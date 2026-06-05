import {
  createVizDensityIndex,
  type VizDensityBin,
  type VizDensityIndex,
  type VizDensitySample,
  type VizHeatmap,
  type VizHeatmapCell,
  type VizHistogram,
  type VizHistogramBucket,
  type VizPointValueAccessor,
  type VizSeriesPoint,
} from "@moritzbrantner/viz-engine";

import { createPointStoreHeatmap, type ChartPointStore } from "./density/point-store";

import {
  collectDensityMetricKeys,
  sumDensityMetrics,
  type BinnedSeries,
  type BinnedSeriesIndexOptions,
} from "./data-density";

import type {
  ChartBackendCapabilities,
  ChartDensityIndex,
  ChartDensityQuery,
  ChartDensitySample,
  ChartDensitySeries,
  ChartHeatmap,
  ChartHeatmapCell,
  ChartHistogram,
  ChartHistogramBucket,
  ChartMetricRecord,
  ChartPercentileMode,
  ChartPointValueAccessor,
  ChartSeriesPoint,
  ChartValueMode,
  IndexedChartSeriesPoint,
} from "./density";

type VizChartsPoint<TProperties> = VizSeriesPoint<TProperties> & {
  id: string;
  label: string;
  metrics: ChartMetricRecord;
  properties: TProperties;
};

type WasmProfileRow = {
  durationMs: number;
  name: string;
};

type WasmBenchGlobal = typeof globalThis & {
  __CHARTS_BENCH_PROFILE_RESULTS__?: WasmProfileRow[];
};

const WASM_CAPABILITIES: ChartBackendCapabilities = {
  backend: "wasm-index",
  supportsGroupedSeries: false,
  supportsHeatmap: true,
  supportsHistogram: true,
  supportsPercentiles: true,
  usesWasm: true,
};

const CHART_PERCENTILES: readonly ChartPercentileMode[] = [
  "p10",
  "p25",
  "p50",
  "p75",
  "p90",
  "p95",
  "p99",
];

const WASM_BENCH_PROFILE_ENABLED = readProcessEnv("CHARTS_BENCH_PROFILE") === "1";
const WASM_HEATMAP_DIRECT_ENABLED = readProcessEnv("CHARTS_BENCH_WASM_HEATMAP") === "1";

export function createWasmChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
  createFallbackIndex: () => ChartDensityIndex<TProperties>,
): ChartDensityIndex<TProperties> {
  const normalizedPoints = profileWasm("wasm.normalize-points", () =>
    normalizeWasmPoints(points, options),
  );
  const metricKeys = profileWasm("wasm.collect-metric-keys", () => {
    const metrics = new Array<ChartMetricRecord>(normalizedPoints.length);

    for (let index = 0; index < normalizedPoints.length; index += 1) {
      metrics[index] = normalizedPoints[index]!.metrics;
    }

    return collectDensityMetricKeys(metrics);
  });
  const vizIndex = profileWasm("wasm.create-viz-index", () =>
    createVizDensityIndex(normalizedPoints, { backend: "wasm" }),
  );
  const pointLookup = profileWasm("wasm.create-point-lookup", () => {
    const lookup = new Map<
      string,
      IndexedChartSeriesPoint<TProperties> & VizChartsPoint<TProperties>
    >();

    for (const point of normalizedPoints) {
      lookup.set(point.id, point);
    }

    return lookup;
  });
  const heatmapStore = profileWasm("wasm.create-heatmap-point-store", () =>
    createWasmPointStore(normalizedPoints, metricKeys, pointLookup),
  );
  const bounds = profileWasm("wasm.create-bounds", () => createSeriesBounds(normalizedPoints));
  let fallbackIndex: ChartDensityIndex<TProperties> | null = null;
  const readFallbackIndex = () => {
    fallbackIndex ??= createFallbackIndex();

    return fallbackIndex;
  };

  return {
    getBackendCapabilities() {
      return WASM_CAPABILITIES;
    },

    getBinnedSeries(query) {
      const result = vizIndex.getBinnedSeries(query);

      return mapBinnedSeries(
        result.bins,
        metricKeys,
        normalizedPoints,
        normalizeChartDomain(query.xDomain),
      );
    },

    getChartSeries(query) {
      const valueMode = query.valueMode ?? "average";
      const wasmQuery = {
        ...query,
        percentiles: resolveRequestedPercentiles(query, valueMode),
        valueMode,
      };

      if (WASM_BENCH_PROFILE_ENABLED) {
        const result = profileWasm("wasm.query-core", () => vizIndex.getChartSeries(wasmQuery));

        return profileWasm("wasm.map-result", () =>
          mapChartSeries(result, normalizedPoints, metricKeys),
        );
      }

      return mapChartSeries(vizIndex.getChartSeries(wasmQuery), normalizedPoints, metricKeys);
    },

    getChartPoints(query) {
      return readFallbackIndex().getChartPoints(query);
    },

    getGroupedChartSeries(query) {
      return readFallbackIndex().getGroupedChartSeries(query);
    },

    getHeatmap(query) {
      const valueAccessor = toVizValueAccessor(query.valueAccessor);

      // WASM heatmap currently loses to the point-store implementation after public result
      // mapping, so the wrapper routes heatmap to hybrid until benchmark evidence changes.
      if (!WASM_HEATMAP_DIRECT_ENABLED || (query.valueAccessor && !valueAccessor)) {
        return createPointStoreHeatmap(heatmapStore, query);
      }

      if (WASM_BENCH_PROFILE_ENABLED) {
        const result = profileWasm("wasm.query-core", () =>
          vizIndex.getHeatmap(omitUndefined({ ...query, valueAccessor })),
        );

        return profileWasm("wasm.map-result", () => mapHeatmap(result, normalizedPoints));
      }

      return mapHeatmap(
        vizIndex.getHeatmap(omitUndefined({ ...query, valueAccessor })),
        normalizedPoints,
      );
    },

    getHistogram(query) {
      const valueAccessor = toVizValueAccessor(query.valueAccessor);

      if (query.valueAccessor && !valueAccessor) {
        return readFallbackIndex().getHistogram(query);
      }

      if (WASM_BENCH_PROFILE_ENABLED) {
        const result = profileWasm("wasm.query-core", () =>
          vizIndex.getHistogram(omitUndefined({ ...query, valueAccessor })),
        );

        return profileWasm("wasm.map-result", () => mapHistogram(result, normalizedPoints));
      }

      return mapHistogram(
        vizIndex.getHistogram(omitUndefined({ ...query, valueAccessor })),
        normalizedPoints,
      );
    },

    getPointById(pointId) {
      return pointLookup.get(pointId) ?? null;
    },

    getScatter(query) {
      return readFallbackIndex().getScatter(query);
    },

    getSeriesBounds() {
      return bounds;
    },
  };
}

function normalizeWasmPoints<TProperties>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
): Array<IndexedChartSeriesPoint<TProperties> & VizChartsPoint<TProperties>> {
  const normalizedPoints: Array<
    IndexedChartSeriesPoint<TProperties> & VizChartsPoint<TProperties>
  > = [];

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]!;
    const normalizedPoint: IndexedChartSeriesPoint<TProperties> & VizChartsPoint<TProperties> = {
      id: String(point.id ?? index),
      label: point.label ?? "",
      metrics: normalizeWasmMetrics(point.metrics),
      properties: point.properties ?? ({} as TProperties),
      x: point.x,
      y: point.y,
    };

    if (
      Number.isFinite(normalizedPoint.x) &&
      Number.isFinite(normalizedPoint.y) &&
      (options.filterPoint?.(normalizedPoint) ?? true)
    ) {
      normalizedPoints.push(normalizedPoint);
    }
  }

  return normalizedPoints;
}

function createWasmPointStore<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties> & VizChartsPoint<TProperties>>,
  metricKeys: string[],
  pointLookup: Map<string, IndexedChartSeriesPoint<TProperties> & VizChartsPoint<TProperties>>,
): ChartPointStore<TProperties> {
  return {
    metricKeys,
    pointLookup,
    points: [...points].sort((left, right) => left.x - right.x),
  };
}

function mapBinnedSeries<TProperties>(
  bins: Array<VizDensityBin<TProperties>>,
  metricKeys: string[],
  normalizedPoints: Array<IndexedChartSeriesPoint<TProperties>>,
  xDomain: [number, number],
): BinnedSeries<TProperties> {
  const mappedBins = new Array<ReturnType<typeof mapBin<TProperties>>>(bins.length);

  for (let index = 0; index < bins.length; index += 1) {
    mappedBins[index] = mapBin(bins[index]!, normalizedPoints);
  }

  return {
    bins: mappedBins,
    summary: {
      binCount: mappedBins.length,
      metrics: sumDensityMetrics(
        mappedBins.map((bin) => bin.metrics),
        metricKeys,
      ),
      pointCount: mappedBins.reduce((total, bin) => total + bin.pointCount, 0),
      xDomain,
    },
  };
}

function mapChartSeries<TProperties>(
  series: ReturnType<VizDensityIndex<TProperties>["getChartSeries"]>,
  normalizedPoints: Array<IndexedChartSeriesPoint<TProperties>>,
  metricKeys: string[],
): ChartDensitySeries<TProperties> {
  const bins = profileWasm("wasm.map-bins", () => {
    const mappedBins = new Array<ReturnType<typeof mapBin<TProperties>>>(series.bins.length);

    for (let index = 0; index < series.bins.length; index += 1) {
      mappedBins[index] = mapBin(series.bins[index]!, normalizedPoints);
    }

    return mappedBins;
  });
  const samples = profileWasm("wasm.map-samples", () => {
    const mappedSamples = new Array<ChartDensitySample<TProperties>>(series.samples.length);

    for (let index = 0; index < series.samples.length; index += 1) {
      mappedSamples[index] = mapSample(series.samples[index]!, normalizedPoints);
    }

    return mappedSamples;
  });
  const metrics = profileWasm("wasm.normalize-metrics", () =>
    withZeroMetricKeys(normalizeVizMetrics(series.summary.metrics), metricKeys),
  );

  return {
    bins,
    samples,
    summary: {
      binCount: series.summary.binCount,
      metrics,
      pointCount: series.summary.pointCount,
      sampleCount: series.summary.sampleCount,
      valueMode: series.summary.valueMode,
      xDomain: series.summary.xDomain,
    },
  };
}

function mapHistogram<TProperties>(
  histogram: VizHistogram<TProperties>,
  normalizedPoints: Array<IndexedChartSeriesPoint<TProperties>>,
): ChartHistogram<TProperties> {
  const buckets = profileWasm("wasm.map-bins", () => {
    const mappedBuckets = new Array<ReturnType<typeof mapHistogramBucket<TProperties>>>(
      histogram.buckets.length,
    );

    for (let index = 0; index < histogram.buckets.length; index += 1) {
      mappedBuckets[index] = mapHistogramBucket(
        histogram.buckets[index]!,
        normalizedPoints,
        histogram.summary,
      );
    }

    return mappedBuckets;
  });
  const metrics = profileWasm("wasm.normalize-metrics", () =>
    normalizeVizMetrics(histogram.summary.metrics),
  );

  return {
    buckets,
    summary: {
      ...histogram.summary,
      metrics,
      xDomain: histogram.summary.xDomain ?? null,
    },
  };
}

function mapHeatmap<TProperties>(
  heatmap: VizHeatmap<TProperties>,
  normalizedPoints: Array<IndexedChartSeriesPoint<TProperties>>,
): ChartHeatmap<TProperties> {
  const cells = profileWasm("wasm.map-bins", () => {
    const mappedCells = new Array<ReturnType<typeof mapHeatmapCell<TProperties>>>(
      heatmap.cells.length,
    );

    for (let index = 0; index < heatmap.cells.length; index += 1) {
      mappedCells[index] = mapHeatmapCell(heatmap.cells[index]!, normalizedPoints);
    }

    return mappedCells;
  });
  const metrics = profileWasm("wasm.normalize-metrics", () =>
    normalizeVizMetrics(heatmap.summary.metrics),
  );

  return {
    cells,
    summary: {
      ...heatmap.summary,
      metrics,
    },
  };
}

function mapBin<TProperties>(
  bin: VizDensityBin<TProperties>,
  normalizedPoints: Array<IndexedChartSeriesPoint<TProperties>>,
) {
  const mappedBin = {
    averageY: bin.averageY ?? null,
    firstPoint: pointBySourceIndex(normalizedPoints, bin.firstPointIndex),
    index: bin.index,
    lastPoint: pointBySourceIndex(normalizedPoints, bin.lastPointIndex),
    maxY: bin.maxY ?? null,
    metrics: normalizeVizMetrics(bin.metrics),
    minY: bin.minY ?? null,
    pointCount: bin.pointCount,
    sumY: bin.sumY,
    x0: bin.x0,
    x1: bin.x1,
  };

  for (const percentile of CHART_PERCENTILES) {
    const value = bin[percentile];

    if (bin.pointCount > 0 && value != null) {
      (mappedBin as typeof mappedBin & Partial<Record<ChartPercentileMode, number | null>>)[
        percentile
      ] = value;
    }
  }

  return mappedBin;
}

function mapSample<TProperties>(
  sample: VizDensitySample<TProperties>,
  normalizedPoints: Array<IndexedChartSeriesPoint<TProperties>>,
): ChartDensitySample<TProperties> {
  return {
    averageY: sample.averageY ?? null,
    firstPoint: pointBySourceIndex(normalizedPoints, sample.firstPointIndex),
    index: sample.index,
    lastPoint: pointBySourceIndex(normalizedPoints, sample.lastPointIndex),
    maxY: sample.maxY ?? null,
    metrics: normalizeVizMetrics(sample.metrics),
    minY: sample.minY ?? null,
    p10: sample.p10 ?? null,
    p25: sample.p25 ?? null,
    p50: sample.p50 ?? null,
    p75: sample.p75 ?? null,
    p90: sample.p90 ?? null,
    p95: sample.p95 ?? null,
    p99: sample.p99 ?? null,
    pointCount: sample.pointCount,
    sumY: sample.sumY,
    x: sample.x,
    x0: sample.x0,
    x1: sample.x1,
    y: sample.y ?? null,
  };
}

function mapHistogramBucket<TProperties>(
  bucket: VizHistogramBucket<TProperties>,
  normalizedPoints: Array<IndexedChartSeriesPoint<TProperties>>,
  summary: VizHistogram<TProperties>["summary"],
): ChartHistogramBucket<TProperties> & { sumValue: number } {
  const bucketWidth = getBinWidth(summary.valueDomain, summary.bucketCount);
  const value0 = summary.valueDomain[0] + bucket.index * bucketWidth;

  return {
    averageValue: bucket.averageValue ?? null,
    firstPoint: pointBySourceIndex(normalizedPoints, bucket.firstPointIndex),
    index: bucket.index,
    lastPoint: pointBySourceIndex(normalizedPoints, bucket.lastPointIndex),
    maxValue: bucket.maxValue ?? null,
    metrics: normalizeVizMetrics(bucket.metrics),
    minValue: bucket.minValue ?? null,
    pointCount: bucket.pointCount,
    sumValue: bucket.sumValue,
    value: summary.valueDomain[0] + (bucket.index + 0.5) * bucketWidth,
    value0,
    value1:
      bucket.index === summary.bucketCount - 1
        ? summary.valueDomain[1]
        : summary.valueDomain[0] + (bucket.index + 1) * bucketWidth,
  };
}

function mapHeatmapCell<TProperties>(
  cell: VizHeatmapCell<TProperties>,
  normalizedPoints: Array<IndexedChartSeriesPoint<TProperties>>,
): ChartHeatmapCell<TProperties> & { sumValue: number } {
  return {
    averageValue: cell.averageValue ?? null,
    firstPoint: pointBySourceIndex(normalizedPoints, cell.firstPointIndex),
    index: cell.index,
    lastPoint: pointBySourceIndex(normalizedPoints, cell.lastPointIndex),
    metrics: normalizeVizMetrics(cell.metrics),
    pointCount: cell.pointCount,
    sumValue: cell.sumValue,
    value: cell.value,
    x: cell.x,
    x0: cell.x0,
    x1: cell.x1,
    xIndex: cell.xIndex,
    y: cell.y,
    y0: cell.y0,
    y1: cell.y1,
    yIndex: cell.yIndex,
  };
}

function pointBySourceIndex<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties>>,
  sourceIndex: number | null | undefined,
) {
  return sourceIndex == null ? null : (points[sourceIndex] ?? null);
}

function normalizeWasmMetrics(metrics: ChartMetricRecord | undefined): ChartMetricRecord {
  if (!metrics) {
    return {};
  }

  const normalizedMetrics: ChartMetricRecord = {};

  for (const [metricKey, value] of Object.entries(metrics)) {
    if (Number.isFinite(value)) {
      normalizedMetrics[metricKey] = value;
    }
  }

  return normalizedMetrics;
}

function normalizeVizMetrics(metrics: ChartMetricRecord | Map<string, number>): ChartMetricRecord {
  if (!(metrics instanceof Map)) {
    return metrics;
  }

  const normalizedMetrics: ChartMetricRecord = {};

  for (const [metricKey, value] of metrics) {
    normalizedMetrics[metricKey] = value;
  }

  return normalizedMetrics;
}

function withZeroMetricKeys(metrics: ChartMetricRecord, metricKeys: string[]): ChartMetricRecord {
  let hasMissingMetric = false;

  for (const metricKey of metricKeys) {
    if (!(metricKey in metrics)) {
      hasMissingMetric = true;
      break;
    }
  }

  if (!hasMissingMetric) {
    return metrics;
  }

  const normalizedMetrics: ChartMetricRecord = {};

  for (const metricKey of metricKeys) {
    normalizedMetrics[metricKey] = metrics[metricKey] ?? 0;
  }

  for (const [metricKey, value] of Object.entries(metrics)) {
    normalizedMetrics[metricKey] = value;
  }

  return normalizedMetrics;
}

function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined)) as T;
}

function getBinWidth(domain: [number, number], binCount: number) {
  const span = domain[1] - domain[0];

  return span > 0 ? span / binCount : 1;
}

function normalizeChartDomain(domain: [number, number]): [number, number] {
  return domain[0] <= domain[1] ? domain : [domain[1], domain[0]];
}

function createSeriesBounds<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties>>,
): ReturnType<ChartDensityIndex<TProperties>["getSeriesBounds"]> {
  if (points.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return { maxX, maxY, minX, minY };
}

function toVizValueAccessor<TProperties>(
  accessor: ChartPointValueAccessor<TProperties> | undefined,
): VizPointValueAccessor | undefined {
  if (!accessor) {
    return undefined;
  }

  if (typeof accessor === "function") {
    return undefined;
  }

  if (typeof accessor === "object") {
    return { metric: accessor.metric };
  }

  return accessor;
}

function resolveRequestedPercentiles(
  query: Pick<ChartDensityQuery, "percentiles">,
  valueMode: ChartValueMode,
): ChartPercentileMode[] {
  const percentiles = new Set<ChartPercentileMode>(query.percentiles ?? []);

  if (isChartPercentileMode(valueMode)) {
    percentiles.add(valueMode);
  }

  return Array.from(percentiles);
}

function isChartPercentileMode(valueMode: ChartValueMode): valueMode is ChartPercentileMode {
  return (CHART_PERCENTILES as readonly ChartValueMode[]).includes(valueMode);
}

function profileWasm<TResult>(name: string, run: () => TResult): TResult {
  if (!WASM_BENCH_PROFILE_ENABLED) {
    return run();
  }

  const startedAt = performance.now();

  try {
    return run();
  } finally {
    const benchGlobal = globalThis as WasmBenchGlobal;

    benchGlobal.__CHARTS_BENCH_PROFILE_RESULTS__ ??= [];
    benchGlobal.__CHARTS_BENCH_PROFILE_RESULTS__.push({
      durationMs: performance.now() - startedAt,
      name,
    });
  }
}

function readProcessEnv(name: string): string | undefined {
  if (typeof process === "undefined") {
    return undefined;
  }

  return process.env[name];
}

import {
  collectDensityMetricKeys,
  type BinnedSeries,
  type BinnedSeriesIndexOptions,
} from "./data-density";
import { getChartsDensityWasmModule } from "./wasm-loader";

import type {
  ChartBackendCapabilities,
  ChartDensityIndex,
  ChartDensityQuery,
  ChartDensitySample,
  ChartDensitySeries,
  ChartHeatmap,
  ChartHeatmapCell,
  ChartHeatmapQuery,
  ChartHistogram,
  ChartHistogramBucket,
  ChartHistogramQuery,
  ChartMetricRecord,
  ChartPercentileMode,
  ChartPointValueAccessor,
  ChartSeriesPoint,
  ChartValueMode,
  IndexedChartSeriesPoint,
} from "./density";

type WasmMetricRecord = number[];

type WasmBin = {
  averageY: number | null;
  firstPointIndex: number | null;
  index: number;
  lastPointIndex: number | null;
  maxY: number | null;
  metrics: WasmMetricRecord;
  minY: number | null;
  p10?: number | null;
  p25?: number | null;
  p50?: number | null;
  p75?: number | null;
  p90?: number | null;
  p95?: number | null;
  p99?: number | null;
  pointIndices?: number[];
  pointCount: number;
  sumY: number;
  x0: number;
  x1: number;
};

type WasmSample = WasmBin & {
  x: number;
  y: number | null;
};

type WasmBinnedSeries = {
  bins: WasmBin[];
  summary: {
    binCount: number;
    metrics: WasmMetricRecord;
    pointCount: number;
    xDomain: [number, number];
  };
};

type WasmChartSeries = {
  bins: WasmBin[];
  samples: WasmSample[];
  summary: {
    binCount: number;
    metrics: WasmMetricRecord;
    pointCount: number;
    sampleCount: number;
    valueMode: ChartValueMode;
    xDomain: [number, number];
  };
};

type WasmHistogramBucket = {
  averageValue: number | null;
  firstPointIndex: number | null;
  index: number;
  lastPointIndex: number | null;
  maxValue: number | null;
  metrics: WasmMetricRecord;
  minValue: number | null;
  pointCount: number;
  sumValue?: number;
  value: number;
  value0: number;
  value1: number;
};

type WasmHistogram = {
  buckets: WasmHistogramBucket[];
  summary: {
    bucketCount: number;
    metrics: WasmMetricRecord;
    pointCount: number;
    valueDomain: [number, number];
    xDomain: [number, number] | null;
  };
};

type WasmHeatmapCell = {
  averageValue: number | null;
  firstPointIndex: number | null;
  index: number;
  lastPointIndex: number | null;
  metrics: WasmMetricRecord;
  pointCount: number;
  sumValue?: number;
  value: number;
  x: number;
  x0: number;
  x1: number;
  xIndex: number;
  y: number;
  y0: number;
  y1: number;
  yIndex: number;
};

type WasmHeatmap = {
  cells: WasmHeatmapCell[];
  summary: {
    maxCellCount: number;
    metrics: WasmMetricRecord;
    pointCount: number;
    xBinCount: number;
    xDomain: [number, number];
    yBinCount: number;
    yDomain: [number, number];
  };
};

type PackedWasmNullableArray = Float64Array;

type PackedWasmSeries = {
  averageY: PackedWasmNullableArray;
  binCount: number;
  firstPointIndex: Uint32Array;
  index?: Uint32Array;
  lastPointIndex: Uint32Array;
  maxY: PackedWasmNullableArray;
  metricCount: number;
  metrics: Float64Array;
  minY: PackedWasmNullableArray;
  percentiles?: Partial<Record<ChartPercentileMode, PackedWasmNullableArray>>;
  pointCount: Uint32Array;
  sampleCount: number;
  sumY: Float64Array;
  x: Float64Array;
  x0: Float64Array;
  x1: Float64Array;
  xDomain: Float64Array;
  y: PackedWasmNullableArray;
};

type PackedWasmHistogram = WasmHistogram;
type PackedWasmHeatmap = WasmHeatmap;

type WasmValueAccessor = { kind: "metric"; metric: string } | { kind: "x" | "y"; metric?: never };

type WasmIndexInstance = {
  getBinnedSeries(query: unknown): unknown;
  getBinnedSeriesPacked?: (query: unknown) => unknown;
  getChartSeries(query: unknown): unknown;
  getChartSeriesPacked?: (query: unknown) => unknown;
  getHeatmap(query: unknown): unknown;
  getHistogram(query: unknown): unknown;
};

const WASM_CAPABILITIES: ChartBackendCapabilities = {
  backend: "wasm-index",
  supportsGroupedSeries: false,
  supportsHeatmap: true,
  supportsHistogram: true,
  supportsPercentiles: true,
  usesWasm: true,
};

export function createWasmChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
  fallbackIndex: ChartDensityIndex<TProperties>,
): ChartDensityIndex<TProperties> {
  const normalizedPoints = normalizeWasmPoints(points, options);
  const metricKeys = collectDensityMetricKeys(normalizedPoints.map((point) => point.metrics));
  const wasmInput = createWasmIndexInput(normalizedPoints, metricKeys);
  const wasm = new (getChartsDensityWasmModule().ChartDensityWasmIndex)({
    metricKeys,
    metrics: wasmInput.metrics,
    x: wasmInput.x,
    y: wasmInput.y,
  }) as WasmIndexInstance;
  const pointLookup = new Map(normalizedPoints.map((point) => [point.id, point]));
  const bounds = createSeriesBounds(normalizedPoints);

  return {
    getBackendCapabilities() {
      return WASM_CAPABILITIES;
    },

    getBinnedSeries(query) {
      const context: PackedWasmMappingContext<TProperties> = {
        metricKeys,
        normalizedPoints,
      };
      const packed = wasm.getBinnedSeriesPacked?.(query) as PackedWasmSeries | undefined;

      return packed
        ? mapPackedBinnedSeries(packed, context)
        : mapBinnedSeries(wasm.getBinnedSeries(query) as WasmBinnedSeries, context);
    },

    getChartSeries(query) {
      const context: PackedWasmMappingContext<TProperties> & {
        requestedPercentiles: readonly ChartPercentileMode[];
        valueMode: ChartValueMode;
      } = {
        metricKeys,
        normalizedPoints,
        requestedPercentiles: resolveRequestedPercentiles(query),
        valueMode: query.valueMode ?? "average",
      };
      const packed = wasm.getChartSeriesPacked?.(query) as PackedWasmSeries | undefined;

      return packed
        ? mapPackedChartSeries(packed, context)
        : mapChartSeries(wasm.getChartSeries(query) as WasmChartSeries, context);
    },

    getGroupedChartSeries(query) {
      return fallbackIndex.getGroupedChartSeries(query);
    },

    getHeatmap(query) {
      const wasmQuery = toWasmHeatmapQuery(query);

      if (!wasmQuery) {
        return fallbackIndex.getHeatmap(query);
      }

      return mapHeatmap(wasm.getHeatmap(wasmQuery) as PackedWasmHeatmap, {
        metricKeys,
        normalizedPoints,
      });
    },

    getHistogram(query) {
      const wasmQuery = toWasmHistogramQuery(query);

      if (!wasmQuery) {
        return fallbackIndex.getHistogram(query);
      }

      return mapHistogram(wasm.getHistogram(wasmQuery) as PackedWasmHistogram, {
        metricKeys,
        normalizedPoints,
      });
    },

    getPointById(pointId) {
      return pointLookup.get(pointId) ?? null;
    },

    getSeriesBounds() {
      return bounds;
    },
  };
}

function createWasmIndexInput<TProperties>(
  normalizedPoints: Array<IndexedChartSeriesPoint<TProperties>>,
  metricKeys: string[],
) {
  const x = new Float64Array(normalizedPoints.length);
  const y = new Float64Array(normalizedPoints.length);
  const metrics = new Float64Array(normalizedPoints.length * metricKeys.length);

  for (let pointIndex = 0; pointIndex < normalizedPoints.length; pointIndex += 1) {
    const point = normalizedPoints[pointIndex];

    x[pointIndex] = point.x;
    y[pointIndex] = point.y;

    const metricOffset = pointIndex * metricKeys.length;

    for (let metricIndex = 0; metricIndex < metricKeys.length; metricIndex += 1) {
      metrics[metricOffset + metricIndex] = point.metrics[metricKeys[metricIndex]] ?? 0;
    }
  }

  return { metrics, x, y };
}

function normalizeWasmPoints<TProperties>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
): Array<IndexedChartSeriesPoint<TProperties>> {
  return points
    .map(
      (point, index): IndexedChartSeriesPoint<TProperties> => ({
        id: String(point.id ?? index),
        label: point.label ?? "",
        metrics: normalizeWasmMetrics(point.metrics),
        properties: point.properties ?? ({} as TProperties),
        x: point.x,
        y: point.y,
      }),
    )
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .filter((point) => options.filterPoint?.(point) ?? true);
}

function mapBinnedSeries<TProperties>(
  series: WasmBinnedSeries,
  context: PackedWasmMappingContext<TProperties>,
): BinnedSeries<TProperties> {
  const bins: BinnedSeries<TProperties>["bins"] = [];
  bins.length = series.bins.length;

  for (let index = 0; index < series.bins.length; index += 1) {
    bins[index] = mapBin(series.bins[index], context);
  }

  return {
    bins,
    summary: {
      ...series.summary,
      metrics: mapMetrics(series.summary.metrics, context.metricKeys),
    },
  };
}

function mapChartSeries<TProperties>(
  series: WasmChartSeries,
  context: PackedWasmMappingContext<TProperties> & {
    requestedPercentiles: readonly ChartPercentileMode[];
    valueMode: ChartValueMode;
  },
): ChartDensitySeries<TProperties> {
  const bins: ChartDensitySeries<TProperties>["bins"] = [];
  const samples: ChartDensitySeries<TProperties>["samples"] = [];
  bins.length = series.bins.length;
  samples.length = series.samples.length;

  for (let index = 0; index < series.bins.length; index += 1) {
    bins[index] = mapBin(series.bins[index], context, context.requestedPercentiles);
  }

  for (let index = 0; index < series.samples.length; index += 1) {
    samples[index] = mapSample(series.samples[index], context);
  }

  return {
    bins,
    samples,
    summary: {
      ...series.summary,
      metrics: mapMetrics(series.summary.metrics, context.metricKeys),
    },
  };
}

function mapPackedBinnedSeries<TProperties>(
  series: PackedWasmSeries,
  context: PackedWasmMappingContext<TProperties>,
): BinnedSeries<TProperties> {
  const bins: BinnedSeries<TProperties>["bins"] = [];
  const summaryMetrics = createZeroMetrics(context.metricKeys);
  let pointCount = 0;

  bins.length = series.binCount;

  for (let index = 0; index < series.binCount; index += 1) {
    const metrics = mapPackedMetrics(
      series.metrics,
      index * series.metricCount,
      context.metricKeys,
      summaryMetrics,
    );

    pointCount += series.pointCount[index] ?? 0;
    bins[index] = mapPackedBin(series, index, metrics, context);
  }

  return {
    bins,
    summary: {
      binCount: series.binCount,
      metrics: summaryMetrics,
      pointCount,
      xDomain: [series.xDomain[0] ?? 0, series.xDomain[1] ?? series.xDomain[0] ?? 0],
    },
  };
}

function mapPackedChartSeries<TProperties>(
  series: PackedWasmSeries,
  context: PackedWasmMappingContext<TProperties> & {
    requestedPercentiles: readonly ChartPercentileMode[];
    valueMode: ChartValueMode;
  },
): ChartDensitySeries<TProperties> {
  const bins: ChartDensitySeries<TProperties>["bins"] = [];
  const samples: ChartDensitySeries<TProperties>["samples"] = [];
  const summaryMetrics = createZeroMetrics(context.metricKeys);
  let pointCount = 0;

  bins.length = series.binCount;
  samples.length = series.sampleCount;

  for (let index = 0; index < series.binCount; index += 1) {
    const metrics = mapPackedMetrics(
      series.metrics,
      index * series.metricCount,
      context.metricKeys,
      summaryMetrics,
    );
    const bin = mapPackedBin(series, index, metrics, context, context.requestedPercentiles);

    pointCount += series.pointCount[index] ?? 0;
    bins[index] = bin;
    samples[index] = mapPackedSample(series, index, bin, metrics);
  }

  return {
    bins,
    samples,
    summary: {
      binCount: series.binCount,
      metrics: summaryMetrics,
      pointCount,
      sampleCount: series.sampleCount,
      valueMode: context.valueMode,
      xDomain: [series.xDomain[0] ?? 0, series.xDomain[1] ?? series.xDomain[0] ?? 0],
    },
  };
}

function mapHistogram<TProperties>(
  histogram: WasmHistogram,
  context: PackedWasmMappingContext<TProperties>,
): ChartHistogram<TProperties> {
  return {
    buckets: histogram.buckets.map((bucket) => ({
      averageValue: bucket.averageValue,
      firstPoint: getPoint(context.normalizedPoints, bucket.firstPointIndex),
      index: bucket.index,
      lastPoint: getPoint(context.normalizedPoints, bucket.lastPointIndex),
      maxValue: bucket.maxValue,
      metrics: mapMetrics(bucket.metrics, context.metricKeys),
      minValue: bucket.minValue,
      pointCount: bucket.pointCount,
      sumValue: bucket.sumValue ?? 0,
      value: bucket.value,
      value0: bucket.value0,
      value1: bucket.value1,
    })) satisfies Array<ChartHistogramBucket<TProperties>>,
    summary: {
      ...histogram.summary,
      metrics: mapMetrics(histogram.summary.metrics, context.metricKeys),
      xDomain: histogram.summary.xDomain ?? null,
    },
  };
}

function mapHeatmap<TProperties>(
  heatmap: WasmHeatmap,
  context: PackedWasmMappingContext<TProperties>,
): ChartHeatmap<TProperties> {
  return {
    cells: heatmap.cells.map((cell) => ({
      averageValue: cell.averageValue,
      firstPoint: getPoint(context.normalizedPoints, cell.firstPointIndex),
      index: cell.index,
      lastPoint: getPoint(context.normalizedPoints, cell.lastPointIndex),
      metrics: mapMetrics(cell.metrics, context.metricKeys),
      pointCount: cell.pointCount,
      sumValue: cell.sumValue ?? 0,
      value: cell.value,
      x: cell.x,
      x0: cell.x0,
      x1: cell.x1,
      xIndex: cell.xIndex,
      y: cell.y,
      y0: cell.y0,
      y1: cell.y1,
      yIndex: cell.yIndex,
    })) satisfies Array<ChartHeatmapCell<TProperties>>,
    summary: {
      ...heatmap.summary,
      metrics: mapMetrics(heatmap.summary.metrics, context.metricKeys),
    },
  };
}

function mapBin<TProperties>(
  bin: WasmBin,
  context: PackedWasmMappingContext<TProperties>,
  requestedPercentiles: readonly ChartPercentileMode[] = [],
) {
  const mappedBin = {
    averageY: bin.averageY ?? null,
    firstPoint: getPoint(context.normalizedPoints, bin.firstPointIndex),
    index: bin.index,
    lastPoint: getPoint(context.normalizedPoints, bin.lastPointIndex),
    maxY: bin.maxY ?? null,
    metrics: mapMetrics(bin.metrics, context.metricKeys),
    minY: bin.minY ?? null,
    pointCount: bin.pointCount,
    sumY: bin.sumY,
    x0: bin.x0,
    x1: bin.x1,
  };

  if (bin.pointCount > 0) {
    for (const percentile of requestedPercentiles) {
      (mappedBin as typeof mappedBin & Partial<Record<ChartPercentileMode, number | null>>)[
        percentile
      ] = bin[percentile] ?? null;
    }
  }

  return mappedBin;
}

function mapPackedBin<TProperties>(
  series: PackedWasmSeries,
  index: number,
  metrics: ChartMetricRecord,
  context: PackedWasmMappingContext<TProperties>,
  requestedPercentiles: readonly ChartPercentileMode[] = [],
) {
  const pointCount = series.pointCount[index] ?? 0;
  const mappedBin = {
    averageY: nullableNumber(series.averageY[index]),
    firstPoint: getPoint(context.normalizedPoints, pointIndexOrNull(series.firstPointIndex[index])),
    index: series.index?.[index] ?? index,
    lastPoint: getPoint(context.normalizedPoints, pointIndexOrNull(series.lastPointIndex[index])),
    maxY: nullableNumber(series.maxY[index]),
    metrics,
    minY: nullableNumber(series.minY[index]),
    pointCount,
    sumY: series.sumY[index] ?? 0,
    x0: series.x0[index] ?? 0,
    x1: series.x1[index] ?? 0,
  };

  if (pointCount > 0) {
    for (const percentile of requestedPercentiles) {
      (mappedBin as typeof mappedBin & Partial<Record<ChartPercentileMode, number | null>>)[
        percentile
      ] = nullableNumber(series.percentiles?.[percentile]?.[index]);
    }
  }

  return mappedBin;
}

function mapSample<TProperties>(
  sample: WasmSample,
  context: PackedWasmMappingContext<TProperties>,
): ChartDensitySample<TProperties> {
  return {
    averageY: sample.averageY ?? null,
    firstPoint: getPoint(context.normalizedPoints, sample.firstPointIndex),
    index: sample.index,
    lastPoint: getPoint(context.normalizedPoints, sample.lastPointIndex),
    maxY: sample.maxY ?? null,
    metrics: mapMetrics(sample.metrics, context.metricKeys),
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

function mapPackedSample<TProperties>(
  series: PackedWasmSeries,
  index: number,
  bin: ReturnType<typeof mapPackedBin<TProperties>>,
  metrics: ChartMetricRecord,
): ChartDensitySample<TProperties> {
  return {
    averageY: bin.averageY,
    firstPoint: bin.firstPoint,
    index: bin.index,
    lastPoint: bin.lastPoint,
    maxY: bin.maxY,
    metrics,
    minY: bin.minY,
    p10: nullableNumber(series.percentiles?.p10?.[index]),
    p25: nullableNumber(series.percentiles?.p25?.[index]),
    p50: nullableNumber(series.percentiles?.p50?.[index]),
    p75: nullableNumber(series.percentiles?.p75?.[index]),
    p90: nullableNumber(series.percentiles?.p90?.[index]),
    p95: nullableNumber(series.percentiles?.p95?.[index]),
    p99: nullableNumber(series.percentiles?.p99?.[index]),
    pointCount: bin.pointCount,
    sumY: bin.sumY,
    x: series.x[index] ?? (bin.x0 + bin.x1) / 2,
    x0: bin.x0,
    x1: bin.x1,
    y: nullableNumber(series.y[index]),
  };
}

type PackedWasmMappingContext<TProperties> = {
  metricKeys: string[];
  normalizedPoints: Array<IndexedChartSeriesPoint<TProperties>>;
};

function mapMetrics(metrics: WasmMetricRecord, metricKeys: string[]): ChartMetricRecord {
  const mappedMetrics: ChartMetricRecord = {};

  for (let index = 0; index < metricKeys.length; index += 1) {
    mappedMetrics[metricKeys[index]] = metrics[index] ?? 0;
  }

  return mappedMetrics;
}

function mapPackedMetrics(
  metrics: Float64Array,
  offset: number,
  metricKeys: string[],
  totals?: ChartMetricRecord,
): ChartMetricRecord {
  const mappedMetrics: ChartMetricRecord = {};

  for (let index = 0; index < metricKeys.length; index += 1) {
    const metricKey = metricKeys[index];
    const value = metrics[offset + index] ?? 0;

    mappedMetrics[metricKey] = value;

    if (totals) {
      totals[metricKey] += value;
    }
  }

  return mappedMetrics;
}

function createZeroMetrics(metricKeys: string[]): ChartMetricRecord {
  const metrics: ChartMetricRecord = {};

  for (let index = 0; index < metricKeys.length; index += 1) {
    metrics[metricKeys[index]] = 0;
  }

  return metrics;
}

function getPoint<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties>>,
  pointIndex: number | null,
) {
  return pointIndex === null ? null : (points[pointIndex] ?? null);
}

function nullableNumber(value: number | undefined) {
  return value === undefined || Number.isNaN(value) ? null : value;
}

function pointIndexOrNull(value: number | undefined) {
  return value === undefined || value === 4_294_967_295 ? null : value;
}

function normalizeWasmMetrics(metrics: ChartMetricRecord | undefined): ChartMetricRecord {
  if (!metrics) {
    return {};
  }

  return Object.fromEntries(Object.entries(metrics).filter((entry) => Number.isFinite(entry[1])));
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

function toWasmHistogramQuery<TProperties>(query: ChartHistogramQuery<TProperties>):
  | (Omit<ChartHistogramQuery<TProperties>, "valueAccessor"> & {
      valueAccessor?: WasmValueAccessor;
    })
  | null {
  const valueAccessor = toWasmValueAccessor(query.valueAccessor);

  if (query.valueAccessor && !valueAccessor) {
    return null;
  }

  return {
    ...query,
    valueAccessor,
  };
}

function toWasmHeatmapQuery<TProperties>(query: ChartHeatmapQuery<TProperties>):
  | (Omit<ChartHeatmapQuery<TProperties>, "valueAccessor"> & {
      valueAccessor?: WasmValueAccessor;
    })
  | null {
  const valueAccessor = toWasmValueAccessor(query.valueAccessor);

  if (query.valueAccessor && !valueAccessor) {
    return null;
  }

  return {
    ...query,
    valueAccessor,
  };
}

function toWasmValueAccessor<TProperties>(
  accessor: ChartPointValueAccessor<TProperties> | undefined,
): WasmValueAccessor | undefined {
  if (!accessor) {
    return undefined;
  }

  if (typeof accessor === "function") {
    return undefined;
  }

  if (typeof accessor === "object") {
    return { kind: "metric", metric: accessor.metric };
  }

  return { kind: accessor };
}

function resolveRequestedPercentiles(query: ChartDensityQuery): ChartPercentileMode[] {
  const percentiles = new Set<ChartPercentileMode>(query.percentiles ?? []);

  if (isChartPercentileMode(query.valueMode)) {
    percentiles.add(query.valueMode);
  }

  return Array.from(percentiles);
}

function isChartPercentileMode(mode: ChartValueMode | undefined): mode is ChartPercentileMode {
  return (
    mode === "p10" ||
    mode === "p25" ||
    mode === "p50" ||
    mode === "p75" ||
    mode === "p90" ||
    mode === "p95" ||
    mode === "p99"
  );
}

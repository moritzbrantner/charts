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

type WasmValueAccessor = { kind: "metric"; metric: string } | { kind: "x" | "y"; metric?: never };

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
  const wasmMetrics = normalizedPoints.flatMap((point) =>
    metricKeys.map((metricKey) => point.metrics[metricKey] ?? 0),
  );
  const wasm = new (getChartsDensityWasmModule().ChartDensityWasmIndex)({
    metricKeys,
    metrics: wasmMetrics,
    x: normalizedPoints.map((point) => point.x),
    y: normalizedPoints.map((point) => point.y),
  });
  const pointLookup = new Map(normalizedPoints.map((point) => [point.id, point]));
  const bounds = createSeriesBounds(normalizedPoints);

  return {
    getBackendCapabilities() {
      return WASM_CAPABILITIES;
    },

    getBinnedSeries(query) {
      return mapBinnedSeries(wasm.getBinnedSeries(query) as WasmBinnedSeries, {
        metricKeys,
        normalizedPoints,
      });
    },

    getChartSeries(query) {
      return mapChartSeries(wasm.getChartSeries(query) as WasmChartSeries, {
        metricKeys,
        normalizedPoints,
        requestedPercentiles: resolveRequestedPercentiles(query),
      });
    },

    getGroupedChartSeries(query) {
      return fallbackIndex.getGroupedChartSeries(query);
    },

    getHeatmap(query) {
      const wasmQuery = toWasmHeatmapQuery(query);

      if (!wasmQuery) {
        return fallbackIndex.getHeatmap(query);
      }

      return mapHeatmap(wasm.getHeatmap(wasmQuery) as WasmHeatmap, {
        metricKeys,
        normalizedPoints,
      });
    },

    getHistogram(query) {
      const wasmQuery = toWasmHistogramQuery(query);

      if (!wasmQuery) {
        return fallbackIndex.getHistogram(query);
      }

      return mapHistogram(wasm.getHistogram(wasmQuery) as WasmHistogram, {
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
  context: WasmMappingContext<TProperties>,
): BinnedSeries<TProperties> {
  return {
    bins: series.bins.map((bin) => mapBin(bin, context)),
    summary: {
      ...series.summary,
      metrics: mapMetrics(series.summary.metrics, context.metricKeys),
    },
  };
}

function mapChartSeries<TProperties>(
  series: WasmChartSeries,
  context: WasmMappingContext<TProperties> & {
    requestedPercentiles: readonly ChartPercentileMode[];
  },
): ChartDensitySeries<TProperties> {
  return {
    bins: series.bins.map((bin) => mapBin(bin, context, context.requestedPercentiles)),
    samples: series.samples.map((sample) => mapSample(sample, context)),
    summary: {
      ...series.summary,
      metrics: mapMetrics(series.summary.metrics, context.metricKeys),
    },
  };
}

function mapHistogram<TProperties>(
  histogram: WasmHistogram,
  context: WasmMappingContext<TProperties>,
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
  context: WasmMappingContext<TProperties>,
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
  context: WasmMappingContext<TProperties>,
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

  if (requestedPercentiles.length > 0) {
    (
      mappedBin as typeof mappedBin & {
        points: Array<IndexedChartSeriesPoint<TProperties>>;
      }
    ).points = (bin.pointIndices ?? [])
      .map((pointIndex) => getPoint(context.normalizedPoints, pointIndex))
      .filter((point): point is IndexedChartSeriesPoint<TProperties> => point !== null);
  }

  return mappedBin;
}

function mapSample<TProperties>(
  sample: WasmSample,
  context: WasmMappingContext<TProperties>,
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

type WasmMappingContext<TProperties> = {
  metricKeys: string[];
  normalizedPoints: Array<IndexedChartSeriesPoint<TProperties>>;
};

function mapMetrics(metrics: WasmMetricRecord, metricKeys: string[]): ChartMetricRecord {
  return Object.fromEntries(metricKeys.map((metricKey, index) => [metricKey, metrics[index] ?? 0]));
}

function getPoint<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties>>,
  pointIndex: number | null,
) {
  return pointIndex === null ? null : (points[pointIndex] ?? null);
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

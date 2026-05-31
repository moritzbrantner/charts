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

export function createWasmChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
  fallbackIndex: ChartDensityIndex<TProperties>,
): ChartDensityIndex<TProperties> {
  const normalizedPoints = normalizeWasmPoints(points, options);
  const metricKeys = collectDensityMetricKeys(normalizedPoints.map((point) => point.metrics));
  const vizIndex = createVizDensityIndex(normalizedPoints, { backend: "wasm" });
  const pointLookup = new Map(normalizedPoints.map((point) => [point.id, point]));
  const bounds = createSeriesBounds(normalizedPoints);

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
      const result = vizIndex.getChartSeries({
        ...query,
        percentiles: resolveRequestedPercentiles(query, valueMode),
        valueMode,
      });

      return mapChartSeries(result, normalizedPoints, metricKeys);
    },

    getGroupedChartSeries(query) {
      return fallbackIndex.getGroupedChartSeries(query);
    },

    getHeatmap(query) {
      const valueAccessor = toVizValueAccessor(query.valueAccessor);

      if (query.valueAccessor && !valueAccessor) {
        return fallbackIndex.getHeatmap(query);
      }

      return mapHeatmap(
        vizIndex.getHeatmap(omitUndefined({ ...query, valueAccessor })),
        normalizedPoints,
      );
    },

    getHistogram(query) {
      const valueAccessor = toVizValueAccessor(query.valueAccessor);

      if (query.valueAccessor && !valueAccessor) {
        return fallbackIndex.getHistogram(query);
      }

      return mapHistogram(
        vizIndex.getHistogram(omitUndefined({ ...query, valueAccessor })),
        normalizedPoints,
      );
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
): Array<IndexedChartSeriesPoint<TProperties> & VizChartsPoint<TProperties>> {
  return points
    .map((point, index): IndexedChartSeriesPoint<TProperties> & VizChartsPoint<TProperties> => ({
      id: String(point.id ?? index),
      label: point.label ?? "",
      metrics: normalizeWasmMetrics(point.metrics),
      properties: point.properties ?? ({} as TProperties),
      x: point.x,
      y: point.y,
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .filter((point) => options.filterPoint?.(point) ?? true);
}

function mapBinnedSeries<TProperties>(
  bins: Array<VizDensityBin<TProperties>>,
  metricKeys: string[],
  normalizedPoints: Array<IndexedChartSeriesPoint<TProperties>>,
  xDomain: [number, number],
): BinnedSeries<TProperties> {
  const mappedBins = bins.map((bin) => mapBin(bin, normalizedPoints));

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
  return {
    bins: series.bins.map((bin) => mapBin(bin, normalizedPoints)),
    samples: series.samples.map((sample) => mapSample(sample, normalizedPoints)),
    summary: {
      binCount: series.summary.binCount,
      metrics: withZeroMetricKeys(normalizeVizMetrics(series.summary.metrics), metricKeys),
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
  return {
    buckets: histogram.buckets.map((bucket) =>
      mapHistogramBucket(bucket, normalizedPoints, histogram.summary),
    ),
    summary: {
      ...histogram.summary,
      metrics: normalizeVizMetrics(histogram.summary.metrics),
      xDomain: histogram.summary.xDomain ?? null,
    },
  };
}

function mapHeatmap<TProperties>(
  heatmap: VizHeatmap<TProperties>,
  normalizedPoints: Array<IndexedChartSeriesPoint<TProperties>>,
): ChartHeatmap<TProperties> {
  return {
    cells: heatmap.cells.map((cell) => mapHeatmapCell(cell, normalizedPoints)),
    summary: {
      ...heatmap.summary,
      metrics: normalizeVizMetrics(heatmap.summary.metrics),
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
    ...mapBin(sample, normalizedPoints),
    p10: sample.p10 ?? null,
    p25: sample.p25 ?? null,
    p50: sample.p50 ?? null,
    p75: sample.p75 ?? null,
    p90: sample.p90 ?? null,
    p95: sample.p95 ?? null,
    p99: sample.p99 ?? null,
    x: sample.x,
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

  return Object.fromEntries(Object.entries(metrics).filter((entry) => Number.isFinite(entry[1])));
}

function normalizeVizMetrics(metrics: ChartMetricRecord | Map<string, number>): ChartMetricRecord {
  return metrics instanceof Map ? Object.fromEntries(metrics) : metrics;
}

function withZeroMetricKeys(metrics: ChartMetricRecord, metricKeys: string[]): ChartMetricRecord {
  return {
    ...Object.fromEntries(metricKeys.map((metricKey) => [metricKey, 0])),
    ...metrics,
  };
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

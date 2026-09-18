import {
  collectDensityMetricKeys,
  normalizeDensityMetrics,
  sumDensityMetrics,
  type BinnedSeries,
  type BinnedSeriesIndexOptions,
} from "./data-density";
import {
  getBucketIndex,
  getChartBinWidth,
  getPointAccessorValue,
  getPointsInXDomain,
  getValueDomain,
} from "./density/point-store";
import { createChartDensitySample } from "./density/render-data";
import { clampInteger, normalizeChartDomain } from "./density/shared";
import {
  attachChartDensityWorkFacts,
  createMutableChartDensityWorkFacts,
} from "./density/work-facts";
import { getLoadedChartWasmKernel, loadChartWasmKernel } from "./wasm-kernel";

import type {
  ChartBackendCapabilities,
  ChartDensityBin,
  ChartDensityIndex,
  ChartDensityQuery,
  ChartDensitySample,
  ChartDensitySeries,
  ChartHistogram,
  ChartHistogramBucket,
  ChartHistogramQuery,
  ChartMetricRecord,
  ChartPercentileMode,
  ChartSeriesPoint,
  IndexedChartSeriesPoint,
} from "./density";

const WASM_CAPABILITIES: ChartBackendCapabilities = {
  backend: "wasm-index",
  supportsGroupedSeries: false,
  supportsHeatmap: false,
  supportsHistogram: true,
  supportsPercentiles: true,
  usesWasm: true,
};

const FALLBACK_CAPABILITIES: ChartBackendCapabilities = {
  backend: "hybrid-js",
  supportsGroupedSeries: true,
  supportsHeatmap: true,
  supportsHistogram: true,
  supportsPercentiles: true,
  usesWasm: false,
};

const PERCENTILE_QUANTILES: Record<ChartPercentileMode, number> = {
  p10: 0.1,
  p25: 0.25,
  p50: 0.5,
  p75: 0.75,
  p90: 0.9,
  p95: 0.95,
  p99: 0.99,
};

type WasmPreparedChartState<TProperties> = {
  metricKeys: string[];
  points: Array<IndexedChartSeriesPoint<TProperties>>;
  x: Float64Array;
  y: Float64Array;
};

type WasmChartDensityPreparationOptions<TProperties> = {
  fallbackIndex?: ChartDensityIndex<TProperties>;
  prepareImmediately?: boolean;
};

export function createWasmChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
  createFallbackIndex: () => ChartDensityIndex<TProperties>,
  preparation: WasmChartDensityPreparationOptions<TProperties> = {},
): ChartDensityIndex<TProperties> {
  // Loading is intentionally asynchronous so importing @moritzbrantner/charts/core remains
  // server-safe and ordinary development never requires a WASM artifact. Dataset normalization
  // and coordinate packing are also demand-driven so merely constructing this wrapper does not
  // duplicate the source series before a WASM query is actually requested.
  if (!getLoadedChartWasmKernel()) {
    void loadChartWasmKernel().catch(() => undefined);
  }

  const facts = createMutableChartDensityWorkFacts(points.length);
  let fallbackIndex = preparation.fallbackIndex ?? null;
  let wasmState: WasmPreparedChartState<TProperties> | null = null;
  const readFallbackIndex = () => {
    if (!fallbackIndex) {
      facts.preparation.fallbackIndexBuilds += 1;
      fallbackIndex = createFallbackIndex();
    }

    return fallbackIndex;
  };
  const readWasmState = () => {
    if (wasmState) {
      return wasmState;
    }

    facts.preparation.wasmStateBuilds += 1;
    const normalizedPoints = normalizeWasmPoints(points, options);
    const x = Float64Array.from(normalizedPoints, (point) => point.x);
    const y = Float64Array.from(normalizedPoints, (point) => point.y);

    facts.materialized.wasmPreparedPoints += normalizedPoints.length;
    facts.materialized.wasmCoordinateValues += x.length + y.length;
    wasmState = {
      metricKeys: collectDensityMetricKeys(normalizedPoints.map((point) => point.metrics)),
      points: normalizedPoints,
      x,
      y,
    };

    return wasmState;
  };

  if (preparation.prepareImmediately) {
    if (!getLoadedChartWasmKernel()) {
      throw new Error("charts WASM kernel must be loaded before eager preparation");
    }
    readWasmState();
  }

  const index: ChartDensityIndex<TProperties> = {
    getBackendCapabilities() {
      return wasmState ? WASM_CAPABILITIES : FALLBACK_CAPABILITIES;
    },

    getBinnedSeries(query) {
      facts.queries.binnedSeries += 1;
      const series = getLoadedChartWasmKernel()
        ? createWasmBinnedSeries(readWasmState(), query)
        : readFallbackIndex().getBinnedSeries(query);

      facts.materialized.bins += series.bins.length;
      return series;
    },

    getChartSeries(query) {
      facts.queries.chartSeries += 1;

      if (!getLoadedChartWasmKernel()) {
        const result = readFallbackIndex().getChartSeries(query);

        facts.materialized.bins += result.bins.length;
        facts.materialized.samples += result.samples.length;
        return result;
      }

      const state = readWasmState();
      const valueMode = query.valueMode ?? "average";
      const series = createWasmBinnedSeries(state, query);
      const samples = series.bins.map((bin) => createChartDensitySample(bin, valueMode));
      populateWasmPercentiles(samples, state.points, query);
      const result = {
        bins: series.bins,
        samples,
        summary: {
          ...series.summary,
          sampleCount: samples.length,
          valueMode,
        },
      } satisfies ChartDensitySeries<TProperties>;

      facts.materialized.bins += result.bins.length;
      facts.materialized.samples += result.samples.length;
      return result;
    },

    getChartPoints(query) {
      facts.queries.chartPoints += 1;
      const series = readFallbackIndex().getChartPoints(query);

      facts.materialized.points += series.points.length;
      return series;
    },

    getGroupedChartSeries(query) {
      facts.queries.groupedSeries += 1;
      const grouped = readFallbackIndex().getGroupedChartSeries(query);

      facts.materialized.groups += grouped.groups.length;
      for (const group of grouped.groups) {
        facts.materialized.bins += group.series.bins.length;
        facts.materialized.samples += group.series.samples.length;
      }
      return grouped;
    },

    getHeatmap(query) {
      facts.queries.heatmaps += 1;
      const heatmap = readFallbackIndex().getHeatmap(query);

      facts.materialized.cells += heatmap.cells.length;
      return heatmap;
    },

    getHistogram(query) {
      facts.queries.histograms += 1;
      const histogram =
        getLoadedChartWasmKernel() && typeof query.valueAccessor !== "function"
          ? createWasmHistogram(readWasmState(), query)
          : readFallbackIndex().getHistogram(query);

      facts.materialized.buckets += histogram.buckets.length;
      return histogram;
    },

    getPointById(pointId) {
      facts.queries.pointLookups += 1;
      return readFallbackIndex().getPointById(pointId);
    },

    getScatter(query) {
      facts.queries.scatters += 1;
      const scatter = readFallbackIndex().getScatter(query);

      facts.materialized.scatterPoints += scatter.points.length;
      return scatter;
    },

    getSeriesBounds() {
      facts.queries.bounds += 1;
      return readFallbackIndex().getSeriesBounds();
    },
  };

  return attachChartDensityWorkFacts(index, facts);
}

function createWasmBinnedSeries<TProperties>(
  state: WasmPreparedChartState<TProperties>,
  query: { includeEmptyBins?: boolean; targetBinCount: number; xDomain: [number, number] },
): BinnedSeries<TProperties> {
  const kernel = getLoadedChartWasmKernel();
  if (!kernel) {
    throw new Error("charts WASM kernel is not loaded");
  }

  const { metricKeys, points, x, y } = state;
  const xDomain = normalizeChartDomain(query.xDomain);
  const targetBinCount = clampInteger(query.targetBinCount, 1, 100_000);
  const numericBins = kernel.aggregateDensityBins(x, y, xDomain, targetBinCount);
  const metadata = numericBins.map<{
    firstPoint: IndexedChartSeriesPoint<TProperties> | null;
    lastPoint: IndexedChartSeriesPoint<TProperties> | null;
    metrics: ChartMetricRecord;
  }>(() => ({
    firstPoint: null,
    lastPoint: null,
    metrics: Object.fromEntries(metricKeys.map((key) => [key, 0])),
  }));
  const width = (xDomain[1] - xDomain[0]) / targetBinCount;

  for (const point of points) {
    if (point.x < xDomain[0] || point.x > xDomain[1]) {
      continue;
    }
    const binIndex = Math.min(
      targetBinCount - 1,
      Math.max(0, Math.floor((point.x - xDomain[0]) / width)),
    );
    const bin = metadata[binIndex];
    bin.firstPoint ??= point;
    bin.lastPoint = point;
    for (const key of metricKeys) {
      bin.metrics[key] = (bin.metrics[key] ?? 0) + (point.metrics[key] ?? 0);
    }
  }

  const bins: Array<ChartDensityBin<TProperties>> = numericBins.map((bin, index) => ({
    averageY: bin.averageY,
    firstPoint: metadata[index].firstPoint,
    index: bin.index,
    lastPoint: metadata[index].lastPoint,
    maxY: bin.maxY,
    metrics: metadata[index].metrics,
    minY: bin.minY,
    pointCount: bin.pointCount,
    sumY: bin.sumY,
    x0: bin.x0,
    x1: bin.x1,
  }));
  const visibleBins = query.includeEmptyBins ? bins : bins.filter((bin) => bin.pointCount > 0);

  return {
    bins: visibleBins,
    summary: {
      binCount: visibleBins.length,
      metrics: sumDensityMetrics(
        visibleBins.map((bin) => bin.metrics),
        metricKeys,
      ),
      pointCount: visibleBins.reduce((total, bin) => total + bin.pointCount, 0),
      xDomain,
    },
  };
}

function createWasmHistogram<TProperties>(
  state: WasmPreparedChartState<TProperties>,
  query: ChartHistogramQuery<TProperties>,
): ChartHistogram<TProperties> {
  const kernel = getLoadedChartWasmKernel();
  if (!kernel) {
    throw new Error("charts WASM kernel is not loaded");
  }

  const bucketCount = clampInteger(query.bucketCount, 1, 100_000);
  const xDomain = query.xDomain ? normalizeChartDomain(query.xDomain) : null;
  const selectedPoints = xDomain ? getPointsInXDomain(state.points, xDomain) : state.points;
  const accessor = query.valueAccessor ?? "y";
  const valuedPoints: Array<{ point: IndexedChartSeriesPoint<TProperties>; value: number }> = [];
  for (const point of selectedPoints) {
    const value = getPointAccessorValue(point, accessor);
    if (value !== null) {
      valuedPoints.push({ point, value });
    }
  }
  const valueDomain = query.valueDomain ??
    getValueDomain(valuedPoints.map((item) => item.value)) ?? [0, 0];
  const normalizedValueDomain = normalizeChartDomain(valueDomain);
  const numericBuckets = kernel.aggregateHistogram(
    Float64Array.from(valuedPoints, (item) => item.value),
    normalizedValueDomain,
    bucketCount,
  );
  const metadata = numericBuckets.map<{
    firstPoint: IndexedChartSeriesPoint<TProperties> | null;
    lastPoint: IndexedChartSeriesPoint<TProperties> | null;
    metrics: ChartMetricRecord;
  }>(() => ({
    firstPoint: null,
    lastPoint: null,
    metrics: Object.fromEntries(state.metricKeys.map((key) => [key, 0])),
  }));

  for (const item of valuedPoints) {
    if (item.value < normalizedValueDomain[0] || item.value > normalizedValueDomain[1]) {
      continue;
    }

    const bucketIndex = getBucketIndex(item.value, normalizedValueDomain, bucketCount);
    const bucketMetadata = metadata[bucketIndex];
    bucketMetadata.firstPoint ??= item.point;
    bucketMetadata.lastPoint = item.point;
    for (const key of state.metricKeys) {
      bucketMetadata.metrics[key] =
        (bucketMetadata.metrics[key] ?? 0) + (item.point.metrics[key] ?? 0);
    }
  }

  const bucketWidth = getChartBinWidth(normalizedValueDomain, bucketCount);
  const buckets: Array<ChartHistogramBucket<TProperties>> = numericBuckets.map((bucket, index) => ({
    averageValue: bucket.averageValue,
    firstPoint: metadata[index].firstPoint,
    index: bucket.index,
    lastPoint: metadata[index].lastPoint,
    maxValue: bucket.maxValue,
    metrics: metadata[index].metrics,
    minValue: bucket.minValue,
    pointCount: bucket.pointCount,
    value: normalizedValueDomain[0] + (index + 0.5) * bucketWidth,
    value0: bucket.value0,
    value1: bucket.value1,
  }));
  const visibleBuckets =
    query.includeEmptyBuckets === false
      ? buckets.filter((bucket) => bucket.pointCount > 0)
      : buckets;

  return {
    buckets: visibleBuckets,
    summary: {
      bucketCount: visibleBuckets.length,
      metrics: sumDensityMetrics(
        visibleBuckets.map((bucket) => bucket.metrics),
        state.metricKeys,
      ),
      pointCount: visibleBuckets.reduce((total, bucket) => total + bucket.pointCount, 0),
      valueDomain: normalizedValueDomain,
      xDomain,
    },
  };
}

function populateWasmPercentiles<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  points: Array<IndexedChartSeriesPoint<TProperties>>,
  query: ChartDensityQuery,
) {
  const requested = new Set<ChartPercentileMode>(query.percentiles ?? []);
  if (query.valueMode && isPercentileMode(query.valueMode)) {
    requested.add(query.valueMode);
  }
  if (requested.size === 0) {
    return;
  }

  const kernel = getLoadedChartWasmKernel();
  if (!kernel) {
    return;
  }

  const xDomain = normalizeChartDomain(query.xDomain);
  const binCount = clampInteger(query.targetBinCount, 1, 100_000);
  const width = (xDomain[1] - xDomain[0]) / binCount;
  const valuesByBin: number[][] = Array.from({ length: binCount }, () => []);

  for (const point of points) {
    if (point.x < xDomain[0] || point.x > xDomain[1]) {
      continue;
    }
    const binIndex = Math.min(
      binCount - 1,
      Math.max(0, Math.floor((point.x - xDomain[0]) / width)),
    );
    valuesByBin[binIndex].push(point.y);
  }

  for (const sample of samples) {
    const values = valuesByBin[sample.index] ?? [];
    if (values.length === 0) {
      continue;
    }
    const typedValues = Float64Array.from(values);
    for (const mode of requested) {
      const value = kernel.percentile(typedValues, PERCENTILE_QUANTILES[mode]);
      sample[mode] = Number.isFinite(value) ? value : null;
      if (query.valueMode === mode) {
        sample.y = sample[mode];
      }
    }
  }
}

function normalizeWasmPoints<TProperties>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
): Array<IndexedChartSeriesPoint<TProperties>> {
  const normalized: Array<IndexedChartSeriesPoint<TProperties>> = [];

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const next: IndexedChartSeriesPoint<TProperties> = {
      id: String(point.id ?? index),
      label: point.label ?? "",
      metrics: normalizeDensityMetrics(point.metrics),
      properties: point.properties ?? ({} as TProperties),
      x: point.x,
      y: point.y,
    };

    if (
      Number.isFinite(next.x) &&
      Number.isFinite(next.y) &&
      (options.filterPoint?.(next) ?? true)
    ) {
      normalized.push(next);
    }
  }

  normalized.sort((left, right) => left.x - right.x);
  return normalized;
}

function isPercentileMode(value: string): value is ChartPercentileMode {
  return value in PERCENTILE_QUANTILES;
}

import {
  collectDensityMetricKeys,
  normalizeDensityMetrics,
  sumDensityMetrics,
  type BinnedSeries,
  type BinnedSeriesIndexOptions,
} from "./data-density";
import { createChartDensitySample } from "./density/render-data";
import { clampInteger, normalizeChartDomain } from "./density/shared";
import { getLoadedChartWasmKernel, loadChartWasmKernel } from "./wasm-kernel";

import type {
  ChartBackendCapabilities,
  ChartDensityBin,
  ChartDensityIndex,
  ChartDensityQuery,
  ChartDensitySeries,
  ChartMetricRecord,
  ChartSeriesPoint,
  IndexedChartSeriesPoint,
} from "./density";

const WASM_CAPABILITIES: ChartBackendCapabilities = {
  backend: "wasm-index",
  supportsGroupedSeries: false,
  supportsHeatmap: false,
  supportsHistogram: false,
  supportsPercentiles: false,
  usesWasm: true,
};

export function createWasmChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
  createFallbackIndex: () => ChartDensityIndex<TProperties>,
): ChartDensityIndex<TProperties> {
  // Loading is intentionally asynchronous so importing @moritzbrantner/charts/core remains
  // server-safe and ordinary development never requires a WASM artifact. Until the local
  // kernel is ready, this index is behaviorally identical to the JS correctness baseline.
  if (!getLoadedChartWasmKernel()) {
    void loadChartWasmKernel().catch(() => undefined);
  }

  const normalizedPoints = normalizeWasmPoints(points, options);
  const x = Float64Array.from(normalizedPoints, (point) => point.x);
  const y = Float64Array.from(normalizedPoints, (point) => point.y);
  const pointLookup = new Map(normalizedPoints.map((point) => [point.id, point]));
  const metricKeys = collectDensityMetricKeys(normalizedPoints.map((point) => point.metrics));
  const bounds = createSeriesBounds(normalizedPoints);
  let fallbackIndex: ChartDensityIndex<TProperties> | null = null;
  const readFallbackIndex = () => (fallbackIndex ??= createFallbackIndex());

  return {
    getBackendCapabilities() {
      if (!getLoadedChartWasmKernel()) {
        return (
          readFallbackIndex().getBackendCapabilities?.() ?? {
            backend: "hybrid-js",
            supportsGroupedSeries: true,
            supportsHeatmap: true,
            supportsHistogram: true,
            supportsPercentiles: true,
            usesWasm: false,
          }
        );
      }
      return WASM_CAPABILITIES;
    },

    getBinnedSeries(query) {
      if (!getLoadedChartWasmKernel()) {
        return readFallbackIndex().getBinnedSeries(query);
      }
      return createWasmBinnedSeries(normalizedPoints, x, y, metricKeys, query);
    },

    getChartSeries(query) {
      if (!getLoadedChartWasmKernel() || requiresPercentileFallback(query)) {
        return readFallbackIndex().getChartSeries(query);
      }

      const valueMode = query.valueMode ?? "average";
      const series = createWasmBinnedSeries(normalizedPoints, x, y, metricKeys, query);
      const samples = series.bins.map((bin) => createChartDensitySample(bin, valueMode));

      return {
        bins: series.bins,
        samples,
        summary: {
          ...series.summary,
          sampleCount: samples.length,
          valueMode,
        },
      } satisfies ChartDensitySeries<TProperties>;
    },

    getChartPoints(query) {
      return readFallbackIndex().getChartPoints(query);
    },

    getGroupedChartSeries(query) {
      return readFallbackIndex().getGroupedChartSeries(query);
    },

    getHeatmap(query) {
      return readFallbackIndex().getHeatmap(query);
    },

    getHistogram(query) {
      return readFallbackIndex().getHistogram(query);
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

function createWasmBinnedSeries<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties>>,
  x: Float64Array,
  y: Float64Array,
  metricKeys: string[],
  query: { includeEmptyBins?: boolean; targetBinCount: number; xDomain: [number, number] },
): BinnedSeries<TProperties> {
  const kernel = getLoadedChartWasmKernel();
  if (!kernel) {
    throw new Error("charts WASM kernel is not loaded");
  }

  const xDomain = normalizeChartDomain(query.xDomain);
  const targetBinCount = clampInteger(query.targetBinCount, 1, 100_000);
  const numericBins = kernel.aggregateDensityBins(x, y, xDomain, targetBinCount);
  const metadata = numericBins.map(() => ({
    firstPoint: null as IndexedChartSeriesPoint<TProperties> | null,
    lastPoint: null as IndexedChartSeriesPoint<TProperties> | null,
    metrics: Object.fromEntries(metricKeys.map((key) => [key, 0])) as ChartMetricRecord,
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
    const bin = metadata[binIndex]!;
    bin.firstPoint ??= point;
    bin.lastPoint = point;
    for (const key of metricKeys) {
      bin.metrics[key] = (bin.metrics[key] ?? 0) + (point.metrics[key] ?? 0);
    }
  }

  const bins: Array<ChartDensityBin<TProperties>> = numericBins.map((bin, index) => ({
    averageY: bin.averageY,
    firstPoint: metadata[index]!.firstPoint,
    index: bin.index,
    lastPoint: metadata[index]!.lastPoint,
    maxY: bin.maxY,
    metrics: metadata[index]!.metrics,
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

function normalizeWasmPoints<TProperties>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
): Array<IndexedChartSeriesPoint<TProperties>> {
  const normalized: Array<IndexedChartSeriesPoint<TProperties>> = [];

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]!;
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

function createSeriesBounds<TProperties>(points: Array<IndexedChartSeriesPoint<TProperties>>) {
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

function requiresPercentileFallback(query: ChartDensityQuery) {
  return Boolean(query.percentiles?.length || (query.valueMode && query.valueMode.startsWith("p")));
}

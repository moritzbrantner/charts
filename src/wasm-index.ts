import {
  collectDensityMetricKeys,
  normalizeDensityMetrics,
  sumDensityMetrics,
  type BinnedSeries,
  type BinnedSeriesBin,
  type BinnedSeriesIndexOptions,
} from "./data-density";
import { createChartDensitySample } from "./density/render-data";
import { clampInteger, normalizeChartDomain } from "./density/shared";
import { createChartWasmKernelIndex } from "./wasm-kernel";

import type {
  ChartBackendCapabilities,
  ChartDensityIndex,
  ChartSeriesPoint,
  IndexedChartSeriesPoint,
} from "./density";

const BIN_STRIDE = 6;

export function createWasmChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
  createFallbackIndex: () => ChartDensityIndex<TProperties>,
): ChartDensityIndex<TProperties> {
  const normalizedPoints = normalizePoints(points, options);
  const pointLookup = new Map(normalizedPoints.map((point) => [point.id, point]));
  const metricKeys = collectDensityMetricKeys(normalizedPoints.map((point) => point.metrics));
  const kernel = createChartWasmKernelIndex(
    Float64Array.from(normalizedPoints, (point) => point.x),
    Float64Array.from(normalizedPoints, (point) => point.y),
  );
  let fallbackIndex: ChartDensityIndex<TProperties> | null = null;
  const readFallbackIndex = () => {
    fallbackIndex ??= createFallbackIndex();
    return fallbackIndex;
  };

  if (!kernel) {
    const fallback = readFallbackIndex();

    return {
      ...fallback,
      getBackendCapabilities() {
        return {
          ...(fallback.getBackendCapabilities?.() ?? defaultHybridCapabilities()),
          backend: "wasm-index",
          usesWasm: false,
        };
      },
    };
  }

  const getBinnedSeries: ChartDensityIndex<TProperties>["getBinnedSeries"] = (query) => {
    const xDomain = normalizeChartDomain(query.xDomain);
    const targetBinCount = clampInteger(query.targetBinCount, 1, 100_000);
    const binWidth = getBinWidth(xDomain, targetBinCount);
    const aggregates = kernel.binSeries(xDomain[0], xDomain[1], targetBinCount);

    if (aggregates.length !== targetBinCount * BIN_STRIDE) {
      throw new Error(
        `Chart WASM kernel returned ${aggregates.length} aggregate values for ${targetBinCount} bins.`,
      );
    }

    const bins = createBins(
      normalizedPoints,
      aggregates,
      metricKeys,
      xDomain,
      targetBinCount,
      binWidth,
    );
    const visibleBins = query.includeEmptyBins ? bins : bins.filter((bin) => bin.pointCount > 0);

    return summarizeBins(visibleBins, metricKeys, xDomain);
  };

  return {
    getBackendCapabilities() {
      return {
        backend: "wasm-index",
        supportsGroupedSeries: false,
        supportsHeatmap: false,
        supportsHistogram: false,
        supportsPercentiles: false,
        usesWasm: true,
      };
    },

    getBinnedSeries,

    getChartSeries(query) {
      if (query.percentiles?.length || query.valueMode?.startsWith("p")) {
        return readFallbackIndex().getChartSeries(query);
      }

      const valueMode = query.valueMode ?? "average";
      const series = getBinnedSeries(query);
      const samples = series.bins.map((bin) => createChartDensitySample(bin, valueMode));

      return {
        bins: series.bins,
        samples,
        summary: {
          ...series.summary,
          sampleCount: samples.length,
          valueMode,
        },
      };
    },

    getChartPoints(query = {}) {
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

    getScatter(query = {}) {
      return readFallbackIndex().getScatter(query);
    },

    getSeriesBounds() {
      return readSeriesBounds(normalizedPoints);
    },
  };
}

function normalizePoints<TProperties>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
): Array<IndexedChartSeriesPoint<TProperties>> {
  return points
    .map((point, index) => ({
      id: String(point.id ?? index),
      label: point.label ?? "",
      metrics: normalizeDensityMetrics(point.metrics),
      properties: point.properties ?? ({} as TProperties),
      x: point.x,
      y: point.y,
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .filter((point) => options.filterPoint?.(point) ?? true)
    .sort((left, right) => left.x - right.x);
}

function createBins<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties>>,
  aggregates: Float64Array,
  metricKeys: string[],
  xDomain: [number, number],
  binCount: number,
  binWidth: number,
): Array<BinnedSeriesBin<TProperties>> {
  const bins = Array.from({ length: binCount }, (_, index) => {
    const offset = index * BIN_STRIDE;
    const pointCount = aggregates[offset] ?? 0;
    const sumY = aggregates[offset + 1] ?? 0;
    const firstIndex = aggregates[offset + 4] ?? -1;
    const lastIndex = aggregates[offset + 5] ?? -1;

    return {
      averageY: pointCount > 0 ? sumY / pointCount : null,
      firstPoint: firstIndex >= 0 ? (points[firstIndex] ?? null) : null,
      index,
      lastPoint: lastIndex >= 0 ? (points[lastIndex] ?? null) : null,
      maxY: pointCount > 0 ? (aggregates[offset + 3] ?? null) : null,
      metrics: Object.fromEntries(metricKeys.map((metricKey) => [metricKey, 0])),
      minY: pointCount > 0 ? (aggregates[offset + 2] ?? null) : null,
      pointCount,
      sumY,
      x0: xDomain[0] + index * binWidth,
      x1: index === binCount - 1 ? xDomain[1] : xDomain[0] + (index + 1) * binWidth,
    } satisfies BinnedSeriesBin<TProperties>;
  });

  const startIndex = lowerBoundByX(points, xDomain[0]);
  const endIndex = upperBoundByX(points, xDomain[1]);

  for (let pointIndex = startIndex; pointIndex < endIndex; pointIndex += 1) {
    const point = points[pointIndex];
    const binIndex = Math.min(
      binCount - 1,
      Math.max(0, Math.floor((point.x - xDomain[0]) / binWidth)),
    );
    const metrics = bins[binIndex].metrics;

    for (const metricKey of metricKeys) {
      metrics[metricKey] += point.metrics[metricKey] ?? 0;
    }
  }

  return bins;
}

function summarizeBins<TProperties>(
  bins: Array<BinnedSeriesBin<TProperties>>,
  metricKeys: string[],
  xDomain: [number, number],
): BinnedSeries<TProperties> {
  return {
    bins,
    summary: {
      binCount: bins.length,
      metrics: sumDensityMetrics(
        bins.map((bin) => bin.metrics),
        metricKeys,
      ),
      pointCount: bins.reduce((total, bin) => total + bin.pointCount, 0),
      xDomain,
    },
  };
}

function readSeriesBounds<TProperties>(points: Array<IndexedChartSeriesPoint<TProperties>>) {
  if (points.length === 0) {
    return null;
  }

  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return {
    maxX: points[points.length - 1].x,
    maxY,
    minX: points[0].x,
    minY,
  };
}

function lowerBoundByX<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties>>,
  x: number,
) {
  let low = 0;
  let high = points.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (points[middle].x < x) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
}

function upperBoundByX<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties>>,
  x: number,
) {
  let low = 0;
  let high = points.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (points[middle].x <= x) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
}

function getBinWidth(domain: [number, number], binCount: number) {
  const span = domain[1] - domain[0];
  return span > 0 ? span / binCount : 1;
}

function defaultHybridCapabilities(): ChartBackendCapabilities {
  return {
    backend: "hybrid-js",
    supportsGroupedSeries: true,
    supportsHeatmap: true,
    supportsHistogram: true,
    supportsPercentiles: true,
    usesWasm: false,
  };
}

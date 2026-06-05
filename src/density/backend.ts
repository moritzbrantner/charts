import { createBinnedSeriesIndex } from "../data-density";
import { createWasmChartDensityIndex } from "../wasm-index";

import {
  createChartPointStore,
  createChartRangeAggregateStore,
  createPointStoreChartPoints,
  createPointStoreChartSeries,
  createPointStoreGroupedChartSeries,
  createPointStoreHeatmap,
  createPointStoreHistogram,
  createPointStoreScatter,
  createRangeAggregateBinnedSeries,
  isChartPercentileMode,
  shouldUsePointStoreForQuery,
} from "./point-store";
import { createChartDensitySample } from "./render-data";
import { clampInteger, normalizeChartDomain, scheduleChartDensityWarmup } from "./shared";
import { createChartDensityWorkerIndex } from "./worker-client";

import type { BinnedSeries, BinnedSeriesIndexOptions, BinnedSeriesQuery } from "../data-density";
import type { StaticChartDensityIndexOptions } from "./shared";
import type {
  BinnedSeriesBackend,
  ChartDensityBackendPolicyInput,
  ChartDensityCacheOptions,
  ChartDensityIndex,
  ChartDensityIndexOptions,
  ChartDensityQuery,
  ChartDensitySeries,
  ChartDensityWorkerIndex,
  ChartDensityWorkerOptions,
  ChartSeriesPoint,
  ProgressiveChartDensityIndex,
} from "./types";

export function resolveChartDensityBackendPolicy({
  hasPercentiles = false,
  operationKind = "chart",
  pointCount,
  requestedModes = [],
}: ChartDensityBackendPolicyInput): BinnedSeriesBackend {
  const percentileRequested =
    hasPercentiles || requestedModes.some((mode) => isChartPercentileMode(mode));

  if (operationKind === "chart" && percentileRequested && pointCount >= 200_000) {
    return "wasm-index";
  }

  return "hybrid-js";
}

export function createChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: ChartDensityIndexOptions<TProperties> = {},
): ChartDensityIndex<TProperties> {
  const { backend = "progressive", progressive, ...indexOptions } = options;
  const resolvedBackend =
    backend === "auto"
      ? resolveChartDensityBackendPolicy({
          operationKind: "construct",
          pointCount: points.length,
        })
      : backend;

  if (resolvedBackend === "progressive") {
    return createProgressiveChartDensityIndex(points, {
      ...indexOptions,
      progressive,
    });
  }

  return createStaticChartDensityIndex(points, {
    ...indexOptions,
    backend: resolvedBackend,
    rangeAggregate: backend === "auto",
  });
}

export function createProgressiveChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: Omit<ChartDensityIndexOptions<TProperties>, "backend"> = {},
): ProgressiveChartDensityIndex<TProperties> {
  const { progressive, ...indexOptions } = options;
  let activeBackend: BinnedSeriesBackend = "hybrid-js";
  let activeIndex = createStaticChartDensityIndex(points, {
    ...indexOptions,
    backend: "hybrid-js",
  });
  let wasmIndex: ChartDensityIndex<TProperties> | null = null;
  let wasmError: unknown | null = null;
  let isWarming = false;
  let warmupPromise: Promise<ChartDensityIndex<TProperties>> | null = null;
  let workerIndex: ChartDensityWorkerIndex<TProperties> | null = null;
  let workerError: unknown | null = null;
  let workerReady = false;
  let isWorkerBuilding = false;
  let workerWarmupPromise: Promise<ChartDensityWorkerIndex<TProperties> | null> | null = null;

  const warmWasmIndex = () => {
    if (wasmIndex) {
      return Promise.resolve(wasmIndex);
    }

    if (warmupPromise) {
      return warmupPromise;
    }

    isWarming = true;
    wasmError = null;
    warmupPromise = Promise.resolve()
      .then(() => {
        const nextIndex = createStaticChartDensityIndex(points, {
          ...indexOptions,
          backend: "wasm-index",
        });

        wasmIndex = nextIndex;
        activeIndex = nextIndex;
        activeBackend = "wasm-index";
        progressive?.onReady?.(nextIndex);

        return nextIndex;
      })
      .catch((error: unknown) => {
        wasmError = error;
        progressive?.onError?.(error);
        throw error;
      })
      .finally(() => {
        isWarming = false;
      });

    return warmupPromise;
  };
  const warmWorkerIndex = () => {
    if (workerReady && workerIndex) {
      return Promise.resolve(workerIndex);
    }

    if (workerWarmupPromise) {
      return workerWarmupPromise;
    }

    const workerOptions = resolveProgressiveWorkerOptions(progressive?.worker);

    if (!workerOptions) {
      return Promise.resolve(null);
    }

    isWorkerBuilding = true;
    workerError = null;

    try {
      workerIndex = createChartDensityWorkerIndex(points, indexOptions, workerOptions);
    } catch (error) {
      const workerBuildError = normalizeChartDensityWorkerError(error);

      isWorkerBuilding = false;
      workerError = workerBuildError;
      progressive?.onError?.(workerBuildError);
      return Promise.reject(workerBuildError);
    }

    if (!workerIndex) {
      isWorkerBuilding = false;
      return Promise.resolve(null);
    }

    workerWarmupPromise = workerIndex
      .whenReady()
      .then((readyIndex) => {
        workerReady = true;
        progressive?.onWorkerReady?.(readyIndex);

        return readyIndex;
      })
      .catch((error: unknown) => {
        workerError = error;
        progressive?.onError?.(error);
        throw error;
      })
      .finally(() => {
        isWorkerBuilding = false;
      });

    return workerWarmupPromise;
  };

  if (progressive?.warmup !== "manual") {
    scheduleChartDensityWarmup(progressive?.scheduler, () => {
      if (progressive?.worker) {
        void warmWorkerIndex().catch(() => undefined);
        return;
      }

      void warmWasmIndex().catch(() => undefined);
    });
  }

  return {
    getBackendCapabilities() {
      return (
        activeIndex.getBackendCapabilities?.() ?? {
          backend: activeBackend,
          supportsGroupedSeries: true,
          supportsHeatmap: true,
          supportsHistogram: true,
          supportsPercentiles: true,
          usesWasm: activeBackend === "wasm-index",
        }
      );
    },

    getActiveBackend() {
      return activeBackend;
    },

    getBinnedSeries(query) {
      return activeIndex.getBinnedSeries(query);
    },

    getChartSeries(query) {
      return activeIndex.getChartSeries(query);
    },

    getChartPoints(query) {
      return activeIndex.getChartPoints(query);
    },

    getGroupedChartSeries(query) {
      return activeIndex.getGroupedChartSeries(query);
    },

    getHeatmap(query) {
      return activeIndex.getHeatmap(query);
    },

    getHistogram(query) {
      return activeIndex.getHistogram(query);
    },

    getPointById(pointId) {
      return activeIndex.getPointById(pointId);
    },

    getScatter(query) {
      return activeIndex.getScatter(query);
    },

    getProgressiveStatus() {
      return {
        activeBackend,
        isWarming,
        isWorkerBuilding,
        workerError,
        workerReady,
        wasmError,
        wasmReady: Boolean(wasmIndex),
      };
    },

    getSeriesBounds() {
      return activeIndex.getSeriesBounds();
    },

    getWorkerIndex() {
      return workerIndex;
    },

    warmWorkerIndex,

    warmWasmIndex,

    whenWorkerReady() {
      return warmWorkerIndex();
    },

    whenWasmReady() {
      return warmWasmIndex();
    },
  };
}

function resolveProgressiveWorkerOptions(
  options: boolean | ChartDensityWorkerOptions | undefined,
): ChartDensityWorkerOptions | null {
  if (!options) {
    return null;
  }

  return options === true ? {} : options;
}

function normalizeChartDensityWorkerError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

function createStaticChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: StaticChartDensityIndexOptions<TProperties>,
): ChartDensityIndex<TProperties> {
  const { cache, ...indexOptions } = options;
  const cacheOptions = normalizeChartDensityCacheOptions(cache);
  const index =
    indexOptions.backend === "wasm-index"
      ? createWasmChartDensityIndex(
          points,
          indexOptions as BinnedSeriesIndexOptions<TProperties>,
          () => createHybridChartDensityIndex(points, indexOptions),
        )
      : createHybridChartDensityIndex(points, indexOptions);

  return cacheOptions.enabled
    ? createCachedChartDensityIndex(index, cacheOptions.maxEntries)
    : index;
}

function createHybridChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: StaticChartDensityIndexOptions<TProperties>,
): ChartDensityIndex<TProperties> {
  const binnedIndex = createBinnedSeriesIndex(
    points,
    options as BinnedSeriesIndexOptions<TProperties>,
  );
  const pointStore = createChartPointStore(points, options);
  const rangeAggregateStore = options.rangeAggregate
    ? createChartRangeAggregateStore(pointStore)
    : null;

  return {
    getBackendCapabilities() {
      return {
        backend: "hybrid-js",
        supportsGroupedSeries: true,
        supportsHeatmap: true,
        supportsHistogram: true,
        supportsPercentiles: true,
        usesWasm: false,
      };
    },

    getBinnedSeries(query) {
      if (rangeAggregateStore) {
        return createRangeAggregateBinnedSeries(rangeAggregateStore, query);
      }

      return binnedIndex.getBinnedSeries(query);
    },

    getChartSeries(query) {
      const valueMode = query.valueMode ?? "average";

      if (shouldUsePointStoreForQuery(query)) {
        return createPointStoreChartSeries(pointStore, query, valueMode);
      }

      const series = rangeAggregateStore
        ? createRangeAggregateBinnedSeries(rangeAggregateStore, query)
        : binnedIndex.getBinnedSeries(query);
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

    getGroupedChartSeries(query) {
      return createPointStoreGroupedChartSeries(pointStore, query);
    },

    getChartPoints(query = {}) {
      return createPointStoreChartPoints(pointStore, query);
    },

    getHeatmap(query) {
      return createPointStoreHeatmap(pointStore, query);
    },

    getHistogram(query) {
      return createPointStoreHistogram(pointStore, query);
    },

    getPointById(pointId) {
      return binnedIndex.getPointById(pointId);
    },

    getScatter(query = {}) {
      return createPointStoreScatter(pointStore, query);
    },

    getSeriesBounds() {
      return binnedIndex.getSeriesBounds();
    },
  };
}

function normalizeChartDensityCacheOptions(
  options: ChartDensityCacheOptions | undefined,
): Required<ChartDensityCacheOptions> {
  return {
    enabled: options?.enabled ?? true,
    maxEntries: clampInteger(options?.maxEntries ?? 64, 0, 10_000),
  };
}

function createCachedChartDensityIndex<TProperties>(
  index: ChartDensityIndex<TProperties>,
  maxEntries: number,
): ChartDensityIndex<TProperties> {
  if (maxEntries <= 0) {
    return index;
  }

  const binnedCache = new ChartLruCache<BinnedSeries<TProperties>>(maxEntries);
  const chartCache = new ChartLruCache<ChartDensitySeries<TProperties>>(maxEntries);

  return {
    ...index,
    getBinnedSeries(query) {
      const key = createBinnedSeriesCacheKey(query);
      const cached = binnedCache.get(key);

      if (cached) {
        return cached;
      }

      const series = index.getBinnedSeries(query);

      binnedCache.set(key, series);

      return series;
    },
    getChartSeries(query) {
      const key = createChartSeriesCacheKey(query);
      const cached = chartCache.get(key);

      if (cached) {
        return cached;
      }

      const series = index.getChartSeries(query);

      chartCache.set(key, series);

      return series;
    },
    getChartPoints(query = {}) {
      return index.getChartPoints(query);
    },
    getScatter(query = {}) {
      return index.getScatter(query);
    },
  };
}

class ChartLruCache<TValue> {
  readonly #entries = new Map<string, TValue>();
  readonly #maxEntries: number;

  constructor(maxEntries: number) {
    this.#maxEntries = Math.max(0, maxEntries);
  }

  get(key: string) {
    if (!this.#entries.has(key)) {
      return null;
    }

    const value = this.#entries.get(key) as TValue;

    this.#entries.delete(key);
    this.#entries.set(key, value);

    return value;
  }

  set(key: string, value: TValue) {
    this.#entries.set(key, value);

    while (this.#entries.size > this.#maxEntries) {
      const oldestKey = this.#entries.keys().next().value;

      if (typeof oldestKey !== "string") {
        break;
      }

      this.#entries.delete(oldestKey);
    }
  }
}

function createBinnedSeriesCacheKey(query: BinnedSeriesQuery) {
  const xDomain = normalizeChartDomain(query.xDomain);

  return JSON.stringify({
    includeEmptyBins: Boolean(query.includeEmptyBins),
    targetBinCount: clampInteger(query.targetBinCount, 1, 100_000),
    xDomain,
  });
}

function createChartSeriesCacheKey(query: ChartDensityQuery) {
  const xDomain = normalizeChartDomain(query.xDomain);
  const percentiles = [...(query.percentiles ?? [])].sort();

  return JSON.stringify({
    includeEmptyBins: Boolean(query.includeEmptyBins),
    percentiles,
    targetBinCount: clampInteger(query.targetBinCount, 1, 100_000),
    valueMode: query.valueMode ?? "average",
    xDomain,
  });
}

export const createChartSeriesIndex = createChartDensityIndex;

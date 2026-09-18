import { createBinnedSeriesIndex } from "../data-density";
import { createWasmChartDensityIndex } from "../wasm-index";
import { loadChartWasmKernel } from "../wasm-kernel";

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
import {
  attachChartDensityWorkFacts,
  createMutableChartDensityWorkFacts,
  getMutableChartDensityWorkFacts,
} from "./work-facts";
import { createChartDensityWorkerIndex } from "./worker-client";

import type {
  BinnedSeries,
  BinnedSeriesIndex,
  BinnedSeriesIndexOptions,
  BinnedSeriesQuery,
} from "../data-density";
import type { ChartPointStore, ChartRangeAggregateStore } from "./point-store";
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

type StaticChartDensityInternalOptions<TProperties> = {
  prepareWasmState?: boolean;
  wasmFallbackIndex?: ChartDensityIndex<TProperties>;
};

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
  const hybridIndex = createStaticChartDensityIndex(points, {
    ...indexOptions,
    backend: "hybrid-js",
  });
  let activeBackend: BinnedSeriesBackend = "hybrid-js";
  let activeIndex = hybridIndex;
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
      .then(async () => {
        await loadChartWasmKernel();
        const nextIndex = createStaticChartDensityIndex(
          points,
          {
            ...indexOptions,
            backend: "wasm-index",
          },
          {
            prepareWasmState: true,
            wasmFallbackIndex: hybridIndex,
          },
        );

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
  internal: StaticChartDensityInternalOptions<TProperties> = {},
): ChartDensityIndex<TProperties> {
  const { cache, ...indexOptions } = options;
  const cacheOptions = normalizeChartDensityCacheOptions(cache);
  const index =
    indexOptions.backend === "wasm-index"
      ? createWasmChartDensityIndex(
          points,
          indexOptions as BinnedSeriesIndexOptions<TProperties>,
          () => createHybridChartDensityIndex(points, indexOptions),
          {
            fallbackIndex: internal.wasmFallbackIndex,
            prepareImmediately: internal.prepareWasmState,
          },
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
  const facts = createMutableChartDensityWorkFacts(points.length);
  let binnedIndex: BinnedSeriesIndex<TProperties> | null = null;
  let pointStore: ChartPointStore<TProperties> | null = null;
  let pointStoreBounds:
    | { maxX: number; maxY: number; minX: number; minY: number }
    | null
    | undefined;
  let rangeAggregateStore: ChartRangeAggregateStore<TProperties> | null = null;
  const readBinnedIndex = () => {
    if (!binnedIndex) {
      facts.preparation.binnedIndexBuilds += 1;
      binnedIndex = createBinnedSeriesIndex(
        points,
        options as BinnedSeriesIndexOptions<TProperties>,
      );
    }

    return binnedIndex;
  };
  const readPointStore = () => {
    if (!pointStore) {
      facts.preparation.pointStoreBuilds += 1;
      pointStore = createChartPointStore(points, options);
    }

    return pointStore;
  };
  const readRangeAggregateStore = () => {
    if (!rangeAggregateStore) {
      facts.preparation.rangeAggregateStoreBuilds += 1;
      rangeAggregateStore = createChartRangeAggregateStore(readPointStore());
    }

    return rangeAggregateStore;
  };
  const readPointStoreBounds = () => {
    if (pointStoreBounds !== undefined) {
      return pointStoreBounds;
    }

    const store = readPointStore();

    if (store.points.length === 0) {
      pointStoreBounds = null;
      return pointStoreBounds;
    }

    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const point of store.points) {
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    pointStoreBounds = {
      maxX: store.points[store.points.length - 1].x,
      maxY,
      minX: store.points[0].x,
      minY,
    };

    return pointStoreBounds;
  };

  const index: ChartDensityIndex<TProperties> = {
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
      facts.queries.binnedSeries += 1;
      const series = options.rangeAggregate
        ? createRangeAggregateBinnedSeries(readRangeAggregateStore(), query)
        : readBinnedIndex().getBinnedSeries(query);

      facts.materialized.bins += series.bins.length;
      return series;
    },

    getChartSeries(query) {
      facts.queries.chartSeries += 1;
      const valueMode = query.valueMode ?? "average";
      let result: ChartDensitySeries<TProperties>;

      if (shouldUsePointStoreForQuery(query)) {
        result = createPointStoreChartSeries(readPointStore(), query, valueMode);
      } else {
        const series = options.rangeAggregate
          ? createRangeAggregateBinnedSeries(readRangeAggregateStore(), query)
          : readBinnedIndex().getBinnedSeries(query);
        const samples = series.bins.map((bin) => createChartDensitySample(bin, valueMode));

        result = {
          bins: series.bins,
          samples,
          summary: {
            ...series.summary,
            sampleCount: samples.length,
            valueMode,
          },
        };
      }

      facts.materialized.bins += result.bins.length;
      facts.materialized.samples += result.samples.length;
      return result;
    },

    getGroupedChartSeries(query) {
      facts.queries.groupedSeries += 1;
      const grouped = createPointStoreGroupedChartSeries(readPointStore(), query);

      facts.materialized.groups += grouped.groups.length;
      for (const group of grouped.groups) {
        facts.materialized.bins += group.series.bins.length;
        facts.materialized.samples += group.series.samples.length;
      }
      return grouped;
    },

    getChartPoints(query = {}) {
      facts.queries.chartPoints += 1;
      const series = createPointStoreChartPoints(readPointStore(), query);

      facts.materialized.points += series.points.length;
      return series;
    },

    getHeatmap(query) {
      facts.queries.heatmaps += 1;
      const heatmap = createPointStoreHeatmap(readPointStore(), query);

      facts.materialized.cells += heatmap.cells.length;
      return heatmap;
    },

    getHistogram(query) {
      facts.queries.histograms += 1;
      const histogram = createPointStoreHistogram(readPointStore(), query);

      facts.materialized.buckets += histogram.buckets.length;
      return histogram;
    },

    getPointById(pointId) {
      facts.queries.pointLookups += 1;

      if (pointStore) {
        return pointStore.pointLookup.get(pointId) ?? null;
      }

      return readBinnedIndex().getPointById(pointId);
    },

    getScatter(query = {}) {
      facts.queries.scatters += 1;
      const scatter = createPointStoreScatter(readPointStore(), query);

      facts.materialized.scatterPoints += scatter.points.length;
      return scatter;
    },

    getSeriesBounds() {
      facts.queries.bounds += 1;

      if (pointStore) {
        return readPointStoreBounds();
      }

      return readBinnedIndex().getSeriesBounds();
    },
  };

  return attachChartDensityWorkFacts(index, facts);
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
  const facts = getMutableChartDensityWorkFacts(index);
  const cachedIndex: ChartDensityIndex<TProperties> = {
    ...index,
    getBinnedSeries(query) {
      const key = createBinnedSeriesCacheKey(query);
      const cached = binnedCache.get(key);

      if (cached) {
        if (facts) {
          facts.cache.hits += 1;
        }
        return cached;
      }

      if (facts) {
        facts.cache.misses += 1;
      }
      const series = index.getBinnedSeries(query);

      binnedCache.set(key, series);

      return series;
    },
    getChartSeries(query) {
      const key = createChartSeriesCacheKey(query);
      const cached = chartCache.get(key);

      if (cached) {
        if (facts) {
          facts.cache.hits += 1;
        }
        return cached;
      }

      if (facts) {
        facts.cache.misses += 1;
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

  return facts ? attachChartDensityWorkFacts(cachedIndex, facts) : cachedIndex;
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

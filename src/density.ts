import {
  collectDensityMetricKeys,
  createDensityViewportSummary,
  createBinnedSeriesIndex,
  sumDensityMetrics,
  type BinnedSeries,
  type BinnedSeriesBin,
  type BinnedSeriesIndexOptions,
  type BinnedSeriesQuery,
  type BinnedSeriesSummary,
  type DataDensityMetricRecord,
  type DataDensityViewportSummary,
  type IndexedNumericSeriesPoint,
  type NumericSeriesPoint,
} from "./data-density";
import { createWasmChartDensityIndex } from "./wasm-index";

import type { ChartDerivedPoint } from "./analytics";

export type BinnedSeriesBackend = "hybrid-js" | "wasm-index";
export type ChartMetricRecord = DataDensityMetricRecord;
export type ChartSeriesPoint<TProperties = Record<string, unknown>> =
  NumericSeriesPoint<TProperties>;
export type IndexedChartSeriesPoint<TProperties = Record<string, unknown>> =
  IndexedNumericSeriesPoint<TProperties>;
export type ChartDensityBin<TProperties = Record<string, unknown>> = BinnedSeriesBin<TProperties>;

export type ChartPercentileMode = "p10" | "p25" | "p50" | "p75" | "p90" | "p95" | "p99";

export type ChartValueMode = "average" | "count" | "max" | "min" | "sum" | ChartPercentileMode;

export type ChartValueModeRenderer = "line" | "bar";

export type ChartValueModeDefinition = {
  axisLabel: string;
  color: string;
  description: string;
  formatValue: (value: number | null, sample: ChartDensitySample) => string;
  id: ChartValueMode;
  label: string;
  renderer: ChartValueModeRenderer;
};

export type ChartGapBehavior = "preserve" | "connect" | "drop" | "zero-fill";

export type ChartGapAnnotation = {
  endIndex: number;
  endX: number;
  sampleCount: number;
  startIndex: number;
  startX: number;
};

export type ChartRenderDataOptions<TProperties = Record<string, unknown>> = {
  derived?: Record<
    string,
    | Array<ChartDerivedPoint<TProperties>>
    | ((sample: ChartDensitySample<TProperties>) => number | null)
  >;
  gapBehavior?: ChartGapBehavior;
  includeMetrics?: boolean;
  includeSample?: boolean;
  modes?: readonly ChartValueMode[];
  xLabel?: (sample: ChartDensitySample<TProperties>) => string;
};

export type ChartRenderDatum<TProperties = Record<string, unknown>> = {
  average: number | null;
  count: number | null;
  index: number;
  label: string;
  max: number | null;
  metrics?: ChartMetricRecord;
  min: number | null;
  p10?: number | null;
  p25?: number | null;
  p50?: number | null;
  p75?: number | null;
  p90?: number | null;
  p95?: number | null;
  p99?: number | null;
  pointCount: number;
  sample?: ChartDensitySample<TProperties>;
  sum: number | null;
  value: number | null;
  x: number;
  x0: number;
  x1: number;
  [derivedKey: string]: unknown;
};

export type ChartRenderData<TProperties = Record<string, unknown>> = {
  annotations: ChartGapAnnotation[];
  rows: Array<ChartRenderDatum<TProperties>>;
};

export type ChartDensityQuery = BinnedSeriesQuery & {
  percentiles?: readonly ChartPercentileMode[];
  valueMode?: ChartValueMode;
};

export type ChartDensityBackend = BinnedSeriesBackend | "progressive";

export type ChartDensitySample<TProperties = Record<string, unknown>> = {
  averageY: number | null;
  firstPoint: IndexedChartSeriesPoint<TProperties> | null;
  index: number;
  lastPoint: IndexedChartSeriesPoint<TProperties> | null;
  maxY: number | null;
  metrics: ChartMetricRecord;
  minY: number | null;
  p10: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  p95: number | null;
  p99: number | null;
  pointCount: number;
  sumY: number;
  x: number;
  x0: number;
  x1: number;
  y: number | null;
};

export type ChartDensitySummary = BinnedSeriesSummary & {
  sampleCount: number;
  valueMode: ChartValueMode;
};

export type ChartDensityViewportSummary = DataDensityViewportSummary & {
  binCount: number;
  sampleCount: number;
  valueMode: ChartValueMode;
  xDomain: BinnedSeriesSummary["xDomain"];
};

export type ChartDensitySeries<TProperties = Record<string, unknown>> = {
  bins: Array<ChartDensityBin<TProperties>>;
  samples: Array<ChartDensitySample<TProperties>>;
  summary: ChartDensitySummary;
};

export type ChartDensityIndex<TProperties = Record<string, unknown>> = {
  getBackendCapabilities?: () => ChartBackendCapabilities;
  getBinnedSeries(query: BinnedSeriesQuery): BinnedSeries<TProperties>;
  getChartSeries(query: ChartDensityQuery): ChartDensitySeries<TProperties>;
  getGroupedChartSeries(
    query: ChartGroupedDensityQuery<TProperties>,
  ): ChartGroupedDensitySeries<TProperties>;
  getHeatmap(query: ChartHeatmapQuery<TProperties>): ChartHeatmap<TProperties>;
  getHistogram(query: ChartHistogramQuery<TProperties>): ChartHistogram<TProperties>;
  getPointById(pointId: string): IndexedChartSeriesPoint<TProperties> | null;
  getSeriesBounds(): {
    maxX: number;
    maxY: number;
    minX: number;
    minY: number;
  } | null;
};

export type ChartBackendCapabilities = {
  backend: BinnedSeriesBackend;
  supportsGroupedSeries: boolean;
  supportsHeatmap: boolean;
  supportsHistogram: boolean;
  supportsPercentiles: boolean;
  usesWasm: boolean;
};

export type ChartPointValueAccessor<TProperties = Record<string, unknown>> =
  | "x"
  | "y"
  | { metric: string }
  | ((point: IndexedChartSeriesPoint<TProperties>) => number | null | undefined);

export type ChartHistogramQuery<TProperties = Record<string, unknown>> = {
  bucketCount: number;
  includeEmptyBuckets?: boolean;
  valueAccessor?: ChartPointValueAccessor<TProperties>;
  valueDomain?: [number, number];
  xDomain?: [number, number];
};

export type ChartHistogramBucket<TProperties = Record<string, unknown>> = {
  averageValue: number | null;
  firstPoint: IndexedChartSeriesPoint<TProperties> | null;
  index: number;
  lastPoint: IndexedChartSeriesPoint<TProperties> | null;
  maxValue: number | null;
  metrics: ChartMetricRecord;
  minValue: number | null;
  pointCount: number;
  value: number;
  value0: number;
  value1: number;
};

export type ChartHistogram<TProperties = Record<string, unknown>> = {
  buckets: Array<ChartHistogramBucket<TProperties>>;
  summary: {
    bucketCount: number;
    metrics: ChartMetricRecord;
    pointCount: number;
    valueDomain: [number, number];
    xDomain: [number, number] | null;
  };
};

export type ChartHeatmapQuery<TProperties = Record<string, unknown>> = {
  includeEmptyCells?: boolean;
  valueAccessor?: ChartPointValueAccessor<TProperties>;
  xBinCount: number;
  xDomain: [number, number];
  yBinCount: number;
  yDomain?: [number, number];
};

export type ChartHeatmapCell<TProperties = Record<string, unknown>> = {
  averageValue: number | null;
  firstPoint: IndexedChartSeriesPoint<TProperties> | null;
  index: number;
  lastPoint: IndexedChartSeriesPoint<TProperties> | null;
  metrics: ChartMetricRecord;
  pointCount: number;
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

export type ChartHeatmap<TProperties = Record<string, unknown>> = {
  cells: Array<ChartHeatmapCell<TProperties>>;
  summary: {
    maxCellCount: number;
    metrics: ChartMetricRecord;
    pointCount: number;
    xBinCount: number;
    xDomain: [number, number];
    yBinCount: number;
    yDomain: [number, number];
  };
};

export type ChartPointGroupAccessor<TProperties = Record<string, unknown>> =
  | { metric: string }
  | { property: string }
  | ((point: IndexedChartSeriesPoint<TProperties>) => string | number | null | undefined);

export type ChartGroupedDensityQuery<TProperties = Record<string, unknown>> = Omit<
  ChartDensityQuery,
  "valueMode"
> & {
  groupBy: ChartPointGroupAccessor<TProperties>;
  includeOther?: boolean;
  maxGroups?: number;
  sortGroupsBy?: "count" | "label" | "sum";
  valueMode?: ChartValueMode;
};

export type ChartGroupedDensityGroup<TProperties = Record<string, unknown>> = {
  key: string;
  label: string;
  metrics: ChartMetricRecord;
  pointCount: number;
  series: ChartDensitySeries<TProperties>;
};

export type ChartGroupedDensitySeries<TProperties = Record<string, unknown>> = {
  groups: Array<ChartGroupedDensityGroup<TProperties>>;
  summary: ChartDensitySummary & {
    groupCount: number;
  };
};

export type ChartBandBoundary =
  | "average"
  | "max"
  | "min"
  | "sum"
  | ChartPercentileMode
  | ((sample: ChartDensitySample) => number | null);

export type ChartBandRenderDatum<TProperties = Record<string, unknown>> =
  ChartRenderDatum<TProperties> & {
    center: number | null;
    lower: number | null;
    range: [number, number] | null;
    upper: number | null;
  };

export type ChartBoxPlotDatum<TProperties = Record<string, unknown>> = {
  index: number;
  label: string;
  lowerWhisker: number | null;
  max: number | null;
  median: number | null;
  min: number | null;
  q1: number | null;
  q3: number | null;
  sample: ChartDensitySample<TProperties>;
  upperWhisker: number | null;
  x: number;
  x0: number;
  x1: number;
};

export type ChartDensityWarmupScheduler = (warmup: () => void) => void;

export type ChartDensityProgressiveOptions<TProperties = Record<string, unknown>> = {
  onError?: (error: unknown) => void;
  onReady?: (index: ChartDensityIndex<TProperties>) => void;
  scheduler?: ChartDensityWarmupScheduler;
  warmup?: "manual" | "scheduled";
};

export type ChartDensityIndexOptions<TProperties = Record<string, unknown>> = Omit<
  BinnedSeriesIndexOptions<TProperties>,
  "backend"
> & {
  backend?: ChartDensityBackend;
  progressive?: ChartDensityProgressiveOptions<TProperties>;
};

export type ChartDensityProgressiveStatus = {
  activeBackend: BinnedSeriesBackend;
  isWarming: boolean;
  wasmError: unknown | null;
  wasmReady: boolean;
};

export type ProgressiveChartDensityIndex<TProperties = Record<string, unknown>> =
  ChartDensityIndex<TProperties> & {
    getActiveBackend(): BinnedSeriesBackend;
    getProgressiveStatus(): ChartDensityProgressiveStatus;
    warmWasmIndex(): Promise<ChartDensityIndex<TProperties>>;
    whenWasmReady(): Promise<ChartDensityIndex<TProperties>>;
  };

export const CHART_VALUE_MODE_DEFINITIONS: readonly ChartValueModeDefinition[] = [
  {
    axisLabel: "Average y",
    color: "var(--chart-1)",
    description: "Mean y value across every source point in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "average",
    label: "Average",
    renderer: "line",
  },
  {
    axisLabel: "Point count",
    color: "var(--chart-4)",
    description: "Number of source points represented by each bin.",
    formatValue: formatNullableCompactNumber,
    id: "count",
    label: "Count",
    renderer: "bar",
  },
  {
    axisLabel: "Maximum y",
    color: "var(--chart-2)",
    description: "Highest y value found inside each bin.",
    formatValue: formatNullableCompactNumber,
    id: "max",
    label: "Maximum",
    renderer: "line",
  },
  {
    axisLabel: "Minimum y",
    color: "var(--chart-3)",
    description: "Lowest y value found inside each bin.",
    formatValue: formatNullableCompactNumber,
    id: "min",
    label: "Minimum",
    renderer: "line",
  },
  {
    axisLabel: "Sum y",
    color: "var(--chart-5)",
    description: "Total y value across every source point in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "sum",
    label: "Sum",
    renderer: "line",
  },
  {
    axisLabel: "Median y",
    color: "var(--chart-2)",
    description: "50th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p50",
    label: "Median",
    renderer: "line",
  },
  {
    axisLabel: "75th percentile y",
    color: "var(--chart-3)",
    description: "75th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p75",
    label: "P75",
    renderer: "line",
  },
  {
    axisLabel: "90th percentile y",
    color: "var(--chart-4)",
    description: "90th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p90",
    label: "P90",
    renderer: "line",
  },
  {
    axisLabel: "95th percentile y",
    color: "var(--chart-5)",
    description: "95th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p95",
    label: "P95",
    renderer: "line",
  },
  {
    axisLabel: "99th percentile y",
    color: "var(--chart-1)",
    description: "99th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p99",
    label: "P99",
    renderer: "line",
  },
];

const EXTRA_CHART_VALUE_MODE_DEFINITIONS: readonly ChartValueModeDefinition[] = [
  {
    axisLabel: "10th percentile y",
    color: "var(--chart-3)",
    description: "10th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p10",
    label: "P10",
    renderer: "line",
  },
  {
    axisLabel: "25th percentile y",
    color: "var(--chart-4)",
    description: "25th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p25",
    label: "P25",
    renderer: "line",
  },
];

export function getChartValueModeDefinition(mode: ChartValueMode): ChartValueModeDefinition {
  const definition = [...CHART_VALUE_MODE_DEFINITIONS, ...EXTRA_CHART_VALUE_MODE_DEFINITIONS].find(
    (item) => item.id === mode,
  );

  if (!definition) {
    throw new Error(`Unknown chart value mode: ${mode}`);
  }

  return definition;
}

export function getChartValueModeDefinitions(
  modes?: readonly ChartValueMode[],
): ChartValueModeDefinition[] {
  if (!modes) {
    return [...CHART_VALUE_MODE_DEFINITIONS];
  }

  return modes.map((mode) => getChartValueModeDefinition(mode));
}

export function createChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: ChartDensityIndexOptions<TProperties> = {},
): ChartDensityIndex<TProperties> {
  const { backend = "progressive", progressive, ...indexOptions } = options;

  if (backend === "progressive") {
    return createProgressiveChartDensityIndex(points, {
      ...indexOptions,
      progressive,
    });
  }

  return createStaticChartDensityIndex(points, {
    ...indexOptions,
    backend,
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

  if (progressive?.warmup !== "manual") {
    scheduleChartDensityWarmup(progressive?.scheduler, () => {
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

    getProgressiveStatus() {
      return {
        activeBackend,
        isWarming,
        wasmError,
        wasmReady: Boolean(wasmIndex),
      };
    },

    getSeriesBounds() {
      return activeIndex.getSeriesBounds();
    },

    warmWasmIndex,

    whenWasmReady() {
      return warmWasmIndex();
    },
  };
}

function createStaticChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties> & { backend?: BinnedSeriesBackend },
): ChartDensityIndex<TProperties> {
  if (options.backend === "wasm-index") {
    return createWasmChartDensityIndex(
      points,
      options as BinnedSeriesIndexOptions<TProperties>,
      createHybridChartDensityIndex(points, options),
    );
  }

  return createHybridChartDensityIndex(points, options);
}

function createHybridChartDensityIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties> & { backend?: BinnedSeriesBackend },
): ChartDensityIndex<TProperties> {
  const binnedIndex = createBinnedSeriesIndex(
    points,
    options as BinnedSeriesIndexOptions<TProperties>,
  );
  const pointStore = createChartPointStore(points, options);

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
      return binnedIndex.getBinnedSeries(query);
    },

    getChartSeries(query) {
      const valueMode = query.valueMode ?? "average";

      if (shouldUsePointStoreForQuery(query)) {
        return createPointStoreChartSeries(pointStore, query, valueMode);
      }

      const series = binnedIndex.getBinnedSeries(query);
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

    getHeatmap(query) {
      return createPointStoreHeatmap(pointStore, query);
    },

    getHistogram(query) {
      return createPointStoreHistogram(pointStore, query);
    },

    getPointById(pointId) {
      return binnedIndex.getPointById(pointId);
    },

    getSeriesBounds() {
      return binnedIndex.getSeriesBounds();
    },
  };
}

export const createChartSeriesIndex = createChartDensityIndex;

type ChartPointStore<TProperties = Record<string, unknown>> = {
  metricKeys: string[];
  pointLookup: Map<string, IndexedChartSeriesPoint<TProperties>>;
  points: Array<IndexedChartSeriesPoint<TProperties>>;
};

type MutableChartDensityBin<TProperties = Record<string, unknown>> =
  ChartDensityBin<TProperties> & {
    points: Array<IndexedChartSeriesPoint<TProperties>>;
  };

const CHART_PERCENTILE_VALUES: Record<ChartPercentileMode, number> = {
  p10: 0.1,
  p25: 0.25,
  p50: 0.5,
  p75: 0.75,
  p90: 0.9,
  p95: 0.95,
  p99: 0.99,
};

function createChartPointStore<TProperties>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
): ChartPointStore<TProperties> {
  const normalizedPoints = points
    .map(
      (point, index): IndexedChartSeriesPoint<TProperties> => ({
        id: String(point.id ?? index),
        label: point.label ?? "",
        metrics: normalizeChartMetrics(point.metrics),
        properties: point.properties ?? ({} as TProperties),
        x: point.x,
        y: point.y,
      }),
    )
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .filter((point) => options.filterPoint?.(point) ?? true)
    .sort((left, right) => left.x - right.x);

  return {
    metricKeys: collectDensityMetricKeys(normalizedPoints.map((point) => point.metrics)),
    pointLookup: new Map(normalizedPoints.map((point) => [point.id, point])),
    points: normalizedPoints,
  };
}

function shouldUsePointStoreForQuery(query: ChartDensityQuery) {
  return isChartPercentileMode(query.valueMode) || Boolean(query.percentiles?.length);
}

function createPointStoreChartSeries<TProperties>(
  store: ChartPointStore<TProperties>,
  query: ChartDensityQuery,
  valueMode: ChartValueMode,
): ChartDensitySeries<TProperties> {
  const xDomain = normalizeChartDomain(query.xDomain);
  const targetBinCount = clampInteger(query.targetBinCount, 1, 100_000);
  const requestedPercentiles = resolveRequestedPercentiles(query, valueMode);
  const bins = createPointStoreBins(store, {
    includeEmptyBins: query.includeEmptyBins,
    percentiles: requestedPercentiles,
    targetBinCount,
    xDomain,
  });
  const samples = bins.map((bin) =>
    createPointStoreChartDensitySample(bin, valueMode, requestedPercentiles),
  );

  return {
    bins,
    samples,
    summary: {
      binCount: bins.length,
      metrics: sumDensityMetrics(
        bins.map((bin) => bin.metrics),
        store.metricKeys,
      ),
      pointCount: bins.reduce((total, bin) => total + bin.pointCount, 0),
      sampleCount: samples.length,
      valueMode,
      xDomain,
    },
  };
}

function createPointStoreGroupedChartSeries<TProperties>(
  store: ChartPointStore<TProperties>,
  query: ChartGroupedDensityQuery<TProperties>,
): ChartGroupedDensitySeries<TProperties> {
  const xDomain = normalizeChartDomain(query.xDomain);
  const valueMode = query.valueMode ?? "average";
  const includeOther = query.includeOther ?? true;
  const maxGroups = clampInteger(query.maxGroups ?? 8, 1, 100);
  const selectedPoints = getPointsInXDomain(store.points, xDomain);
  const groups = new Map<
    string,
    { key: string; label: string; points: Array<IndexedChartSeriesPoint<TProperties>> }
  >();

  for (const point of selectedPoints) {
    const groupValue = getPointGroupValue(point, query.groupBy);

    if (groupValue === null || groupValue === undefined || groupValue === "") {
      continue;
    }

    const label = String(groupValue);
    const group = groups.get(label) ?? { key: normalizeGroupKey(label), label, points: [] };

    group.points.push(point);
    groups.set(label, group);
  }

  const sortedGroups = Array.from(groups.values()).sort((left, right) =>
    comparePointGroups(left, right, query.sortGroupsBy ?? "count"),
  );
  const selectedGroups = sortedGroups.slice(0, maxGroups);
  const otherGroups = sortedGroups.slice(maxGroups);

  if (includeOther && otherGroups.length > 0) {
    selectedGroups.push({
      key: "__other",
      label: "Other",
      points: otherGroups.flatMap((group) => group.points),
    });
  }

  const requestedPercentiles = resolveRequestedPercentiles(query, valueMode);
  const chartGroups = selectedGroups.map((group): ChartGroupedDensityGroup<TProperties> => {
    const groupStore: ChartPointStore<TProperties> = {
      metricKeys: store.metricKeys,
      pointLookup: store.pointLookup,
      points: group.points,
    };
    const series = createPointStoreChartSeries(
      groupStore,
      {
        ...query,
        includeEmptyBins: true,
        percentiles: requestedPercentiles,
        targetBinCount: query.targetBinCount,
        valueMode,
        xDomain,
      },
      valueMode,
    );

    return {
      key: group.key,
      label: group.label,
      metrics: sumDensityMetrics(
        group.points.map((point) => point.metrics),
        store.metricKeys,
      ),
      pointCount: group.points.length,
      series,
    };
  });

  return {
    groups: chartGroups,
    summary: {
      binCount:
        chartGroups[0]?.series.summary.binCount ?? clampInteger(query.targetBinCount, 1, 100_000),
      groupCount: chartGroups.length,
      metrics: sumDensityMetrics(
        chartGroups.map((group) => group.metrics),
        store.metricKeys,
      ),
      pointCount: chartGroups.reduce((total, group) => total + group.pointCount, 0),
      sampleCount: chartGroups[0]?.series.summary.sampleCount ?? 0,
      valueMode,
      xDomain,
    },
  };
}

function createPointStoreHistogram<TProperties>(
  store: ChartPointStore<TProperties>,
  query: ChartHistogramQuery<TProperties>,
): ChartHistogram<TProperties> {
  const bucketCount = clampInteger(query.bucketCount, 1, 100_000);
  const xDomain = query.xDomain ? normalizeChartDomain(query.xDomain) : null;
  const selectedPoints = xDomain ? getPointsInXDomain(store.points, xDomain) : store.points;
  const valuedPoints = selectedPoints
    .map((point) => ({ point, value: getPointAccessorValue(point, query.valueAccessor ?? "y") }))
    .filter((item): item is { point: IndexedChartSeriesPoint<TProperties>; value: number } =>
      isFiniteNumber(item.value),
    );
  const valueDomain = query.valueDomain ??
    getValueDomain(valuedPoints.map((item) => item.value)) ?? [0, 0];
  const normalizedValueDomain = normalizeChartDomain(valueDomain);
  const buckets = createHistogramBuckets<TProperties>(
    bucketCount,
    normalizedValueDomain,
    store.metricKeys,
  );

  for (const item of valuedPoints) {
    if (item.value < normalizedValueDomain[0] || item.value > normalizedValueDomain[1]) {
      continue;
    }

    updateHistogramBucket(
      buckets[getBucketIndex(item.value, normalizedValueDomain, bucketCount)],
      item.point,
      item.value,
      store.metricKeys,
    );
  }

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
        store.metricKeys,
      ),
      pointCount: visibleBuckets.reduce((total, bucket) => total + bucket.pointCount, 0),
      valueDomain: normalizedValueDomain,
      xDomain,
    },
  };
}

function createPointStoreHeatmap<TProperties>(
  store: ChartPointStore<TProperties>,
  query: ChartHeatmapQuery<TProperties>,
): ChartHeatmap<TProperties> {
  const xBinCount = clampInteger(query.xBinCount, 1, 100_000);
  const yBinCount = clampInteger(query.yBinCount, 1, 100_000);
  const xDomain = normalizeChartDomain(query.xDomain);
  const selectedPoints = getPointsInXDomain(store.points, xDomain);
  const valuedPoints = selectedPoints
    .map((point) => ({ point, value: getPointAccessorValue(point, query.valueAccessor ?? "y") }))
    .filter((item): item is { point: IndexedChartSeriesPoint<TProperties>; value: number } =>
      isFiniteNumber(item.value),
    );
  const yDomain = normalizeChartDomain(
    query.yDomain ?? getValueDomain(valuedPoints.map((item) => item.value)) ?? [0, 0],
  );
  const cells = createHeatmapCells<TProperties>(
    xBinCount,
    yBinCount,
    xDomain,
    yDomain,
    store.metricKeys,
  );

  for (const item of valuedPoints) {
    if (item.value < yDomain[0] || item.value > yDomain[1]) {
      continue;
    }

    const xIndex = getBucketIndex(item.point.x, xDomain, xBinCount);
    const yIndex = getBucketIndex(item.value, yDomain, yBinCount);
    const cell = cells[yIndex * xBinCount + xIndex];

    if (cell) {
      updateHeatmapCell(cell, item.point, item.value, store.metricKeys);
    }
  }

  const maxCellCount = cells.reduce((max, cell) => Math.max(max, cell.pointCount), 0);

  for (const cell of cells) {
    cell.value = maxCellCount > 0 ? cell.pointCount / maxCellCount : 0;
  }

  const visibleCells =
    query.includeEmptyCells === false ? cells.filter((cell) => cell.pointCount > 0) : cells;

  return {
    cells: visibleCells,
    summary: {
      maxCellCount,
      metrics: sumDensityMetrics(
        visibleCells.map((cell) => cell.metrics),
        store.metricKeys,
      ),
      pointCount: visibleCells.reduce((total, cell) => total + cell.pointCount, 0),
      xBinCount,
      xDomain,
      yBinCount,
      yDomain,
    },
  };
}

function createPointStoreBins<TProperties>(
  store: ChartPointStore<TProperties>,
  query: {
    includeEmptyBins?: boolean;
    percentiles: readonly ChartPercentileMode[];
    targetBinCount: number;
    xDomain: [number, number];
  },
): Array<MutableChartDensityBin<TProperties>> {
  const binWidth = getChartBinWidth(query.xDomain, query.targetBinCount);
  const bins = Array.from({ length: query.targetBinCount }, (_, index) =>
    createEmptyPointStoreBin<TProperties>(
      index,
      query.xDomain,
      query.targetBinCount,
      binWidth,
      store.metricKeys,
    ),
  );

  for (const point of getPointsInXDomain(store.points, query.xDomain)) {
    const bin = bins[getBucketIndex(point.x, query.xDomain, query.targetBinCount)];

    if (bin) {
      updatePointStoreBin(bin, point, store.metricKeys);
    }
  }

  for (const bin of bins) {
    applyBinPercentiles(bin, query.percentiles);
  }

  return query.includeEmptyBins ? bins : bins.filter((bin) => bin.pointCount > 0);
}

function createEmptyPointStoreBin<TProperties>(
  index: number,
  xDomain: [number, number],
  binCount: number,
  binWidth: number,
  metricKeys: string[],
): MutableChartDensityBin<TProperties> {
  return {
    averageY: null,
    firstPoint: null,
    index,
    lastPoint: null,
    maxY: null,
    metrics: createZeroMetricRecord(metricKeys),
    minY: null,
    pointCount: 0,
    points: [],
    sumY: 0,
    x0: xDomain[0] + index * binWidth,
    x1: index === binCount - 1 ? xDomain[1] : xDomain[0] + (index + 1) * binWidth,
  };
}

function updatePointStoreBin<TProperties>(
  bin: MutableChartDensityBin<TProperties>,
  point: IndexedChartSeriesPoint<TProperties>,
  metricKeys: string[],
) {
  bin.firstPoint ??= point;
  bin.lastPoint = point;
  bin.pointCount += 1;
  bin.points.push(point);
  bin.sumY += point.y;
  bin.averageY = bin.sumY / bin.pointCount;
  bin.minY = bin.minY === null ? point.y : Math.min(bin.minY, point.y);
  bin.maxY = bin.maxY === null ? point.y : Math.max(bin.maxY, point.y);

  for (const metricKey of metricKeys) {
    bin.metrics[metricKey] += point.metrics[metricKey] ?? 0;
  }
}

function applyBinPercentiles<TProperties>(
  bin: MutableChartDensityBin<TProperties>,
  percentiles: readonly ChartPercentileMode[],
) {
  if (bin.pointCount === 0 || percentiles.length === 0) {
    return;
  }

  const values = bin.points.map((point) => point.y).sort((left, right) => left - right);
  const percentileValues = bin as MutableChartDensityBin<TProperties> &
    Record<ChartPercentileMode, number | null>;

  for (const percentile of percentiles) {
    percentileValues[percentile] = getInterpolatedPercentile(
      values,
      CHART_PERCENTILE_VALUES[percentile],
    );
  }
}

function createPointStoreChartDensitySample<TProperties>(
  bin: ChartDensityBin<TProperties> & Partial<Record<ChartPercentileMode, number | null>>,
  valueMode: ChartValueMode,
  requestedPercentiles: readonly ChartPercentileMode[],
): ChartDensitySample<TProperties> {
  const percentiles = createNullPercentileRecord();

  for (const percentile of requestedPercentiles) {
    percentiles[percentile] = bin[percentile] ?? null;
  }

  return {
    averageY: bin.averageY,
    firstPoint: bin.firstPoint,
    index: bin.index,
    lastPoint: bin.lastPoint,
    maxY: bin.maxY,
    metrics: bin.metrics,
    minY: bin.minY,
    ...percentiles,
    pointCount: bin.pointCount,
    sumY: bin.sumY,
    x: (bin.x0 + bin.x1) / 2,
    x0: bin.x0,
    x1: bin.x1,
    y: getPointStoreChartDensityValue(bin, valueMode),
  };
}

function getPointStoreChartDensityValue<TProperties>(
  bin: ChartDensityBin<TProperties> & Partial<Record<ChartPercentileMode, number | null>>,
  valueMode: ChartValueMode,
) {
  if (bin.pointCount === 0) {
    return null;
  }

  if (isChartPercentileMode(valueMode)) {
    return bin[valueMode] ?? null;
  }

  return getChartDensityValue(bin, valueMode);
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

function isChartPercentileMode(mode: ChartValueMode | undefined): mode is ChartPercentileMode {
  return typeof mode === "string" && mode in CHART_PERCENTILE_VALUES;
}

function createHistogramBuckets<TProperties>(
  bucketCount: number,
  valueDomain: [number, number],
  metricKeys: string[],
): Array<ChartHistogramBucket<TProperties> & { sumValue: number }> {
  const bucketWidth = getChartBinWidth(valueDomain, bucketCount);

  return Array.from({ length: bucketCount }, (_, index) => ({
    averageValue: null,
    firstPoint: null,
    index,
    lastPoint: null,
    maxValue: null,
    metrics: createZeroMetricRecord(metricKeys),
    minValue: null,
    pointCount: 0,
    sumValue: 0,
    value: valueDomain[0] + (index + 0.5) * bucketWidth,
    value0: valueDomain[0] + index * bucketWidth,
    value1: index === bucketCount - 1 ? valueDomain[1] : valueDomain[0] + (index + 1) * bucketWidth,
  }));
}

function updateHistogramBucket<TProperties>(
  bucket: ChartHistogramBucket<TProperties> & { sumValue: number },
  point: IndexedChartSeriesPoint<TProperties>,
  value: number,
  metricKeys: string[],
) {
  bucket.firstPoint ??= point;
  bucket.lastPoint = point;
  bucket.pointCount += 1;
  bucket.sumValue += value;
  bucket.averageValue = bucket.sumValue / bucket.pointCount;
  bucket.minValue = bucket.minValue === null ? value : Math.min(bucket.minValue, value);
  bucket.maxValue = bucket.maxValue === null ? value : Math.max(bucket.maxValue, value);

  for (const metricKey of metricKeys) {
    bucket.metrics[metricKey] += point.metrics[metricKey] ?? 0;
  }
}

function createHeatmapCells<TProperties>(
  xBinCount: number,
  yBinCount: number,
  xDomain: [number, number],
  yDomain: [number, number],
  metricKeys: string[],
): Array<ChartHeatmapCell<TProperties> & { sumValue: number }> {
  const xBinWidth = getChartBinWidth(xDomain, xBinCount);
  const yBinWidth = getChartBinWidth(yDomain, yBinCount);

  return Array.from({ length: xBinCount * yBinCount }, (_, index) => {
    const xIndex = index % xBinCount;
    const yIndex = Math.floor(index / xBinCount);
    const x0 = xDomain[0] + xIndex * xBinWidth;
    const y0 = yDomain[0] + yIndex * yBinWidth;

    return {
      averageValue: null,
      firstPoint: null,
      index,
      lastPoint: null,
      metrics: createZeroMetricRecord(metricKeys),
      pointCount: 0,
      sumValue: 0,
      value: 0,
      x: x0 + xBinWidth / 2,
      x0,
      x1: xIndex === xBinCount - 1 ? xDomain[1] : x0 + xBinWidth,
      xIndex,
      y: y0 + yBinWidth / 2,
      y0,
      y1: yIndex === yBinCount - 1 ? yDomain[1] : y0 + yBinWidth,
      yIndex,
    };
  });
}

function updateHeatmapCell<TProperties>(
  cell: ChartHeatmapCell<TProperties> & { sumValue: number },
  point: IndexedChartSeriesPoint<TProperties>,
  value: number,
  metricKeys: string[],
) {
  cell.firstPoint ??= point;
  cell.lastPoint = point;
  cell.pointCount += 1;
  cell.sumValue += value;
  cell.averageValue = cell.sumValue / cell.pointCount;

  for (const metricKey of metricKeys) {
    cell.metrics[metricKey] += point.metrics[metricKey] ?? 0;
  }
}

function getPointAccessorValue<TProperties>(
  point: IndexedChartSeriesPoint<TProperties>,
  accessor: ChartPointValueAccessor<TProperties>,
): number | null {
  if (typeof accessor === "function") {
    return normalizeNumericValue(accessor(point));
  }

  if (typeof accessor === "object") {
    return normalizeNumericValue(point.metrics[accessor.metric]);
  }

  return normalizeNumericValue(point[accessor]);
}

function getPointGroupValue<TProperties>(
  point: IndexedChartSeriesPoint<TProperties>,
  accessor: ChartPointGroupAccessor<TProperties>,
) {
  if (typeof accessor === "function") {
    return accessor(point);
  }

  if ("metric" in accessor) {
    return point.metrics[accessor.metric];
  }

  const properties = point.properties as Record<string, unknown>;
  const value = properties[accessor.property];

  return typeof value === "string" || typeof value === "number" ? value : null;
}

function comparePointGroups<TProperties>(
  left: { label: string; points: Array<IndexedChartSeriesPoint<TProperties>> },
  right: { label: string; points: Array<IndexedChartSeriesPoint<TProperties>> },
  sortBy: "count" | "label" | "sum",
) {
  switch (sortBy) {
    case "label":
      return left.label.localeCompare(right.label);
    case "sum":
      return (
        right.points.reduce((total, point) => total + point.y, 0) -
        left.points.reduce((total, point) => total + point.y, 0)
      );
    case "count":
      return right.points.length - left.points.length || left.label.localeCompare(right.label);
  }
}

function getPointsInXDomain<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties>>,
  xDomain: [number, number],
) {
  return points.filter((point) => point.x >= xDomain[0] && point.x <= xDomain[1]);
}

function getValueDomain(values: number[]): [number, number] | null {
  if (values.length === 0) {
    return null;
  }

  return [Math.min(...values), Math.max(...values)];
}

function getBucketIndex(value: number, domain: [number, number], bucketCount: number) {
  const binWidth = getChartBinWidth(domain, bucketCount);

  return Math.min(bucketCount - 1, Math.max(0, Math.floor((value - domain[0]) / binWidth)));
}

function getChartBinWidth(domain: [number, number], binCount: number) {
  const span = domain[1] - domain[0];

  return span > 0 ? span / binCount : 1;
}

function getInterpolatedPercentile(values: number[], percentile: number) {
  if (values.length === 0) {
    return null;
  }

  if (values.length === 1) {
    return values[0] ?? null;
  }

  const position = (values.length - 1) * percentile;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lower = values[lowerIndex] ?? null;
  const upper = values[upperIndex] ?? null;

  if (lower === null || upper === null) {
    return null;
  }

  return lower + (upper - lower) * (position - lowerIndex);
}

function normalizeChartDomain(domain: [number, number]): [number, number] {
  const left = Number.isFinite(domain[0]) ? domain[0] : 0;
  const right = Number.isFinite(domain[1]) ? domain[1] : left;

  return left <= right ? [left, right] : [right, left];
}

function normalizeChartMetrics(metrics: ChartMetricRecord | undefined): ChartMetricRecord {
  if (!metrics) {
    return {};
  }

  return Object.fromEntries(Object.entries(metrics).filter((entry) => Number.isFinite(entry[1])));
}

function createZeroMetricRecord(metricKeys: string[]) {
  return Object.fromEntries(metricKeys.map((metricKey) => [metricKey, 0]));
}

function createNullPercentileRecord(): Record<ChartPercentileMode, number | null> {
  return {
    p10: null,
    p25: null,
    p50: null,
    p75: null,
    p90: null,
    p95: null,
    p99: null,
  };
}

function normalizeGroupKey(label: string) {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "group"
  );
}

export function createChartDensitySample<TProperties = Record<string, unknown>>(
  bin: ChartDensityBin<TProperties>,
  valueMode: ChartValueMode = "average",
): ChartDensitySample<TProperties> {
  return {
    averageY: bin.averageY,
    firstPoint: bin.firstPoint,
    index: bin.index,
    lastPoint: bin.lastPoint,
    maxY: bin.maxY,
    metrics: bin.metrics,
    minY: bin.minY,
    p10: null,
    p25: null,
    p50: null,
    p75: null,
    p90: null,
    p95: null,
    p99: null,
    pointCount: bin.pointCount,
    sumY: bin.sumY,
    x: (bin.x0 + bin.x1) / 2,
    x0: bin.x0,
    x1: bin.x1,
    y: getChartDensityValue(bin, valueMode),
  };
}

export function createChartDensityViewportSummary<TProperties = Record<string, unknown>>(
  series: ChartDensitySeries<TProperties>,
): ChartDensityViewportSummary {
  return {
    ...createDensityViewportSummary(
      "chart",
      series.bins.map((bin) => bin.metrics),
      series.summary.pointCount,
    ),
    binCount: series.summary.binCount,
    sampleCount: series.summary.sampleCount,
    valueMode: series.summary.valueMode,
    xDomain: series.summary.xDomain,
  };
}

export function getChartGapAnnotations<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
): ChartGapAnnotation[] {
  const annotations: ChartGapAnnotation[] = [];
  let startSample: ChartDensitySample<TProperties> | null = null;
  let previousSample: ChartDensitySample<TProperties> | null = null;

  for (const sample of samples) {
    if (sample.y === null) {
      startSample ??= sample;
      previousSample = sample;
      continue;
    }

    if (startSample && previousSample) {
      annotations.push(createGapAnnotation(startSample, previousSample));
    }

    startSample = null;
    previousSample = null;
  }

  if (startSample && previousSample) {
    annotations.push(createGapAnnotation(startSample, previousSample));
  }

  return annotations;
}

export function createChartRenderData<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  options: ChartRenderDataOptions<TProperties> = {},
): ChartRenderData<TProperties> {
  const {
    derived,
    gapBehavior = "preserve",
    includeMetrics = false,
    includeSample = false,
    modes,
    xLabel = (sample) => String(sample.x),
  } = options;
  const includedModes = new Set<ChartValueMode>(modes ?? ["average", "count", "max", "min", "sum"]);
  const includeEmptySamples = gapBehavior === "preserve" || gapBehavior === "zero-fill";
  const zeroFill = gapBehavior === "zero-fill";
  const annotations = gapBehavior === "connect" ? getChartGapAnnotations(samples) : [];
  const rows = samples
    .filter((sample) => includeEmptySamples || sample.y !== null)
    .map((sample) => {
      const row: ChartRenderDatum<TProperties> = {
        average: includedModes.has("average")
          ? normalizeRenderValue(sample.averageY, zeroFill)
          : null,
        count: includedModes.has("count")
          ? normalizeRenderValue(sample.pointCount > 0 ? sample.pointCount : null, zeroFill)
          : null,
        index: sample.index,
        label: xLabel(sample),
        max: includedModes.has("max") ? normalizeRenderValue(sample.maxY, zeroFill) : null,
        min: includedModes.has("min") ? normalizeRenderValue(sample.minY, zeroFill) : null,
        p10: includedModes.has("p10") ? normalizeRenderValue(sample.p10, zeroFill) : null,
        p25: includedModes.has("p25") ? normalizeRenderValue(sample.p25, zeroFill) : null,
        p50: includedModes.has("p50") ? normalizeRenderValue(sample.p50, zeroFill) : null,
        p75: includedModes.has("p75") ? normalizeRenderValue(sample.p75, zeroFill) : null,
        p90: includedModes.has("p90") ? normalizeRenderValue(sample.p90, zeroFill) : null,
        p95: includedModes.has("p95") ? normalizeRenderValue(sample.p95, zeroFill) : null,
        p99: includedModes.has("p99") ? normalizeRenderValue(sample.p99, zeroFill) : null,
        pointCount: sample.pointCount,
        sum: includedModes.has("sum")
          ? normalizeRenderValue(sample.pointCount > 0 ? sample.sumY : null, zeroFill)
          : null,
        value: normalizeRenderValue(sample.y, zeroFill),
        x: sample.x,
        x0: sample.x0,
        x1: sample.x1,
      };

      if (includeMetrics) {
        row.metrics = sample.metrics;
      }

      if (includeSample) {
        row.sample = sample;
      }

      applyDerivedRenderValues(row, sample, derived);

      return row;
    });

  return {
    annotations,
    rows,
  };
}

export function createGroupedChartRenderData<TProperties>(
  grouped: ChartGroupedDensitySeries<TProperties>,
  options: {
    gapBehavior?: ChartGapBehavior;
    keyPrefix?: string;
    percent?: boolean;
    xLabel?: (sample: ChartDensitySample<TProperties>) => string;
  } = {},
): ChartRenderData<TProperties> {
  const firstGroup = grouped.groups[0];

  if (!firstGroup) {
    return {
      annotations: [],
      rows: [],
    };
  }

  const baseData = createChartRenderData(firstGroup.series.samples, {
    gapBehavior: options.gapBehavior,
    xLabel: options.xLabel,
  });
  const keyPrefix = options.keyPrefix ?? "";

  for (const row of baseData.rows) {
    const rawValues = grouped.groups.map((group) => {
      const sample = group.series.samples.find((candidate) => candidate.index === row.index);

      return {
        key: `${keyPrefix}${group.key}`,
        value: sample?.y ?? null,
      };
    });
    const total = rawValues.reduce((sum, item) => sum + (item.value ?? 0), 0);

    row.total = total;

    for (const item of rawValues) {
      row[item.key] =
        options.percent && total > 0 && item.value !== null
          ? (item.value / total) * 100
          : item.value;
    }
  }

  return baseData;
}

export function createChartBandRenderData<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  options: {
    center?: ChartBandBoundary;
    includeSample?: boolean;
    lower?: ChartBandBoundary;
    upper?: ChartBandBoundary;
    xLabel?: (sample: ChartDensitySample<TProperties>) => string;
  } = {},
): {
  rows: Array<ChartBandRenderDatum<TProperties>>;
} {
  const lowerBoundary = options.lower ?? "min";
  const upperBoundary = options.upper ?? "max";
  const centerBoundary = options.center ?? "average";
  const xLabel = options.xLabel ?? ((sample: ChartDensitySample<TProperties>) => String(sample.x));

  return {
    rows: samples.map((sample) => {
      const lowerValue = readChartBandBoundary(sample, lowerBoundary);
      const upperValue = readChartBandBoundary(sample, upperBoundary);
      const normalizedRange = normalizeBandRange(lowerValue, upperValue);
      const row: ChartBandRenderDatum<TProperties> = {
        average: sample.averageY,
        center: readChartBandBoundary(sample, centerBoundary),
        count: sample.pointCount > 0 ? sample.pointCount : null,
        index: sample.index,
        label: xLabel(sample),
        lower: normalizedRange?.[0] ?? lowerValue,
        max: sample.maxY,
        min: sample.minY,
        p10: sample.p10,
        p25: sample.p25,
        p50: sample.p50,
        p75: sample.p75,
        p90: sample.p90,
        p95: sample.p95,
        p99: sample.p99,
        pointCount: sample.pointCount,
        range: normalizedRange,
        sum: sample.pointCount > 0 ? sample.sumY : null,
        upper: normalizedRange?.[1] ?? upperValue,
        value: sample.y,
        x: sample.x,
        x0: sample.x0,
        x1: sample.x1,
      };

      if (options.includeSample) {
        row.sample = sample;
      }

      return row;
    }),
  };
}

export function createChartBoxPlotData<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  options: {
    lowerWhisker?: ChartBandBoundary;
    upperWhisker?: ChartBandBoundary;
    xLabel?: (sample: ChartDensitySample<TProperties>) => string;
  } = {},
): Array<ChartBoxPlotDatum<TProperties>> {
  const lowerWhisker = options.lowerWhisker ?? "min";
  const upperWhisker = options.upperWhisker ?? "max";
  const xLabel = options.xLabel ?? ((sample: ChartDensitySample<TProperties>) => String(sample.x));

  return samples.map((sample) => ({
    index: sample.index,
    label: xLabel(sample),
    lowerWhisker: readChartBandBoundary(sample, lowerWhisker),
    max: sample.maxY,
    median: sample.p50,
    min: sample.minY,
    q1: sample.p25,
    q3: sample.p75,
    sample,
    upperWhisker: readChartBandBoundary(sample, upperWhisker),
    x: sample.x,
    x0: sample.x0,
    x1: sample.x1,
  }));
}

function applyDerivedRenderValues<TProperties>(
  row: ChartRenderDatum<TProperties>,
  sample: ChartDensitySample<TProperties>,
  derived:
    | Record<
        string,
        | Array<ChartDerivedPoint<TProperties>>
        | ((sample: ChartDensitySample<TProperties>) => number | null)
      >
    | undefined,
) {
  if (!derived) {
    return;
  }

  for (const [key, source] of Object.entries(derived)) {
    if (typeof source === "function") {
      row[key] = normalizeRenderValue(source(sample), false);
      continue;
    }

    row[key] = source.find((point) => point.index === sample.index)?.value ?? null;
  }
}

function getChartDensityValue<TProperties>(
  bin: ChartDensityBin<TProperties>,
  valueMode: ChartValueMode,
) {
  if (bin.pointCount === 0) {
    return null;
  }

  switch (valueMode) {
    case "count":
      return bin.pointCount;
    case "max":
      return bin.maxY;
    case "min":
      return bin.minY;
    case "sum":
      return bin.sumY;
    case "average":
      return bin.averageY;
    case "p10":
    case "p25":
    case "p50":
    case "p75":
    case "p90":
    case "p95":
    case "p99":
      return null;
  }
}

function createGapAnnotation<TProperties>(
  startSample: ChartDensitySample<TProperties>,
  endSample: ChartDensitySample<TProperties>,
): ChartGapAnnotation {
  return {
    endIndex: endSample.index,
    endX: endSample.x,
    sampleCount: endSample.index - startSample.index + 1,
    startIndex: startSample.index,
    startX: startSample.x,
  };
}

function normalizeRenderValue(value: number | null, zeroFill: boolean) {
  return value === null && zeroFill ? 0 : value;
}

function readChartBandBoundary<TProperties>(
  sample: ChartDensitySample<TProperties>,
  boundary: ChartBandBoundary,
): number | null {
  if (typeof boundary === "function") {
    return normalizeNumericValue(boundary(sample as ChartDensitySample));
  }

  switch (boundary) {
    case "average":
      return sample.averageY;
    case "max":
      return sample.maxY;
    case "min":
      return sample.minY;
    case "sum":
      return sample.pointCount > 0 ? sample.sumY : null;
    case "p10":
      return sample.p10;
    case "p25":
      return sample.p25;
    case "p50":
      return sample.p50;
    case "p75":
      return sample.p75;
    case "p90":
      return sample.p90;
    case "p95":
      return sample.p95;
    case "p99":
      return sample.p99;
  }
}

function normalizeBandRange(
  lowerValue: number | null,
  upperValue: number | null,
): [number, number] | null {
  if (lowerValue === null || upperValue === null) {
    return null;
  }

  return lowerValue <= upperValue ? [lowerValue, upperValue] : [upperValue, lowerValue];
}

function normalizeNumericValue(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.floor(value)));
}

function formatNullableCompactNumber(value: number | null) {
  if (value === null) {
    return "n/a";
  }

  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
  }).format(value);
}

function scheduleChartDensityWarmup(
  scheduler: ChartDensityWarmupScheduler | undefined,
  warmup: () => void,
) {
  if (scheduler) {
    scheduler(warmup);
    return;
  }

  const runtime = globalThis as {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => unknown;
    setTimeout?: (callback: () => void, delay: number) => unknown;
  };

  if (typeof runtime.requestIdleCallback === "function") {
    runtime.requestIdleCallback(warmup, { timeout: 1_000 });
    return;
  }

  const timeoutHandle = runtime.setTimeout?.(warmup, 0);
  const maybeNodeTimer = timeoutHandle as { unref?: () => void } | undefined;

  maybeNodeTimer?.unref?.();
}

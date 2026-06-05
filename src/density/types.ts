import type { ChartDerivedPoint } from "../analytics";
import type {
  BinnedSeries,
  BinnedSeriesBin,
  BinnedSeriesIndexOptions,
  BinnedSeriesQuery,
  BinnedSeriesSummary,
  DataDensityMetricRecord,
  DataDensityViewportSummary,
  IndexedNumericSeriesPoint,
  NumericSeriesPoint,
} from "../data-density";

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

export type ChartDensityCacheOptions = {
  enabled?: boolean;
  maxEntries?: number;
};

export type ChartDensityBackendPolicy = ChartDensityBackend | "auto";

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
  getChartPoints(query?: ChartPointQuery): ChartPointSeries<TProperties>;
  getGroupedChartSeries(
    query: ChartGroupedDensityQuery<TProperties>,
  ): ChartGroupedDensitySeries<TProperties>;
  getHeatmap(query: ChartHeatmapQuery<TProperties>): ChartHeatmap<TProperties>;
  getHistogram(query: ChartHistogramQuery<TProperties>): ChartHistogram<TProperties>;
  getPointById(pointId: string): IndexedChartSeriesPoint<TProperties> | null;
  getScatter(query?: ChartScatterQuery<TProperties>): ChartScatterSeries<TProperties>;
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

export type ChartCalendarHeatmapDatum<TProperties = Record<string, unknown>> = {
  date: Date;
  day: number;
  dayOfWeek: number;
  firstPoint: IndexedChartSeriesPoint<TProperties> | null;
  id: string;
  index: number;
  lastPoint: IndexedChartSeriesPoint<TProperties> | null;
  metrics: ChartMetricRecord;
  pointCount: number;
  value: number | null;
  week: number;
  x0: number;
  x1: number;
};

export type ChartCalendarHeatmapData<TProperties = Record<string, unknown>> = {
  days: Array<ChartCalendarHeatmapDatum<TProperties>>;
  summary: {
    dayCount: number;
    maxValue: number | null;
    minValue: number | null;
    pointCount: number;
    xDomain: [number, number];
  };
};

export type ChartRidgelineBucket = {
  index: number;
  pointCount: number;
  value: number;
  value0: number;
  value1: number;
  x: number;
};

export type ChartRidgelineDatum<_TProperties = Record<string, unknown>> = {
  buckets: ChartRidgelineBucket[];
  groupId: string;
  groupLabel: string;
  maxCount: number;
  pointCount: number;
};

export type ChartRidgelineData<TProperties = Record<string, unknown>> = {
  groups: Array<ChartRidgelineDatum<TProperties>>;
  summary: {
    bucketCount: number;
    groupCount: number;
    maxCount: number;
    pointCount: number;
    valueDomain: [number, number];
    xDomain: [number, number] | null;
  };
};

export type ChartPointSampling = "stride";

export type ChartPointQuery = {
  maxPoints?: number;
  sampling?: ChartPointSampling;
  xDomain?: [number, number];
};

export type ChartPointSeries<TProperties = Record<string, unknown>> = {
  points: Array<IndexedChartSeriesPoint<TProperties>>;
  summary: {
    metrics: ChartMetricRecord;
    pointCount: number;
    sampledPointCount: number;
    xDomain: [number, number] | null;
  };
};

export type ChartScatterQuery<TProperties = Record<string, unknown>> = ChartPointQuery & {
  sizeAccessor?: ChartPointValueAccessor<TProperties>;
  yDomain?: [number, number];
};

export type ChartScatterPoint<TProperties = Record<string, unknown>> = {
  id: string;
  label: string;
  metrics: ChartMetricRecord;
  point: IndexedChartSeriesPoint<TProperties>;
  radius: number;
  sizeValue: number | null;
  x: number;
  y: number;
};

export type ChartScatterSeries<TProperties = Record<string, unknown>> = {
  points: Array<ChartScatterPoint<TProperties>>;
  summary: {
    maxSizeValue: number | null;
    metrics: ChartMetricRecord;
    minSizeValue: number | null;
    pointCount: number;
    sampledPointCount: number;
    xDomain: [number, number] | null;
    yDomain: [number, number] | null;
  };
};

export type ChartWaterfallDatum = {
  color?: string;
  id?: string;
  label: string;
  value: number;
};

export type ChartWaterfallRow = {
  color?: string;
  end: number;
  id: string;
  index: number;
  label: string;
  negative: boolean;
  start: number;
  value: number;
};

export type ChartFunnelDatum = {
  color?: string;
  id?: string;
  label: string;
  value: number;
};

export type ChartFunnelRow = {
  color?: string;
  dropOff: number | null;
  id: string;
  index: number;
  label: string;
  percentOfFirst: number;
  percentOfPrevious: number | null;
  value: number;
};

export type ChartHierarchyNode<TPayload = unknown> = {
  children?: Array<ChartHierarchyNode<TPayload>>;
  color?: string;
  id?: string;
  label: string;
  payload?: TPayload;
  value?: number;
};

export type ChartTreemapNode<TPayload = unknown> = {
  color?: string;
  depth: number;
  height: number;
  id: string;
  label: string;
  parentId: string | null;
  payload?: TPayload;
  value: number;
  width: number;
  x: number;
  y: number;
};

export type ChartSunburstNode<TPayload = unknown> = {
  color?: string;
  depth: number;
  endAngle: number;
  id: string;
  innerRadius: number;
  label: string;
  outerRadius: number;
  parentId: string | null;
  payload?: TPayload;
  startAngle: number;
  value: number;
};

export type ChartIcicleNode<TPayload = unknown> = {
  color?: string;
  depth: number;
  height: number;
  id: string;
  label: string;
  parentId: string | null;
  payload?: TPayload;
  value: number;
  width: number;
  x: number;
  y: number;
};

export type ChartFlameGraphNode<TPayload = unknown> = {
  color?: string;
  depth: number;
  height: number;
  id: string;
  label: string;
  parentId: string | null;
  payload?: TPayload;
  value: number;
  width: number;
  x: number;
  y: number;
};

export type ChartCirclePackNode<TPayload = unknown> = {
  color?: string;
  depth: number;
  id: string;
  label: string;
  parentId: string | null;
  payload?: TPayload;
  radius: number;
  value: number;
  x: number;
  y: number;
};

export type ChartTreeNode<TPayload = unknown> = {
  color?: string;
  depth: number;
  id: string;
  label: string;
  parentId: string | null;
  payload?: TPayload;
  value: number;
  x: number;
  y: number;
};

export type ChartRadialTreeNode<TPayload = unknown> = {
  angle: number;
  color?: string;
  depth: number;
  id: string;
  label: string;
  parentId: string | null;
  payload?: TPayload;
  radius: number;
  value: number;
  x: number;
  y: number;
};

export type ChartIndentedTreeNode<TPayload = unknown> = {
  color?: string;
  depth: number;
  height: number;
  id: string;
  label: string;
  parentId: string | null;
  payload?: TPayload;
  rowIndex: number;
  value: number;
  width: number;
  x: number;
  y: number;
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
  onWorkerReady?: (index: ChartDensityWorkerIndex<TProperties>) => void;
  scheduler?: ChartDensityWarmupScheduler;
  warmup?: "manual" | "scheduled";
  worker?: boolean | ChartDensityWorkerOptions;
};

export type ChartDensityIndexOptions<TProperties = Record<string, unknown>> = Omit<
  BinnedSeriesIndexOptions<TProperties>,
  "backend"
> & {
  backend?: ChartDensityBackendPolicy;
  cache?: ChartDensityCacheOptions;
  progressive?: ChartDensityProgressiveOptions<TProperties>;
};

export type ChartDensityProgressiveStatus = {
  activeBackend: BinnedSeriesBackend;
  isWarming: boolean;
  isWorkerBuilding?: boolean;
  workerError?: unknown | null;
  workerReady?: boolean;
  wasmError: unknown | null;
  wasmReady: boolean;
};

export type ProgressiveChartDensityIndex<TProperties = Record<string, unknown>> =
  ChartDensityIndex<TProperties> & {
    getActiveBackend(): BinnedSeriesBackend;
    getProgressiveStatus(): ChartDensityProgressiveStatus;
    getWorkerIndex(): ChartDensityWorkerIndex<TProperties> | null;
    warmWorkerIndex(): Promise<ChartDensityWorkerIndex<TProperties> | null>;
    warmWasmIndex(): Promise<ChartDensityIndex<TProperties>>;
    whenWorkerReady(): Promise<ChartDensityWorkerIndex<TProperties> | null>;
    whenWasmReady(): Promise<ChartDensityIndex<TProperties>>;
  };

export type ChartDensityWorkerOptions = {
  createWorker?: () => Worker;
};

export type ChartDensityWorkerIndex<TProperties = Record<string, unknown>> = {
  getBackendCapabilities(): Promise<ChartBackendCapabilities>;
  getBinnedSeries(query: BinnedSeriesQuery): Promise<BinnedSeries<TProperties>>;
  getChartSeries(query: ChartDensityQuery): Promise<ChartDensitySeries<TProperties>>;
  getHeatmap(query: ChartHeatmapQuery<TProperties>): Promise<ChartHeatmap<TProperties>>;
  getHistogram(query: ChartHistogramQuery<TProperties>): Promise<ChartHistogram<TProperties>>;
  getPointById(pointId: string): Promise<IndexedChartSeriesPoint<TProperties> | null>;
  getSeriesBounds(): Promise<{
    maxX: number;
    maxY: number;
    minX: number;
    minY: number;
  } | null>;
  terminate(): void;
  whenReady(): Promise<ChartDensityWorkerIndex<TProperties>>;
};

export type ChartDensityBackendPolicyInput = {
  hasPercentiles?: boolean;
  operationKind?: "chart" | "grouped" | "heatmap" | "histogram" | "construct" | "progressive";
  pointCount: number;
  requestedModes?: readonly ChartValueMode[];
};

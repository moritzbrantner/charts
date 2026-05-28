# API Report: @moritzbrantner/charts

This file is generated from `dist/index.d.ts`. Update it intentionally when the public API changes.

```ts
import { ChartContainer, ChartConfig } from '@moritzbrantner/ui';
import { ComponentProps, JSX, ReactNode, MouseEvent, WheelEventHandler } from 'react';

type DataDensityMetricRecord = Record<string, number>;
type DataDensityMetricSummary = {
    itemCount: number;
    metricKeys: string[];
    metrics: DataDensityMetricRecord;
};
type DataDensityViewportSummary = DataDensityMetricSummary & {
    kind: "chart" | "graph" | "map" | "table";
};
type NumericSeriesPoint<TProperties = Record<string, unknown>> = {
    id?: string | number;
    label?: string;
    metrics?: DataDensityMetricRecord;
    properties?: TProperties;
    x: number;
    y: number;
};
type IndexedNumericSeriesPoint<TProperties = Record<string, unknown>> = Required<NumericSeriesPoint<TProperties>> & {
    id: string;
};
type NumericSeriesDomain = [min: number, max: number];
type BinnedSeriesQuery = {
    includeEmptyBins?: boolean;
    targetBinCount: number;
    xDomain: NumericSeriesDomain;
};
type BinnedSeriesBin<TProperties = Record<string, unknown>> = {
    averageY: number | null;
    firstPoint: IndexedNumericSeriesPoint<TProperties> | null;
    index: number;
    lastPoint: IndexedNumericSeriesPoint<TProperties> | null;
    maxY: number | null;
    metrics: DataDensityMetricRecord;
    minY: number | null;
    pointCount: number;
    sumY: number;
    x0: number;
    x1: number;
};
type BinnedSeriesSummary = {
    binCount: number;
    metrics: DataDensityMetricRecord;
    pointCount: number;
    xDomain: NumericSeriesDomain;
};
type BinnedSeries<TProperties = Record<string, unknown>> = {
    bins: Array<BinnedSeriesBin<TProperties>>;
    summary: BinnedSeriesSummary;
};
type BinnedSeriesIndexOptions<TProperties = Record<string, unknown>> = {
    filterPoint?: (point: IndexedNumericSeriesPoint<TProperties>) => boolean;
};

type ChartSampleValueAccessor<TProperties = Record<string, unknown>> = ChartValueMode | {
    metric: string;
} | ((sample: ChartDensitySample<TProperties>) => number | null);
type ChartDerivedPoint<TProperties = Record<string, unknown>> = {
    index: number;
    sample: ChartDensitySample<TProperties>;
    value: number | null;
    x: number;
    x0: number;
    x1: number;
};
type ChartRollingStatistic = "average" | "sum" | "min" | "max";
type ChartRollingSeriesOptions<TProperties = Record<string, unknown>> = {
    accessor?: ChartSampleValueAccessor<TProperties>;
    minPoints?: number;
    statistic?: ChartRollingStatistic;
    windowSize: number;
};
type ChartDeltaSeriesOptions<TProperties = Record<string, unknown>> = {
    accessor?: ChartSampleValueAccessor<TProperties>;
    mode?: "absolute" | "percent";
    offset?: number;
};
type ChartThresholdAnnotation<TProperties = Record<string, unknown>> = {
    direction: "above" | "below";
    endIndex: number;
    endX: number;
    sampleCount: number;
    samples: Array<ChartDensitySample<TProperties>>;
    startIndex: number;
    startX: number;
    threshold: number;
};
type ChartAnomalyAnnotation<TProperties = Record<string, unknown>> = {
    baseline: number;
    deviation: number;
    index: number;
    sample: ChartDensitySample<TProperties>;
    score: number;
    value: number;
    x: number;
};
type ChartAnomalyOptions<TProperties = Record<string, unknown>> = {
    accessor?: ChartSampleValueAccessor<TProperties>;
    minSamples?: number;
    sensitivity?: number;
};
declare function getChartSampleValue<TProperties>(sample: ChartDensitySample<TProperties>, accessor?: ChartSampleValueAccessor<TProperties>): number | null;
declare function createRollingChartSeries<TProperties>(samples: Array<ChartDensitySample<TProperties>>, options: ChartRollingSeriesOptions<TProperties>): Array<ChartDerivedPoint<TProperties>>;
declare function createDeltaChartSeries<TProperties>(samples: Array<ChartDensitySample<TProperties>>, options?: ChartDeltaSeriesOptions<TProperties>): Array<ChartDerivedPoint<TProperties>>;
declare function createCumulativeChartSeries<TProperties>(samples: Array<ChartDensitySample<TProperties>>, accessor?: ChartSampleValueAccessor<TProperties>): Array<ChartDerivedPoint<TProperties>>;
declare function getChartThresholdAnnotations<TProperties>(samples: Array<ChartDensitySample<TProperties>>, threshold: number, options?: {
    accessor?: ChartSampleValueAccessor<TProperties>;
    direction?: "above" | "below";
}): Array<ChartThresholdAnnotation<TProperties>>;
declare function getChartAnomalyAnnotations<TProperties>(samples: Array<ChartDensitySample<TProperties>>, options?: ChartAnomalyOptions<TProperties>): Array<ChartAnomalyAnnotation<TProperties>>;

type BinnedSeriesBackend = "hybrid-js" | "wasm-index";
type ChartMetricRecord = DataDensityMetricRecord;
type ChartSeriesPoint<TProperties = Record<string, unknown>> = NumericSeriesPoint<TProperties>;
type IndexedChartSeriesPoint<TProperties = Record<string, unknown>> = IndexedNumericSeriesPoint<TProperties>;
type ChartDensityBin<TProperties = Record<string, unknown>> = BinnedSeriesBin<TProperties>;
type ChartPercentileMode = "p10" | "p25" | "p50" | "p75" | "p90" | "p95" | "p99";
type ChartValueMode = "average" | "count" | "max" | "min" | "sum" | ChartPercentileMode;
type ChartValueModeRenderer = "line" | "bar";
type ChartValueModeDefinition = {
    axisLabel: string;
    color: string;
    description: string;
    formatValue: (value: number | null, sample: ChartDensitySample) => string;
    id: ChartValueMode;
    label: string;
    renderer: ChartValueModeRenderer;
};
type ChartGapBehavior = "preserve" | "connect" | "drop" | "zero-fill";
type ChartGapAnnotation = {
    endIndex: number;
    endX: number;
    sampleCount: number;
    startIndex: number;
    startX: number;
};
type ChartRenderDataOptions<TProperties = Record<string, unknown>> = {
    derived?: Record<string, Array<ChartDerivedPoint<TProperties>> | ((sample: ChartDensitySample<TProperties>) => number | null)>;
    gapBehavior?: ChartGapBehavior;
    includeMetrics?: boolean;
    includeSample?: boolean;
    modes?: readonly ChartValueMode[];
    xLabel?: (sample: ChartDensitySample<TProperties>) => string;
};
type ChartRenderDatum<TProperties = Record<string, unknown>> = {
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
type ChartRenderData<TProperties = Record<string, unknown>> = {
    annotations: ChartGapAnnotation[];
    rows: Array<ChartRenderDatum<TProperties>>;
};
type ChartDensityQuery = BinnedSeriesQuery & {
    percentiles?: readonly ChartPercentileMode[];
    valueMode?: ChartValueMode;
};
type ChartDensityBackend = BinnedSeriesBackend | "progressive";
type ChartDensitySample<TProperties = Record<string, unknown>> = {
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
type ChartDensitySummary = BinnedSeriesSummary & {
    sampleCount: number;
    valueMode: ChartValueMode;
};
type ChartDensityViewportSummary = DataDensityViewportSummary & {
    binCount: number;
    sampleCount: number;
    valueMode: ChartValueMode;
    xDomain: BinnedSeriesSummary["xDomain"];
};
type ChartDensitySeries<TProperties = Record<string, unknown>> = {
    bins: Array<ChartDensityBin<TProperties>>;
    samples: Array<ChartDensitySample<TProperties>>;
    summary: ChartDensitySummary;
};
type ChartDensityIndex<TProperties = Record<string, unknown>> = {
    getBinnedSeries(query: BinnedSeriesQuery): BinnedSeries<TProperties>;
    getChartSeries(query: ChartDensityQuery): ChartDensitySeries<TProperties>;
    getGroupedChartSeries(query: ChartGroupedDensityQuery<TProperties>): ChartGroupedDensitySeries<TProperties>;
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
type ChartPointValueAccessor<TProperties = Record<string, unknown>> = "x" | "y" | {
    metric: string;
} | ((point: IndexedChartSeriesPoint<TProperties>) => number | null | undefined);
type ChartHistogramQuery<TProperties = Record<string, unknown>> = {
    bucketCount: number;
    includeEmptyBuckets?: boolean;
    valueAccessor?: ChartPointValueAccessor<TProperties>;
    valueDomain?: [number, number];
    xDomain?: [number, number];
};
type ChartHistogramBucket<TProperties = Record<string, unknown>> = {
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
type ChartHistogram<TProperties = Record<string, unknown>> = {
    buckets: Array<ChartHistogramBucket<TProperties>>;
    summary: {
        bucketCount: number;
        metrics: ChartMetricRecord;
        pointCount: number;
        valueDomain: [number, number];
        xDomain: [number, number] | null;
    };
};
type ChartHeatmapQuery<TProperties = Record<string, unknown>> = {
    includeEmptyCells?: boolean;
    valueAccessor?: ChartPointValueAccessor<TProperties>;
    xBinCount: number;
    xDomain: [number, number];
    yBinCount: number;
    yDomain?: [number, number];
};
type ChartHeatmapCell<TProperties = Record<string, unknown>> = {
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
type ChartHeatmap<TProperties = Record<string, unknown>> = {
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
type ChartPointGroupAccessor<TProperties = Record<string, unknown>> = {
    metric: string;
} | {
    property: string;
} | ((point: IndexedChartSeriesPoint<TProperties>) => string | number | null | undefined);
type ChartGroupedDensityQuery<TProperties = Record<string, unknown>> = Omit<ChartDensityQuery, "valueMode"> & {
    groupBy: ChartPointGroupAccessor<TProperties>;
    includeOther?: boolean;
    maxGroups?: number;
    sortGroupsBy?: "count" | "label" | "sum";
    valueMode?: ChartValueMode;
};
type ChartGroupedDensityGroup<TProperties = Record<string, unknown>> = {
    key: string;
    label: string;
    metrics: ChartMetricRecord;
    pointCount: number;
    series: ChartDensitySeries<TProperties>;
};
type ChartGroupedDensitySeries<TProperties = Record<string, unknown>> = {
    groups: Array<ChartGroupedDensityGroup<TProperties>>;
    summary: ChartDensitySummary & {
        groupCount: number;
    };
};
type ChartBandBoundary = "average" | "max" | "min" | "sum" | ChartPercentileMode | ((sample: ChartDensitySample) => number | null);
type ChartBandRenderDatum<TProperties = Record<string, unknown>> = ChartRenderDatum<TProperties> & {
    center: number | null;
    lower: number | null;
    range: [number, number] | null;
    upper: number | null;
};
type ChartBoxPlotDatum<TProperties = Record<string, unknown>> = {
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
type ChartDensityWarmupScheduler = (warmup: () => void) => void;
type ChartDensityProgressiveOptions<TProperties = Record<string, unknown>> = {
    onError?: (error: unknown) => void;
    onReady?: (index: ChartDensityIndex<TProperties>) => void;
    scheduler?: ChartDensityWarmupScheduler;
    warmup?: "manual" | "scheduled";
};
type ChartDensityIndexOptions<TProperties = Record<string, unknown>> = Omit<BinnedSeriesIndexOptions<TProperties>, "backend"> & {
    backend?: ChartDensityBackend;
    progressive?: ChartDensityProgressiveOptions<TProperties>;
};
type ChartDensityProgressiveStatus = {
    activeBackend: BinnedSeriesBackend;
    isWarming: boolean;
    wasmError: unknown | null;
    wasmReady: boolean;
};
type ProgressiveChartDensityIndex<TProperties = Record<string, unknown>> = ChartDensityIndex<TProperties> & {
    getActiveBackend(): BinnedSeriesBackend;
    getProgressiveStatus(): ChartDensityProgressiveStatus;
    warmWasmIndex(): Promise<ChartDensityIndex<TProperties>>;
    whenWasmReady(): Promise<ChartDensityIndex<TProperties>>;
};
declare const CHART_VALUE_MODE_DEFINITIONS: readonly ChartValueModeDefinition[];
declare function getChartValueModeDefinition(mode: ChartValueMode): ChartValueModeDefinition;
declare function getChartValueModeDefinitions(modes?: readonly ChartValueMode[]): ChartValueModeDefinition[];
declare function createChartDensityIndex<TProperties = Record<string, unknown>>(points: readonly ChartSeriesPoint<TProperties>[], options?: ChartDensityIndexOptions<TProperties>): ChartDensityIndex<TProperties>;
declare function createProgressiveChartDensityIndex<TProperties = Record<string, unknown>>(points: readonly ChartSeriesPoint<TProperties>[], options?: Omit<ChartDensityIndexOptions<TProperties>, "backend">): ProgressiveChartDensityIndex<TProperties>;
declare const createChartSeriesIndex: typeof createChartDensityIndex;
declare function createChartDensitySample<TProperties = Record<string, unknown>>(bin: ChartDensityBin<TProperties>, valueMode?: ChartValueMode): ChartDensitySample<TProperties>;
declare function createChartDensityViewportSummary<TProperties = Record<string, unknown>>(series: ChartDensitySeries<TProperties>): ChartDensityViewportSummary;
declare function getChartGapAnnotations<TProperties>(samples: Array<ChartDensitySample<TProperties>>): ChartGapAnnotation[];
declare function createChartRenderData<TProperties>(samples: Array<ChartDensitySample<TProperties>>, options?: ChartRenderDataOptions<TProperties>): ChartRenderData<TProperties>;
declare function createGroupedChartRenderData<TProperties>(grouped: ChartGroupedDensitySeries<TProperties>, options?: {
    gapBehavior?: ChartGapBehavior;
    keyPrefix?: string;
    percent?: boolean;
    xLabel?: (sample: ChartDensitySample<TProperties>) => string;
}): ChartRenderData<TProperties>;
declare function createChartBandRenderData<TProperties>(samples: Array<ChartDensitySample<TProperties>>, options?: {
    center?: ChartBandBoundary;
    includeSample?: boolean;
    lower?: ChartBandBoundary;
    upper?: ChartBandBoundary;
    xLabel?: (sample: ChartDensitySample<TProperties>) => string;
}): {
    rows: Array<ChartBandRenderDatum<TProperties>>;
};
declare function createChartBoxPlotData<TProperties>(samples: Array<ChartDensitySample<TProperties>>, options?: {
    lowerWhisker?: ChartBandBoundary;
    upperWhisker?: ChartBandBoundary;
    xLabel?: (sample: ChartDensitySample<TProperties>) => string;
}): Array<ChartBoxPlotDatum<TProperties>>;

type ChartLabelPlacement = "top" | "top-right" | "right" | "bottom-right" | "bottom" | "bottom-left" | "left" | "top-left";
type ChartLabelRect = {
    height: number;
    width: number;
    x: number;
    y: number;
};
type ChartLabelObstacle = {
    id?: string;
    kind?: "mark" | "axis" | "custom";
    priority?: number;
    rect: ChartLabelRect;
};
type ChartLabelAnnotation<TPayload = unknown> = {
    anchor: {
        x: number;
        y: number;
    };
    id: string;
    maxWidth?: number;
    offset?: number;
    payload?: TPayload;
    placements?: readonly ChartLabelPlacement[];
    priority?: number;
    text: string;
};
type ChartLabelLine = {
    text: string;
    width: number;
};
type ChartLabelLeaderLine = {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
};
type ChartPlacedLabel<TPayload = unknown> = ChartLabelAnnotation<TPayload> & {
    hidden: boolean;
    leaderLine: ChartLabelLeaderLine | null;
    lines: ChartLabelLine[];
    placement: ChartLabelPlacement | null;
    rect: ChartLabelRect | null;
};
type ChartLabelLayoutOptions = {
    boundary: ChartLabelRect;
    boundaryPadding?: number;
    collisionPadding?: number;
    font?: string;
    leaderLine?: "auto" | "always" | "never";
    lineHeight?: number;
    maxWidth?: number;
    obstacles?: readonly ChartLabelObstacle[];
    offset?: number;
    padding?: number;
};
declare function layoutChartLabels<TPayload>(labels: readonly ChartLabelAnnotation<TPayload>[], options: ChartLabelLayoutOptions): Array<ChartPlacedLabel<TPayload>>;
declare function doChartLabelRectsIntersect(left: ChartLabelRect, right: ChartLabelRect, padding?: number): boolean;

type ChartRange = {
    description?: string;
    domain: [number, number];
    id: string;
    label: string;
};
type MeasuredChartSeries<TProperties = Record<string, unknown>> = {
    queryMs: number;
    series: ChartDensitySeries<TProperties>;
};
type ChartMetricCardProps = {
    className?: string;
    hint?: ReactNode;
    label: ReactNode;
    value: ReactNode;
};
type ChartMetricStripProps = {
    className?: string;
    label: ReactNode;
    value: ReactNode;
};
type ChartDerivedMetricCardProps = {
    className?: string;
    formatValue?: (value: number | null) => ReactNode;
    label: ReactNode;
    previousValue?: number | null;
    value: number | null;
};
type ChartPanelProps = {
    badge?: ReactNode;
    children: ReactNode;
    className?: string;
    description?: ReactNode;
    title: ReactNode;
};
type ChartLegendItem = {
    color?: string;
    description?: ReactNode;
    disabled?: boolean;
    id: string;
    label: ReactNode;
    meta?: ReactNode;
};
type ChartSeriesLegendProps = {
    "aria-label"?: string;
    className?: string;
    hiddenIds?: readonly string[];
    items: readonly ChartLegendItem[];
    onHiddenIdsChange?: (hiddenIds: string[]) => void;
    orientation?: "horizontal" | "vertical";
    showCounts?: boolean;
};
type ChartWithLegendProps = {
    children: ReactNode;
    className?: string;
    legend: ReactNode;
    legendSide?: "left" | "right";
    legendWidthClassName?: string;
};
type BinnedChartRenderContext<TProperties = Record<string, unknown>> = {
    isAutoBinCount: boolean;
    renderData: ChartRenderData<TProperties>;
    rows: ChartRenderData<TProperties>["rows"];
    series: ChartDensitySeries<TProperties>;
    targetBinCount: number;
    width: number | null;
};
type BinnedChartProps<TProperties = Record<string, unknown>> = {
    binCountOptions?: UseChartBinCountOptions;
    chartClassName?: string;
    children: (context: BinnedChartRenderContext<TProperties>) => ComponentProps<typeof ChartContainer>["children"];
    className?: string;
    config: ChartConfig;
    domain: [number, number];
    formatDomainValue?: (value: number) => string;
    fullDomain?: [number, number];
    index: ChartDensityIndex<TProperties>;
    minSpan?: number;
    minimap?: boolean;
    minimapClassName?: string;
    minimapTargetBinCount?: number;
    onDomainChange?: (domain: [number, number]) => void;
    query?: Omit<ChartDensityQuery, "targetBinCount" | "valueMode" | "xDomain">;
    renderDataOptions?: ChartRenderDataOptions<TProperties>;
    valueMode?: ChartValueMode;
    wheel?: boolean;
    wheelOptions?: Omit<UseChartWheelDomainOptions, "disabled" | "domain" | "fullDomain" | "minSpan" | "onDomainChange"> & {
        disabled?: boolean;
    };
};
type ChartDataLabelAnnotation<TPayload = unknown> = Omit<ChartLabelAnnotation<TPayload>, "anchor"> & {
    x: number | string;
    y: number | string;
};
type ChartDataLabelObstacle = {
    height?: number;
    id?: string;
    kind?: "mark" | "axis" | "custom";
    priority?: number;
    radius?: number;
    width?: number;
    x: number | string;
    y: number | string;
};
type ChartLabelOverlayProps<TPayload = unknown> = Omit<ChartLabelLayoutOptions, "boundary" | "obstacles"> & {
    className?: string;
    labels: readonly ChartDataLabelAnnotation<TPayload>[];
    obstacles?: readonly ChartDataLabelObstacle[];
    pixelObstacles?: readonly ChartLabelObstacle[];
    renderLabel?: (label: ChartPlacedLabel<TPayload>) => ReactNode;
    xAxisId?: string | number;
    yAxisId?: string | number;
};
type ChartRangeSelectorProps = {
    "aria-label"?: string;
    className?: string;
    formatDomain?: (domain: [number, number]) => string;
    onValueChange: (rangeId: string) => void;
    ranges: ChartRange[];
    value: string;
};
type ChartValueModeSelectorProps = {
    "aria-label"?: string;
    className?: string;
    definitions?: readonly ChartValueModeDefinition[];
    onValueChange: (mode: ChartValueMode) => void;
    value: ChartValueMode;
};
type ChartBackendStatusProps = {
    className?: string;
    formatError?: (error: unknown) => string;
    onWarmNow?: () => void | Promise<void>;
    progress?: number;
    status: ChartDensityProgressiveStatus;
    warmLabel?: string;
};
type ChartSampleSparklineProps<TProperties = Record<string, unknown>> = {
    ariaLabel?: string;
    className?: string;
    domain: [number, number];
    formatDomainValue?: (value: number) => string;
    formatSampleLabel?: (sample: ChartDensitySample<TProperties>) => string;
    formatValue?: (value: number | null, sample: ChartDensitySample<TProperties>) => string;
    onSampleHover?: (sample: ChartDensitySample<TProperties> | null) => void;
    onSampleSelect?: (sample: ChartDensitySample<TProperties>) => void;
    samples: Array<ChartDensitySample<TProperties>>;
    selectedSampleIndex?: number | null;
};
type ChartSampleInteraction<TProperties = Record<string, unknown>> = {
    clientX: number;
    clientY: number;
    domainValue: number;
    sample: ChartDensitySample<TProperties>;
};
type ChartSampleInteractionOverlayProps<TProperties = Record<string, unknown>> = {
    ariaLabel?: string;
    className?: string;
    domain: [number, number];
    formatSampleLabel?: (sample: ChartDensitySample<TProperties>) => string;
    isSampleSelectable?: (sample: ChartDensitySample<TProperties>) => boolean;
    onSampleContextMenu?: (interaction: ChartSampleInteraction<TProperties>, event: MouseEvent<SVGRectElement>) => void;
    onSampleHover?: (interaction: ChartSampleInteraction<TProperties> | null) => void;
    onSampleSelect?: (interaction: ChartSampleInteraction<TProperties>) => void;
    samples: Array<ChartDensitySample<TProperties>>;
    selectedSampleIndex?: number | null;
};
type ChartDomainMinimapProps<TProperties = Record<string, unknown>> = {
    ariaLabel?: string;
    className?: string;
    domain: [number, number];
    formatDomainValue?: (value: number) => string;
    fullDomain: [number, number];
    minSpan?: number;
    onDomainChange: (domain: [number, number]) => void;
    samples: Array<ChartDensitySample<TProperties>>;
};
type ChartHotBinRowProps<TProperties = Record<string, unknown>> = {
    className?: string;
    formatMetric?: (metricKey: string, value: number) => ReactNode;
    formatX?: (value: number) => string;
    sample: ChartDensitySample<TProperties>;
};
type ChartThresholdMarkerProps<TProperties = Record<string, unknown>> = {
    annotations: Array<ChartThresholdAnnotation<TProperties>>;
    className?: string;
    formatLabel?: (annotation: ChartThresholdAnnotation<TProperties>) => string;
};
type ChartAnomalyMarkerListProps<TProperties = Record<string, unknown>> = {
    anomalies: Array<ChartAnomalyAnnotation<TProperties>>;
    className?: string;
    formatValue?: (value: number) => ReactNode;
    onSelect?: (anomaly: ChartAnomalyAnnotation<TProperties>) => void;
};
type ChartHeatmapGridProps<TProperties = Record<string, unknown>> = {
    ariaLabel?: string;
    cells: Array<ChartHeatmapCell<TProperties>>;
    className?: string;
    formatValue?: (cell: ChartHeatmapCell<TProperties>) => string;
    formatX?: (value: number) => string;
    formatY?: (value: number) => string;
    onCellSelect?: (cell: ChartHeatmapCell<TProperties>) => void;
};
type ChartBoxPlotSvgProps<TProperties = Record<string, unknown>> = {
    ariaLabel?: string;
    className?: string;
    data: Array<ChartBoxPlotDatum<TProperties>>;
    formatValue?: (value: number | null) => string;
    onDatumSelect?: (datum: ChartBoxPlotDatum<TProperties>) => void;
};
type ChartValueModePreviewProps<TProperties = Record<string, unknown>> = {
    active?: boolean;
    className?: string;
    definition: ChartValueModeDefinition;
    measured: MeasuredChartSeries<TProperties>;
    onSelect?: () => void;
};
type UseChartBinCountOptions = {
    defaultBinCount?: number;
    maxBinCount?: number;
    minBinCount?: number;
    pixelsPerBin?: number;
    step?: number;
};
type UseChartBinCountResult<TElement extends Element = HTMLDivElement> = {
    containerRef: (node: TElement | null) => void;
    isAuto: boolean;
    resetAuto: () => void;
    setManualBinCount: (value: number) => void;
    targetBinCount: number;
    width: number | null;
};
type UseChartWheelDomainOptions = {
    disabled?: boolean;
    domain: [number, number];
    fullDomain: [number, number];
    minSpan?: number;
    onDomainChange: (domain: [number, number]) => void;
    scrollScale?: number;
    zoomScale?: number;
};
type UseChartWheelDomainResult<TElement extends Element = HTMLElement> = {
    containerRef: (node: TElement | null) => void;
    onWheel: WheelEventHandler<TElement>;
};
type UseChartSeriesVisibilityOptions = {
    defaultHiddenIds?: readonly string[];
    hiddenIds?: readonly string[];
    itemIds: readonly string[];
    minVisible?: number;
    onHiddenIdsChange?: (hiddenIds: string[]) => void;
};
type UseChartSeriesVisibilityResult = {
    hiddenIds: string[];
    isVisible: (id: string) => boolean;
    setHiddenIds: (hiddenIds: readonly string[]) => void;
    showAll: () => void;
    toggle: (id: string) => void;
    visibleIds: string[];
};
declare function ChartPanel({ badge, children, className, description, title, }: ChartPanelProps): JSX.Element;
declare function ChartMetricCard({ className, hint, label, value, }: ChartMetricCardProps): JSX.Element;
declare function ChartMetricStrip({ className, label, value }: ChartMetricStripProps): JSX.Element;
declare function ChartDerivedMetricCard({ className, formatValue, label, previousValue, value, }: ChartDerivedMetricCardProps): JSX.Element;
declare function ChartSeriesLegend({ "aria-label": ariaLabel, className, hiddenIds, items, onHiddenIdsChange, orientation, showCounts, }: ChartSeriesLegendProps): JSX.Element;
declare function ChartWithLegend({ children, className, legend, legendSide, legendWidthClassName, }: ChartWithLegendProps): JSX.Element;
declare function BinnedChart<TProperties = Record<string, unknown>>({ binCountOptions, chartClassName, children, className, config, domain, formatDomainValue, fullDomain, index, minSpan, minimap, minimapClassName, minimapTargetBinCount, onDomainChange, query, renderDataOptions, valueMode, wheel, wheelOptions, }: BinnedChartProps<TProperties>): JSX.Element;
declare function ChartLabelOverlay<TPayload = unknown>({ boundaryPadding, className, collisionPadding, font, labels, leaderLine, lineHeight, maxWidth, obstacles, offset, padding, pixelObstacles, renderLabel, xAxisId, yAxisId, }: ChartLabelOverlayProps<TPayload>): JSX.Element | null;
declare function ChartRangeSelector({ "aria-label": ariaLabel, className, formatDomain, onValueChange, ranges, value, }: ChartRangeSelectorProps): JSX.Element;
declare function ChartValueModeSelector({ "aria-label": ariaLabel, className, definitions, onValueChange, value, }: ChartValueModeSelectorProps): JSX.Element;
declare function ChartBackendStatus({ className, formatError, onWarmNow, progress, status, warmLabel, }: ChartBackendStatusProps): JSX.Element;
declare function ChartSampleSparkline<TProperties = Record<string, unknown>>({ ariaLabel, className, domain, formatDomainValue, formatSampleLabel, formatValue, onSampleHover, onSampleSelect, samples, selectedSampleIndex, }: ChartSampleSparklineProps<TProperties>): JSX.Element;
declare function ChartSampleInteractionOverlay<TProperties = Record<string, unknown>>({ ariaLabel, className, domain, formatSampleLabel, isSampleSelectable, onSampleContextMenu, onSampleHover, onSampleSelect, samples, selectedSampleIndex, }: ChartSampleInteractionOverlayProps<TProperties>): JSX.Element | null;
declare function ChartDomainMinimap<TProperties = Record<string, unknown>>({ ariaLabel, className, domain, formatDomainValue, fullDomain, minSpan, onDomainChange, samples, }: ChartDomainMinimapProps<TProperties>): JSX.Element;
declare function ChartHotBinRow<TProperties = Record<string, unknown>>({ className, formatMetric, formatX, sample, }: ChartHotBinRowProps<TProperties>): JSX.Element;
declare function ChartThresholdMarker<TProperties = Record<string, unknown>>({ annotations, className, formatLabel, }: ChartThresholdMarkerProps<TProperties>): JSX.Element;
declare function ChartAnomalyMarkerList<TProperties = Record<string, unknown>>({ anomalies, className, formatValue, onSelect, }: ChartAnomalyMarkerListProps<TProperties>): JSX.Element;
declare function ChartHeatmapGrid<TProperties = Record<string, unknown>>({ ariaLabel, cells, className, formatValue, formatX, formatY, onCellSelect, }: ChartHeatmapGridProps<TProperties>): JSX.Element;
declare function ChartBoxPlotSvg<TProperties = Record<string, unknown>>({ ariaLabel, className, data, formatValue, onDatumSelect, }: ChartBoxPlotSvgProps<TProperties>): JSX.Element;
declare function ChartValueModePreview<TProperties = Record<string, unknown>>({ active, className, definition, measured, onSelect, }: ChartValueModePreviewProps<TProperties>): JSX.Element;
declare function useProgressiveChartDensity<TProperties = Record<string, unknown>>(points: readonly ChartSeriesPoint<TProperties>[], options?: Omit<ChartDensityIndexOptions<TProperties>, "backend">): {
    index: ProgressiveChartDensityIndex<TProperties>;
    status: ChartDensityProgressiveStatus;
    warmWasmNow: () => Promise<void>;
};
declare function useChartBinCount<TElement extends Element = HTMLDivElement>(options?: UseChartBinCountOptions): UseChartBinCountResult<TElement>;
declare function useChartWheelDomain<TElement extends Element = HTMLElement>({ disabled, domain, fullDomain, minSpan, onDomainChange, scrollScale, zoomScale, }: UseChartWheelDomainOptions): UseChartWheelDomainResult<TElement>;
declare function useChartSeriesVisibility({ defaultHiddenIds, hiddenIds, itemIds, minVisible, onHiddenIdsChange, }: UseChartSeriesVisibilityOptions): UseChartSeriesVisibilityResult;
declare function measureChartSeries<TProperties = Record<string, unknown>>(index: ChartDensityIndex<TProperties>, query: ChartDensityQuery): MeasuredChartSeries<TProperties>;
declare function getChartSampleYBounds<TProperties = Record<string, unknown>>(samples: Array<ChartDensitySample<TProperties>>): {
    maxY: number | null;
    minY: number | null;
};
declare function getNearestChartSample<TProperties>(samples: readonly ChartDensitySample<TProperties>[], x: number, options?: {
    isSampleSelectable?: (sample: ChartDensitySample<TProperties>) => boolean;
}): ChartDensitySample<TProperties> | null;

export { BinnedChart, type BinnedChartProps, type BinnedChartRenderContext, type BinnedSeriesBackend, CHART_VALUE_MODE_DEFINITIONS, type ChartAnomalyAnnotation, ChartAnomalyMarkerList, type ChartAnomalyMarkerListProps, type ChartAnomalyOptions, ChartBackendStatus, type ChartBackendStatusProps, type ChartBandBoundary, type ChartBandRenderDatum, type ChartBoxPlotDatum, ChartBoxPlotSvg, type ChartBoxPlotSvgProps, type ChartDataLabelAnnotation, type ChartDataLabelObstacle, type ChartDeltaSeriesOptions, type ChartDensityBackend, type ChartDensityBin, type ChartDensityIndex, type ChartDensityIndexOptions, type ChartDensityProgressiveOptions, type ChartDensityProgressiveStatus, type ChartDensityQuery, type ChartDensitySample, type ChartDensitySeries, type ChartDensitySummary, type ChartDensityViewportSummary, type ChartDensityWarmupScheduler, ChartDerivedMetricCard, type ChartDerivedMetricCardProps, type ChartDerivedPoint, ChartDomainMinimap, type ChartDomainMinimapProps, type ChartGapAnnotation, type ChartGapBehavior, type ChartGroupedDensityGroup, type ChartGroupedDensityQuery, type ChartGroupedDensitySeries, type ChartHeatmap, type ChartHeatmapCell, ChartHeatmapGrid, type ChartHeatmapGridProps, type ChartHeatmapQuery, type ChartHistogram, type ChartHistogramBucket, type ChartHistogramQuery, ChartHotBinRow, type ChartHotBinRowProps, type ChartLabelAnnotation, type ChartLabelLayoutOptions, type ChartLabelLeaderLine, type ChartLabelLine, type ChartLabelObstacle, ChartLabelOverlay, type ChartLabelOverlayProps, type ChartLabelPlacement, type ChartLabelRect, type ChartLegendItem, ChartMetricCard, type ChartMetricCardProps, type ChartMetricRecord, ChartMetricStrip, type ChartMetricStripProps, ChartPanel, type ChartPanelProps, type ChartPercentileMode, type ChartPlacedLabel, type ChartPointGroupAccessor, type ChartPointValueAccessor, type ChartRange, ChartRangeSelector, type ChartRangeSelectorProps, type ChartRenderData, type ChartRenderDataOptions, type ChartRenderDatum, type ChartRollingSeriesOptions, type ChartRollingStatistic, type ChartSampleInteraction, ChartSampleInteractionOverlay, type ChartSampleInteractionOverlayProps, ChartSampleSparkline, type ChartSampleSparklineProps, type ChartSampleValueAccessor, ChartSeriesLegend, type ChartSeriesLegendProps, type ChartSeriesPoint, type ChartThresholdAnnotation, ChartThresholdMarker, type ChartThresholdMarkerProps, type ChartValueMode, type ChartValueModeDefinition, ChartValueModePreview, type ChartValueModePreviewProps, type ChartValueModeRenderer, ChartValueModeSelector, type ChartValueModeSelectorProps, ChartWithLegend, type ChartWithLegendProps, type IndexedChartSeriesPoint, type MeasuredChartSeries, type ProgressiveChartDensityIndex, type UseChartBinCountOptions, type UseChartBinCountResult, type UseChartSeriesVisibilityOptions, type UseChartSeriesVisibilityResult, type UseChartWheelDomainOptions, type UseChartWheelDomainResult, createChartBandRenderData, createChartBoxPlotData, createChartDensityIndex, createChartDensitySample, createChartDensityViewportSummary, createChartRenderData, createChartSeriesIndex, createCumulativeChartSeries, createDeltaChartSeries, createGroupedChartRenderData, createProgressiveChartDensityIndex, createRollingChartSeries, doChartLabelRectsIntersect, getChartAnomalyAnnotations, getChartGapAnnotations, getChartSampleValue, getChartSampleYBounds, getChartThresholdAnnotations, getChartValueModeDefinition, getChartValueModeDefinitions, getNearestChartSample, layoutChartLabels, measureChartSeries, useChartBinCount, useChartSeriesVisibility, useChartWheelDomain, useProgressiveChartDensity };
```

# API Report: @moritzbrantner/charts

This file is generated from `dist/index.d.ts`. Update it intentionally when the public API changes.

```ts
import { a9 as ChartRenderData, v as ChartDensitySeries, p as ChartDensityIndex, t as ChartDensityQuery, aa as ChartRenderDataOptions, aq as ChartValueMode, a as ChartAnomalyAnnotation, s as ChartDensityProgressiveStatus, f as ChartBoxPlotDatum, g as ChartCalendarHeatmapData, h as ChartCalendarHeatmapDatum, i as ChartCirclePackNode, V as ChartLabelAnnotation, u as ChartDensitySample, E as ChartFlameGraphNode, G as ChartFunnelRow, N as ChartHeatmapCell, T as ChartIcicleNode, U as ChartIndentedTreeNode, W as ChartLabelLayoutOptions, Z as ChartLabelObstacle, a2 as ChartPlacedLabel, a8 as ChartRadialTreeNode, ad as ChartRidgelineData, ae as ChartRidgelineDatum, ak as ChartScatterSeries, am as ChartSunburstNode, an as ChartThresholdAnnotation, ao as ChartTreeNode, ap as ChartTreemapNode, ar as ChartValueModeDefinition, au as ChartWaterfallRow, al as ChartSeriesPoint, q as ChartDensityIndexOptions, aw as ProgressiveChartDensityIndex, z as ChartDensityWorkerIndex } from './labels-CoVlToOC.js';
export { B as BinnedSeriesBackend, C as CHART_VALUE_MODE_DEFINITIONS, b as ChartAnomalyOptions, c as ChartBackendCapabilities, d as ChartBandBoundary, e as ChartBandRenderDatum, j as ChartDeltaSeriesOptions, k as ChartDensityBackend, l as ChartDensityBackendPolicy, m as ChartDensityBackendPolicyInput, n as ChartDensityBin, o as ChartDensityCacheOptions, r as ChartDensityProgressiveOptions, w as ChartDensitySummary, x as ChartDensityViewportSummary, y as ChartDensityWarmupScheduler, A as ChartDensityWorkerOptions, D as ChartDerivedPoint, F as ChartFunnelDatum, H as ChartGapAnnotation, I as ChartGapBehavior, J as ChartGroupedDensityGroup, K as ChartGroupedDensityQuery, L as ChartGroupedDensitySeries, M as ChartHeatmap, O as ChartHeatmapQuery, P as ChartHierarchyNode, Q as ChartHistogram, R as ChartHistogramBucket, S as ChartHistogramQuery, X as ChartLabelLeaderLine, Y as ChartLabelLine, _ as ChartLabelPlacement, $ as ChartLabelRect, a0 as ChartMetricRecord, a1 as ChartPercentileMode, a3 as ChartPointGroupAccessor, a4 as ChartPointQuery, a5 as ChartPointSampling, a6 as ChartPointSeries, a7 as ChartPointValueAccessor, ab as ChartRenderDatum, ac as ChartRidgelineBucket, af as ChartRollingSeriesOptions, ag as ChartRollingStatistic, ah as ChartSampleValueAccessor, ai as ChartScatterPoint, aj as ChartScatterQuery, as as ChartValueModeRenderer, at as ChartWaterfallDatum, av as IndexedChartSeriesPoint, ax as createChartBandRenderData, ay as createChartBoxPlotData, az as createChartCalendarHeatmapData, aA as createChartCirclePackLayout, aB as createChartDensityIndex, aC as createChartDensitySample, aD as createChartDensityViewportSummary, aE as createChartDensityWorkerIndex, aF as createChartFlameGraphLayout, aG as createChartFunnelData, aH as createChartIcicleLayout, aI as createChartIndentedTreeLayout, aJ as createChartRadialTreeLayout, aK as createChartRenderData, aL as createChartRidgelineData, aM as createChartSeriesIndex, aN as createChartSunburstLayout, aO as createChartTreeLayout, aP as createChartTreemapLayout, aQ as createChartWaterfallData, aR as createCumulativeChartSeries, aS as createDeltaChartSeries, aT as createGroupedChartRenderData, aU as createProgressiveChartDensityIndex, aV as createRollingChartSeries, aW as doChartLabelRectsIntersect, aX as getChartAnomalyAnnotations, aY as getChartGapAnnotations, aZ as getChartSampleValue, a_ as getChartThresholdAnnotations, a$ as getChartValueModeDefinition, b0 as getChartValueModeDefinitions, b1 as layoutChartLabels, b2 as resolveChartDensityBackendPolicy } from './labels-CoVlToOC.js';
import * as recharts from 'recharts';
import { ResponsiveContainer, DefaultLegendContentProps, Tooltip, DefaultTooltipContentProps, TooltipValueType } from 'recharts';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';
import { ComponentProps, ReactNode, MouseEvent, MouseEventHandler, PointerEventHandler, WheelEventHandler, JSX } from 'react';

declare const THEMES: {
    readonly light: "";
    readonly dark: ".dark";
};
type TooltipNameType = number | string;
type ChartConfig = Record<string, {
    label?: React.ReactNode;
    icon?: React.ComponentType;
} & ({
    color?: string;
    theme?: never;
} | {
    color?: never;
    theme: Record<keyof typeof THEMES, string>;
})>;
declare function ChartContainer({ id, className, children, config, initialDimension, ...props }: React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof ResponsiveContainer>["children"];
    initialDimension?: {
        width: number;
        height: number;
    };
}): react_jsx_runtime.JSX.Element;
declare const ChartStyle: ({ id, config }: {
    id: string;
    config: ChartConfig;
}) => react_jsx_runtime.JSX.Element | null;
declare const ChartTooltip: typeof Tooltip;
declare function ChartTooltipContent({ active, payload, className, indicator, hideLabel, hideIndicator, label, labelFormatter, labelClassName, formatter, color, nameKey, labelKey, }: React.ComponentProps<typeof Tooltip> & React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
} & Omit<DefaultTooltipContentProps<TooltipValueType, TooltipNameType>, "accessibilityLayer">): react_jsx_runtime.JSX.Element | null;
declare const ChartLegend: React.MemoExoticComponent<(outsideProps: recharts.LegendProps) => React.ReactPortal | null>;
declare function ChartLegendContent({ className, hideIcon, payload, verticalAlign, nameKey, }: React.ComponentProps<"div"> & {
    hideIcon?: boolean;
    nameKey?: string;
} & DefaultLegendContentProps): react_jsx_runtime.JSX.Element | null;

type ChartContainerProps = React.ComponentProps<typeof ChartContainer>;
type ChartLegendProps = React.ComponentProps<typeof ChartLegend>;
type ChartLegendContentProps = React.ComponentProps<typeof ChartLegendContent>;
type ChartStyleProps = React.ComponentProps<typeof ChartStyle>;
type ChartTooltipProps = React.ComponentProps<typeof ChartTooltip>;
type ChartTooltipContentProps = React.ComponentProps<typeof ChartTooltipContent>;

type ChartRange = {
    description?: string;
    domain: [number, number];
    id: string;
    label: string;
};
type ChartAxisRange = [number, number] | null;
type ChartAxisScale = "linear" | "log" | "sqrt" | "symlog";
type ChartAxisOrientation = "vertical" | "horizontal";
type ChartAxisTransform = {
    domain: ChartAxisRange;
    scale: ChartAxisScale;
};
type ChartAxesTransform = {
    orientation: ChartAxisOrientation;
    x: ChartAxisTransform;
    y: ChartAxisTransform;
};
type ChartAxisTransformStatus = {
    message: string | null;
    renderScale: ChartAxisScale;
    valid: boolean;
};
type ChartAnimationMode = "none" | "draw" | "rescale" | "draw-and-rescale";
type ChartAnimationOptions = {
    durationMs?: number;
    enabled?: boolean;
    easing?: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
    mode?: ChartAnimationMode;
    respectReducedMotion?: boolean;
};
type ChartPlaybackState = {
    playing: boolean;
    progress: number;
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
type ChartYAxisRangeMenuProps = {
    "aria-label"?: string;
    axisWidth?: number;
    className?: string;
    dataDomain?: [number, number] | null;
    formatValue?: (value: number) => string;
    hiddenIds?: readonly string[];
    legendItems?: readonly ChartLegendItem[];
    minSpan?: number;
    onHiddenIdsChange?: (hiddenIds: string[]) => void;
    onValueChange: (range: ChartAxisRange) => void;
    orientation?: "left" | "right";
    value: ChartAxisRange;
};
type ChartAxisTransformMenuProps = {
    "aria-label"?: string;
    axis: "x" | "y";
    axisWidth?: number;
    className?: string;
    dataDomain?: [number, number] | null;
    formatValue?: (value: number) => string;
    hiddenIds?: readonly string[];
    legendItems?: readonly ChartLegendItem[];
    minSpan?: number;
    onHiddenIdsChange?: (hiddenIds: string[]) => void;
    onValueChange: (transform: ChartAxisTransform) => void;
    orientation?: "left" | "right" | "top" | "bottom";
    value: ChartAxisTransform;
};
type ChartWithLegendProps = {
    children: ReactNode;
    className?: string;
    defaultLegendDisplay?: "expanded" | "hidden";
    legend: ReactNode;
    legendDisplayLabel?: string;
    legendMode?: "floating" | "side";
    onLegendHide?: () => void;
    legendSide?: "left" | "right";
    legendTitle?: ReactNode;
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
    drag?: boolean;
    dragOptions?: Omit<UseChartDragDomainOptions, "disabled" | "domain" | "fullDomain" | "minSpan" | "onDomainChange"> & {
        disabled?: boolean;
    };
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
    orientation?: ChartAxisOrientation;
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
type ChartSvgAxisOptions = {
    formatValue?: (value: number) => string;
    label?: string;
    tickCount?: number;
    visible?: boolean;
};
type ChartSvgLegendItem = {
    color?: string;
    label: ReactNode;
    value?: ReactNode;
};
type ChartHeatmapGridProps<TProperties = Record<string, unknown>> = {
    ariaLabel?: string;
    cells: Array<ChartHeatmapCell<TProperties>>;
    className?: string;
    formatValue?: (cell: ChartHeatmapCell<TProperties>) => string;
    formatX?: (value: number) => string;
    formatY?: (value: number) => string;
    legend?: ReactNode | readonly ChartSvgLegendItem[];
    onCellSelect?: (cell: ChartHeatmapCell<TProperties>) => void;
    xAxis?: ChartSvgAxisOptions | false;
    yAxis?: ChartSvgAxisOptions | false;
};
type ChartCalendarHeatmapSvgProps<TProperties = Record<string, unknown>> = {
    ariaLabel?: string;
    className?: string;
    data: ChartCalendarHeatmapData<TProperties> | Array<ChartCalendarHeatmapDatum<TProperties>>;
    formatDate?: (date: Date) => string;
    formatValue?: (datum: ChartCalendarHeatmapDatum<TProperties>) => string;
    legend?: ReactNode | readonly ChartSvgLegendItem[];
    onDatumSelect?: (datum: ChartCalendarHeatmapDatum<TProperties>) => void;
    showMonthLabels?: boolean;
    showWeekdayLabels?: boolean;
};
type ChartRidgelineSvgProps<TProperties = Record<string, unknown>> = {
    ariaLabel?: string;
    className?: string;
    data: ChartRidgelineData<TProperties> | Array<ChartRidgelineDatum<TProperties>>;
    formatValue?: (value: number) => string;
    legend?: ReactNode | readonly ChartSvgLegendItem[];
    onGroupSelect?: (group: ChartRidgelineDatum<TProperties>) => void;
    showGroupLabels?: boolean;
    xAxis?: ChartSvgAxisOptions | false;
};
type ChartBoxPlotSvgProps<TProperties = Record<string, unknown>> = {
    ariaLabel?: string;
    className?: string;
    data: Array<ChartBoxPlotDatum<TProperties>>;
    formatValue?: (value: number | null) => string;
    legend?: ReactNode | readonly ChartSvgLegendItem[];
    onDatumSelect?: (datum: ChartBoxPlotDatum<TProperties>) => void;
    showValueLabels?: boolean;
    xAxis?: ChartSvgAxisOptions | false;
    yAxis?: ChartSvgAxisOptions | false;
};
type ChartScatterSvgProps<TProperties = Record<string, unknown>> = {
    ariaLabel?: string;
    className?: string;
    formatValue?: (value: number) => string;
    height?: number;
    legend?: ReactNode | readonly ChartSvgLegendItem[];
    onPointSelect?: (point: ChartScatterSeries<TProperties>["points"][number]) => void;
    series: ChartScatterSeries<TProperties>;
    width?: number;
    xAxis?: ChartSvgAxisOptions | false;
    xDomain?: [number, number];
    yAxis?: ChartSvgAxisOptions | false;
    yDomain?: [number, number];
};
type ChartWaterfallSvgProps = {
    ariaLabel?: string;
    className?: string;
    data: ChartWaterfallRow[];
    formatValue?: (value: number) => string;
    height?: number;
    legend?: ReactNode | readonly ChartSvgLegendItem[];
    onDatumSelect?: (datum: ChartWaterfallRow) => void;
    showValueLabels?: boolean;
    width?: number;
    xAxis?: ChartSvgAxisOptions | false;
    yAxis?: ChartSvgAxisOptions | false;
};
type ChartFunnelSvgProps = {
    ariaLabel?: string;
    className?: string;
    data: ChartFunnelRow[];
    formatValue?: (value: number) => string;
    height?: number;
    legend?: ReactNode | readonly ChartSvgLegendItem[];
    onDatumSelect?: (datum: ChartFunnelRow) => void;
    showValueLabels?: boolean;
    width?: number;
};
type ChartTreemapSvgProps<TPayload = unknown> = {
    ariaLabel?: string;
    centerLabel?: ReactNode;
    className?: string;
    data: Array<ChartTreemapNode<TPayload>>;
    defaultFocusedNodeId?: string | null;
    focusedNodeId?: string | null;
    formatValue?: (value: number) => string;
    onFocusedNodeChange?: (nodeId: string | null, node: ChartTreemapNode<TPayload> | null) => void;
    onNodeSelect?: (node: ChartTreemapNode<TPayload>) => void;
    showNodeLabels?: boolean;
    zoomable?: boolean;
};
type ChartSunburstSvgProps<TPayload = unknown> = {
    ariaLabel?: string;
    className?: string;
    data: Array<ChartSunburstNode<TPayload>>;
    formatValue?: (value: number) => string;
    height?: number;
    onNodeSelect?: (node: ChartSunburstNode<TPayload>) => void;
    width?: number;
};
type ChartIcicleSvgProps<TPayload = unknown> = {
    ariaLabel?: string;
    className?: string;
    data: Array<ChartIcicleNode<TPayload>>;
    formatValue?: (value: number) => string;
    onNodeSelect?: (node: ChartIcicleNode<TPayload>) => void;
    showNodeLabels?: boolean;
};
type ChartFlameGraphSvgProps<TPayload = unknown> = {
    ariaLabel?: string;
    className?: string;
    data: Array<ChartFlameGraphNode<TPayload>>;
    formatValue?: (value: number) => string;
    onNodeSelect?: (node: ChartFlameGraphNode<TPayload>) => void;
    showNodeLabels?: boolean;
};
type ChartCirclePackSvgProps<TPayload = unknown> = {
    ariaLabel?: string;
    className?: string;
    data: Array<ChartCirclePackNode<TPayload>>;
    formatValue?: (value: number) => string;
    height?: number;
    onNodeSelect?: (node: ChartCirclePackNode<TPayload>) => void;
    showNodeLabels?: boolean;
    width?: number;
};
type ChartRadialTreeSvgProps<TPayload = unknown> = {
    ariaLabel?: string;
    className?: string;
    data: Array<ChartRadialTreeNode<TPayload>>;
    formatValue?: (value: number) => string;
    height?: number;
    onNodeSelect?: (node: ChartRadialTreeNode<TPayload>) => void;
    showNodeLabels?: boolean;
    width?: number;
};
type ChartIndentedTreeSvgProps<TPayload = unknown> = {
    ariaLabel?: string;
    className?: string;
    data: Array<ChartIndentedTreeNode<TPayload>>;
    formatValue?: (value: number) => string;
    onNodeSelect?: (node: ChartIndentedTreeNode<TPayload>) => void;
    showValueBars?: boolean;
};
type ChartTreeSvgProps<TPayload = unknown> = {
    ariaLabel?: string;
    className?: string;
    data: Array<ChartTreeNode<TPayload>>;
    formatValue?: (value: number) => string;
    height?: number;
    onNodeSelect?: (node: ChartTreeNode<TPayload>) => void;
    showNodeLabels?: boolean;
    width?: number;
};
type ChartXAxisNavigationMenuProps = {
    "aria-label"?: string;
    axisHeight?: number;
    className?: string;
    domain: [number, number];
    formatValue?: (value: number) => string;
    fullDomain: [number, number];
    minSpan?: number;
    onDomainChange: (domain: [number, number]) => void;
    orientation?: "top" | "bottom";
    ranges?: readonly ChartRange[];
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
type ChartDomainDragSelection = {
    left: number;
    width: number;
};
type ChartDomainDragUpdateMode = "preview" | "live";
type ChartDomainDragPreview = {
    domain: [number, number];
    offsetPx: number;
};
type UseChartDragDomainOptions = {
    disabled?: boolean;
    domain: [number, number];
    fullDomain: [number, number];
    minDragPixels?: number;
    minSpan?: number;
    onDomainChange: (domain: [number, number]) => void;
    onDomainPreviewChange?: (preview: ChartDomainDragPreview | null) => void;
    panScale?: number;
    resetOnDoubleClick?: boolean;
    selectModifier?: "shift" | "alt" | "shift-or-alt";
    updateMode?: ChartDomainDragUpdateMode;
};
type UseChartDragDomainResult<TElement extends Element = HTMLElement> = {
    containerRef: (node: TElement | null) => void;
    isDragging: boolean;
    onDoubleClick: MouseEventHandler<TElement>;
    onPointerCancel: PointerEventHandler<TElement>;
    onPointerDown: PointerEventHandler<TElement>;
    onPointerMove: PointerEventHandler<TElement>;
    onPointerUp: PointerEventHandler<TElement>;
    selection: ChartDomainDragSelection | null;
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

declare function getChartAxisScaleDefinitions(): Array<{
    id: ChartAxisScale;
    label: string;
    description: string;
}>;
declare function resolveChartAxisTransformStatus({ dataDomain, scale, }: {
    dataDomain: [number, number] | null;
    scale: ChartAxisScale;
}): ChartAxisTransformStatus;
declare function ChartAxisTransformMenu(props: ChartAxisTransformMenuProps): JSX.Element | null;
declare function ChartXAxisNavigationMenu({ "aria-label": ariaLabel, axisHeight, className, domain, formatValue, fullDomain, minSpan, onDomainChange, orientation, ranges, }: ChartXAxisNavigationMenuProps): JSX.Element | null;
declare function ChartYAxisRangeMenu({ "aria-label": ariaLabel, axisWidth, className, dataDomain, formatValue, hiddenIds, legendItems, minSpan, onHiddenIdsChange, onValueChange, orientation, value, }: ChartYAxisRangeMenuProps): JSX.Element | null;

declare function getRechartsAnimationProps(options?: ChartAnimationOptions): {
    animationDuration: number;
    animationEasing: string;
    isAnimationActive: boolean;
};
declare function useChartAnimatedDomain({ domain, durationMs, enabled, respectReducedMotion, }: {
    domain: [number, number];
    durationMs?: number;
    enabled?: boolean;
    respectReducedMotion?: boolean;
}): [number, number];
declare function useChartPlaybackDomain({ durationMs, enabled, fullDomain, onComplete, playing, }: {
    durationMs?: number;
    enabled: boolean;
    fullDomain: [number, number];
    onComplete?: () => void;
    playing: boolean;
}): {
    domain: [number, number];
    pause: () => void;
    play: () => void;
    progress: number;
    reset: () => void;
};

declare function ChartPanel({ badge, children, className, description, title, }: ChartPanelProps): JSX.Element;
declare function ChartMetricCard({ className, hint, label, value, }: ChartMetricCardProps): JSX.Element;
declare function ChartMetricStrip({ className, label, value }: ChartMetricStripProps): JSX.Element;
declare function ChartDerivedMetricCard({ className, formatValue, label, previousValue, value, }: ChartDerivedMetricCardProps): JSX.Element;
declare function ChartSeriesLegend({ "aria-label": ariaLabel, className, hiddenIds, items, onHiddenIdsChange, orientation, showCounts, }: ChartSeriesLegendProps): JSX.Element;
declare function ChartWithLegend({ children, className, defaultLegendDisplay, legend, legendDisplayLabel, legendMode, onLegendHide, legendSide, legendTitle, legendWidthClassName, }: ChartWithLegendProps): JSX.Element;
declare function BinnedChart<TProperties = Record<string, unknown>>({ binCountOptions, chartClassName, children, className, config, drag, dragOptions, domain, formatDomainValue, fullDomain, index, minSpan, minimap, minimapClassName, minimapTargetBinCount, onDomainChange, query, renderDataOptions, valueMode, wheel, wheelOptions, }: BinnedChartProps<TProperties>): JSX.Element;

declare function ChartLabelOverlay<TPayload = unknown>({ boundaryPadding, className, collisionPadding, font, labels, leaderLine, lineHeight, maxWidth, obstacles, offset, padding, pixelObstacles, renderLabel, xAxisId, yAxisId, }: ChartLabelOverlayProps<TPayload>): JSX.Element | null;

declare function ChartRangeSelector({ "aria-label": ariaLabel, className, formatDomain, onValueChange, ranges, value, }: ChartRangeSelectorProps): JSX.Element;
declare function ChartValueModeSelector({ "aria-label": ariaLabel, className, definitions, onValueChange, value, }: ChartValueModeSelectorProps): JSX.Element;
declare function ChartBackendStatus({ className, formatError, onWarmNow, progress, status, warmLabel, }: ChartBackendStatusProps): JSX.Element;

declare function ChartSampleSparkline<TProperties = Record<string, unknown>>({ ariaLabel, className, domain, formatDomainValue, formatSampleLabel, formatValue, onSampleHover, onSampleSelect, samples, selectedSampleIndex, }: ChartSampleSparklineProps<TProperties>): JSX.Element;
declare function ChartSampleInteractionOverlay<TProperties = Record<string, unknown>>({ ariaLabel, className, domain, formatSampleLabel, isSampleSelectable, orientation, onSampleContextMenu, onSampleHover, onSampleSelect, samples, selectedSampleIndex, }: ChartSampleInteractionOverlayProps<TProperties>): JSX.Element | null;
declare function ChartDomainMinimap<TProperties = Record<string, unknown>>({ ariaLabel, className, domain, formatDomainValue, fullDomain, minSpan, onDomainChange, samples, }: ChartDomainMinimapProps<TProperties>): JSX.Element;
declare function ChartHotBinRow<TProperties = Record<string, unknown>>({ className, formatMetric, formatX, sample, }: ChartHotBinRowProps<TProperties>): JSX.Element;
declare function ChartThresholdMarker<TProperties = Record<string, unknown>>({ annotations, className, formatLabel, }: ChartThresholdMarkerProps<TProperties>): JSX.Element;
declare function ChartAnomalyMarkerList<TProperties = Record<string, unknown>>({ anomalies, className, formatValue, onSelect, }: ChartAnomalyMarkerListProps<TProperties>): JSX.Element;

declare function ChartHeatmapGrid<TProperties = Record<string, unknown>>({ ariaLabel, cells, className, formatValue, formatX, formatY, legend, onCellSelect, xAxis, yAxis, }: ChartHeatmapGridProps<TProperties>): JSX.Element;
declare function ChartCalendarHeatmapSvg<TProperties = Record<string, unknown>>({ ariaLabel, className, data, formatDate, formatValue, legend, onDatumSelect, showMonthLabels, showWeekdayLabels, }: ChartCalendarHeatmapSvgProps<TProperties>): JSX.Element;
declare function ChartRidgelineSvg<TProperties = Record<string, unknown>>({ ariaLabel, className, data, formatValue, legend, onGroupSelect, showGroupLabels, xAxis, }: ChartRidgelineSvgProps<TProperties>): JSX.Element;
declare function ChartBoxPlotSvg<TProperties = Record<string, unknown>>({ ariaLabel, className, data, formatValue, legend, onDatumSelect, showValueLabels, xAxis, yAxis, }: ChartBoxPlotSvgProps<TProperties>): JSX.Element;
declare function ChartScatterSvg<TProperties = Record<string, unknown>>({ ariaLabel, className, formatValue, height, legend, onPointSelect, series, width, xAxis, xDomain, yAxis, yDomain, }: ChartScatterSvgProps<TProperties>): JSX.Element;
declare function ChartWaterfallSvg({ ariaLabel, className, data, formatValue, height, legend, onDatumSelect, showValueLabels, width, xAxis, yAxis, }: ChartWaterfallSvgProps): JSX.Element;
declare function ChartFunnelSvg({ ariaLabel, className, data, formatValue, height, legend, onDatumSelect, showValueLabels, width, }: ChartFunnelSvgProps): JSX.Element;

declare function ChartTreemapSvg<TPayload = unknown>({ ariaLabel, centerLabel, className, data, defaultFocusedNodeId, focusedNodeId, formatValue, onFocusedNodeChange, onNodeSelect, showNodeLabels, zoomable, }: ChartTreemapSvgProps<TPayload>): JSX.Element;
declare function ChartSunburstSvg<TPayload = unknown>({ ariaLabel, className, data, formatValue, height, onNodeSelect, width, }: ChartSunburstSvgProps<TPayload>): JSX.Element;
declare function ChartIcicleSvg<TPayload = unknown>({ ariaLabel, className, data, formatValue, onNodeSelect, showNodeLabels, }: ChartIcicleSvgProps<TPayload>): JSX.Element;
declare function ChartFlameGraphSvg<TPayload = unknown>({ ariaLabel, className, data, formatValue, onNodeSelect, showNodeLabels, }: ChartFlameGraphSvgProps<TPayload>): JSX.Element;
declare function ChartCirclePackSvg<TPayload = unknown>({ ariaLabel, className, data, formatValue, height, onNodeSelect, showNodeLabels, width, }: ChartCirclePackSvgProps<TPayload>): JSX.Element;
declare function ChartRadialTreeSvg<TPayload = unknown>({ ariaLabel, className, data, formatValue, height, onNodeSelect, showNodeLabels, width, }: ChartRadialTreeSvgProps<TPayload>): JSX.Element;
declare function ChartIndentedTreeSvg<TPayload = unknown>({ ariaLabel, className, data, formatValue, onNodeSelect, showValueBars, }: ChartIndentedTreeSvgProps<TPayload>): JSX.Element;
declare function ChartTreeSvg<TPayload = unknown>({ ariaLabel, className, data, formatValue, height, onNodeSelect, showNodeLabels, width, }: ChartTreeSvgProps<TPayload>): JSX.Element;

declare function ChartValueModePreview<TProperties = Record<string, unknown>>({ active, className, definition, measured, onSelect, }: ChartValueModePreviewProps<TProperties>): JSX.Element;

declare function useProgressiveChartDensity<TProperties = Record<string, unknown>>(points: readonly ChartSeriesPoint<TProperties>[], options?: Omit<ChartDensityIndexOptions<TProperties>, "backend">): {
    index: ProgressiveChartDensityIndex<TProperties>;
    status: ChartDensityProgressiveStatus;
    warmWorkerNow: () => Promise<ChartDensityWorkerIndex<TProperties> | null>;
    warmWasmNow: () => Promise<void>;
    workerIndex: ChartDensityWorkerIndex<TProperties> | null;
};

declare function useChartBinCount<TElement extends Element = HTMLDivElement>(options?: UseChartBinCountOptions): UseChartBinCountResult<TElement>;
declare function useChartDragDomain<TElement extends Element = HTMLElement>({ disabled, domain, fullDomain, minDragPixels, minSpan, onDomainChange, onDomainPreviewChange, panScale, resetOnDoubleClick, selectModifier, updateMode, }: UseChartDragDomainOptions): UseChartDragDomainResult<TElement>;
declare function useChartWheelDomain<TElement extends Element = HTMLElement>({ disabled, domain, fullDomain, minSpan, onDomainChange, scrollScale, zoomScale, }: UseChartWheelDomainOptions): UseChartWheelDomainResult<TElement>;
declare function useChartSeriesVisibility({ defaultHiddenIds, hiddenIds, itemIds, minVisible, onHiddenIdsChange, }: UseChartSeriesVisibilityOptions): UseChartSeriesVisibilityResult;

declare function measureChartSeries<TProperties = Record<string, unknown>>(index: ChartDensityIndex<TProperties>, query: ChartDensityQuery): MeasuredChartSeries<TProperties>;
declare function getChartSampleYBounds<TProperties = Record<string, unknown>>(samples: Array<ChartDensitySample<TProperties>>): {
    maxY: number | null;
    minY: number | null;
};
declare function getChartDataYBounds(rows: readonly Record<string, unknown>[], dataKeys: readonly string[]): {
    maxY: number | null;
    minY: number | null;
};
declare function getNearestChartSample<TProperties>(samples: readonly ChartDensitySample<TProperties>[], x: number, options?: {
    isSampleSelectable?: (sample: ChartDensitySample<TProperties>) => boolean;
}): ChartDensitySample<TProperties> | null;

export { BinnedChart, type BinnedChartProps, type BinnedChartRenderContext, type ChartAnimationMode, type ChartAnimationOptions, ChartAnomalyAnnotation, ChartAnomalyMarkerList, type ChartAnomalyMarkerListProps, type ChartAxesTransform, type ChartAxisOrientation, type ChartAxisRange, type ChartAxisScale, type ChartAxisTransform, ChartAxisTransformMenu, type ChartAxisTransformMenuProps, type ChartAxisTransformStatus, ChartBackendStatus, type ChartBackendStatusProps, ChartBoxPlotDatum, ChartBoxPlotSvg, type ChartBoxPlotSvgProps, ChartCalendarHeatmapData, ChartCalendarHeatmapDatum, ChartCalendarHeatmapSvg, type ChartCalendarHeatmapSvgProps, ChartCirclePackNode, ChartCirclePackSvg, type ChartCirclePackSvgProps, type ChartConfig, ChartContainer, type ChartContainerProps, type ChartDataLabelAnnotation, type ChartDataLabelObstacle, ChartDensityIndex, ChartDensityIndexOptions, ChartDensityProgressiveStatus, ChartDensityQuery, ChartDensitySample, ChartDensitySeries, ChartDensityWorkerIndex, ChartDerivedMetricCard, type ChartDerivedMetricCardProps, type ChartDomainDragPreview, type ChartDomainDragSelection, type ChartDomainDragUpdateMode, ChartDomainMinimap, type ChartDomainMinimapProps, ChartFlameGraphNode, ChartFlameGraphSvg, type ChartFlameGraphSvgProps, ChartFunnelRow, ChartFunnelSvg, type ChartFunnelSvgProps, ChartHeatmapCell, ChartHeatmapGrid, type ChartHeatmapGridProps, ChartHotBinRow, type ChartHotBinRowProps, ChartIcicleNode, ChartIcicleSvg, type ChartIcicleSvgProps, ChartIndentedTreeNode, ChartIndentedTreeSvg, type ChartIndentedTreeSvgProps, ChartLabelAnnotation, ChartLabelLayoutOptions, ChartLabelObstacle, ChartLabelOverlay, type ChartLabelOverlayProps, ChartLegend, ChartLegendContent, type ChartLegendContentProps, type ChartLegendItem, type ChartLegendProps, ChartMetricCard, type ChartMetricCardProps, ChartMetricStrip, type ChartMetricStripProps, ChartPanel, type ChartPanelProps, ChartPlacedLabel, type ChartPlaybackState, ChartRadialTreeNode, ChartRadialTreeSvg, type ChartRadialTreeSvgProps, type ChartRange, ChartRangeSelector, type ChartRangeSelectorProps, ChartRenderData, ChartRenderDataOptions, ChartRidgelineData, ChartRidgelineDatum, ChartRidgelineSvg, type ChartRidgelineSvgProps, type ChartSampleInteraction, ChartSampleInteractionOverlay, type ChartSampleInteractionOverlayProps, ChartSampleSparkline, type ChartSampleSparklineProps, ChartScatterSeries, ChartScatterSvg, type ChartScatterSvgProps, ChartSeriesLegend, type ChartSeriesLegendProps, ChartSeriesPoint, ChartStyle, type ChartStyleProps, ChartSunburstNode, ChartSunburstSvg, type ChartSunburstSvgProps, type ChartSvgAxisOptions, type ChartSvgLegendItem, ChartThresholdAnnotation, ChartThresholdMarker, type ChartThresholdMarkerProps, ChartTooltip, ChartTooltipContent, type ChartTooltipContentProps, type ChartTooltipProps, ChartTreeNode, ChartTreeSvg, type ChartTreeSvgProps, ChartTreemapNode, ChartTreemapSvg, type ChartTreemapSvgProps, ChartValueMode, ChartValueModeDefinition, ChartValueModePreview, type ChartValueModePreviewProps, ChartValueModeSelector, type ChartValueModeSelectorProps, ChartWaterfallRow, ChartWaterfallSvg, type ChartWaterfallSvgProps, ChartWithLegend, type ChartWithLegendProps, ChartXAxisNavigationMenu, type ChartXAxisNavigationMenuProps, ChartYAxisRangeMenu, type ChartYAxisRangeMenuProps, type MeasuredChartSeries, ProgressiveChartDensityIndex, type UseChartBinCountOptions, type UseChartBinCountResult, type UseChartDragDomainOptions, type UseChartDragDomainResult, type UseChartSeriesVisibilityOptions, type UseChartSeriesVisibilityResult, type UseChartWheelDomainOptions, type UseChartWheelDomainResult, getChartAxisScaleDefinitions, getChartDataYBounds, getChartSampleYBounds, getNearestChartSample, getRechartsAnimationProps, measureChartSeries, resolveChartAxisTransformStatus, useChartAnimatedDomain, useChartBinCount, useChartDragDomain, useChartPlaybackDomain, useChartSeriesVisibility, useChartWheelDomain, useProgressiveChartDensity };
```

# API Report: @moritzbrantner/charts

This file is generated from the complete declaration graph emitted for the public package entry points. Generated chunk names are normalized so implementation-only hashes do not create API-report churn.

## Compatibility entry point (`.`)

Generated from `dist/index.d.ts`.

```ts
export { B as BinnedSeriesBackend, C as ChartAnomalyAnnotation, a as ChartAnomalyOptions, b as ChartBackendCapabilities, c as ChartBandBoundary, d as ChartBandRenderDatum, e as ChartBoxPlotDatum, f as ChartCalendarHeatmapData, g as ChartCalendarHeatmapDatum, h as ChartCirclePackNode, i as ChartDeltaSeriesOptions, j as ChartDensityBackend, k as ChartDensityBackendPolicy, l as ChartDensityBackendPolicyInput, m as ChartDensityBin, n as ChartDensityCacheOptions, o as ChartDensityIndex, p as ChartDensityIndexOptions, q as ChartDensityPreparationMode, r as ChartDensityProgressiveOptions, s as ChartDensityProgressiveStatus, t as ChartDensityQuery, u as ChartDensitySample, v as ChartDensitySeries, w as ChartDensitySummary, x as ChartDensityViewportSummary, y as ChartDensityWarmupScheduler, z as ChartDensityWorkerIndex, A as ChartDensityWorkerOptions, D as ChartDerivedPoint, E as ChartFlameGraphNode, F as ChartFunnelDatum, G as ChartFunnelRow, H as ChartGapAnnotation, I as ChartGapBehavior, J as ChartGroupedDensityGroup, K as ChartGroupedDensityQuery, L as ChartGroupedDensitySeries, M as ChartHeatmap, N as ChartHeatmapCell, O as ChartHeatmapQuery, P as ChartHierarchyNode, Q as ChartHistogram, R as ChartHistogramBucket, S as ChartHistogramQuery, T as ChartIcicleNode, U as ChartIndentedTreeNode, V as ChartLabelAnnotation, W as ChartLabelLayoutOptions, X as ChartLabelLeaderLine, Y as ChartLabelLine, Z as ChartLabelObstacle, _ as ChartLabelPlacement, $ as ChartLabelRect, a0 as ChartMetricRecord, a1 as ChartPercentileMode, a2 as ChartPlacedLabel, a3 as ChartPointGroupAccessor, a4 as ChartPointQuery, a5 as ChartPointSampling, a6 as ChartPointSeries, a7 as ChartPointValueAccessor, a8 as ChartRadialTreeNode, a9 as ChartRenderData, aa as ChartRenderDataOptions, ab as ChartRenderDatum, ac as ChartRidgelineBucket, ad as ChartRidgelineData, ae as ChartRidgelineDatum, af as ChartRollingSeriesOptions, ag as ChartRollingStatistic, ah as ChartSampleValueAccessor, ai as ChartScatterPoint, aj as ChartScatterQuery, ak as ChartScatterSeries, al as ChartSeriesPoint, am as ChartSunburstNode, an as ChartThresholdAnnotation, ao as ChartTreeNode, ap as ChartTreemapNode, aq as ChartValueMode, ar as ChartValueModeDefinition, as as ChartValueModeRenderer, at as ChartWaterfallDatum, au as ChartWaterfallRow, av as IndexedChartSeriesPoint, aw as ProgressiveChartDensityIndex, ax as createCumulativeChartSeries, ay as createDeltaChartSeries, az as createRollingChartSeries, aA as doChartLabelRectsIntersect, aB as getChartAnomalyAnnotations, aC as getChartSampleValue, aD as getChartThresholdAnnotations, aE as layoutChartLabels } from './shared-1.js';
export { CHART_VALUE_MODE_DEFINITIONS, ChartBinTransform, ChartBinTransformBin, ChartBinTransformOptions, ChartContour, ChartContourGrid, ChartContourLine, ChartContourOptions, ChartContourPoint, ChartStackOffset, ChartStackPoint, ChartStackSeries, ChartStackTransform, ChartStackTransformOptions, ChartViewState, createChartBandRenderData, createChartBinTransform, createChartBoxPlotData, createChartCalendarHeatmapData, createChartCirclePackLayout, createChartContours, createChartDensityIndex, createChartDensitySample, createChartDensityViewportSummary, createChartDensityWorkerIndex, createChartFlameGraphLayout, createChartFunnelData, createChartIcicleLayout, createChartIndentedTreeLayout, createChartRadialTreeLayout, createChartRenderData, createChartRidgelineData, createChartSeriesIndex, createChartStackTransform, createChartSunburstLayout, createChartTreeLayout, createChartTreemapLayout, createChartWaterfallData, createGroupedChartRenderData, createProgressiveChartDensityIndex, decodeChartViewState, encodeChartViewState, getChartGapAnnotations, getChartValueModeDefinition, getChartValueModeDefinitions, getLoadedChartWasmKernel, loadChartWasmKernel, resolveChartDensityBackendPolicy } from './core.js';
export { BinnedChart, BinnedChartProps, BinnedChartRenderContext, ChartAnimationMode, ChartAnimationOptions, ChartAnomalyMarkerList, ChartAnomalyMarkerListProps, ChartAxesTransform, ChartAxisOrientation, ChartAxisRange, ChartAxisScale, ChartAxisTransform, ChartAxisTransformMenu, ChartAxisTransformMenuProps, ChartAxisTransformStatus, ChartBackendStatus, ChartBackendStatusProps, ChartBoxPlotSvg, ChartBoxPlotSvgProps, ChartCalendarHeatmapSvg, ChartCalendarHeatmapSvgProps, ChartCirclePackSvg, ChartCirclePackSvgProps, ChartConfig, ChartContainer, ChartDataLabelAnnotation, ChartDataLabelObstacle, ChartDensityTable, ChartDensityTableProps, ChartDerivedMetricCard, ChartDerivedMetricCardProps, ChartDomainDragPreview, ChartDomainDragSelection, ChartDomainDragUpdateMode, ChartDomainMinimap, ChartDomainMinimapProps, ChartFlameGraphSvg, ChartFlameGraphSvgProps, ChartFunnelSvg, ChartFunnelSvgProps, ChartHeatmapGrid, ChartHeatmapGridProps, ChartHotBinRow, ChartHotBinRowProps, ChartIcicleSvg, ChartIcicleSvgProps, ChartIndentedTreeSvg, ChartIndentedTreeSvgProps, ChartLabelOverlay, ChartLabelOverlayProps, ChartLegendItem, ChartMetricCard, ChartMetricCardProps, ChartMetricStrip, ChartMetricStripProps, ChartPanel, ChartPanelProps, ChartPlaybackState, ChartRadialTreeSvg, ChartRadialTreeSvgProps, ChartRange, ChartRangeSelector, ChartRangeSelectorProps, ChartRidgelineSvg, ChartRidgelineSvgProps, ChartSampleInteraction, ChartSampleInteractionOverlay, ChartSampleInteractionOverlayProps, ChartSampleSparkline, ChartSampleSparklineProps, ChartScatterSvg, ChartScatterSvgProps, ChartSeriesLegend, ChartSeriesLegendProps, ChartSunburstSvg, ChartSunburstSvgProps, ChartSvgAxisOptions, ChartSvgLegendItem, ChartThresholdMarker, ChartThresholdMarkerProps, ChartTreeSvg, ChartTreeSvgProps, ChartTreemapSvg, ChartTreemapSvgProps, ChartValueModePreview, ChartValueModePreviewProps, ChartValueModeSelector, ChartValueModeSelectorProps, ChartWaterfallSvg, ChartWaterfallSvgProps, ChartWithLegend, ChartWithLegendProps, ChartXAxisNavigationMenu, ChartXAxisNavigationMenuProps, ChartYAxisRangeMenu, ChartYAxisRangeMenuProps, MeasuredChartSeries, UseChartBinCountOptions, UseChartBinCountResult, UseChartDragDomainOptions, UseChartDragDomainResult, UseChartSeriesVisibilityOptions, UseChartSeriesVisibilityResult, UseChartWheelDomainOptions, UseChartWheelDomainResult, getChartAxisScaleDefinitions, getChartDataYBounds, getChartSampleYBounds, getNearestChartSample, getRechartsAnimationProps, measureChartSeries, resolveChartAxisTransformStatus, useChartAnimatedDomain, useChartBinCount, useChartDragDomain, useChartPlaybackDomain, useChartSeriesVisibility, useChartWheelDomain, useProgressiveChartDensity } from './react.js';
import 'react/jsx-runtime';
import 'react';
```

## Server-safe entry point (`./core`)

Generated from `dist/core.d.ts`.

```ts
import { ar as ChartValueModeDefinition, aq as ChartValueMode, al as ChartSeriesPoint, p as ChartDensityIndexOptions, o as ChartDensityIndex, aw as ProgressiveChartDensityIndex, l as ChartDensityBackendPolicyInput, B as BinnedSeriesBackend, A as ChartDensityWorkerOptions, z as ChartDensityWorkerIndex, u as ChartDensitySample, c as ChartBandBoundary, d as ChartBandRenderDatum, e as ChartBoxPlotDatum, av as IndexedChartSeriesPoint, a7 as ChartPointValueAccessor, f as ChartCalendarHeatmapData, m as ChartDensityBin, v as ChartDensitySeries, x as ChartDensityViewportSummary, F as ChartFunnelDatum, G as ChartFunnelRow, aa as ChartRenderDataOptions, a9 as ChartRenderData, ad as ChartRidgelineData, at as ChartWaterfallDatum, au as ChartWaterfallRow, L as ChartGroupedDensitySeries, I as ChartGapBehavior, H as ChartGapAnnotation, P as ChartHierarchyNode, h as ChartCirclePackNode, E as ChartFlameGraphNode, T as ChartIcicleNode, U as ChartIndentedTreeNode, a8 as ChartRadialTreeNode, am as ChartSunburstNode, ao as ChartTreeNode, ap as ChartTreemapNode } from './shared-1.js';
export { C as ChartAnomalyAnnotation, a as ChartAnomalyOptions, b as ChartBackendCapabilities, g as ChartCalendarHeatmapDatum, i as ChartDeltaSeriesOptions, j as ChartDensityBackend, k as ChartDensityBackendPolicy, n as ChartDensityCacheOptions, q as ChartDensityPreparationMode, r as ChartDensityProgressiveOptions, s as ChartDensityProgressiveStatus, t as ChartDensityQuery, w as ChartDensitySummary, y as ChartDensityWarmupScheduler, D as ChartDerivedPoint, J as ChartGroupedDensityGroup, K as ChartGroupedDensityQuery, M as ChartHeatmap, N as ChartHeatmapCell, O as ChartHeatmapQuery, Q as ChartHistogram, R as ChartHistogramBucket, S as ChartHistogramQuery, V as ChartLabelAnnotation, W as ChartLabelLayoutOptions, X as ChartLabelLeaderLine, Y as ChartLabelLine, Z as ChartLabelObstacle, _ as ChartLabelPlacement, $ as ChartLabelRect, a0 as ChartMetricRecord, a1 as ChartPercentileMode, a2 as ChartPlacedLabel, a3 as ChartPointGroupAccessor, a4 as ChartPointQuery, a5 as ChartPointSampling, a6 as ChartPointSeries, ab as ChartRenderDatum, ac as ChartRidgelineBucket, ae as ChartRidgelineDatum, af as ChartRollingSeriesOptions, ag as ChartRollingStatistic, ah as ChartSampleValueAccessor, ai as ChartScatterPoint, aj as ChartScatterQuery, ak as ChartScatterSeries, an as ChartThresholdAnnotation, as as ChartValueModeRenderer, ax as createCumulativeChartSeries, ay as createDeltaChartSeries, az as createRollingChartSeries, aA as doChartLabelRectsIntersect, aB as getChartAnomalyAnnotations, aC as getChartSampleValue, aD as getChartThresholdAnnotations, aE as layoutChartLabels } from './shared-1.js';

type ChartBinTransformOptions<TDatum> = {
    binCount: number;
    domain?: [number, number];
    includeEmptyBins?: boolean;
    value: (datum: TDatum, index: number) => number | null | undefined;
};
type ChartBinTransformBin<TDatum> = {
    count: number;
    index: number;
    items: TDatum[];
    x: number;
    x0: number;
    x1: number;
};
type ChartBinTransform<TDatum> = {
    bins: Array<ChartBinTransformBin<TDatum>>;
    summary: {
        binCount: number;
        binnedItemCount: number;
        requestedBinCount: number;
        sourceItemCount: number;
        valueDomain: [number, number];
    };
};
type ChartContourGrid = {
    values: readonly number[];
    xCount: number;
    xDomain?: [number, number];
    yCount: number;
    yDomain?: [number, number];
};
type ChartContourOptions = {
    thresholds: readonly number[];
};
type ChartContourPoint = {
    x: number;
    y: number;
};
type ChartContourLine = {
    closed: boolean;
    points: ChartContourPoint[];
};
type ChartContour = {
    lines: ChartContourLine[];
    threshold: number;
};
declare function createChartBinTransform<TDatum>(data: readonly TDatum[], options: ChartBinTransformOptions<TDatum>): ChartBinTransform<TDatum>;
declare function createChartContours(grid: ChartContourGrid, options: ChartContourOptions): ChartContour[];

type ChartStackOffset = "diverging" | "zero";
type ChartStackTransformOptions<TDatum, TKey extends string = string> = {
    keys: readonly TKey[];
    offset?: ChartStackOffset;
    order?: readonly TKey[];
    value: (datum: TDatum, key: TKey, datumIndex: number) => number | null | undefined;
};
type ChartStackPoint<TDatum> = {
    datum: TDatum;
    datumIndex: number;
    defined: boolean;
    end: number;
    start: number;
    value: number;
};
type ChartStackSeries<TDatum, TKey extends string = string> = {
    index: number;
    key: TKey;
    points: Array<ChartStackPoint<TDatum>>;
};
type ChartStackTransform<TDatum, TKey extends string = string> = {
    domain: [number, number];
    series: Array<ChartStackSeries<TDatum, TKey>>;
};
declare function createChartStackTransform<TDatum, TKey extends string = string>(data: readonly TDatum[], options: ChartStackTransformOptions<TDatum, TKey>): ChartStackTransform<TDatum, TKey>;

declare const CHART_VALUE_MODE_DEFINITIONS: readonly ChartValueModeDefinition[];
declare function getChartValueModeDefinition(mode: ChartValueMode): ChartValueModeDefinition;
declare function getChartValueModeDefinitions(modes?: readonly ChartValueMode[]): ChartValueModeDefinition[];

declare function resolveChartDensityBackendPolicy({ hasPercentiles, operationKind, pointCount, requestedModes, }: ChartDensityBackendPolicyInput): BinnedSeriesBackend;
declare function createChartDensityIndex<TProperties = Record<string, unknown>>(points: readonly ChartSeriesPoint<TProperties>[], options?: ChartDensityIndexOptions<TProperties>): ChartDensityIndex<TProperties>;
declare function createProgressiveChartDensityIndex<TProperties = Record<string, unknown>>(points: readonly ChartSeriesPoint<TProperties>[], options?: Omit<ChartDensityIndexOptions<TProperties>, "backend">): ProgressiveChartDensityIndex<TProperties>;
declare const createChartSeriesIndex: typeof createChartDensityIndex;

declare function createChartDensityWorkerIndex<TProperties = Record<string, unknown>>(points: readonly ChartSeriesPoint<TProperties>[], options?: Omit<ChartDensityIndexOptions<TProperties>, "backend" | "progressive">, workerOptions?: ChartDensityWorkerOptions): ChartDensityWorkerIndex<TProperties> | null;

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
declare function createChartWaterfallData(data: readonly ChartWaterfallDatum[], options?: {
    initialValue?: number;
}): ChartWaterfallRow[];
declare function createChartFunnelData(data: readonly ChartFunnelDatum[]): ChartFunnelRow[];
declare function createChartCalendarHeatmapData<TProperties>(points: Array<IndexedChartSeriesPoint<TProperties> | ChartSeriesPoint<TProperties>>, options?: {
    dayMs?: number;
    includeEmptyDays?: boolean;
    startOfDay?: (x: number) => number;
    valueAccessor?: ChartPointValueAccessor<TProperties>;
    xDomain?: [number, number];
}): ChartCalendarHeatmapData<TProperties>;
declare function createChartRidgelineData<TProperties>(points: Array<IndexedChartSeriesPoint<TProperties> | ChartSeriesPoint<TProperties>>, options: {
    bucketCount: number;
    groupBy: {
        property: keyof TProperties & string;
    } | ((point: IndexedChartSeriesPoint<TProperties>) => string);
    maxGroups?: number;
    valueAccessor?: ChartPointValueAccessor<TProperties>;
    valueDomain?: [number, number];
    xDomain?: [number, number];
}): ChartRidgelineData<TProperties>;

declare function createChartTreemapLayout<TPayload = unknown>(root: ChartHierarchyNode<TPayload>, options: {
    height: number;
    padding?: number;
    width: number;
    x?: number;
    y?: number;
}): Array<ChartTreemapNode<TPayload>>;
declare function createChartSunburstLayout<TPayload = unknown>(root: ChartHierarchyNode<TPayload>, options: {
    innerRadius?: number;
    outerRadius: number;
    paddingAngle?: number;
}): Array<ChartSunburstNode<TPayload>>;
declare function createChartIcicleLayout<TPayload = unknown>(root: ChartHierarchyNode<TPayload>, options: {
    height: number;
    padding?: number;
    width: number;
    x?: number;
    y?: number;
}): Array<ChartIcicleNode<TPayload>>;
declare function createChartFlameGraphLayout<TPayload = unknown>(root: ChartHierarchyNode<TPayload>, options: {
    height: number;
    padding?: number;
    width: number;
    x?: number;
    y?: number;
}): Array<ChartFlameGraphNode<TPayload>>;
declare function createChartCirclePackLayout<TPayload = unknown>(root: ChartHierarchyNode<TPayload>, options?: {
    height?: number;
    padding?: number;
    radius?: number;
    width?: number;
    x?: number;
    y?: number;
}): Array<ChartCirclePackNode<TPayload>>;
declare function createChartTreeLayout<TPayload = unknown>(root: ChartHierarchyNode<TPayload>, options: {
    height: number;
    width: number;
    x?: number;
    y?: number;
}): Array<ChartTreeNode<TPayload>>;
declare function createChartRadialTreeLayout<TPayload = unknown>(root: ChartHierarchyNode<TPayload>, options?: {
    height?: number;
    innerRadius?: number;
    outerRadius?: number;
    startAngle?: number;
    width?: number;
    x?: number;
    y?: number;
}): Array<ChartRadialTreeNode<TPayload>>;
declare function createChartIndentedTreeLayout<TPayload = unknown>(root: ChartHierarchyNode<TPayload>, options: {
    indent?: number;
    padding?: number;
    rowHeight?: number;
    width: number;
    x?: number;
    y?: number;
}): Array<ChartIndentedTreeNode<TPayload>>;

type ChartViewState = {
    domain?: [number, number];
    hiddenSeries?: string[];
    selectedSampleIndex?: number | null;
    valueMode?: ChartValueMode;
};
declare function encodeChartViewState(state: ChartViewState): string;
declare function decodeChartViewState(input: string | URLSearchParams): ChartViewState;

type ChartWasmDensityBin = {
    averageY: number | null;
    index: number;
    maxY: number | null;
    minY: number | null;
    pointCount: number;
    sumY: number;
    x0: number;
    x1: number;
};
type ChartWasmHistogramBucket = {
    averageValue: number | null;
    index: number;
    maxValue: number | null;
    minValue: number | null;
    pointCount: number;
    sumValue: number;
    value0: number;
    value1: number;
};
type ChartWasmKernel = {
    aggregateDensityBins(x: Float64Array, y: Float64Array, domain: [number, number], binCount: number): ChartWasmDensityBin[];
    aggregateHistogram(values: Float64Array, domain: [number, number], bucketCount: number): ChartWasmHistogramBucket[];
    percentile(values: Float64Array, quantile: number): number;
};
declare function getLoadedChartWasmKernel(): ChartWasmKernel | null;
declare function loadChartWasmKernel(): Promise<ChartWasmKernel>;

export { BinnedSeriesBackend, CHART_VALUE_MODE_DEFINITIONS, ChartBandBoundary, ChartBandRenderDatum, type ChartBinTransform, type ChartBinTransformBin, type ChartBinTransformOptions, ChartBoxPlotDatum, ChartCalendarHeatmapData, ChartCirclePackNode, type ChartContour, type ChartContourGrid, type ChartContourLine, type ChartContourOptions, type ChartContourPoint, ChartDensityBackendPolicyInput, ChartDensityBin, ChartDensityIndex, ChartDensityIndexOptions, ChartDensitySample, ChartDensitySeries, ChartDensityViewportSummary, ChartDensityWorkerIndex, ChartDensityWorkerOptions, ChartFlameGraphNode, ChartFunnelDatum, ChartFunnelRow, ChartGapAnnotation, ChartGapBehavior, ChartGroupedDensitySeries, ChartHierarchyNode, ChartIcicleNode, ChartIndentedTreeNode, ChartPointValueAccessor, ChartRadialTreeNode, ChartRenderData, ChartRenderDataOptions, ChartRidgelineData, ChartSeriesPoint, type ChartStackOffset, type ChartStackPoint, type ChartStackSeries, type ChartStackTransform, type ChartStackTransformOptions, ChartSunburstNode, ChartTreeNode, ChartTreemapNode, ChartValueMode, ChartValueModeDefinition, type ChartViewState, ChartWaterfallDatum, ChartWaterfallRow, IndexedChartSeriesPoint, ProgressiveChartDensityIndex, createChartBandRenderData, createChartBinTransform, createChartBoxPlotData, createChartCalendarHeatmapData, createChartCirclePackLayout, createChartContours, createChartDensityIndex, createChartDensitySample, createChartDensityViewportSummary, createChartDensityWorkerIndex, createChartFlameGraphLayout, createChartFunnelData, createChartIcicleLayout, createChartIndentedTreeLayout, createChartRadialTreeLayout, createChartRenderData, createChartRidgelineData, createChartSeriesIndex, createChartStackTransform, createChartSunburstLayout, createChartTreeLayout, createChartTreemapLayout, createChartWaterfallData, createGroupedChartRenderData, createProgressiveChartDensityIndex, decodeChartViewState, encodeChartViewState, getChartGapAnnotations, getChartValueModeDefinition, getChartValueModeDefinitions, getLoadedChartWasmKernel, loadChartWasmKernel, resolveChartDensityBackendPolicy };
```

## React entry point (`./react`)

Generated from `dist/react.d.ts`.

```ts
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';
import { HTMLAttributes, ReactElement, ReactNode, ComponentProps, MouseEvent, MouseEventHandler, PointerEventHandler, WheelEventHandler, JSX } from 'react';
import { a9 as ChartRenderData, v as ChartDensitySeries, o as ChartDensityIndex, t as ChartDensityQuery, aa as ChartRenderDataOptions, aq as ChartValueMode, C as ChartAnomalyAnnotation, s as ChartDensityProgressiveStatus, e as ChartBoxPlotDatum, f as ChartCalendarHeatmapData, g as ChartCalendarHeatmapDatum, h as ChartCirclePackNode, V as ChartLabelAnnotation, u as ChartDensitySample, E as ChartFlameGraphNode, G as ChartFunnelRow, N as ChartHeatmapCell, T as ChartIcicleNode, U as ChartIndentedTreeNode, W as ChartLabelLayoutOptions, Z as ChartLabelObstacle, a2 as ChartPlacedLabel, a8 as ChartRadialTreeNode, ad as ChartRidgelineData, ae as ChartRidgelineDatum, ak as ChartScatterSeries, am as ChartSunburstNode, an as ChartThresholdAnnotation, ao as ChartTreeNode, ap as ChartTreemapNode, ar as ChartValueModeDefinition, au as ChartWaterfallRow, al as ChartSeriesPoint, p as ChartDensityIndexOptions, aw as ProgressiveChartDensityIndex, z as ChartDensityWorkerIndex } from './shared-1.js';

type ChartConfig = Record<string, {
    color?: string;
    label?: ReactNode;
    theme?: Record<string, string>;
}>;
type ChartContainerProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children: ReactElement;
    config: ChartConfig;
};
declare function ChartContainer({ children, className, config, style, ...props }: ChartContainerProps): react_jsx_runtime.JSX.Element;

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

type ChartDensityTableProps<TProperties = Record<string, unknown>> = Omit<React.ComponentProps<"table">, "children"> & {
    caption?: React.ReactNode;
    formatNumber?: (value: number) => React.ReactNode;
    formatX?: (sample: ChartDensitySample<TProperties>) => React.ReactNode;
    samples: Array<ChartDensitySample<TProperties>>;
};
/**
 * Structured-value companion for interactive density charts.
 *
 * Render this table alongside or behind a chart when the visual surface carries
 * information that must also be available as semantic values. Consumers own
 * responsive presentation (for example a tabs/disclosure layout).
 */
declare function ChartDensityTable<TProperties = Record<string, unknown>>({ caption, formatNumber, formatX, samples, ...props }: ChartDensityTableProps<TProperties>): react_jsx_runtime.JSX.Element;

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

export { BinnedChart, type BinnedChartProps, type BinnedChartRenderContext, type ChartAnimationMode, type ChartAnimationOptions, ChartAnomalyMarkerList, type ChartAnomalyMarkerListProps, type ChartAxesTransform, type ChartAxisOrientation, type ChartAxisRange, type ChartAxisScale, type ChartAxisTransform, ChartAxisTransformMenu, type ChartAxisTransformMenuProps, type ChartAxisTransformStatus, ChartBackendStatus, type ChartBackendStatusProps, ChartBoxPlotSvg, type ChartBoxPlotSvgProps, ChartCalendarHeatmapSvg, type ChartCalendarHeatmapSvgProps, ChartCirclePackSvg, type ChartCirclePackSvgProps, type ChartConfig, ChartContainer, type ChartDataLabelAnnotation, type ChartDataLabelObstacle, ChartDensityTable, type ChartDensityTableProps, ChartDerivedMetricCard, type ChartDerivedMetricCardProps, type ChartDomainDragPreview, type ChartDomainDragSelection, type ChartDomainDragUpdateMode, ChartDomainMinimap, type ChartDomainMinimapProps, ChartFlameGraphSvg, type ChartFlameGraphSvgProps, ChartFunnelSvg, type ChartFunnelSvgProps, ChartHeatmapGrid, type ChartHeatmapGridProps, ChartHotBinRow, type ChartHotBinRowProps, ChartIcicleSvg, type ChartIcicleSvgProps, ChartIndentedTreeSvg, type ChartIndentedTreeSvgProps, ChartLabelOverlay, type ChartLabelOverlayProps, type ChartLegendItem, ChartMetricCard, type ChartMetricCardProps, ChartMetricStrip, type ChartMetricStripProps, ChartPanel, type ChartPanelProps, type ChartPlaybackState, ChartRadialTreeSvg, type ChartRadialTreeSvgProps, type ChartRange, ChartRangeSelector, type ChartRangeSelectorProps, ChartRidgelineSvg, type ChartRidgelineSvgProps, type ChartSampleInteraction, ChartSampleInteractionOverlay, type ChartSampleInteractionOverlayProps, ChartSampleSparkline, type ChartSampleSparklineProps, ChartScatterSvg, type ChartScatterSvgProps, ChartSeriesLegend, type ChartSeriesLegendProps, ChartSunburstSvg, type ChartSunburstSvgProps, type ChartSvgAxisOptions, type ChartSvgLegendItem, ChartThresholdMarker, type ChartThresholdMarkerProps, ChartTreeSvg, type ChartTreeSvgProps, ChartTreemapSvg, type ChartTreemapSvgProps, ChartValueModePreview, type ChartValueModePreviewProps, ChartValueModeSelector, type ChartValueModeSelectorProps, ChartWaterfallSvg, type ChartWaterfallSvgProps, ChartWithLegend, type ChartWithLegendProps, ChartXAxisNavigationMenu, type ChartXAxisNavigationMenuProps, ChartYAxisRangeMenu, type ChartYAxisRangeMenuProps, type MeasuredChartSeries, type UseChartBinCountOptions, type UseChartBinCountResult, type UseChartDragDomainOptions, type UseChartDragDomainResult, type UseChartSeriesVisibilityOptions, type UseChartSeriesVisibilityResult, type UseChartWheelDomainOptions, type UseChartWheelDomainResult, getChartAxisScaleDefinitions, getChartDataYBounds, getChartSampleYBounds, getNearestChartSample, getRechartsAnimationProps, measureChartSeries, resolveChartAxisTransformStatus, useChartAnimatedDomain, useChartBinCount, useChartDragDomain, useChartPlaybackDomain, useChartSeriesVisibility, useChartWheelDomain, useProgressiveChartDensity };
```

## Shared declaration 1

Generated from `dist/shared-1.d.ts`.

```ts
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
type ChartDensityCacheOptions = {
    enabled?: boolean;
    maxEntries?: number;
};
type ChartDensityPreparationMode = "lazy" | "eager";
type ChartDensityBackendPolicy = ChartDensityBackend | "auto";
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
    getBackendCapabilities?: () => ChartBackendCapabilities;
    getBinnedSeries(query: BinnedSeriesQuery): BinnedSeries<TProperties>;
    getChartSeries(query: ChartDensityQuery): ChartDensitySeries<TProperties>;
    getChartPoints(query?: ChartPointQuery): ChartPointSeries<TProperties>;
    getGroupedChartSeries(query: ChartGroupedDensityQuery<TProperties>): ChartGroupedDensitySeries<TProperties>;
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
type ChartBackendCapabilities = {
    backend: BinnedSeriesBackend;
    supportsGroupedSeries: boolean;
    supportsHeatmap: boolean;
    supportsHistogram: boolean;
    supportsPercentiles: boolean;
    usesWasm: boolean;
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
type ChartCalendarHeatmapDatum<TProperties = Record<string, unknown>> = {
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
type ChartCalendarHeatmapData<TProperties = Record<string, unknown>> = {
    days: Array<ChartCalendarHeatmapDatum<TProperties>>;
    summary: {
        dayCount: number;
        maxValue: number | null;
        minValue: number | null;
        pointCount: number;
        xDomain: [number, number];
    };
};
type ChartRidgelineBucket = {
    index: number;
    pointCount: number;
    value: number;
    value0: number;
    value1: number;
    x: number;
};
type ChartRidgelineDatum<_TProperties = Record<string, unknown>> = {
    buckets: ChartRidgelineBucket[];
    groupId: string;
    groupLabel: string;
    maxCount: number;
    pointCount: number;
};
type ChartRidgelineData<TProperties = Record<string, unknown>> = {
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
type ChartPointSampling = "stride";
type ChartPointQuery = {
    maxPoints?: number;
    sampling?: ChartPointSampling;
    xDomain?: [number, number];
};
type ChartPointSeries<TProperties = Record<string, unknown>> = {
    points: Array<IndexedChartSeriesPoint<TProperties>>;
    summary: {
        metrics: ChartMetricRecord;
        pointCount: number;
        sampledPointCount: number;
        xDomain: [number, number] | null;
    };
};
type ChartScatterQuery<TProperties = Record<string, unknown>> = ChartPointQuery & {
    sizeAccessor?: ChartPointValueAccessor<TProperties>;
    yDomain?: [number, number];
};
type ChartScatterPoint<TProperties = Record<string, unknown>> = {
    id: string;
    label: string;
    metrics: ChartMetricRecord;
    point: IndexedChartSeriesPoint<TProperties>;
    radius: number;
    sizeValue: number | null;
    x: number;
    y: number;
};
type ChartScatterSeries<TProperties = Record<string, unknown>> = {
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
type ChartWaterfallDatum = {
    color?: string;
    id?: string;
    label: string;
    value: number;
};
type ChartWaterfallRow = {
    color?: string;
    end: number;
    id: string;
    index: number;
    label: string;
    negative: boolean;
    start: number;
    value: number;
};
type ChartFunnelDatum = {
    color?: string;
    id?: string;
    label: string;
    value: number;
};
type ChartFunnelRow = {
    color?: string;
    dropOff: number | null;
    id: string;
    index: number;
    label: string;
    percentOfFirst: number;
    percentOfPrevious: number | null;
    value: number;
};
type ChartHierarchyNode<TPayload = unknown> = {
    children?: Array<ChartHierarchyNode<TPayload>>;
    color?: string;
    id?: string;
    label: string;
    payload?: TPayload;
    value?: number;
};
type ChartTreemapNode<TPayload = unknown> = {
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
type ChartSunburstNode<TPayload = unknown> = {
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
type ChartIcicleNode<TPayload = unknown> = {
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
type ChartFlameGraphNode<TPayload = unknown> = {
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
type ChartCirclePackNode<TPayload = unknown> = {
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
type ChartTreeNode<TPayload = unknown> = {
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
type ChartRadialTreeNode<TPayload = unknown> = {
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
type ChartIndentedTreeNode<TPayload = unknown> = {
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
    onWorkerReady?: (index: ChartDensityWorkerIndex<TProperties>) => void;
    scheduler?: ChartDensityWarmupScheduler;
    warmup?: "manual" | "scheduled";
    worker?: boolean | ChartDensityWorkerOptions;
};
type ChartDensityIndexOptions<TProperties = Record<string, unknown>> = Omit<BinnedSeriesIndexOptions<TProperties>, "backend"> & {
    backend?: ChartDensityBackendPolicy;
    cache?: ChartDensityCacheOptions;
    preparation?: ChartDensityPreparationMode;
    progressive?: ChartDensityProgressiveOptions<TProperties>;
};
type ChartDensityProgressiveStatus = {
    activeBackend: BinnedSeriesBackend;
    isWarming: boolean;
    isWorkerBuilding?: boolean;
    workerError?: unknown | null;
    workerReady?: boolean;
    wasmError: unknown | null;
    wasmReady: boolean;
};
type ProgressiveChartDensityIndex<TProperties = Record<string, unknown>> = ChartDensityIndex<TProperties> & {
    getActiveBackend(): BinnedSeriesBackend;
    getProgressiveStatus(): ChartDensityProgressiveStatus;
    getWorkerIndex(): ChartDensityWorkerIndex<TProperties> | null;
    warmWorkerIndex(): Promise<ChartDensityWorkerIndex<TProperties> | null>;
    warmWasmIndex(): Promise<ChartDensityIndex<TProperties>>;
    whenWorkerReady(): Promise<ChartDensityWorkerIndex<TProperties> | null>;
    whenWasmReady(): Promise<ChartDensityIndex<TProperties>>;
};
type ChartDensityWorkerOptions = {
    createWorker?: () => Worker;
};
type ChartDensityWorkerIndex<TProperties = Record<string, unknown>> = {
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
type ChartDensityBackendPolicyInput = {
    hasPercentiles?: boolean;
    operationKind?: "chart" | "grouped" | "heatmap" | "histogram" | "construct" | "progressive";
    pointCount: number;
    requestedModes?: readonly ChartValueMode[];
};

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

export { type ChartLabelRect as $, type ChartDensityWorkerOptions as A, type BinnedSeriesBackend as B, type ChartAnomalyAnnotation as C, type ChartDerivedPoint as D, type ChartFlameGraphNode as E, type ChartFunnelDatum as F, type ChartFunnelRow as G, type ChartGapAnnotation as H, type ChartGapBehavior as I, type ChartGroupedDensityGroup as J, type ChartGroupedDensityQuery as K, type ChartGroupedDensitySeries as L, type ChartHeatmap as M, type ChartHeatmapCell as N, type ChartHeatmapQuery as O, type ChartHierarchyNode as P, type ChartHistogram as Q, type ChartHistogramBucket as R, type ChartHistogramQuery as S, type ChartIcicleNode as T, type ChartIndentedTreeNode as U, type ChartLabelAnnotation as V, type ChartLabelLayoutOptions as W, type ChartLabelLeaderLine as X, type ChartLabelLine as Y, type ChartLabelObstacle as Z, type ChartLabelPlacement as _, type ChartAnomalyOptions as a, type ChartMetricRecord as a0, type ChartPercentileMode as a1, type ChartPlacedLabel as a2, type ChartPointGroupAccessor as a3, type ChartPointQuery as a4, type ChartPointSampling as a5, type ChartPointSeries as a6, type ChartPointValueAccessor as a7, type ChartRadialTreeNode as a8, type ChartRenderData as a9, doChartLabelRectsIntersect as aA, getChartAnomalyAnnotations as aB, getChartSampleValue as aC, getChartThresholdAnnotations as aD, layoutChartLabels as aE, type ChartRenderDataOptions as aa, type ChartRenderDatum as ab, type ChartRidgelineBucket as ac, type ChartRidgelineData as ad, type ChartRidgelineDatum as ae, type ChartRollingSeriesOptions as af, type ChartRollingStatistic as ag, type ChartSampleValueAccessor as ah, type ChartScatterPoint as ai, type ChartScatterQuery as aj, type ChartScatterSeries as ak, type ChartSeriesPoint as al, type ChartSunburstNode as am, type ChartThresholdAnnotation as an, type ChartTreeNode as ao, type ChartTreemapNode as ap, type ChartValueMode as aq, type ChartValueModeDefinition as ar, type ChartValueModeRenderer as as, type ChartWaterfallDatum as at, type ChartWaterfallRow as au, type IndexedChartSeriesPoint as av, type ProgressiveChartDensityIndex as aw, createCumulativeChartSeries as ax, createDeltaChartSeries as ay, createRollingChartSeries as az, type ChartBackendCapabilities as b, type ChartBandBoundary as c, type ChartBandRenderDatum as d, type ChartBoxPlotDatum as e, type ChartCalendarHeatmapData as f, type ChartCalendarHeatmapDatum as g, type ChartCirclePackNode as h, type ChartDeltaSeriesOptions as i, type ChartDensityBackend as j, type ChartDensityBackendPolicy as k, type ChartDensityBackendPolicyInput as l, type ChartDensityBin as m, type ChartDensityCacheOptions as n, type ChartDensityIndex as o, type ChartDensityIndexOptions as p, type ChartDensityPreparationMode as q, type ChartDensityProgressiveOptions as r, type ChartDensityProgressiveStatus as s, type ChartDensityQuery as t, type ChartDensitySample as u, type ChartDensitySeries as v, type ChartDensitySummary as w, type ChartDensityViewportSummary as x, type ChartDensityWarmupScheduler as y, type ChartDensityWorkerIndex as z };
```

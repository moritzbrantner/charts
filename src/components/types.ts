import { type ChartContainer, type ChartConfig } from "../internal/ui-primitives";

import type { ChartAnomalyAnnotation, ChartThresholdAnnotation } from "../analytics";
import type {
  ChartBoxPlotDatum,
  ChartCalendarHeatmapData,
  ChartCalendarHeatmapDatum,
  ChartCirclePackNode,
  ChartDensityIndex,
  ChartDensityProgressiveStatus,
  ChartDensityQuery,
  ChartDensitySample,
  ChartDensitySeries,
  ChartFlameGraphNode,
  ChartFunnelRow,
  ChartHeatmapCell,
  ChartIcicleNode,
  ChartIndentedTreeNode,
  ChartRadialTreeNode,
  ChartRenderData,
  ChartRenderDataOptions,
  ChartRidgelineData,
  ChartRidgelineDatum,
  ChartScatterSeries,
  ChartSunburstNode,
  ChartTreeNode,
  ChartTreemapNode,
  ChartValueMode,
  ChartValueModeDefinition,
  ChartWaterfallRow,
} from "../density";
import type {
  ChartLabelAnnotation,
  ChartLabelLayoutOptions,
  ChartLabelObstacle,
  ChartPlacedLabel,
} from "../labels";
import type {
  ComponentProps,
  MouseEvent,
  MouseEventHandler,
  PointerEventHandler,
  ReactNode,
  WheelEventHandler,
} from "react";

export type ChartRange = {
  description?: string;
  domain: [number, number];
  id: string;
  label: string;
};

export type ChartAxisRange = [number, number] | null;

export type ChartAxisScale = "linear" | "log" | "sqrt" | "symlog";

export type ChartAxisOrientation = "vertical" | "horizontal";

export type ChartAxisTransform = {
  domain: ChartAxisRange;
  scale: ChartAxisScale;
};

export type ChartAxesTransform = {
  orientation: ChartAxisOrientation;
  x: ChartAxisTransform;
  y: ChartAxisTransform;
};

export type ChartAxisTransformStatus = {
  message: string | null;
  renderScale: ChartAxisScale;
  valid: boolean;
};

export type ChartAnimationMode = "none" | "draw" | "rescale" | "draw-and-rescale";

export type ChartAnimationOptions = {
  durationMs?: number;
  enabled?: boolean;
  easing?: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
  mode?: ChartAnimationMode;
  respectReducedMotion?: boolean;
};

export type ChartPlaybackState = {
  playing: boolean;
  progress: number;
};

export type MeasuredChartSeries<TProperties = Record<string, unknown>> = {
  queryMs: number;
  series: ChartDensitySeries<TProperties>;
};

export type ChartMetricCardProps = {
  className?: string;
  hint?: ReactNode;
  label: ReactNode;
  value: ReactNode;
};

export type ChartMetricStripProps = {
  className?: string;
  label: ReactNode;
  value: ReactNode;
};

export type ChartDerivedMetricCardProps = {
  className?: string;
  formatValue?: (value: number | null) => ReactNode;
  label: ReactNode;
  previousValue?: number | null;
  value: number | null;
};

export type ChartPanelProps = {
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  title: ReactNode;
};

export type ChartLegendItem = {
  color?: string;
  description?: ReactNode;
  disabled?: boolean;
  id: string;
  label: ReactNode;
  meta?: ReactNode;
};

export type ChartSeriesLegendProps = {
  "aria-label"?: string;
  className?: string;
  hiddenIds?: readonly string[];
  items: readonly ChartLegendItem[];
  onHiddenIdsChange?: (hiddenIds: string[]) => void;
  orientation?: "horizontal" | "vertical";
  showCounts?: boolean;
};

export type ChartYAxisRangeMenuProps = {
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

export type ChartAxisTransformMenuProps = {
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

export type ChartWithLegendProps = {
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

export type BinnedChartRenderContext<TProperties = Record<string, unknown>> = {
  isAutoBinCount: boolean;
  renderData: ChartRenderData<TProperties>;
  rows: ChartRenderData<TProperties>["rows"];
  series: ChartDensitySeries<TProperties>;
  targetBinCount: number;
  width: number | null;
};

export type BinnedChartProps<TProperties = Record<string, unknown>> = {
  binCountOptions?: UseChartBinCountOptions;
  chartClassName?: string;
  children: (
    context: BinnedChartRenderContext<TProperties>,
  ) => ComponentProps<typeof ChartContainer>["children"];
  className?: string;
  config: ChartConfig;
  drag?: boolean;
  dragOptions?: Omit<
    UseChartDragDomainOptions,
    "disabled" | "domain" | "fullDomain" | "minSpan" | "onDomainChange"
  > & {
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
  wheelOptions?: Omit<
    UseChartWheelDomainOptions,
    "disabled" | "domain" | "fullDomain" | "minSpan" | "onDomainChange"
  > & {
    disabled?: boolean;
  };
};

export type ChartDataLabelAnnotation<TPayload = unknown> = Omit<
  ChartLabelAnnotation<TPayload>,
  "anchor"
> & {
  x: number | string;
  y: number | string;
};

export type ChartDataLabelObstacle = {
  height?: number;
  id?: string;
  kind?: "mark" | "axis" | "custom";
  priority?: number;
  radius?: number;
  width?: number;
  x: number | string;
  y: number | string;
};

export type ChartLabelOverlayProps<TPayload = unknown> = Omit<
  ChartLabelLayoutOptions,
  "boundary" | "obstacles"
> & {
  className?: string;
  labels: readonly ChartDataLabelAnnotation<TPayload>[];
  obstacles?: readonly ChartDataLabelObstacle[];
  pixelObstacles?: readonly ChartLabelObstacle[];
  renderLabel?: (label: ChartPlacedLabel<TPayload>) => ReactNode;
  xAxisId?: string | number;
  yAxisId?: string | number;
};

export type ChartRangeSelectorProps = {
  "aria-label"?: string;
  className?: string;
  formatDomain?: (domain: [number, number]) => string;
  onValueChange: (rangeId: string) => void;
  ranges: ChartRange[];
  value: string;
};

export type ChartValueModeSelectorProps = {
  "aria-label"?: string;
  className?: string;
  definitions?: readonly ChartValueModeDefinition[];
  onValueChange: (mode: ChartValueMode) => void;
  value: ChartValueMode;
};

export type ChartBackendStatusProps = {
  className?: string;
  formatError?: (error: unknown) => string;
  onWarmNow?: () => void | Promise<void>;
  progress?: number;
  status: ChartDensityProgressiveStatus;
  warmLabel?: string;
};

export type ChartSampleSparklineProps<TProperties = Record<string, unknown>> = {
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

export type ChartSampleInteraction<TProperties = Record<string, unknown>> = {
  clientX: number;
  clientY: number;
  domainValue: number;
  sample: ChartDensitySample<TProperties>;
};

export type ChartSampleInteractionOverlayProps<TProperties = Record<string, unknown>> = {
  ariaLabel?: string;
  className?: string;
  domain: [number, number];
  formatSampleLabel?: (sample: ChartDensitySample<TProperties>) => string;
  isSampleSelectable?: (sample: ChartDensitySample<TProperties>) => boolean;
  orientation?: ChartAxisOrientation;
  onSampleContextMenu?: (
    interaction: ChartSampleInteraction<TProperties>,
    event: MouseEvent<SVGRectElement>,
  ) => void;
  onSampleHover?: (interaction: ChartSampleInteraction<TProperties> | null) => void;
  onSampleSelect?: (interaction: ChartSampleInteraction<TProperties>) => void;
  samples: Array<ChartDensitySample<TProperties>>;
  selectedSampleIndex?: number | null;
};

export type ChartDomainMinimapProps<TProperties = Record<string, unknown>> = {
  ariaLabel?: string;
  className?: string;
  domain: [number, number];
  formatDomainValue?: (value: number) => string;
  fullDomain: [number, number];
  minSpan?: number;
  onDomainChange: (domain: [number, number]) => void;
  samples: Array<ChartDensitySample<TProperties>>;
};

export type ChartHotBinRowProps<TProperties = Record<string, unknown>> = {
  className?: string;
  formatMetric?: (metricKey: string, value: number) => ReactNode;
  formatX?: (value: number) => string;
  sample: ChartDensitySample<TProperties>;
};

export type ChartThresholdMarkerProps<TProperties = Record<string, unknown>> = {
  annotations: Array<ChartThresholdAnnotation<TProperties>>;
  className?: string;
  formatLabel?: (annotation: ChartThresholdAnnotation<TProperties>) => string;
};

export type ChartAnomalyMarkerListProps<TProperties = Record<string, unknown>> = {
  anomalies: Array<ChartAnomalyAnnotation<TProperties>>;
  className?: string;
  formatValue?: (value: number) => ReactNode;
  onSelect?: (anomaly: ChartAnomalyAnnotation<TProperties>) => void;
};

export type ChartSvgAxisOptions = {
  formatValue?: (value: number) => string;
  label?: string;
  tickCount?: number;
  visible?: boolean;
};

export type ChartSvgLegendItem = {
  color?: string;
  label: ReactNode;
  value?: ReactNode;
};

export type ChartHeatmapGridProps<TProperties = Record<string, unknown>> = {
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

export type ChartCalendarHeatmapSvgProps<TProperties = Record<string, unknown>> = {
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

export type ChartRidgelineSvgProps<TProperties = Record<string, unknown>> = {
  ariaLabel?: string;
  className?: string;
  data: ChartRidgelineData<TProperties> | Array<ChartRidgelineDatum<TProperties>>;
  formatValue?: (value: number) => string;
  legend?: ReactNode | readonly ChartSvgLegendItem[];
  onGroupSelect?: (group: ChartRidgelineDatum<TProperties>) => void;
  showGroupLabels?: boolean;
  xAxis?: ChartSvgAxisOptions | false;
};

export type ChartBoxPlotSvgProps<TProperties = Record<string, unknown>> = {
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

export type ChartScatterSvgProps<TProperties = Record<string, unknown>> = {
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

export type ChartWaterfallSvgProps = {
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

export type ChartFunnelSvgProps = {
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

export type ChartTreemapSvgProps<TPayload = unknown> = {
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

export type ChartSunburstSvgProps<TPayload = unknown> = {
  ariaLabel?: string;
  className?: string;
  data: Array<ChartSunburstNode<TPayload>>;
  formatValue?: (value: number) => string;
  height?: number;
  onNodeSelect?: (node: ChartSunburstNode<TPayload>) => void;
  width?: number;
};

export type ChartIcicleSvgProps<TPayload = unknown> = {
  ariaLabel?: string;
  className?: string;
  data: Array<ChartIcicleNode<TPayload>>;
  formatValue?: (value: number) => string;
  onNodeSelect?: (node: ChartIcicleNode<TPayload>) => void;
  showNodeLabels?: boolean;
};

export type ChartFlameGraphSvgProps<TPayload = unknown> = {
  ariaLabel?: string;
  className?: string;
  data: Array<ChartFlameGraphNode<TPayload>>;
  formatValue?: (value: number) => string;
  onNodeSelect?: (node: ChartFlameGraphNode<TPayload>) => void;
  showNodeLabels?: boolean;
};

export type ChartCirclePackSvgProps<TPayload = unknown> = {
  ariaLabel?: string;
  className?: string;
  data: Array<ChartCirclePackNode<TPayload>>;
  formatValue?: (value: number) => string;
  height?: number;
  onNodeSelect?: (node: ChartCirclePackNode<TPayload>) => void;
  showNodeLabels?: boolean;
  width?: number;
};

export type ChartRadialTreeSvgProps<TPayload = unknown> = {
  ariaLabel?: string;
  className?: string;
  data: Array<ChartRadialTreeNode<TPayload>>;
  formatValue?: (value: number) => string;
  height?: number;
  onNodeSelect?: (node: ChartRadialTreeNode<TPayload>) => void;
  showNodeLabels?: boolean;
  width?: number;
};

export type ChartIndentedTreeSvgProps<TPayload = unknown> = {
  ariaLabel?: string;
  className?: string;
  data: Array<ChartIndentedTreeNode<TPayload>>;
  formatValue?: (value: number) => string;
  onNodeSelect?: (node: ChartIndentedTreeNode<TPayload>) => void;
  showValueBars?: boolean;
};

export type ChartTreeSvgProps<TPayload = unknown> = {
  ariaLabel?: string;
  className?: string;
  data: Array<ChartTreeNode<TPayload>>;
  formatValue?: (value: number) => string;
  height?: number;
  onNodeSelect?: (node: ChartTreeNode<TPayload>) => void;
  showNodeLabels?: boolean;
  width?: number;
};

export type ChartXAxisNavigationMenuProps = {
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

export type ChartValueModePreviewProps<TProperties = Record<string, unknown>> = {
  active?: boolean;
  className?: string;
  definition: ChartValueModeDefinition;
  measured: MeasuredChartSeries<TProperties>;
  onSelect?: () => void;
};

export type UseChartBinCountOptions = {
  defaultBinCount?: number;
  maxBinCount?: number;
  minBinCount?: number;
  pixelsPerBin?: number;
  step?: number;
};

export type UseChartBinCountResult<TElement extends Element = HTMLDivElement> = {
  containerRef: (node: TElement | null) => void;
  isAuto: boolean;
  resetAuto: () => void;
  setManualBinCount: (value: number) => void;
  targetBinCount: number;
  width: number | null;
};

export type UseChartWheelDomainOptions = {
  disabled?: boolean;
  domain: [number, number];
  fullDomain: [number, number];
  minSpan?: number;
  onDomainChange: (domain: [number, number]) => void;
  scrollScale?: number;
  zoomScale?: number;
};

export type UseChartWheelDomainResult<TElement extends Element = HTMLElement> = {
  containerRef: (node: TElement | null) => void;
  onWheel: WheelEventHandler<TElement>;
};

export type ChartDomainDragSelection = {
  left: number;
  width: number;
};

export type ChartDomainDragUpdateMode = "preview" | "live";

export type ChartDomainDragPreview = {
  domain: [number, number];
  offsetPx: number;
};

export type UseChartDragDomainOptions = {
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

export type UseChartDragDomainResult<TElement extends Element = HTMLElement> = {
  containerRef: (node: TElement | null) => void;
  isDragging: boolean;
  onDoubleClick: MouseEventHandler<TElement>;
  onPointerCancel: PointerEventHandler<TElement>;
  onPointerDown: PointerEventHandler<TElement>;
  onPointerMove: PointerEventHandler<TElement>;
  onPointerUp: PointerEventHandler<TElement>;
  selection: ChartDomainDragSelection | null;
};

export type UseChartSeriesVisibilityOptions = {
  defaultHiddenIds?: readonly string[];
  hiddenIds?: readonly string[];
  itemIds: readonly string[];
  minVisible?: number;
  onHiddenIdsChange?: (hiddenIds: string[]) => void;
};

export type UseChartSeriesVisibilityResult = {
  hiddenIds: string[];
  isVisible: (id: string) => boolean;
  setHiddenIds: (hiddenIds: readonly string[]) => void;
  showAll: () => void;
  toggle: (id: string) => void;
  visibleIds: string[];
};

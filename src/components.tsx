import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  Checkbox,
  type ChartConfig,
  Input,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Progress,
  ToggleGroup,
  ToggleGroupItem,
} from "@moritzbrantner/ui";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type JSX,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type WheelEvent,
  type WheelEventHandler,
} from "react";
import { createPortal } from "react-dom";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
} from "recharts";

import {
  CHART_VALUE_MODE_DEFINITIONS,
  createChartRenderData,
  createProgressiveChartDensityIndex,
  type ChartDensityIndex,
  type ChartDensityIndexOptions,
  type ChartDensityProgressiveStatus,
  type ChartDensityQuery,
  type ChartDensitySample,
  type ChartDensitySeries,
  type ChartBoxPlotDatum,
  type ChartHeatmapCell,
  type ChartSeriesPoint,
  type ChartRenderData,
  type ChartRenderDataOptions,
  type ChartValueMode,
  type ChartValueModeDefinition,
  type ProgressiveChartDensityIndex,
} from "./density";
import {
  layoutChartLabels,
  type ChartLabelAnnotation,
  type ChartLabelLayoutOptions,
  type ChartLabelObstacle,
  type ChartPlacedLabel,
} from "./labels";

import type { ChartAnomalyAnnotation, ChartThresholdAnnotation } from "./analytics";

export type ChartRange = {
  description?: string;
  domain: [number, number];
  id: string;
  label: string;
};

export type ChartAxisRange = [number, number] | null;

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

export type ChartWithLegendProps = {
  children: ReactNode;
  className?: string;
  legend: ReactNode;
  legendSide?: "left" | "right";
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

export type ChartHeatmapGridProps<TProperties = Record<string, unknown>> = {
  ariaLabel?: string;
  cells: Array<ChartHeatmapCell<TProperties>>;
  className?: string;
  formatValue?: (cell: ChartHeatmapCell<TProperties>) => string;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  onCellSelect?: (cell: ChartHeatmapCell<TProperties>) => void;
};

export type ChartBoxPlotSvgProps<TProperties = Record<string, unknown>> = {
  ariaLabel?: string;
  className?: string;
  data: Array<ChartBoxPlotDatum<TProperties>>;
  formatValue?: (value: number | null) => string;
  onDatumSelect?: (datum: ChartBoxPlotDatum<TProperties>) => void;
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

type ChartWheelEvent = Pick<
  globalThis.WheelEvent,
  | "clientX"
  | "ctrlKey"
  | "deltaMode"
  | "deltaX"
  | "deltaY"
  | "metaKey"
  | "preventDefault"
  | "shiftKey"
>;

type ChartDomainMinimapDragState =
  | {
      anchorValue: number;
      bounds: ChartDomainPointerBounds;
      mode: "select";
    }
  | {
      bounds: ChartDomainPointerBounds;
      mode: "pan";
      startDomain: [number, number];
      startValue: number;
    }
  | {
      bounds: ChartDomainPointerBounds;
      mode: "resize-left" | "resize-right";
      startDomain: [number, number];
    };

type ChartDomainPointerBounds = {
  left: number;
  width: number;
};

export function ChartPanel({
  badge,
  children,
  className,
  description,
  title,
}: ChartPanelProps): JSX.Element {
  return (
    <Card className={joinClassNames("rounded-none border-border/60 bg-background/80", className)}>
      <CardHeader>
        {badge ? (
          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
            {badge}
          </Badge>
        ) : null}
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ChartMetricCard({
  className,
  hint,
  label,
  value,
}: ChartMetricCardProps): JSX.Element {
  return (
    <Card
      className={joinClassNames(
        "rounded-none border-border/60 bg-background/80 shadow-lg shadow-black/5",
        className,
      )}
    >
      <CardContent className="space-y-2 p-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {hint ? <p className="text-sm leading-6 text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function ChartMetricStrip({ className, label, value }: ChartMetricStripProps): JSX.Element {
  return (
    <Item variant="muted" className={joinClassNames("items-start bg-muted/20 p-4", className)}>
      <ItemContent>
        <ItemDescription className="text-xs uppercase tracking-[0.18em]">{label}</ItemDescription>
        <ItemTitle className="mt-1 text-lg font-semibold">{value}</ItemTitle>
      </ItemContent>
    </Item>
  );
}

export function ChartDerivedMetricCard({
  className,
  formatValue = formatNullableNumber,
  label,
  previousValue = null,
  value,
}: ChartDerivedMetricCardProps): JSX.Element {
  const delta = value === null || previousValue === null ? null : value - previousValue;
  const percentDelta =
    delta === null || previousValue === null || previousValue === 0
      ? null
      : (delta / Math.abs(previousValue)) * 100;
  const deltaPrefix = delta !== null && delta > 0 ? "+" : "";
  const percentPrefix = percentDelta !== null && percentDelta > 0 ? "+" : "";

  return (
    <ChartMetricCard
      className={className}
      label={label}
      value={formatValue(value)}
      hint={
        delta === null ? (
          "No comparison value"
        ) : (
          <>
            {deltaPrefix}
            {formatCompactNumber(delta)}{" "}
            {percentDelta === null ? null : (
              <>
                ({percentPrefix}
                {percentDelta.toFixed(1)}%)
              </>
            )}
          </>
        )
      }
    />
  );
}

export function ChartSeriesLegend({
  "aria-label": ariaLabel = "Chart series legend",
  className,
  hiddenIds,
  items,
  onHiddenIdsChange,
  orientation = "vertical",
  showCounts = true,
}: ChartSeriesLegendProps): JSX.Element {
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const visibility = useChartSeriesVisibility({
    hiddenIds,
    itemIds,
    onHiddenIdsChange,
  });

  return (
    <div
      aria-label={ariaLabel}
      className={joinClassNames(
        orientation === "horizontal" ? "flex flex-wrap gap-2" : "grid gap-2",
        className,
      )}
      role="group"
    >
      {items.map((item) => {
        const visible = visibility.isVisible(item.id);

        return (
          <label
            key={item.id}
            className={joinClassNames(
              "flex cursor-pointer items-start gap-3 border border-border/60 bg-muted/20 px-3 py-2 text-sm transition hover:border-primary/50",
              item.disabled ? "cursor-not-allowed opacity-60" : null,
              orientation === "horizontal" ? "min-w-40 flex-1" : null,
            )}
          >
            <Checkbox
              checked={visible}
              disabled={item.disabled}
              onCheckedChange={() => visibility.toggle(item.id)}
              aria-label={typeof item.label === "string" ? item.label : undefined}
              className="mt-0.5"
            />
            <span
              aria-hidden="true"
              className="mt-1 h-3 w-3 shrink-0 border border-border/60"
              style={{ backgroundColor: item.color ?? "var(--muted-foreground)" }}
            />
            <span className="grid min-w-0 flex-1 gap-1">
              <span className="flex min-w-0 items-start justify-between gap-3">
                <span className="min-w-0 font-medium text-foreground">{item.label}</span>
                {showCounts && item.meta ? (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {item.meta}
                  </span>
                ) : null}
              </span>
              {item.description ? (
                <span className="text-xs leading-5 text-muted-foreground">{item.description}</span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function ChartWithLegend({
  children,
  className,
  legend,
  legendSide = "right",
  legendWidthClassName = "lg:w-64",
}: ChartWithLegendProps): JSX.Element {
  const chart = (
    <div
      key="chart"
      className={joinClassNames("min-w-0 flex-1", legendSide === "left" ? "lg:order-2" : null)}
    >
      {children}
    </div>
  );
  const legendNode = (
    <div
      key="legend"
      className={joinClassNames(
        "min-w-0 shrink-0",
        legendWidthClassName,
        legendSide === "left" ? "lg:order-1" : null,
      )}
    >
      {legend}
    </div>
  );

  return (
    <div
      className={joinClassNames("flex flex-col gap-4 lg:flex-row", className)}
      data-chart-legend-side={legendSide}
    >
      {legendSide === "left" ? [legendNode, chart] : [chart, legendNode]}
    </div>
  );
}

export function BinnedChart<TProperties = Record<string, unknown>>({
  binCountOptions,
  chartClassName,
  children,
  className,
  config,
  domain,
  formatDomainValue = formatCompactNumber,
  fullDomain,
  index,
  minSpan,
  minimap = true,
  minimapClassName,
  minimapTargetBinCount = 180,
  onDomainChange,
  query,
  renderDataOptions,
  valueMode = "average",
  wheel = true,
  wheelOptions,
}: BinnedChartProps<TProperties>): JSX.Element {
  const {
    containerRef: binCountContainerRef,
    isAuto,
    targetBinCount,
    width,
  } = useChartBinCount<HTMLDivElement>(binCountOptions);
  const resolvedFullDomain = fullDomain ?? domain;
  const handleDomainChange = onDomainChange ?? noopDomainChange;
  const { containerRef: wheelContainerRef, onWheel } = useChartWheelDomain<HTMLDivElement>({
    ...wheelOptions,
    disabled: !onDomainChange || !wheel || wheelOptions?.disabled,
    domain,
    fullDomain: resolvedFullDomain,
    minSpan,
    onDomainChange: handleDomainChange,
  });
  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      binCountContainerRef(node);
      wheelContainerRef(node);
    },
    [binCountContainerRef, wheelContainerRef],
  );
  const series = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        ...query,
        targetBinCount,
        valueMode,
        xDomain: domain,
      }),
    [domain, index, query, targetBinCount, valueMode],
  );
  const renderData = useMemo(
    () => createChartRenderData(series.samples, renderDataOptions),
    [renderDataOptions, series.samples],
  );
  const minimapSeries = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        ...query,
        targetBinCount: minimapTargetBinCount,
        valueMode,
        xDomain: resolvedFullDomain,
      }),
    [index, minimapTargetBinCount, query, resolvedFullDomain, valueMode],
  );
  const context = useMemo(
    (): BinnedChartRenderContext<TProperties> => ({
      isAutoBinCount: isAuto,
      renderData,
      rows: renderData.rows,
      series,
      targetBinCount,
      width,
    }),
    [isAuto, renderData, series, targetBinCount, width],
  );
  const showMinimap = minimap && Boolean(onDomainChange);

  return (
    <div ref={containerRef} className={joinClassNames("grid gap-3", className)} onWheel={onWheel}>
      <ChartContainer className={chartClassName} config={config}>
        {children(context)}
      </ChartContainer>
      {showMinimap ? (
        <ChartDomainMinimap
          className={minimapClassName}
          domain={domain}
          fullDomain={resolvedFullDomain}
          samples={minimapSeries.samples}
          formatDomainValue={formatDomainValue}
          minSpan={minSpan}
          onDomainChange={handleDomainChange}
        />
      ) : null}
    </div>
  );
}

export function ChartLabelOverlay<TPayload = unknown>({
  boundaryPadding,
  className,
  collisionPadding,
  font,
  labels,
  leaderLine,
  lineHeight = 16,
  maxWidth,
  obstacles = [],
  offset,
  padding = 4,
  pixelObstacles = [],
  renderLabel,
  xAxisId,
  yAxisId,
}: ChartLabelOverlayProps<TPayload>): JSX.Element | null {
  const plotArea = usePlotArea();
  const xScale = useXAxisScale(xAxisId);
  const yScale = useYAxisScale(yAxisId);
  const placedLabels = useMemo(() => {
    if (!plotArea || !xScale || !yScale) {
      return [];
    }

    const pixelLabels = labels
      .map((label): ChartLabelAnnotation<TPayload> | null => {
        const x = xScale(label.x, { position: "middle" });
        const y = yScale(label.y);

        if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
          return null;
        }

        const { x: _x, y: _y, ...annotation } = label;

        return {
          ...annotation,
          anchor: { x, y },
        };
      })
      .filter((label): label is ChartLabelAnnotation<TPayload> => label !== null);
    const dataObstacles = obstacles
      .map((obstacle): ChartLabelObstacle | null => {
        const x = xScale(obstacle.x, { position: "middle" });
        const y = yScale(obstacle.y);

        if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
          return null;
        }

        const radius = obstacle.radius ?? 4;
        const width = obstacle.width ?? radius * 2;
        const height = obstacle.height ?? radius * 2;

        return {
          id: obstacle.id,
          kind: obstacle.kind,
          priority: obstacle.priority,
          rect: {
            height,
            width,
            x: x - width / 2,
            y: y - height / 2,
          },
        };
      })
      .filter((obstacle): obstacle is ChartLabelObstacle => obstacle !== null);

    return layoutChartLabels(pixelLabels, {
      boundary: {
        height: plotArea.height,
        width: plotArea.width,
        x: plotArea.x,
        y: plotArea.y,
      },
      boundaryPadding,
      collisionPadding,
      font,
      leaderLine,
      lineHeight,
      maxWidth,
      obstacles: [...dataObstacles, ...pixelObstacles],
      offset,
      padding,
    });
  }, [
    boundaryPadding,
    collisionPadding,
    font,
    labels,
    leaderLine,
    lineHeight,
    maxWidth,
    obstacles,
    offset,
    padding,
    pixelObstacles,
    plotArea,
    xScale,
    yScale,
  ]);

  if (!plotArea || !xScale || !yScale) {
    return null;
  }

  return (
    <g className={className} pointerEvents="none">
      {placedLabels.map((label) => {
        if (label.hidden || !label.rect) {
          return null;
        }

        return (
          <g key={label.id} data-chart-label-id={label.id}>
            {label.leaderLine ? (
              <line
                x1={label.leaderLine.x1}
                x2={label.leaderLine.x2}
                y1={label.leaderLine.y1}
                y2={label.leaderLine.y2}
                stroke="var(--muted-foreground)"
                strokeOpacity="0.55"
                strokeWidth="1"
              />
            ) : null}
            {renderLabel ? renderLabel(label) : renderDefaultChartLabel(label, padding, lineHeight)}
          </g>
        );
      })}
    </g>
  );
}

export function ChartYAxisRangeMenu({
  "aria-label": ariaLabel = "Y-axis range menu",
  axisWidth = 60,
  className,
  dataDomain = null,
  formatValue = formatCompactNumber,
  hiddenIds,
  legendItems = [],
  minSpan,
  onHiddenIdsChange,
  onValueChange,
  orientation = "left",
  value,
}: ChartYAxisRangeMenuProps): JSX.Element | null {
  const plotArea = usePlotArea();
  const minInputId = useId();
  const maxInputId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const open = menuPosition !== null;
  const resolvedAxisWidth = Math.max(1, axisWidth);
  const triggerX =
    orientation === "right"
      ? (plotArea?.x ?? 0) + (plotArea?.width ?? 0)
      : Math.max(0, (plotArea?.x ?? 0) - resolvedAxisWidth);
  const activeDomain = value ?? dataDomain;

  const resetInputs = useCallback(() => {
    const nextDomain = value ?? dataDomain;

    setMinInput(nextDomain ? String(nextDomain[0]) : "");
    setMaxInput(nextDomain ? String(nextDomain[1]) : "");
    setError(null);
  }, [dataDomain, value]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      const menu = menuRef.current;

      if (menu && event.target instanceof Node && menu.contains(event.target)) {
        return;
      }

      setMenuPosition(null);
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuPosition(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      menuRef.current?.focus();
    }
  }, [open]);

  if (!plotArea) {
    return null;
  }

  const handleContextMenu = (event: MouseEvent<SVGRectElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resetInputs();
    setMenuPosition({ x: event.clientX, y: event.clientY });
  };
  const handleApply = () => {
    const nextMin = Number(minInput);
    const nextMax = Number(maxInput);

    if (
      !minInput.trim() ||
      !maxInput.trim() ||
      !isFiniteNumber(nextMin) ||
      !isFiniteNumber(nextMax)
    ) {
      setError("Enter finite min and max values.");
      return;
    }

    if (nextMax <= nextMin) {
      setError("Max must be greater than min.");
      return;
    }

    if (minSpan !== undefined && nextMax - nextMin < minSpan) {
      setError(`Range must span at least ${formatValue(minSpan)}.`);
      return;
    }

    onValueChange([nextMin, nextMax]);
    setMenuPosition(null);
  };
  const handleAuto = () => {
    onValueChange(null);
    setMinInput(dataDomain ? String(dataDomain[0]) : "");
    setMaxInput(dataDomain ? String(dataDomain[1]) : "");
    setError(null);
    setMenuPosition(null);
  };
  const menu =
    open && typeof document !== "undefined" && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            aria-label={ariaLabel}
            className={joinClassNames(
              "fixed z-50 w-72 border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none",
              className,
            )}
            role="dialog"
            style={getChartAxisMenuStyle(menuPosition)}
            tabIndex={-1}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setMenuPosition(null);
              }
            }}
          >
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                handleApply();
              }}
            >
              <div className="grid gap-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Y-axis range</h3>
                  <span className="text-xs text-muted-foreground">{value ? "Manual" : "Auto"}</span>
                </div>
                {activeDomain ? (
                  <p className="text-xs text-muted-foreground">
                    {formatValue(activeDomain[0])} to {formatValue(activeDomain[1])}
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs font-medium" htmlFor={minInputId}>
                  Min
                  <Input
                    id={minInputId}
                    type="number"
                    value={minInput}
                    onChange={(event) => {
                      setMinInput(event.target.value);
                      setError(null);
                    }}
                  />
                </label>
                <label className="grid gap-1 text-xs font-medium" htmlFor={maxInputId}>
                  Max
                  <Input
                    id={maxInputId}
                    type="number"
                    value={maxInput}
                    onChange={(event) => {
                      setMaxInput(event.target.value);
                      setError(null);
                    }}
                  />
                </label>
              </div>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={handleAuto}>
                  Auto
                </Button>
                <Button type="submit" size="sm">
                  Apply
                </Button>
              </div>
            </form>
            {legendItems.length > 0 ? (
              <div className="mt-3 border-t border-border/60 pt-3">
                {onHiddenIdsChange ? (
                  <ChartSeriesLegend
                    aria-label="Y-axis series legend"
                    className="gap-1"
                    hiddenIds={hiddenIds}
                    items={legendItems}
                    onHiddenIdsChange={onHiddenIdsChange}
                    showCounts={false}
                  />
                ) : (
                  <ChartYAxisRangeLegendList items={legendItems} />
                )}
              </div>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <g className={className} data-chart-y-axis-range-menu="">
        <rect
          aria-label={ariaLabel}
          data-chart-y-axis-range-trigger=""
          x={triggerX}
          y={plotArea.y}
          width={resolvedAxisWidth}
          height={plotArea.height}
          fill="transparent"
          role="button"
          tabIndex={0}
          onContextMenu={handleContextMenu}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              const bounds = event.currentTarget.getBoundingClientRect();

              event.preventDefault();
              resetInputs();
              setMenuPosition({
                x: bounds.left + bounds.width / 2,
                y: bounds.top + bounds.height / 2,
              });
            }
          }}
        >
          <title>{ariaLabel}</title>
        </rect>
      </g>
      {menu}
    </>
  );
}

export function ChartRangeSelector({
  "aria-label": ariaLabel = "Chart range",
  className,
  formatDomain = formatDomainRange,
  onValueChange,
  ranges,
  value,
}: ChartRangeSelectorProps): JSX.Element {
  return (
    <div
      className={joinClassNames("space-y-3", className)}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {ranges.map((range) => {
        const active = range.id === value;

        return (
          <Button
            key={range.id}
            type="button"
            role="radio"
            variant="outline"
            aria-checked={active}
            className={joinClassNames(
              "h-auto w-full justify-start whitespace-normal rounded-none border p-4 text-left transition hover:border-primary/60",
              active ? "border-primary bg-primary/10" : "border-border/60 bg-muted/20",
            )}
            onClick={() => onValueChange(range.id)}
          >
            <span className="grid min-w-0 w-full gap-2">
              <span className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                <span className="font-medium">{range.label}</span>
                <span className="min-w-0 text-xs text-muted-foreground">
                  {formatDomain(range.domain)}
                </span>
              </span>
              {range.description ? (
                <span className="block text-sm leading-6 text-muted-foreground">
                  {range.description}
                </span>
              ) : null}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

export function ChartValueModeSelector({
  "aria-label": ariaLabel = "Chart value mode",
  className,
  definitions = CHART_VALUE_MODE_DEFINITIONS,
  onValueChange,
  value,
}: ChartValueModeSelectorProps): JSX.Element {
  return (
    <ToggleGroup
      type="single"
      value={value}
      aria-label={ariaLabel}
      className={joinClassNames("flex flex-wrap items-center gap-2", className)}
      onValueChange={(nextValue) => {
        if (nextValue) {
          onValueChange(nextValue as ChartValueMode);
        }
      }}
    >
      {definitions.map((definition) => (
        <ToggleGroupItem key={definition.id} value={definition.id} aria-label={definition.label}>
          {definition.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function ChartBackendStatus({
  className,
  formatError = formatUnknownError,
  onWarmNow,
  progress,
  status,
  warmLabel = "Warm WASM now",
}: ChartBackendStatusProps): JSX.Element {
  const stateLabel = status.wasmReady
    ? "ready"
    : status.isWarming
      ? "warming"
      : status.wasmError
        ? "fallback"
        : "scheduled";
  const progressValue = progress ?? (status.wasmReady ? 100 : status.isWarming ? 62 : 22);
  const warmDisabled = status.isWarming || status.wasmReady;

  return (
    <div className={joinClassNames("space-y-5", className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">{status.activeBackend}</span>
          <span className="text-muted-foreground">{stateLabel}</span>
        </div>
        <Progress aria-label="WASM backend warmup progress" value={progressValue} />
      </div>
      {status.wasmError ? (
        <p className="text-sm leading-6 text-muted-foreground">{formatError(status.wasmError)}</p>
      ) : null}
      {onWarmNow ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={warmDisabled}
          onClick={onWarmNow}
        >
          {warmLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function ChartSampleSparkline<TProperties = Record<string, unknown>>({
  ariaLabel = "Dense chart sparkline",
  className,
  domain,
  formatDomainValue = formatCompactNumber,
  formatSampleLabel = formatDefaultSampleLabel,
  formatValue = formatDefaultSampleValue,
  onSampleHover,
  onSampleSelect,
  samples,
  selectedSampleIndex = null,
}: ChartSampleSparklineProps<TProperties>): JSX.Element {
  const values = samples.filter((sample) => sample.y !== null);

  if (values.length === 0) {
    return (
      <div
        className={joinClassNames(
          "flex h-56 items-center justify-center border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        No chart samples in this viewport.
      </div>
    );
  }

  const minY = Math.min(...values.map((sample) => sample.y ?? 0));
  const maxY = Math.max(...values.map((sample) => sample.y ?? 0));
  const spread = Math.max(1, maxY - minY);
  const domainSpread = Math.max(1, domain[1] - domain[0]);
  const plottedSamples = values.map((sample) => {
    const x = ((sample.x - domain[0]) / domainSpread) * 100;
    const y = 92 - (((sample.y ?? minY) - minY) / spread) * 84;

    return {
      sample,
      x: clamp(x, 0, 100),
      y: clamp(y, 8, 92),
    };
  });
  const points = plottedSamples.map((point) => `${point.x},${point.y}`).join(" ");
  const gradientId = `charts-sparkline-fill-${hashString(points)}`;
  const selectedPoint = plottedSamples.find((point) => point.sample.index === selectedSampleIndex);
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!onSampleHover) {
      return;
    }

    onSampleHover(getNearestSample(event, plottedSamples));
  };
  const handleClick = (event: PointerEvent<SVGSVGElement>) => {
    if (!onSampleSelect) {
      return;
    }

    const sample = getNearestSample(event, plottedSamples);

    if (sample) {
      onSampleSelect(sample);
    }
  };

  return (
    <div
      className={joinClassNames(
        "relative overflow-hidden border border-border/60 bg-muted/20 p-4",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={ariaLabel}
        className="h-56 w-full"
        onClick={handleClick}
        onPointerLeave={() => onSampleHover?.(null)}
        onPointerMove={handlePointerMove}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polyline points={`0,96 ${points} 100,96`} fill={`url(#${gradientId})`} stroke="none" />
        <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="1.4" />
        {selectedPoint ? (
          <circle
            cx={selectedPoint.x}
            cy={selectedPoint.y}
            r="2.4"
            fill="var(--background)"
            stroke="var(--primary)"
            strokeWidth="1.4"
          />
        ) : null}
      </svg>
      <p className="sr-only">
        {ariaLabel}: {samples.length} samples from {formatDomainValue(domain[0])} to{" "}
        {formatDomainValue(domain[1])}. Values range from {formatCompactNumber(minY)} to{" "}
        {formatCompactNumber(maxY)}.
      </p>
      {onSampleSelect ? (
        <div className="sr-only">
          {values.map((sample) => (
            <Button
              key={sample.index}
              type="button"
              variant="ghost"
              className="sr-only"
              onClick={() => onSampleSelect(sample)}
            >
              {formatSampleLabel(sample)}: {formatValue(sample.y, sample)}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="absolute bottom-3 left-3 text-xs text-muted-foreground">
        {samples.length} samples from {formatDomainValue(domain[0])} to{" "}
        {formatDomainValue(domain[1])}
      </div>
    </div>
  );
}

export function ChartSampleInteractionOverlay<TProperties = Record<string, unknown>>({
  ariaLabel = "Chart sample interaction layer",
  className,
  domain,
  formatSampleLabel = formatDefaultSampleLabel,
  isSampleSelectable = isNonEmptyChartSample,
  onSampleContextMenu,
  onSampleHover,
  onSampleSelect,
  samples,
  selectedSampleIndex = null,
}: ChartSampleInteractionOverlayProps<TProperties>): JSX.Element | null {
  const plotArea = usePlotArea();

  if (!plotArea) {
    return null;
  }

  const domainSpan = Math.max(Number.EPSILON, domain[1] - domain[0]);
  const selectedSample =
    selectedSampleIndex === null
      ? null
      : (samples.find(
          (sample) => sample.index === selectedSampleIndex && isSampleSelectable(sample),
        ) ?? null);
  const createInteraction = (
    event: MouseEvent<SVGRectElement> | PointerEvent<SVGRectElement>,
  ): ChartSampleInteraction<TProperties> | null => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const domainValue = getDomainValueFromClientX(event.clientX, bounds, domain);
    const sample = getNearestChartSample(samples, domainValue, { isSampleSelectable });

    if (!sample) {
      return null;
    }

    return {
      clientX: event.clientX,
      clientY: event.clientY,
      domainValue,
      sample,
    };
  };
  const handleClick = (event: MouseEvent<SVGRectElement>) => {
    if (!onSampleSelect) {
      return;
    }

    const interaction = createInteraction(event);

    if (interaction) {
      onSampleSelect(interaction);
    }
  };
  const handleContextMenu = (event: MouseEvent<SVGRectElement>) => {
    if (!onSampleContextMenu) {
      return;
    }

    const interaction = createInteraction(event);

    if (interaction) {
      onSampleContextMenu(interaction, event);
    }
  };
  const handlePointerMove = (event: PointerEvent<SVGRectElement>) => {
    if (!onSampleHover) {
      return;
    }

    onSampleHover(createInteraction(event));
  };
  const selectedBand =
    selectedSample && domain[1] > domain[0]
      ? {
          left:
            plotArea.x +
            clamp(
              ((selectedSample.x0 - domain[0]) / domainSpan) * plotArea.width,
              0,
              plotArea.width,
            ),
          right:
            plotArea.x +
            clamp(
              ((selectedSample.x1 - domain[0]) / domainSpan) * plotArea.width,
              0,
              plotArea.width,
            ),
          x:
            plotArea.x +
            clamp(
              ((selectedSample.x - domain[0]) / domainSpan) * plotArea.width,
              0,
              plotArea.width,
            ),
        }
      : null;

  return (
    <g className={className} data-chart-sample-interaction-layer="">
      {selectedBand ? (
        <>
          <rect
            data-chart-sample-selected-band={selectedSample?.index}
            x={Math.min(selectedBand.left, selectedBand.right)}
            y={plotArea.y}
            width={Math.abs(selectedBand.right - selectedBand.left)}
            height={plotArea.height}
            fill="var(--primary)"
            fillOpacity="0.1"
            pointerEvents="none"
          />
          <line
            data-chart-sample-selected-line={selectedSample?.index}
            x1={selectedBand.x}
            x2={selectedBand.x}
            y1={plotArea.y}
            y2={plotArea.y + plotArea.height}
            stroke="var(--primary)"
            strokeOpacity="0.8"
            strokeWidth="1.2"
            pointerEvents="none"
          />
        </>
      ) : null}
      <rect
        data-chart-sample-interaction-overlay=""
        x={plotArea.x}
        y={plotArea.y}
        width={plotArea.width}
        height={plotArea.height}
        fill="transparent"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onPointerLeave={() => onSampleHover?.(null)}
        onPointerMove={handlePointerMove}
      >
        <title>{selectedSample ? formatSampleLabel(selectedSample) : ariaLabel}</title>
      </rect>
    </g>
  );
}

export function ChartDomainMinimap<TProperties = Record<string, unknown>>({
  ariaLabel = "Chart domain minimap",
  className,
  domain,
  formatDomainValue = formatCompactNumber,
  fullDomain,
  minSpan,
  onDomainChange,
  samples,
}: ChartDomainMinimapProps<TProperties>): JSX.Element {
  const dragStateRef = useRef<ChartDomainMinimapDragState | null>(null);
  const domainRef = useRef(domain);
  const fullDomainRef = useRef(fullDomain);
  const onDomainChangeRef = useRef(onDomainChange);
  const pendingDomainRef = useRef<[number, number] | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const [previewDomain, setPreviewDomain] = useState<[number, number] | null>(null);
  const values = useMemo(() => samples.filter((sample) => sample.y !== null), [samples]);
  const fullSpan = Math.max(1, fullDomain[1] - fullDomain[0]);
  const resolvedMinSpan = Math.max(minSpan ?? fullSpan / 100, fullSpan / 1000);
  const resolvedMinSpanRef = useRef(resolvedMinSpan);
  const visibleDomain = previewDomain ?? domain;
  const selectedLeft = clamp(((visibleDomain[0] - fullDomain[0]) / fullSpan) * 100, 0, 100);
  const selectedRight = clamp(((visibleDomain[1] - fullDomain[0]) / fullSpan) * 100, 0, 100);
  const selectedWidth = Math.max(0, selectedRight - selectedLeft);
  const { maxY, minY } = useMemo(() => getMinimapYBounds(values), [values]);
  const spread = useMemo(() => Math.max(1, maxY - minY), [maxY, minY]);
  const points = useMemo(
    () =>
      values
        .flatMap((sample, index) => {
          const y = 47 - (((sample.y ?? minY) - minY) / spread) * 40;
          const xValues = [
            ...(index === 0 ? [sample.x0] : []),
            sample.x,
            ...(index === values.length - 1 ? [sample.x1] : []),
          ];

          return xValues.map((xValue) => {
            const x = ((xValue - fullDomain[0]) / fullSpan) * 100;

            return `${clamp(x, 0, 100)},${clamp(y, 6, 47)}`;
          });
        })
        .join(" "),
    [fullDomain, fullSpan, minY, spread, values],
  );

  useEffect(() => {
    domainRef.current = domain;
    fullDomainRef.current = fullDomain;
    onDomainChangeRef.current = onDomainChange;
    resolvedMinSpanRef.current = resolvedMinSpan;
  }, [domain, fullDomain, onDomainChange, resolvedMinSpan]);

  const flushPendingDomain = useCallback(() => {
    if (frameIdRef.current !== null) {
      cancelFrame(frameIdRef.current);
      frameIdRef.current = null;
    }

    const pendingDomain = pendingDomainRef.current;

    if (!pendingDomain) {
      return;
    }

    pendingDomainRef.current = null;
    setPreviewDomain(null);

    if (!areDomainsEqual(pendingDomain, domainRef.current)) {
      domainRef.current = pendingDomain;
      onDomainChangeRef.current(pendingDomain);
    }
  }, []);
  const previewPendingDomain = useCallback(() => {
    if (frameIdRef.current !== null) {
      return;
    }

    frameIdRef.current = requestFrame(() => {
      frameIdRef.current = null;

      if (pendingDomainRef.current) {
        setPreviewDomain(pendingDomainRef.current);
      }
    });
  }, []);
  const stageDomainChange = useCallback(
    (nextDomain: [number, number]) => {
      const normalized = normalizeDomain(
        nextDomain,
        fullDomainRef.current,
        resolvedMinSpanRef.current,
      );
      const currentDomain = pendingDomainRef.current ?? domainRef.current;

      if (areDomainsEqual(normalized, currentDomain)) {
        return;
      }

      pendingDomainRef.current = normalized;
      previewPendingDomain();
    },
    [previewPendingDomain],
  );
  const stopDragging = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      dragStateRef.current = null;
      flushPendingDomain();
    },
    [flushPendingDomain],
  );

  useEffect(
    () => () => {
      if (frameIdRef.current !== null) {
        cancelFrame(frameIdRef.current);
      }

      frameIdRef.current = null;
    },
    [],
  );

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = getDomainPointerBounds(event.currentTarget);
    const value = getDomainValueFromClientX(event.clientX, bounds, fullDomain);
    const threshold = getDomainHandleThresholdFromBounds(bounds, fullDomain);

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    if (Math.abs(value - domain[0]) <= threshold) {
      dragStateRef.current = {
        bounds,
        mode: "resize-left",
        startDomain: domain,
      };

      return;
    }

    if (Math.abs(value - domain[1]) <= threshold) {
      dragStateRef.current = {
        bounds,
        mode: "resize-right",
        startDomain: domain,
      };

      return;
    }

    if (value >= domain[0] && value <= domain[1]) {
      dragStateRef.current = {
        bounds,
        mode: "pan",
        startDomain: domain,
        startValue: value,
      };

      return;
    }

    dragStateRef.current = {
      anchorValue: value,
      bounds,
      mode: "select",
    };
    stageDomainChange([value, value]);
  };
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState) {
      return;
    }

    const value = getDomainValueFromClientX(event.clientX, dragState.bounds, fullDomainRef.current);

    event.preventDefault();

    if (dragState.mode === "select") {
      stageDomainChange([dragState.anchorValue, value]);

      return;
    }

    if (dragState.mode === "pan") {
      const shift = value - dragState.startValue;

      stageDomainChange([dragState.startDomain[0] + shift, dragState.startDomain[1] + shift]);

      return;
    }

    if (dragState.mode === "resize-left") {
      stageDomainChange([
        Math.min(value, dragState.startDomain[1] - resolvedMinSpanRef.current),
        dragState.startDomain[1],
      ]);

      return;
    }

    stageDomainChange([
      dragState.startDomain[0],
      Math.max(value, dragState.startDomain[0] + resolvedMinSpanRef.current),
    ]);
  };

  return (
    <div
      className={joinClassNames(
        "relative overflow-hidden border border-border/60 bg-muted/20 p-3",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 52"
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        className="h-32 w-full touch-none select-none"
        onPointerCancel={stopDragging}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
      >
        <rect x="0" y="0" width="100" height="52" fill="transparent" />
        {points ? (
          <polyline
            points={points}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeOpacity="0.55"
            strokeWidth="1"
          />
        ) : null}
        <rect
          x="0"
          y="0"
          width={selectedLeft}
          height="52"
          fill="var(--background)"
          opacity="0.64"
        />
        <rect
          x={selectedRight}
          y="0"
          width={100 - selectedRight}
          height="52"
          fill="var(--background)"
          opacity="0.64"
        />
        <rect
          x={selectedLeft}
          y="3"
          width={selectedWidth}
          height="46"
          fill="var(--primary)"
          fillOpacity="0.14"
          stroke="var(--primary)"
          strokeWidth="0.8"
        />
        <line
          x1={selectedLeft}
          x2={selectedLeft}
          y1="3"
          y2="49"
          stroke="var(--primary)"
          strokeWidth="1.4"
        />
        <line
          x1={selectedRight}
          x2={selectedRight}
          y1="3"
          y2="49"
          stroke="var(--primary)"
          strokeWidth="1.4"
        />
      </svg>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{formatDomainValue(fullDomain[0])}</span>
        <span className="font-medium text-foreground">
          {formatDomainValue(domain[0])}-{formatDomainValue(domain[1])}
        </span>
        <span>{formatDomainValue(fullDomain[1])}</span>
      </div>
    </div>
  );
}

export function ChartHotBinRow<TProperties = Record<string, unknown>>({
  className,
  formatMetric = formatMetricValue,
  formatX = formatCompactNumber,
  sample,
}: ChartHotBinRowProps<TProperties>): JSX.Element {
  const primaryMetric = getPrimaryMetric(sample.metrics);

  return (
    <Item
      variant="muted"
      className={joinClassNames(
        "grid gap-3 bg-muted/20 p-4 text-sm md:grid-cols-[1fr_auto] md:items-center",
        className,
      )}
    >
      <div>
        <p className="font-medium">
          {formatX(sample.x0)}-{formatX(sample.x1)}
        </p>
        <p className="text-muted-foreground">
          {formatCompactNumber(sample.pointCount)} source points, average{" "}
          {formatNullableNumber(sample.averageY)}
        </p>
      </div>
      {primaryMetric ? (
        <div className="text-left md:text-right">
          <p>{formatMetric(primaryMetric[0], primaryMetric[1])}</p>
          <p className="text-muted-foreground">{primaryMetric[0]}</p>
        </div>
      ) : null}
    </Item>
  );
}

export function ChartThresholdMarker<TProperties = Record<string, unknown>>({
  annotations,
  className,
  formatLabel = formatThresholdAnnotationLabel,
}: ChartThresholdMarkerProps<TProperties>): JSX.Element {
  if (annotations.length === 0) {
    return (
      <div
        className={joinClassNames(
          "border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        No threshold ranges.
      </div>
    );
  }

  return (
    <div className={joinClassNames("grid gap-2", className)}>
      {annotations.map((annotation) => (
        <Item
          key={`${annotation.direction}-${annotation.startIndex}-${annotation.endIndex}`}
          variant="muted"
          className="bg-muted/20 p-3"
        >
          <ItemContent>
            <ItemTitle>{formatLabel(annotation)}</ItemTitle>
            <ItemDescription>
              {formatCompactNumber(annotation.sampleCount)} samples {annotation.direction}{" "}
              {formatCompactNumber(annotation.threshold)}
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </div>
  );
}

export function ChartAnomalyMarkerList<TProperties = Record<string, unknown>>({
  anomalies,
  className,
  formatValue = formatCompactNumber,
  onSelect,
}: ChartAnomalyMarkerListProps<TProperties>): JSX.Element {
  if (anomalies.length === 0) {
    return (
      <div
        className={joinClassNames(
          "border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        No anomalies detected.
      </div>
    );
  }

  return (
    <div className={joinClassNames("grid gap-2", className)}>
      {anomalies.map((anomaly) => {
        const content = (
          <>
            <ItemContent>
              <ItemTitle>Sample {anomaly.index}</ItemTitle>
              <ItemDescription>
                {formatValue(anomaly.value)} at score {anomaly.score.toFixed(2)}
              </ItemDescription>
            </ItemContent>
            <div className="text-right text-xs text-muted-foreground">
              x {formatCompactNumber(anomaly.x)}
            </div>
          </>
        );

        if (onSelect) {
          return (
            <Button
              key={anomaly.index}
              type="button"
              variant="outline"
              className="h-auto w-full justify-between rounded-none border-border/60 bg-muted/20 p-3 text-left"
              onClick={() => onSelect(anomaly)}
            >
              {content}
            </Button>
          );
        }

        return (
          <Item
            key={anomaly.index}
            variant="muted"
            className="grid grid-cols-[1fr_auto] gap-3 bg-muted/20 p-3"
          >
            {content}
          </Item>
        );
      })}
    </div>
  );
}

export function ChartHeatmapGrid<TProperties = Record<string, unknown>>({
  ariaLabel = "Chart heatmap",
  cells,
  className,
  formatValue = (cell) => `${formatCompactNumber(cell.pointCount)} points`,
  formatX = formatCompactNumber,
  formatY = formatCompactNumber,
  onCellSelect,
}: ChartHeatmapGridProps<TProperties>): JSX.Element {
  if (cells.length === 0) {
    return (
      <div
        className={joinClassNames(
          "flex h-56 items-center justify-center border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        No heatmap cells in this viewport.
      </div>
    );
  }

  const xBinCount = Math.max(...cells.map((cell) => cell.xIndex)) + 1;
  const yBinCount = Math.max(...cells.map((cell) => cell.yIndex)) + 1;
  const cellWidth = 100 / xBinCount;
  const cellHeight = 100 / yBinCount;

  return (
    <div className={joinClassNames("border border-border/60 bg-muted/20 p-3", className)}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        className="h-72 w-full"
      >
        {cells.map((cell) => {
          const x = cell.xIndex * cellWidth;
          const y = 100 - (cell.yIndex + 1) * cellHeight;
          const label = `${formatX(cell.x0)}-${formatX(cell.x1)}, ${formatY(cell.y0)}-${formatY(
            cell.y1,
          )}: ${formatValue(cell)}`;

          return (
            <rect
              key={cell.index}
              data-chart-heatmap-cell={cell.index}
              x={x}
              y={y}
              width={Math.max(0, cellWidth - 0.25)}
              height={Math.max(0, cellHeight - 0.25)}
              fill="var(--primary)"
              fillOpacity={0.08 + cell.value * 0.82}
              stroke="var(--background)"
              strokeWidth="0.15"
              aria-label={label}
              onClick={() => onCellSelect?.(cell)}
            >
              <title>{label}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}

export function ChartBoxPlotSvg<TProperties = Record<string, unknown>>({
  ariaLabel = "Chart box plot",
  className,
  data,
  formatValue = formatNullableNumber,
  onDatumSelect,
}: ChartBoxPlotSvgProps<TProperties>): JSX.Element {
  const valuedData = data.filter((datum) =>
    [datum.lowerWhisker, datum.upperWhisker, datum.q1, datum.q3, datum.median].some(
      (value) => value !== null,
    ),
  );

  if (valuedData.length === 0) {
    return (
      <div
        className={joinClassNames(
          "flex h-56 items-center justify-center border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        No box plot data in this viewport.
      </div>
    );
  }

  const allValues = valuedData.flatMap((datum) =>
    [datum.lowerWhisker, datum.upperWhisker, datum.q1, datum.q3, datum.median].filter(
      (value): value is number => value !== null,
    ),
  );
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const span = Math.max(1, maxValue - minValue);
  const xStep = 100 / Math.max(1, valuedData.length);
  const yForValue = (value: number | null) =>
    value === null ? null : 92 - ((value - minValue) / span) * 84;

  return (
    <div className={joinClassNames("border border-border/60 bg-muted/20 p-3", className)}>
      <svg viewBox="0 0 100 100" role="img" aria-label={ariaLabel} className="h-72 w-full">
        {valuedData.map((datum, datumIndex) => {
          const x = datumIndex * xStep + xStep / 2;
          const boxWidth = Math.max(1.5, Math.min(8, xStep * 0.42));
          const lowerWhiskerY = yForValue(datum.lowerWhisker);
          const upperWhiskerY = yForValue(datum.upperWhisker);
          const q1Y = yForValue(datum.q1);
          const q3Y = yForValue(datum.q3);
          const medianY = yForValue(datum.median);
          const boxTop = q3Y === null || q1Y === null ? null : Math.min(q3Y, q1Y);
          const boxHeight =
            q3Y === null || q1Y === null ? null : Math.max(0.75, Math.abs(q1Y - q3Y));
          const label = `${datum.label}: median ${formatValue(datum.median)}`;

          return (
            <g
              key={datum.index}
              data-chart-box-index={datum.index}
              aria-label={label}
              onClick={() => onDatumSelect?.(datum)}
            >
              <title>{label}</title>
              {lowerWhiskerY !== null && upperWhiskerY !== null ? (
                <line
                  x1={x}
                  x2={x}
                  y1={upperWhiskerY}
                  y2={lowerWhiskerY}
                  stroke="var(--muted-foreground)"
                  strokeWidth="0.7"
                />
              ) : null}
              {lowerWhiskerY !== null ? (
                <line
                  x1={x - boxWidth / 2}
                  x2={x + boxWidth / 2}
                  y1={lowerWhiskerY}
                  y2={lowerWhiskerY}
                  stroke="var(--muted-foreground)"
                  strokeWidth="0.7"
                />
              ) : null}
              {upperWhiskerY !== null ? (
                <line
                  x1={x - boxWidth / 2}
                  x2={x + boxWidth / 2}
                  y1={upperWhiskerY}
                  y2={upperWhiskerY}
                  stroke="var(--muted-foreground)"
                  strokeWidth="0.7"
                />
              ) : null}
              {boxTop !== null && boxHeight !== null ? (
                <rect
                  x={x - boxWidth / 2}
                  y={boxTop}
                  width={boxWidth}
                  height={boxHeight}
                  fill="var(--primary)"
                  fillOpacity="0.16"
                  stroke="var(--primary)"
                  strokeWidth="0.8"
                />
              ) : null}
              {medianY !== null ? (
                <line
                  x1={x - boxWidth / 2}
                  x2={x + boxWidth / 2}
                  y1={medianY}
                  y2={medianY}
                  stroke="var(--primary)"
                  strokeWidth="1"
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ChartValueModePreview<TProperties = Record<string, unknown>>({
  active = false,
  className,
  definition,
  measured,
  onSelect,
}: ChartValueModePreviewProps<TProperties>): JSX.Element {
  const data = createPreviewData(measured.series.samples);
  const previewConfig = {
    value: {
      color: definition.color,
      label: definition.axisLabel,
    },
  };
  const content = (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-medium">{definition.label}</span>
        <span className="text-xs text-muted-foreground">{measured.queryMs.toFixed(2)} ms</span>
      </div>
      <ChartContainer className="h-28 w-full" config={previewConfig}>
        {definition.renderer === "bar" ? (
          <BarChart data={data} margin={{ bottom: 0, left: 0, right: 0, top: 4 }}>
            <Bar dataKey="value" fill="var(--color-value)" radius={0} />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ bottom: 0, left: 0, right: 0, top: 4 }}>
            <Line
              dataKey="value"
              dot={false}
              isAnimationActive={false}
              stroke="var(--color-value)"
              strokeWidth={1.5}
              type="monotone"
            />
          </LineChart>
        )}
      </ChartContainer>
    </>
  );
  const previewClassName = joinClassNames(
    "h-auto w-full rounded-none border p-3 text-left transition hover:border-primary/60",
    active ? "border-primary bg-primary/10" : "border-border/60 bg-muted/20",
    className,
  );

  if (onSelect) {
    return (
      <Button
        type="button"
        variant="outline"
        className={joinClassNames("block justify-start", previewClassName)}
        aria-pressed={active}
        onClick={onSelect}
      >
        <span className="block w-full">{content}</span>
      </Button>
    );
  }

  return <div className={previewClassName}>{content}</div>;
}

export function useProgressiveChartDensity<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options?: Omit<ChartDensityIndexOptions<TProperties>, "backend">,
): {
  index: ProgressiveChartDensityIndex<TProperties>;
  status: ChartDensityProgressiveStatus;
  warmWasmNow: () => Promise<void>;
} {
  const [_statusTick, setStatusTick] = useState(0);
  const index = useMemo(() => {
    const resolvedOptions = options ?? {};
    const progressiveOptions = resolvedOptions.progressive;

    return createProgressiveChartDensityIndex(points, {
      ...resolvedOptions,
      progressive: {
        ...progressiveOptions,
        onError(error) {
          progressiveOptions?.onError?.(error);
          setStatusTick((tick) => tick + 1);
        },
        onReady(nextIndex) {
          progressiveOptions?.onReady?.(nextIndex);
          setStatusTick((tick) => tick + 1);
        },
      },
    });
  }, [options, points]);
  const status = index.getProgressiveStatus();

  useEffect(() => {
    if (status.wasmReady) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setStatusTick((tick) => tick + 1);

      if (index.getProgressiveStatus().wasmReady) {
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [index, status.wasmReady]);
  const warmWasmNow = useCallback(async () => {
    setStatusTick((tick) => tick + 1);

    try {
      await index.warmWasmIndex();
    } finally {
      setStatusTick((tick) => tick + 1);
    }
  }, [index]);

  return {
    index,
    status,
    warmWasmNow,
  };
}

export function useChartBinCount<TElement extends Element = HTMLDivElement>(
  options: UseChartBinCountOptions = {},
): UseChartBinCountResult<TElement> {
  const {
    defaultBinCount = 144,
    maxBinCount = 360,
    minBinCount = 48,
    pixelsPerBin = 8,
    step = 12,
  } = options;
  const [element, setElement] = useState<TElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [manualBinCount, setManualBinCountState] = useState<number | null>(null);
  const autoBinCount =
    width === null
      ? defaultBinCount
      : roundToStep(width / Math.max(1, pixelsPerBin), step, minBinCount, maxBinCount);
  const targetBinCount = manualBinCount ?? autoBinCount;
  const containerRef = useCallback((node: TElement | null) => {
    setElement(node);
  }, []);
  const setManualBinCount = useCallback(
    (value: number) => {
      setManualBinCountState(roundToStep(value, step, minBinCount, maxBinCount));
    },
    [maxBinCount, minBinCount, step],
  );
  const resetAuto = useCallback(() => {
    setManualBinCountState(null);
  }, []);

  useEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return {
    containerRef,
    isAuto: manualBinCount === null,
    resetAuto,
    setManualBinCount,
    targetBinCount,
    width,
  };
}

export function useChartWheelDomain<TElement extends Element = HTMLElement>({
  disabled = false,
  domain,
  fullDomain,
  minSpan,
  onDomainChange,
  scrollScale = 1,
  zoomScale = 2,
}: UseChartWheelDomainOptions): UseChartWheelDomainResult<TElement> {
  const [element, setElement] = useState<TElement | null>(null);
  const handledNativeWheelEventsRef = useRef<WeakSet<globalThis.WheelEvent>>(new WeakSet());
  const handleWheel = useCallback(
    (event: ChartWheelEvent, currentTarget: TElement) => {
      if (disabled) {
        return;
      }

      const span = domain[1] - domain[0];
      const fullSpan = fullDomain[1] - fullDomain[0];

      if (span <= 0 || fullSpan <= 0) {
        return;
      }

      const isZoomGesture = event.ctrlKey || event.metaKey;
      const hasHorizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;

      if (!isZoomGesture && !hasHorizontalIntent) {
        return;
      }

      const primaryDelta = isZoomGesture
        ? Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY
        : event.shiftKey && event.deltaX === 0
          ? event.deltaY
          : event.deltaX;

      if (primaryDelta === 0) {
        return;
      }

      event.preventDefault();

      const bounds = currentTarget.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const pixelDelta =
        event.deltaMode === 1
          ? primaryDelta * 16
          : event.deltaMode === 2
            ? primaryDelta * width
            : primaryDelta;

      if (isZoomGesture) {
        const resolvedMinSpan = Math.min(
          fullSpan,
          Math.max(minSpan ?? fullSpan / 1000, Number.EPSILON),
        );
        const anchorRatio = clamp((event.clientX - bounds.left) / width, 0, 1);
        const nextSpan = clamp(
          span * Math.exp((pixelDelta / width) * zoomScale),
          resolvedMinSpan,
          fullSpan,
        );

        if (nextSpan === span) {
          return;
        }

        const scale = nextSpan / span;
        const anchor = domain[0] + anchorRatio * span;
        const nextDomain = clampDomain(
          [anchor - (anchor - domain[0]) * scale, anchor + (domain[1] - anchor) * scale],
          fullDomain,
        );

        if (nextDomain[0] !== domain[0] || nextDomain[1] !== domain[1]) {
          onDomainChange(nextDomain);
        }

        return;
      }

      if (fullSpan <= span) {
        return;
      }

      const shift = (pixelDelta / width) * span * scrollScale;
      const nextDomain = clampDomain([domain[0] + shift, domain[1] + shift], fullDomain);

      if (nextDomain[0] === domain[0] && nextDomain[1] === domain[1]) {
        return;
      }

      onDomainChange(nextDomain);
    },
    [disabled, domain, fullDomain, minSpan, onDomainChange, scrollScale, zoomScale],
  );
  const containerRef = useCallback((node: TElement | null) => {
    setElement(node);
  }, []);
  const onWheel = useCallback(
    (event: WheelEvent<TElement>) => {
      if (handledNativeWheelEventsRef.current.has(event.nativeEvent)) {
        return;
      }

      handleWheel(event, event.currentTarget);
    },
    [handleWheel],
  );

  useEffect(() => {
    if (!element) {
      return undefined;
    }

    const handledNativeWheelEvents = handledNativeWheelEventsRef.current;
    const handleNativeWheel: EventListener = (event) => {
      const wheelEvent = event as globalThis.WheelEvent;

      handledNativeWheelEvents.add(wheelEvent);
      handleWheel(wheelEvent, element);
    };

    element.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => element.removeEventListener("wheel", handleNativeWheel);
  }, [element, handleWheel]);

  return {
    containerRef,
    onWheel,
  };
}

export function useChartSeriesVisibility({
  defaultHiddenIds = [],
  hiddenIds,
  itemIds,
  minVisible = 1,
  onHiddenIdsChange,
}: UseChartSeriesVisibilityOptions): UseChartSeriesVisibilityResult {
  const [uncontrolledHiddenIds, setUncontrolledHiddenIds] = useState(() =>
    normalizeHiddenChartSeriesIds(defaultHiddenIds, itemIds, Math.max(0, minVisible)),
  );
  const resolvedHiddenIds = useMemo(
    () =>
      normalizeHiddenChartSeriesIds(
        hiddenIds ?? uncontrolledHiddenIds,
        itemIds,
        Math.max(0, minVisible),
      ),
    [hiddenIds, itemIds, minVisible, uncontrolledHiddenIds],
  );
  const visibleIds = useMemo(
    () => getVisibleChartSeriesIds(itemIds, resolvedHiddenIds),
    [itemIds, resolvedHiddenIds],
  );
  const setHiddenIds = useCallback(
    (nextHiddenIds: readonly string[]) => {
      const normalized = normalizeHiddenChartSeriesIds(
        nextHiddenIds,
        itemIds,
        Math.max(0, minVisible),
      );

      if (hiddenIds === undefined) {
        setUncontrolledHiddenIds(normalized);
      }

      onHiddenIdsChange?.(normalized);
    },
    [hiddenIds, itemIds, minVisible, onHiddenIdsChange],
  );
  const toggle = useCallback(
    (id: string) => {
      setHiddenIds(toggleChartSeriesId(id, resolvedHiddenIds, itemIds, Math.max(0, minVisible)));
    },
    [itemIds, minVisible, resolvedHiddenIds, setHiddenIds],
  );
  const showAll = useCallback(() => setHiddenIds([]), [setHiddenIds]);
  const isVisible = useCallback((id: string) => visibleIds.includes(id), [visibleIds]);

  return {
    hiddenIds: resolvedHiddenIds,
    isVisible,
    setHiddenIds,
    showAll,
    toggle,
    visibleIds,
  };
}

export function measureChartSeries<TProperties = Record<string, unknown>>(
  index: ChartDensityIndex<TProperties>,
  query: ChartDensityQuery,
): MeasuredChartSeries<TProperties> {
  const startedAt = now();
  const series = index.getChartSeries(query);

  return {
    queryMs: now() - startedAt,
    series,
  };
}

export function getChartSampleYBounds<TProperties = Record<string, unknown>>(
  samples: Array<ChartDensitySample<TProperties>>,
): {
  maxY: number | null;
  minY: number | null;
} {
  const values = samples.flatMap((sample) => [sample.minY, sample.maxY]).filter(isNumber);

  if (values.length === 0) {
    return {
      maxY: null,
      minY: null,
    };
  }

  return {
    maxY: Math.max(...values),
    minY: Math.min(...values),
  };
}

export function getChartDataYBounds(
  rows: readonly Record<string, unknown>[],
  dataKeys: readonly string[],
): {
  maxY: number | null;
  minY: number | null;
} {
  const values = rows.flatMap((row) =>
    dataKeys.flatMap((dataKey) => {
      const value = row[dataKey];

      return isFiniteNumber(value) ? [value] : [];
    }),
  );

  if (values.length === 0) {
    return {
      maxY: null,
      minY: null,
    };
  }

  return {
    maxY: Math.max(...values),
    minY: Math.min(...values),
  };
}

export function getNearestChartSample<TProperties>(
  samples: readonly ChartDensitySample<TProperties>[],
  x: number,
  options: {
    isSampleSelectable?: (sample: ChartDensitySample<TProperties>) => boolean;
  } = {},
): ChartDensitySample<TProperties> | null {
  const isSampleSelectable = options.isSampleSelectable ?? isNonEmptyChartSample;
  let nearest: ChartDensitySample<TProperties> | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const sample of samples) {
    if (!isSampleSelectable(sample)) {
      continue;
    }

    const distance = Math.abs(sample.x - x);

    if (distance < nearestDistance) {
      nearest = sample;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function createPreviewData<TProperties>(samples: Array<ChartDensitySample<TProperties>>) {
  return samples.map((sample) => ({
    count: sample.pointCount,
    label: formatCompactNumber(sample.x),
    value: sample.y,
    x: sample.x,
  }));
}

function ChartYAxisRangeLegendList({ items }: { items: readonly ChartLegendItem[] }): JSX.Element {
  return (
    <div aria-label="Y-axis series legend" className="grid gap-1" role="group">
      {items.map((item) => (
        <div
          key={item.id}
          className={joinClassNames(
            "flex items-center gap-2 border border-border/60 bg-muted/20 px-2 py-1.5 text-sm",
            item.disabled ? "opacity-60" : null,
          )}
        >
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 border border-border/60"
            style={{ backgroundColor: item.color ?? "var(--muted-foreground)" }}
          />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.meta ? (
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{item.meta}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function getChartAxisMenuStyle(position: { x: number; y: number }) {
  if (typeof window === "undefined") {
    return {
      left: position.x,
      top: position.y,
    };
  }

  const width = 288;
  const height = 360;
  const padding = 8;

  return {
    left: clamp(position.x, padding, Math.max(padding, window.innerWidth - width - padding)),
    top: clamp(position.y, padding, Math.max(padding, window.innerHeight - height - padding)),
  };
}

function getNearestSample<TProperties>(
  event: PointerEvent<SVGSVGElement>,
  plottedSamples: Array<{ sample: ChartDensitySample<TProperties>; x: number; y: number }>,
) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 100;
  let nearest = plottedSamples[0] ?? null;
  let nearestDistance = nearest ? Math.abs(nearest.x - x) : Number.POSITIVE_INFINITY;

  for (const point of plottedSamples.slice(1)) {
    const distance = Math.abs(point.x - x);

    if (distance < nearestDistance) {
      nearest = point;
      nearestDistance = distance;
    }
  }

  return nearest?.sample ?? null;
}

function normalizeHiddenChartSeriesIds(
  hiddenIds: readonly string[],
  itemIds: readonly string[],
  minVisible: number,
) {
  const hiddenIdSet = new Set(hiddenIds);
  const normalized = itemIds.filter((id) => hiddenIdSet.has(id));
  const maxHiddenCount = Math.max(0, itemIds.length - minVisible);

  return normalized.slice(0, maxHiddenCount);
}

function toggleChartSeriesId(
  id: string,
  hiddenIds: readonly string[],
  itemIds: readonly string[],
  minVisible: number,
) {
  if (!itemIds.includes(id)) {
    return [...hiddenIds];
  }

  if (hiddenIds.includes(id)) {
    return hiddenIds.filter((hiddenId) => hiddenId !== id);
  }

  if (getVisibleChartSeriesIds(itemIds, hiddenIds).length <= minVisible) {
    return [...hiddenIds];
  }

  return normalizeHiddenChartSeriesIds([...hiddenIds, id], itemIds, minVisible);
}

function getVisibleChartSeriesIds(itemIds: readonly string[], hiddenIds: readonly string[]) {
  const hiddenIdSet = new Set(hiddenIds);

  return itemIds.filter((id) => !hiddenIdSet.has(id));
}

function formatDomainRange(domain: [number, number]) {
  return `${formatCompactNumber(domain[0])}-${formatCompactNumber(domain[1])}`;
}

function formatMetricValue(metricKey: string, value: number) {
  return `${formatCompactNumber(value)} ${metricKey}`;
}

function getPrimaryMetric(metrics: Record<string, number>) {
  const entries = Object.entries(metrics);

  return entries.find(([metricKey]) => metricKey === "revenue") ?? entries[0];
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
  }).format(value);
}

function formatNullableNumber(value: number | null) {
  return value === null ? "n/a" : formatCompactNumber(value);
}

function formatDefaultSampleLabel<TProperties>(sample: ChartDensitySample<TProperties>) {
  return `Sample ${sample.index}`;
}

function formatDefaultSampleValue<TProperties>(
  value: number | null,
  _sample: ChartDensitySample<TProperties>,
) {
  return formatNullableNumber(value);
}

function isNonEmptyChartSample<TProperties>(sample: ChartDensitySample<TProperties>) {
  return sample.pointCount > 0;
}

function formatThresholdAnnotationLabel<TProperties>(
  annotation: ChartThresholdAnnotation<TProperties>,
) {
  return `${formatCompactNumber(annotation.startX)}-${formatCompactNumber(annotation.endX)}`;
}

function formatUnknownError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function renderDefaultChartLabel<TPayload>(
  label: ChartPlacedLabel<TPayload>,
  padding: number,
  lineHeight: number,
) {
  if (!label.rect) {
    return null;
  }

  return (
    <>
      <rect
        x={label.rect.x}
        y={label.rect.y}
        width={label.rect.width}
        height={label.rect.height}
        rx="3"
        fill="var(--background)"
        fillOpacity="0.92"
        stroke="var(--border)"
        strokeOpacity="0.9"
      />
      <text
        x={label.rect.x + padding}
        y={label.rect.y + padding + lineHeight * 0.72}
        fill="var(--foreground)"
        fontFamily="Inter, sans-serif"
        fontSize="12"
      >
        {label.lines.map((line, lineIndex) => (
          <tspan
            key={`${label.id}-${lineIndex}`}
            x={label.rect ? label.rect.x + padding : 0}
            dy={lineIndex === 0 ? 0 : lineHeight}
          >
            {line.text}
          </tspan>
        ))}
      </text>
    </>
  );
}

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function isNumber(value: number | null): value is number {
  return value !== null;
}

function roundToStep(value: number, step: number, min: number, max: number) {
  const stepped = Math.round(value / Math.max(1, step)) * Math.max(1, step);

  return clamp(stepped, min, max);
}

function clampDomain(domain: [number, number], fullDomain: [number, number]): [number, number] {
  const span = domain[1] - domain[0];
  const min = fullDomain[0];
  const max = fullDomain[1];

  if (span >= max - min) {
    return [min, max];
  }

  if (domain[0] < min) {
    return [min, min + span];
  }

  if (domain[1] > max) {
    return [max - span, max];
  }

  return domain;
}

function normalizeDomain(
  domain: [number, number],
  fullDomain: [number, number],
  minSpan: number,
): [number, number] {
  const sorted: [number, number] = domain[0] <= domain[1] ? domain : [domain[1], domain[0]];
  const fullSpan = fullDomain[1] - fullDomain[0];

  if (fullSpan <= 0) {
    return fullDomain;
  }

  const targetSpan = Math.min(fullSpan, Math.max(sorted[1] - sorted[0], minSpan));

  if (targetSpan >= fullSpan) {
    return fullDomain;
  }

  const midpoint = (sorted[0] + sorted[1]) / 2;

  return clampDomain([midpoint - targetSpan / 2, midpoint + targetSpan / 2], fullDomain);
}

function areDomainsEqual(left: [number, number], right: [number, number]) {
  return left[0] === right[0] && left[1] === right[1];
}

function getMinimapYBounds<TProperties>(samples: Array<ChartDensitySample<TProperties>>) {
  if (samples.length === 0) {
    return {
      maxY: 0,
      minY: 0,
    };
  }

  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const sample of samples) {
    const y = sample.y ?? 0;

    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  return {
    maxY,
    minY,
  };
}

function getDomainPointerBounds(element: SVGSVGElement): ChartDomainPointerBounds {
  const bounds = element.getBoundingClientRect();

  return {
    left: bounds.left,
    width: bounds.width,
  };
}

function getDomainValueFromClientX(
  clientX: number,
  bounds: ChartDomainPointerBounds,
  fullDomain: [number, number],
) {
  const ratio = clamp((clientX - bounds.left) / Math.max(1, bounds.width), 0, 1);

  return fullDomain[0] + ratio * (fullDomain[1] - fullDomain[0]);
}

function getDomainHandleThresholdFromBounds(
  bounds: ChartDomainPointerBounds,
  fullDomain: [number, number],
) {
  return (10 / Math.max(1, bounds.width)) * (fullDomain[1] - fullDomain[0]);
}

function requestFrame(callback: FrameRequestCallback) {
  if (typeof requestAnimationFrame !== "undefined") {
    return requestAnimationFrame(callback);
  }

  return globalThis.setTimeout(() => callback(now()), 16) as unknown as number;
}

function cancelFrame(frameId: number) {
  if (typeof cancelAnimationFrame !== "undefined") {
    cancelAnimationFrame(frameId);

    return;
  }

  globalThis.clearTimeout(frameId);
}

function noopDomainChange() {
  return undefined;
}

function now() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

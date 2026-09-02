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
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "../internal/ui-primitives";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createChartRenderData } from "../density";

import {
  useChartBinCount,
  useChartDragDomain,
  useChartSeriesVisibility,
  useChartWheelDomain,
} from "./hooks";
import { ChartDomainMinimap } from "./interactive";
import {
  clamp,
  formatCompactNumber,
  formatNullableNumber,
  isChartLegendDragControl,
  joinClassNames,
  noopDomainChange,
} from "./shared";

import type {
  BinnedChartProps,
  BinnedChartRenderContext,
  ChartDerivedMetricCardProps,
  ChartDomainDragPreview,
  ChartMetricCardProps,
  ChartMetricStripProps,
  ChartPanelProps,
  ChartSeriesLegendProps,
  ChartWithLegendProps,
} from "./types";
import type { JSX, KeyboardEvent, MouseEvent, PointerEvent } from "react";

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
  defaultLegendDisplay = "expanded",
  legend,
  legendDisplayLabel = "Legend",
  legendMode = "side",
  onLegendHide,
  legendSide = "right",
  legendTitle = "Legend",
  legendWidthClassName = "lg:w-64",
}: ChartWithLegendProps): JSX.Element {
  const [legendDisplay, setLegendDisplay] =
    useState<NonNullable<ChartWithLegendProps["defaultLegendDisplay"]>>(defaultLegendDisplay);
  const [legendPosition, setLegendPosition] = useState({ x: 12, y: 12 });
  const floatingContainerRef = useRef<HTMLDivElement | null>(null);
  const floatingLegendRef = useRef<HTMLDivElement | null>(null);
  const legendDragRef = useRef<{
    offsetX: number;
    offsetY: number;
    pointerId: number;
  } | null>(null);
  const removeLegendDragListenersRef = useRef<(() => void) | null>(null);

  const clampLegendPosition = useCallback((position: { x: number; y: number }) => {
    const container = floatingContainerRef.current;
    const legendElement = floatingLegendRef.current;

    if (!container || !legendElement) {
      return {
        x: Math.max(0, position.x),
        y: Math.max(0, position.y),
      };
    }

    const containerBounds = container.getBoundingClientRect();
    const legendBounds = legendElement.getBoundingClientRect();
    const maxX = Math.max(0, containerBounds.width - legendBounds.width - 8);
    const maxY = Math.max(0, containerBounds.height - legendBounds.height - 8);

    return {
      x: clamp(position.x, 8, maxX),
      y: clamp(position.y, 8, maxY),
    };
  }, []);

  const moveLegendToPointer = useCallback(
    (clientX: number, clientY: number, pointerId: number) => {
      const drag = legendDragRef.current;
      const container = floatingContainerRef.current;

      if (!drag || drag.pointerId !== pointerId || !container) {
        return;
      }

      const containerBounds = container.getBoundingClientRect();

      setLegendPosition(
        clampLegendPosition({
          x: clientX - containerBounds.left - drag.offsetX,
          y: clientY - containerBounds.top - drag.offsetY,
        }),
      );
    },
    [clampLegendPosition],
  );

  const stopLegendDrag = useCallback((pointerId?: number) => {
    const drag = legendDragRef.current;

    if (!drag || (pointerId !== undefined && drag.pointerId !== pointerId)) {
      return;
    }

    legendDragRef.current = null;
    removeLegendDragListenersRef.current?.();
    removeLegendDragListenersRef.current = null;
  }, []);

  const startLegendDrag = useCallback(
    (clientX: number, clientY: number, pointerId: number) => {
      const container = floatingContainerRef.current;

      if (!container) {
        return;
      }

      const containerBounds = container.getBoundingClientRect();
      const currentPosition = clampLegendPosition(legendPosition);

      legendDragRef.current = {
        offsetX: clientX - containerBounds.left - currentPosition.x,
        offsetY: clientY - containerBounds.top - currentPosition.y,
        pointerId,
      };
      setLegendPosition(currentPosition);
      removeLegendDragListenersRef.current?.();

      if (pointerId >= 0) {
        const handleWindowPointerMove = (pointerEvent: globalThis.PointerEvent) => {
          moveLegendToPointer(pointerEvent.clientX, pointerEvent.clientY, pointerEvent.pointerId);
          pointerEvent.preventDefault();
        };
        const handleWindowPointerEnd = (pointerEvent: globalThis.PointerEvent) => {
          stopLegendDrag(pointerEvent.pointerId);
        };

        window.addEventListener("pointermove", handleWindowPointerMove);
        window.addEventListener("pointerup", handleWindowPointerEnd);
        window.addEventListener("pointercancel", handleWindowPointerEnd);
        removeLegendDragListenersRef.current = () => {
          window.removeEventListener("pointermove", handleWindowPointerMove);
          window.removeEventListener("pointerup", handleWindowPointerEnd);
          window.removeEventListener("pointercancel", handleWindowPointerEnd);
        };
      } else {
        const handleWindowMouseMove = (mouseEvent: globalThis.MouseEvent) => {
          moveLegendToPointer(mouseEvent.clientX, mouseEvent.clientY, pointerId);
          mouseEvent.preventDefault();
        };
        const handleWindowMouseEnd = () => {
          stopLegendDrag(pointerId);
        };

        window.addEventListener("mousemove", handleWindowMouseMove);
        window.addEventListener("mouseup", handleWindowMouseEnd);
        removeLegendDragListenersRef.current = () => {
          window.removeEventListener("mousemove", handleWindowMouseMove);
          window.removeEventListener("mouseup", handleWindowMouseEnd);
        };
      }
    },
    [clampLegendPosition, legendPosition, moveLegendToPointer, stopLegendDrag],
  );

  const handleLegendPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || isChartLegendDragControl(event.target)) {
        return;
      }

      startLegendDrag(event.clientX, event.clientY, event.pointerId);
      event.currentTarget.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    },
    [startLegendDrag],
  );

  const handleLegendMouseDown = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || legendDragRef.current || isChartLegendDragControl(event.target)) {
        return;
      }

      startLegendDrag(event.clientX, event.clientY, -1);
      event.preventDefault();
    },
    [startLegendDrag],
  );

  const handleLegendPointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      moveLegendToPointer(event.clientX, event.clientY, event.pointerId);
      event.preventDefault();
    },
    [moveLegendToPointer],
  );

  const handleLegendPointerEnd = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      stopLegendDrag(event.pointerId);
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    },
    [stopLegendDrag],
  );
  const handleLegendHandleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      const step = event.shiftKey ? 24 : 8;

      if (event.key === "ArrowUp") {
        setLegendPosition((position) => clampLegendPosition({ ...position, y: position.y - step }));
        event.preventDefault();
      } else if (event.key === "ArrowDown") {
        setLegendPosition((position) => clampLegendPosition({ ...position, y: position.y + step }));
        event.preventDefault();
      } else if (event.key === "ArrowLeft") {
        setLegendPosition((position) => clampLegendPosition({ ...position, x: position.x - step }));
        event.preventDefault();
      } else if (event.key === "ArrowRight") {
        setLegendPosition((position) => clampLegendPosition({ ...position, x: position.x + step }));
        event.preventDefault();
      }
    },
    [clampLegendPosition],
  );

  useEffect(
    () => () => {
      removeLegendDragListenersRef.current?.();
    },
    [],
  );

  if (legendMode === "floating") {
    const legendStyle = {
      left: `${legendPosition.x}px`,
      top: `${legendPosition.y}px`,
    };

    return (
      <div
        ref={floatingContainerRef}
        className={joinClassNames("relative min-w-0", className)}
        data-chart-legend-mode="floating"
      >
        <div className="min-w-0">{children}</div>
        {legendDisplay === "hidden" ? null : (
          <div
            ref={floatingLegendRef}
            className="absolute z-20 w-[min(18rem,calc(100%-1rem))] overflow-hidden border border-border/70 bg-background/95 shadow-lg backdrop-blur"
            style={legendStyle}
            data-chart-floating-legend=""
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
              <button
                type="button"
                className="min-w-0 flex-1 cursor-move touch-none select-none truncate border-0 bg-transparent p-0 text-left text-sm font-medium text-foreground"
                aria-label={`Move ${legendDisplayLabel.toLowerCase()}`}
                data-chart-floating-legend-handle=""
                onKeyDown={handleLegendHandleKeyDown}
                onMouseDown={handleLegendMouseDown}
                onPointerCancel={handleLegendPointerEnd}
                onPointerDown={handleLegendPointerDown}
                onPointerMove={handleLegendPointerMove}
                onPointerUp={handleLegendPointerEnd}
              >
                {legendTitle}
              </button>
              <span className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => {
                    setLegendDisplay("hidden");
                    onLegendHide?.();
                  }}
                  aria-label={`Hide ${legendDisplayLabel.toLowerCase()}`}
                >
                  Hide
                </Button>
              </span>
            </div>
            <div className="p-2">{legend}</div>
          </div>
        )}
      </div>
    );
  }

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
  drag = true,
  dragOptions,
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
    onDomainPreviewChange,
    updateMode = "preview",
    ...resolvedDragOptions
  } = dragOptions ?? {};
  const [dragPreview, setDragPreview] = useState<ChartDomainDragPreview | null>(null);
  const handleDomainPreviewChange = useCallback(
    (preview: ChartDomainDragPreview | null) => {
      setDragPreview(preview);
      onDomainPreviewChange?.(preview);
    },
    [onDomainPreviewChange],
  );
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
  const {
    containerRef: dragContainerRef,
    isDragging: isDomainDragging,
    onDoubleClick: handleDomainDoubleClick,
    onPointerCancel: handleDomainPointerCancel,
    onPointerDown: handleDomainPointerDown,
    onPointerMove: handleDomainPointerMove,
    onPointerUp: handleDomainPointerUp,
    selection: domainSelection,
  } = useChartDragDomain<HTMLDivElement>({
    ...resolvedDragOptions,
    disabled: !onDomainChange || !drag || resolvedDragOptions.disabled,
    domain,
    fullDomain: resolvedFullDomain,
    minSpan,
    onDomainChange: handleDomainChange,
    onDomainPreviewChange: handleDomainPreviewChange,
    updateMode,
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
      <div
        ref={dragContainerRef}
        className="relative select-none"
        data-chart-domain-drag-frame=""
        data-chart-domain-dragging={isDomainDragging ? "true" : undefined}
        onDoubleClick={handleDomainDoubleClick}
        onPointerCancel={handleDomainPointerCancel}
        onPointerDown={(event) => {
          if (isChartDomainDragIgnoredTarget(event.target)) {
            return;
          }

          handleDomainPointerDown(event);
        }}
        onPointerMove={handleDomainPointerMove}
        onPointerUp={handleDomainPointerUp}
      >
        <div
          data-chart-domain-preview=""
          style={{
            transform: dragPreview ? `translateX(${dragPreview.offsetPx}px)` : undefined,
            willChange: dragPreview ? "transform" : undefined,
          }}
        >
          <ChartContainer className={chartClassName} config={config}>
            {children(context)}
          </ChartContainer>
        </div>
        {domainSelection ? (
          <div
            data-chart-domain-selection=""
            className="pointer-events-none absolute inset-y-0 border-x border-primary bg-primary/15"
            style={{
              left: `${domainSelection.left}px`,
              width: `${domainSelection.width}px`,
            }}
          />
        ) : null}
      </div>
      {showMinimap ? (
        <ChartDomainMinimap
          className={minimapClassName}
          domain={dragPreview?.domain ?? domain}
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

function isChartDomainDragIgnoredTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        [
          "[role='dialog']",
          "button",
          "input",
          "select",
          "textarea",
          "[data-chart-axis-transform-trigger]",
          "[data-chart-y-axis-range-trigger]",
        ].join(", "),
      ),
    )
  );
}

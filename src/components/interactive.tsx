import { Button, Item, ItemContent, ItemDescription, ItemTitle } from "@moritzbrantner/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlotArea } from "recharts";

import { getNearestChartSample } from "./measurement";
import {
  areDomainsEqual,
  cancelFrame,
  clamp,
  formatCompactNumber,
  formatDefaultSampleLabel,
  formatDefaultSampleValue,
  formatMetricValue,
  formatNullableNumber,
  formatThresholdAnnotationLabel,
  getDomainHandleThresholdFromBounds,
  getDomainPointerBounds,
  getDomainValueFromClientX,
  getDomainValueFromClientY,
  getMinimapYBounds,
  getNearestSample,
  getPrimaryMetric,
  hashString,
  isNonEmptyChartSample,
  joinClassNames,
  normalizeDomain,
  requestFrame,
} from "./shared";

import type { ChartDomainMinimapDragState } from "./shared";
import type {
  ChartAnomalyMarkerListProps,
  ChartDomainMinimapProps,
  ChartHotBinRowProps,
  ChartSampleInteraction,
  ChartSampleInteractionOverlayProps,
  ChartSampleSparklineProps,
  ChartThresholdMarkerProps,
} from "./types";
import type { JSX, MouseEvent, PointerEvent } from "react";

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
  orientation = "vertical",
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
    const domainValue =
      orientation === "horizontal"
        ? getDomainValueFromClientY(
            event.clientY,
            { height: bounds.height, top: bounds.top },
            domain,
          )
        : getDomainValueFromClientX(event.clientX, bounds, domain);
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
      ? orientation === "horizontal"
        ? {
            bottom:
              plotArea.y +
              clamp(
                ((selectedSample.x1 - domain[0]) / domainSpan) * plotArea.height,
                0,
                plotArea.height,
              ),
            kind: "horizontal" as const,
            middle:
              plotArea.y +
              clamp(
                ((selectedSample.x - domain[0]) / domainSpan) * plotArea.height,
                0,
                plotArea.height,
              ),
            top:
              plotArea.y +
              clamp(
                ((selectedSample.x0 - domain[0]) / domainSpan) * plotArea.height,
                0,
                plotArea.height,
              ),
          }
        : {
            kind: "vertical" as const,
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
        selectedBand.kind === "horizontal" ? (
          <>
            <rect
              data-chart-sample-selected-band={selectedSample?.index}
              x={plotArea.x}
              y={Math.min(selectedBand.top, selectedBand.bottom)}
              width={plotArea.width}
              height={Math.abs(selectedBand.bottom - selectedBand.top)}
              fill="var(--primary)"
              fillOpacity="0.1"
              pointerEvents="none"
            />
            <line
              data-chart-sample-selected-line={selectedSample?.index}
              x1={plotArea.x}
              x2={plotArea.x + plotArea.width}
              y1={selectedBand.middle}
              y2={selectedBand.middle}
              stroke="var(--primary)"
              strokeOpacity="0.8"
              strokeWidth="1.2"
              pointerEvents="none"
            />
          </>
        ) : (
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
        )
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

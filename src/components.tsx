import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type PointerEvent,
  type ReactNode,
  type WheelEvent,
  type WheelEventHandler,
} from "react";
import { Bar, BarChart, Line, LineChart } from "recharts";

import {
  CHART_VALUE_MODE_DEFINITIONS,
  createProgressiveChartDensityIndex,
  type ChartDensityIndex,
  type ChartDensityIndexOptions,
  type ChartDensityProgressiveStatus,
  type ChartDensityQuery,
  type ChartDensitySample,
  type ChartDensitySeries,
  type ChartSeriesPoint,
  type ChartValueMode,
  type ChartValueModeDefinition,
  type ProgressiveChartDensityIndex,
} from "./density";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Progress,
  ToggleGroup,
  ToggleGroupItem,
} from "@moritzbrantner/ui";

export type ChartRange = {
  description?: string;
  domain: [number, number];
  id: string;
  label: string;
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

export type ChartPanelProps = {
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  title: ReactNode;
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
  onWheel: WheelEventHandler<TElement>;
};

type ChartDomainMinimapDragState =
  | {
      anchorValue: number;
      mode: "select";
    }
  | {
      mode: "pan";
      startDomain: [number, number];
      startValue: number;
    }
  | {
      mode: "resize-left" | "resize-right";
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
              "h-auto w-full justify-start rounded-none border p-4 text-left transition hover:border-primary/60",
              active ? "border-primary bg-primary/10" : "border-border/60 bg-muted/20",
            )}
            onClick={() => onValueChange(range.id)}
          >
            <span className="grid w-full gap-2">
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium">{range.label}</span>
                <span className="text-xs text-muted-foreground">{formatDomain(range.domain)}</span>
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
        <Progress value={progressValue} />
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
  const [dragState, setDragState] = useState<ChartDomainMinimapDragState | null>(null);
  const values = samples.filter((sample) => sample.y !== null);
  const fullSpan = Math.max(1, fullDomain[1] - fullDomain[0]);
  const resolvedMinSpan = Math.max(minSpan ?? fullSpan / 100, fullSpan / 1000);
  const selectedLeft = clamp(((domain[0] - fullDomain[0]) / fullSpan) * 100, 0, 100);
  const selectedRight = clamp(((domain[1] - fullDomain[0]) / fullSpan) * 100, 0, 100);
  const selectedWidth = Math.max(0, selectedRight - selectedLeft);
  const minY = values.length > 0 ? Math.min(...values.map((sample) => sample.y ?? 0)) : 0;
  const maxY = values.length > 0 ? Math.max(...values.map((sample) => sample.y ?? 0)) : 0;
  const spread = Math.max(1, maxY - minY);
  const points = values
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
    .join(" ");

  const updateDomain = (nextDomain: [number, number]) => {
    const normalized = normalizeDomain(nextDomain, fullDomain, resolvedMinSpan);

    if (normalized[0] !== domain[0] || normalized[1] !== domain[1]) {
      onDomainChange(normalized);
    }
  };
  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const value = getDomainValueFromPointerEvent(event, fullDomain);
    const threshold = getDomainHandleThreshold(event.currentTarget, fullDomain);

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    if (Math.abs(value - domain[0]) <= threshold) {
      setDragState({ mode: "resize-left" });

      return;
    }

    if (Math.abs(value - domain[1]) <= threshold) {
      setDragState({ mode: "resize-right" });

      return;
    }

    if (value >= domain[0] && value <= domain[1]) {
      setDragState({
        mode: "pan",
        startDomain: domain,
        startValue: value,
      });

      return;
    }

    setDragState({
      anchorValue: value,
      mode: "select",
    });
    updateDomain([value, value]);
  };
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragState) {
      return;
    }

    const value = getDomainValueFromPointerEvent(event, fullDomain);

    event.preventDefault();

    if (dragState.mode === "select") {
      updateDomain([dragState.anchorValue, value]);

      return;
    }

    if (dragState.mode === "pan") {
      const shift = value - dragState.startValue;

      updateDomain([dragState.startDomain[0] + shift, dragState.startDomain[1] + shift]);

      return;
    }

    if (dragState.mode === "resize-left") {
      updateDomain([Math.min(value, domain[1] - resolvedMinSpan), domain[1]]);

      return;
    }

    updateDomain([domain[0], Math.max(value, domain[0] + resolvedMinSpan)]);
  };
  const stopDragging = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDragState(null);
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
  const [statusTick, setStatusTick] = useState(0);
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
  const status = useMemo(() => index.getProgressiveStatus(), [index, statusTick]);

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
  const onWheel = useCallback(
    (event: WheelEvent<TElement>) => {
      if (disabled) {
        return;
      }

      const span = domain[1] - domain[0];
      const fullSpan = fullDomain[1] - fullDomain[0];

      if (span <= 0 || fullSpan <= 0) {
        return;
      }

      const primaryDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

      if (primaryDelta === 0) {
        return;
      }

      event.preventDefault();

      const bounds = event.currentTarget.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const pixelDelta =
        event.deltaMode === 1
          ? primaryDelta * 16
          : event.deltaMode === 2
            ? primaryDelta * width
            : primaryDelta;

      if (event.ctrlKey || event.metaKey) {
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

  return {
    onWheel,
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

function createPreviewData<TProperties>(samples: Array<ChartDensitySample<TProperties>>) {
  return samples.map((sample) => ({
    count: sample.pointCount,
    label: formatCompactNumber(sample.x),
    value: sample.y,
    x: sample.x,
  }));
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

function formatUnknownError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
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

function getDomainValueFromPointerEvent(
  event: PointerEvent<SVGSVGElement>,
  fullDomain: [number, number],
) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const ratio = clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), 0, 1);

  return fullDomain[0] + ratio * (fullDomain[1] - fullDomain[0]);
}

function getDomainHandleThreshold(element: SVGSVGElement, fullDomain: [number, number]) {
  const bounds = element.getBoundingClientRect();

  return (10 / Math.max(1, bounds.width)) * (fullDomain[1] - fullDomain[0]);
}

function now() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

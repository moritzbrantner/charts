import { type usePlotArea } from "recharts";

import type { ChartThresholdAnnotation } from "../analytics";
import type { ChartDensitySample, ChartSunburstNode } from "../density";
import type { ChartPlacedLabel } from "../labels";
import type {
  ChartAxisScale,
  ChartLegendItem,
  ChartSvgAxisOptions,
  ChartSvgLegendItem,
} from "./types";
import type { JSX, PointerEvent, ReactNode } from "react";

export type ChartWheelEvent = Pick<
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

export type ChartDomainMinimapDragState =
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

export type ChartDomainPointerBounds = {
  left: number;
  width: number;
};

export type ChartDomainDragState = {
  bounds: ChartDomainPointerBounds;
  dragged: boolean;
  mode: "pan" | "select";
  pointerId: number;
  startClientX: number;
  startDomain: [number, number];
};

export function createPreviewData<TProperties>(samples: Array<ChartDensitySample<TProperties>>) {
  return samples.map((sample) => ({
    count: sample.pointCount,
    label: formatCompactNumber(sample.x),
    value: sample.y,
    x: sample.x,
  }));
}

export function ChartYAxisRangeLegendList({
  items,
}: {
  items: readonly ChartLegendItem[];
}): JSX.Element {
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

export function ChartMenuButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ChartEmptyState({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={joinClassNames(
        "flex h-56 items-center justify-center border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function getChartAxisMenuStyle(position: { x: number; y: number }) {
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

export function getNearestSample<TProperties>(
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

export function normalizeHiddenChartSeriesIds(
  hiddenIds: readonly string[],
  itemIds: readonly string[],
  minVisible: number,
) {
  const hiddenIdSet = new Set(hiddenIds);
  const normalized = itemIds.filter((id) => hiddenIdSet.has(id));
  const maxHiddenCount = Math.max(0, itemIds.length - minVisible);

  return normalized.slice(0, maxHiddenCount);
}

export function toggleChartSeriesId(
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

export function getVisibleChartSeriesIds(itemIds: readonly string[], hiddenIds: readonly string[]) {
  const hiddenIdSet = new Set(hiddenIds);

  return itemIds.filter((id) => !hiddenIdSet.has(id));
}

export function formatDomainRange(domain: [number, number]) {
  return `${formatCompactNumber(domain[0])}-${formatCompactNumber(domain[1])}`;
}

export function formatMetricValue(metricKey: string, value: number) {
  return `${formatCompactNumber(value)} ${metricKey}`;
}

export function getPrimaryMetric(metrics: Record<string, number>) {
  const entries = Object.entries(metrics);

  return entries.find(([metricKey]) => metricKey === "revenue") ?? entries[0];
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
  }).format(value);
}

export function formatNullableNumber(value: number | null) {
  return value === null ? "n/a" : formatCompactNumber(value);
}

export function resolveChartSvgAxis(
  axis: ChartSvgAxisOptions | false | undefined,
  formatValue = formatCompactNumber,
) {
  return {
    formatValue: axis && axis.formatValue ? axis.formatValue : formatValue,
    label: axis && axis.label ? axis.label : null,
    tickCount: axis && axis.tickCount ? Math.max(2, Math.floor(axis.tickCount)) : 3,
    visible: axis !== false && axis?.visible !== false,
  };
}

export function createChartSvgTicks(domain: [number, number], tickCount: number) {
  const count = Math.max(2, Math.floor(tickCount));

  if (!Number.isFinite(domain[0]) || !Number.isFinite(domain[1])) {
    return [];
  }

  if (domain[0] === domain[1]) {
    return [domain[0]];
  }

  return Array.from({ length: count }, (_, tickIndex) => {
    const ratio = tickIndex / Math.max(1, count - 1);

    return domain[0] + (domain[1] - domain[0]) * ratio;
  });
}

export function renderChartSvgLegend(
  legend: ReactNode | readonly ChartSvgLegendItem[] | undefined,
) {
  if (legend === undefined || legend === null || legend === false) {
    return null;
  }

  if (isChartSvgLegendItems(legend)) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {legend.map((item, itemIndex) => (
          <span key={itemIndex} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2 rounded-[2px]"
              style={{ backgroundColor: item.color ?? "var(--primary)" }}
            />
            <span>{item.label}</span>
            {item.value ? <span className="font-medium text-foreground">{item.value}</span> : null}
          </span>
        ))}
      </div>
    );
  }

  return <div className="mt-2">{legend}</div>;
}

export function isChartSvgLegendItems(
  legend: ReactNode | readonly ChartSvgLegendItem[],
): legend is readonly ChartSvgLegendItem[] {
  return (
    Array.isArray(legend) &&
    legend.every((item) => Boolean(item) && typeof item === "object" && "label" in item)
  );
}

export function truncateChartText(text: string, maxCharacters: number) {
  const normalizedMaxCharacters = Math.max(1, Math.floor(maxCharacters));

  if (text.length <= normalizedMaxCharacters) {
    return text;
  }

  if (normalizedMaxCharacters <= 3) {
    return ".".repeat(normalizedMaxCharacters);
  }

  return `${text.slice(0, normalizedMaxCharacters - 3).trimEnd()}...`;
}

export function getNumericDomain(values: number[]): [number, number] {
  const finiteValues = values.filter(isFiniteNumber);

  if (finiteValues.length === 0) {
    return [0, 1];
  }

  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);

  return min === max ? [min - 1, max + 1] : [min, max];
}

export function getDomainRatio(value: number, domain: [number, number]) {
  const span = domain[1] - domain[0];

  return span > 0 ? clamp((value - domain[0]) / span, 0, 1) : 0.5;
}

export function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + Math.cos(angle - Math.PI / 2) * radius,
    y: cy + Math.sin(angle - Math.PI / 2) * radius,
  };
}

export function getSunburstLabelPoint(
  node: ChartSunburstNode,
  label: string,
  width: number,
  height: number,
) {
  const center = polarToCartesian(
    width / 2,
    height / 2,
    (node.innerRadius + node.outerRadius) / 2,
    (node.startAngle + node.endAngle) / 2,
  );
  const labelWidth = Math.min(width - 16, Math.max(64, label.length * 6.5 + 16));

  return {
    width: labelWidth,
    x: clamp(center.x - labelWidth / 2, 8, width - labelWidth - 8),
    y: clamp(center.y, 24, height - 8),
  };
}

export function describeArc(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  if (innerRadius <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
      "Z",
    ].join(" ");
  }

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

export function formatDefaultSampleLabel<TProperties>(sample: ChartDensitySample<TProperties>) {
  return `Sample ${sample.index}`;
}

export function formatDefaultSampleValue<TProperties>(
  value: number | null,
  _sample: ChartDensitySample<TProperties>,
) {
  return formatNullableNumber(value);
}

export function isNonEmptyChartSample<TProperties>(sample: ChartDensitySample<TProperties>) {
  return sample.pointCount > 0;
}

export function formatThresholdAnnotationLabel<TProperties>(
  annotation: ChartThresholdAnnotation<TProperties>,
) {
  return `${formatCompactNumber(annotation.startX)}-${formatCompactNumber(annotation.endX)}`;
}

export function formatUnknownError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function renderDefaultChartLabel<TPayload>(
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

export function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function isChartLegendDragControl(target: EventTarget | null) {
  if (target instanceof Element && target.closest("[data-chart-floating-legend-handle]")) {
    return false;
  }

  return (
    target instanceof Element &&
    Boolean(target.closest("button, input, select, textarea, [role='button']"))
  );
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

export function isNumber(value: number | null): value is number {
  return value !== null;
}

export function roundToStep(value: number, step: number, min: number, max: number) {
  const stepped = Math.round(value / Math.max(1, step)) * Math.max(1, step);

  return clamp(stepped, min, max);
}

export function clampDomain(
  domain: [number, number],
  fullDomain: [number, number],
): [number, number] {
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

export function normalizeDomain(
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

export function areDomainsEqual(left: [number, number], right: [number, number]) {
  return left[0] === right[0] && left[1] === right[1];
}

export function interpolateNumber(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

export function getMinimapYBounds<TProperties>(samples: Array<ChartDensitySample<TProperties>>) {
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

export function getDomainPointerBounds(element: Element): ChartDomainPointerBounds {
  const bounds = element.getBoundingClientRect();

  return {
    left: bounds.left,
    width: bounds.width,
  };
}

export function getDomainValueFromClientX(
  clientX: number,
  bounds: ChartDomainPointerBounds,
  fullDomain: [number, number],
) {
  const ratio = clamp((clientX - bounds.left) / Math.max(1, bounds.width), 0, 1);

  return fullDomain[0] + ratio * (fullDomain[1] - fullDomain[0]);
}

export function getDomainValueFromClientY(
  clientY: number,
  bounds: { height: number; top: number },
  fullDomain: [number, number],
) {
  const ratio = clamp((clientY - bounds.top) / Math.max(1, bounds.height), 0, 1);

  return fullDomain[0] + ratio * (fullDomain[1] - fullDomain[0]);
}

export function getChartAxisTriggerRect(
  plotArea: ReturnType<typeof usePlotArea>,
  orientation: "left" | "right" | "top" | "bottom",
  axisWidth: number,
) {
  if (!plotArea) {
    return {
      height: 0,
      width: 0,
      x: 0,
      y: 0,
    };
  }

  if (orientation === "right") {
    return {
      height: plotArea.height,
      width: axisWidth,
      x: plotArea.x + plotArea.width,
      y: plotArea.y,
    };
  }

  if (orientation === "top") {
    return {
      height: axisWidth,
      width: plotArea.width,
      x: plotArea.x,
      y: Math.max(0, plotArea.y - axisWidth),
    };
  }

  if (orientation === "bottom") {
    return {
      height: axisWidth,
      width: plotArea.width,
      x: plotArea.x,
      y: plotArea.y + plotArea.height,
    };
  }

  return {
    height: plotArea.height,
    width: axisWidth,
    x: Math.max(0, plotArea.x - axisWidth),
    y: plotArea.y,
  };
}

export function isChartAxisScale(value: string): value is ChartAxisScale {
  return value === "linear" || value === "log" || value === "sqrt" || value === "symlog";
}

export function getDomainHandleThresholdFromBounds(
  bounds: ChartDomainPointerBounds,
  fullDomain: [number, number],
) {
  return (10 / Math.max(1, bounds.width)) * (fullDomain[1] - fullDomain[0]);
}

export function requestFrame(callback: FrameRequestCallback) {
  if (typeof requestAnimationFrame !== "undefined") {
    return requestAnimationFrame(callback);
  }

  return globalThis.setTimeout(() => callback(now()), 16) as unknown as number;
}

export function cancelFrame(frameId: number) {
  if (typeof cancelAnimationFrame !== "undefined") {
    cancelAnimationFrame(frameId);

    return;
  }

  globalThis.clearTimeout(frameId);
}

export function noopDomainChange() {
  return undefined;
}

export function now() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

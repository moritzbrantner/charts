import { Fragment } from "react";

import {
  ChartEmptyState,
  createChartSvgTicks,
  formatCompactNumber,
  getDomainRatio,
  joinClassNames,
  renderChartSvgLegend,
  resolveChartSvgAxis,
  truncateChartText,
} from "./shared";

import type { ChartRidgelineSvgProps } from "./types";
import type { JSX } from "react";

export function ChartRidgelineSvg<TProperties = Record<string, unknown>>({
  ariaLabel = "Chart ridgeline",
  className,
  data,
  formatValue = formatCompactNumber,
  legend,
  onGroupSelect,
  showGroupLabels = true,
  xAxis,
}: ChartRidgelineSvgProps<TProperties>): JSX.Element {
  const groups = Array.isArray(data) ? data : data.groups;

  if (groups.length === 0) {
    return <ChartEmptyState className={className}>No ridgeline data.</ChartEmptyState>;
  }

  const viewWidth = 160;
  const viewHeight = 104;
  const resolvedXAxis = resolveChartSvgAxis(xAxis, formatValue);
  const plot = {
    bottom: resolvedXAxis.visible ? 13 : 5,
    left: showGroupLabels ? 25 : 6,
    right: 5,
    top: 8,
  };
  const plotWidth = viewWidth - plot.left - plot.right;
  const plotHeight = viewHeight - plot.top - plot.bottom;
  const allBuckets = groups.flatMap((group) => group.buckets);
  const xDomain: [number, number] = Array.isArray(data)
    ? [
        Math.min(...allBuckets.map((bucket) => bucket.value0)),
        Math.max(...allBuckets.map((bucket) => bucket.value1)),
      ]
    : data.summary.valueDomain;
  const maxCount = Math.max(
    1,
    Array.isArray(data)
      ? Math.max(...groups.map((group) => group.maxCount))
      : data.summary.maxCount,
  );
  const rowStep = plotHeight / Math.max(1, groups.length);
  const ridgeHeight = rowStep * 0.72;
  const resolvedLegend =
    legend === undefined ? [{ color: "var(--primary)", label: "Bucket count" }] : legend;

  return (
    <div className={joinClassNames("border border-border/60 bg-muted/20 p-3", className)}>
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        role="img"
        aria-label={ariaLabel}
        className="h-72 w-full"
      >
        {resolvedXAxis.visible
          ? createChartSvgTicks(xDomain, resolvedXAxis.tickCount).map((tick) => {
              const x = plot.left + getDomainRatio(tick, xDomain) * plotWidth;

              return (
                <Fragment key={`x-${tick}`}>
                  <line
                    x1={x}
                    x2={x}
                    y1={plot.top + plotHeight}
                    y2={plot.top + plotHeight + 1.5}
                    stroke="var(--border)"
                    strokeWidth="0.35"
                  />
                  <text
                    x={x}
                    y={viewHeight - 2}
                    textAnchor="middle"
                    fill="var(--muted-foreground)"
                    fontSize="3.2"
                  >
                    {resolvedXAxis.formatValue(tick)}
                  </text>
                </Fragment>
              );
            })
          : null}
        {resolvedXAxis.visible ? (
          <line
            x1={plot.left}
            x2={plot.left + plotWidth}
            y1={plot.top + plotHeight}
            y2={plot.top + plotHeight}
            stroke="var(--border)"
            strokeWidth="0.35"
          />
        ) : null}
        {groups.map((group, groupIndex) => {
          const baseline = plot.top + (groupIndex + 0.82) * rowStep;
          const points = group.buckets.map((bucket) => ({
            x: plot.left + getDomainRatio(bucket.x, xDomain) * plotWidth,
            y: baseline - (bucket.pointCount / maxCount) * ridgeHeight,
          }));
          const path = createRidgelinePath(points, baseline);
          const label = `${group.groupLabel}: ${formatCompactNumber(group.pointCount)} points`;

          return (
            <Fragment key={group.groupId}>
              <line
                x1={plot.left}
                x2={plot.left + plotWidth}
                y1={baseline}
                y2={baseline}
                stroke="var(--border)"
                strokeWidth="0.25"
              />
              {showGroupLabels ? (
                <text
                  x={plot.left - 2}
                  y={baseline - 1.2}
                  textAnchor="end"
                  fill="var(--muted-foreground)"
                  fontSize="3.1"
                >
                  {truncateChartText(group.groupLabel, 12)}
                </text>
              ) : null}
              <path
                data-chart-ridgeline-group={group.groupId}
                d={path}
                fill={`var(--chart-${(groupIndex % 5) + 1}, var(--primary))`}
                fillOpacity="0.5"
                stroke={`var(--chart-${(groupIndex % 5) + 1}, var(--primary))`}
                strokeWidth="0.55"
                aria-label={label}
                onClick={() => onGroupSelect?.(group)}
              >
                <title>{label}</title>
              </path>
            </Fragment>
          );
        })}
      </svg>
      {renderChartSvgLegend(resolvedLegend)}
    </div>
  );
}

function createRidgelinePath(points: Array<{ x: number; y: number }>, baseline: number) {
  if (points.length === 0) {
    return "";
  }

  const topPath = points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${baseline} L ${point.x} ${point.y}`;
      }

      const previous = points[index - 1] ?? point;
      const controlX = (previous.x + point.x) / 2;

      return `C ${controlX} ${previous.y} ${controlX} ${point.y} ${point.x} ${point.y}`;
    })
    .join(" ");
  const lastPoint = points[points.length - 1] ?? points[0];

  return `${topPath} L ${lastPoint.x} ${baseline} Z`;
}

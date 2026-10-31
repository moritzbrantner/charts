import { Fragment } from "react";

import {
  ChartEmptyState,
  createChartSvgTicks,
  formatCompactNumber,
  getDomainRatio,
  getNumericDomain,
  joinClassNames,
  renderChartSvgLegend,
  resolveChartSvgAxis,
} from "./shared";

import type { ChartScatterSvgProps } from "./types";
import type { JSX } from "react";

export function ChartScatterSvg<TProperties = Record<string, unknown>>({
  ariaLabel = "Chart scatter plot",
  className,
  formatValue = formatCompactNumber,
  height = 320,
  legend,
  onPointSelect,
  series,
  width = 640,
  xAxis,
  xDomain,
  yAxis,
  yDomain,
}: ChartScatterSvgProps<TProperties>): JSX.Element {
  if (series.points.length === 0) {
    return (
      <ChartEmptyState className={className}>No scatter points in this viewport.</ChartEmptyState>
    );
  }

  const resolvedXDomain =
    xDomain ?? series.summary.xDomain ?? getNumericDomain(series.points.map((point) => point.x));
  const resolvedYDomain =
    yDomain ?? series.summary.yDomain ?? getNumericDomain(series.points.map((point) => point.y));
  const resolvedXAxis = resolveChartSvgAxis(xAxis, formatValue);
  const resolvedYAxis = resolveChartSvgAxis(yAxis, formatValue);
  const padding = {
    bottom: resolvedXAxis.visible ? 42 : 28,
    left: resolvedYAxis.visible ? 52 : 28,
    right: 24,
    top: 20,
  };
  const plotWidth = Math.max(1, width - padding.left - padding.right);
  const plotHeight = Math.max(1, height - padding.top - padding.bottom);
  const xScale = (value: number) =>
    padding.left + getDomainRatio(value, resolvedXDomain) * plotWidth;
  const yScale = (value: number) =>
    padding.top + (1 - getDomainRatio(value, resolvedYDomain)) * plotHeight;
  const resolvedLegend =
    legend === undefined ? [{ color: "var(--primary)", label: "Sampled points" }] : legend;

  return (
    <div className={joinClassNames("border border-border/60 bg-muted/20 p-3", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="h-72 w-full"
      >
        <line
          x1={padding.left}
          x2={padding.left + plotWidth}
          y1={padding.top + plotHeight}
          y2={padding.top + plotHeight}
          stroke="var(--border)"
        />
        <line
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={padding.top + plotHeight}
          stroke="var(--border)"
        />
        {resolvedXAxis.visible
          ? createChartSvgTicks(resolvedXDomain, resolvedXAxis.tickCount).map((tick) => {
              const x = xScale(tick);

              return (
                <Fragment key={`x-${tick}`}>
                  <line
                    x1={x}
                    x2={x}
                    y1={padding.top + plotHeight}
                    y2={padding.top + plotHeight + 5}
                    stroke="var(--border)"
                  />
                  <text
                    x={x}
                    y={height - 12}
                    textAnchor="middle"
                    fill="var(--muted-foreground)"
                    fontSize="11"
                  >
                    {resolvedXAxis.formatValue(tick)}
                  </text>
                </Fragment>
              );
            })
          : null}
        {resolvedYAxis.visible
          ? createChartSvgTicks(resolvedYDomain, resolvedYAxis.tickCount).map((tick) => {
              const y = yScale(tick);

              return (
                <Fragment key={`y-${tick}`}>
                  <line
                    x1={padding.left - 5}
                    x2={padding.left}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                  />
                  <line
                    x1={padding.left}
                    x2={padding.left + plotWidth}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeOpacity="0.45"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="var(--muted-foreground)"
                    fontSize="11"
                  >
                    {resolvedYAxis.formatValue(tick)}
                  </text>
                </Fragment>
              );
            })
          : null}
        {resolvedXAxis.label ? (
          <text
            x={padding.left + plotWidth / 2}
            y={height - 2}
            textAnchor="middle"
            fill="var(--muted-foreground)"
            fontSize="11"
            fontWeight="600"
          >
            {resolvedXAxis.label}
          </text>
        ) : null}
        {resolvedYAxis.label ? (
          <text
            x={12}
            y={padding.top + plotHeight / 2}
            textAnchor="middle"
            fill="var(--muted-foreground)"
            fontSize="11"
            fontWeight="600"
            transform={`rotate(-90 12 ${padding.top + plotHeight / 2})`}
          >
            {resolvedYAxis.label}
          </text>
        ) : null}
        {series.points.map((point) => {
          const label = `${point.label || point.id}: x ${formatValue(point.x)}, y ${formatValue(point.y)}`;

          return (
            <circle
              key={point.id}
              cx={xScale(point.x)}
              cy={yScale(point.y)}
              r={point.radius}
              fill="var(--primary)"
              fillOpacity="0.45"
              stroke="var(--primary)"
              strokeWidth="1"
              aria-label={label}
              onClick={() => onPointSelect?.(point)}
            >
              <title>{label}</title>
            </circle>
          );
        })}
      </svg>
      {renderChartSvgLegend(resolvedLegend)}
    </div>
  );
}

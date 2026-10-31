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
  truncateChartText,
} from "./shared";

import type { ChartWaterfallSvgProps } from "./types";
import type { JSX } from "react";

export function ChartWaterfallSvg({
  ariaLabel = "Chart waterfall",
  className,
  data,
  formatValue = formatCompactNumber,
  height = 320,
  legend,
  onDatumSelect,
  showValueLabels = true,
  width = 640,
  xAxis,
  yAxis,
}: ChartWaterfallSvgProps): JSX.Element {
  if (data.length === 0) {
    return <ChartEmptyState className={className}>No waterfall data.</ChartEmptyState>;
  }

  const values = data.flatMap((datum) => [datum.start, datum.end, 0]);
  const yDomain = getNumericDomain(values);
  const resolvedXAxis = resolveChartSvgAxis(xAxis);
  const resolvedYAxis = resolveChartSvgAxis(yAxis, formatValue);
  const padding = {
    bottom: resolvedXAxis.visible ? 44 : 32,
    left: resolvedYAxis.visible ? 56 : 32,
    right: 24,
    top: 24,
  };
  const plotWidth = Math.max(1, width - padding.left - padding.right);
  const plotHeight = Math.max(1, height - padding.top - padding.bottom);
  const step = plotWidth / data.length;
  const barWidth = Math.max(8, step * 0.58);
  const yScale = (value: number) => padding.top + (1 - getDomainRatio(value, yDomain)) * plotHeight;
  const resolvedLegend =
    legend === undefined
      ? [
          { color: "var(--primary)", label: "Positive" },
          { color: "var(--destructive)", label: "Negative" },
        ]
      : legend;

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
          y1={yScale(0)}
          y2={yScale(0)}
          stroke="var(--border)"
        />
        {resolvedYAxis.visible
          ? createChartSvgTicks(yDomain, resolvedYAxis.tickCount).map((tick) => {
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
        {resolvedYAxis.visible ? (
          <line
            x1={padding.left}
            x2={padding.left}
            y1={padding.top}
            y2={padding.top + plotHeight}
            stroke="var(--border)"
          />
        ) : null}
        {resolvedXAxis.visible ? (
          <line
            x1={padding.left}
            x2={padding.left + plotWidth}
            y1={padding.top + plotHeight}
            y2={padding.top + plotHeight}
            stroke="var(--border)"
          />
        ) : null}
        {data.map((datum, index) => {
          const x = padding.left + index * step + step / 2 - barWidth / 2;
          const yStart = yScale(datum.start);
          const yEnd = yScale(datum.end);
          const y = Math.min(yStart, yEnd);
          const label = `${datum.label}: ${formatValue(datum.value)}`;

          return (
            <g key={datum.id} aria-label={label} onClick={() => onDatumSelect?.(datum)}>
              <title>{label}</title>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(1, Math.abs(yEnd - yStart))}
                fill={datum.color ?? (datum.negative ? "var(--destructive)" : "var(--primary)")}
                fillOpacity="0.7"
              />
              {showValueLabels ? (
                <text
                  x={x + barWidth / 2}
                  y={Math.max(12, y - 8)}
                  textAnchor="middle"
                  fill="var(--foreground)"
                  fontSize="11"
                  fontWeight="700"
                  paintOrder="stroke"
                  stroke="var(--background)"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  pointerEvents="none"
                >
                  {formatValue(datum.value)}
                </text>
              ) : null}
              {resolvedXAxis.visible ? (
                <text
                  x={x + barWidth / 2}
                  y={height - 12}
                  textAnchor="middle"
                  fill="var(--muted-foreground)"
                  fontSize="11"
                  pointerEvents="none"
                >
                  {truncateChartText(datum.label, Math.max(3, Math.floor(step / 8)))}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {renderChartSvgLegend(resolvedLegend)}
    </div>
  );
}

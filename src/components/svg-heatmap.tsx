import { Fragment } from "react";

import {
  createChartSvgTicks,
  formatCompactNumber,
  getDomainRatio,
  joinClassNames,
  renderChartSvgLegend,
  resolveChartSvgAxis,
} from "./shared";

import type { ChartHeatmapGridProps } from "./types";
import type { JSX } from "react";

export function ChartHeatmapGrid<TProperties = Record<string, unknown>>({
  ariaLabel = "Chart heatmap",
  cells,
  className,
  formatValue = (cell) => `${formatCompactNumber(cell.pointCount)} points`,
  formatX = formatCompactNumber,
  formatY = formatCompactNumber,
  legend,
  onCellSelect,
  xAxis,
  yAxis,
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
  const resolvedXAxis = resolveChartSvgAxis(xAxis, formatX);
  const resolvedYAxis = resolveChartSvgAxis(yAxis, formatY);
  const viewWidth = 160;
  const viewHeight = 100;
  const plot = {
    bottom: resolvedXAxis.visible ? 14 : 2,
    left: resolvedYAxis.visible ? 16 : 2,
    right: 4,
    top: 3,
  };
  const plotWidth = viewWidth - plot.left - plot.right;
  const plotHeight = viewHeight - plot.top - plot.bottom;
  const cellWidth = plotWidth / xBinCount;
  const cellHeight = plotHeight / yBinCount;
  const xDomain = [
    Math.min(...cells.map((cell) => cell.x0)),
    Math.max(...cells.map((cell) => cell.x1)),
  ] as [number, number];
  const yDomain = [
    Math.min(...cells.map((cell) => cell.y0)),
    Math.max(...cells.map((cell) => cell.y1)),
  ] as [number, number];
  const densityLegend =
    legend === undefined
      ? [
          { color: "color-mix(in srgb, var(--primary) 16%, transparent)", label: "Low density" },
          { color: "color-mix(in srgb, var(--primary) 90%, transparent)", label: "High density" },
        ]
      : legend;

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
        {resolvedYAxis.visible
          ? createChartSvgTicks(yDomain, resolvedYAxis.tickCount).map((tick) => {
              const y = plot.top + (1 - getDomainRatio(tick, yDomain)) * plotHeight;

              return (
                <Fragment key={`y-${tick}`}>
                  <line
                    x1={plot.left - 1.5}
                    x2={plot.left}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth="0.35"
                  />
                  <text
                    x={plot.left - 2.2}
                    y={y + 1}
                    textAnchor="end"
                    fill="var(--muted-foreground)"
                    fontSize="3.2"
                  >
                    {resolvedYAxis.formatValue(tick)}
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
        {resolvedYAxis.visible ? (
          <line
            x1={plot.left}
            x2={plot.left}
            y1={plot.top}
            y2={plot.top + plotHeight}
            stroke="var(--border)"
            strokeWidth="0.35"
          />
        ) : null}
        {cells.map((cell) => {
          const x = plot.left + cell.xIndex * cellWidth;
          const y = plot.top + plotHeight - (cell.yIndex + 1) * cellHeight;
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
      {renderChartSvgLegend(densityLegend)}
    </div>
  );
}

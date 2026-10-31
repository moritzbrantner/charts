import { Fragment } from "react";

import {
  createChartSvgTicks,
  formatNullableNumber,
  joinClassNames,
  renderChartSvgLegend,
  resolveChartSvgAxis,
  truncateChartText,
} from "./shared";

import type { ChartBoxPlotSvgProps } from "./types";
import type { JSX } from "react";

export function ChartBoxPlotSvg<TProperties = Record<string, unknown>>({
  ariaLabel = "Chart box plot",
  className,
  data,
  formatValue = formatNullableNumber,
  legend,
  onDatumSelect,
  showValueLabels = false,
  xAxis,
  yAxis,
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
  const resolvedXAxis = resolveChartSvgAxis(xAxis);
  const resolvedYAxis = resolveChartSvgAxis(yAxis, (value) => formatValue(value));
  const plot = {
    bottom: resolvedXAxis.visible ? 14 : 8,
    left: resolvedYAxis.visible ? 16 : 8,
    right: 5,
    top: 8,
  };
  const plotWidth = 100 - plot.left - plot.right;
  const plotHeight = 100 - plot.top - plot.bottom;
  const xStep = plotWidth / Math.max(1, valuedData.length);
  const yForValue = (value: number | null) =>
    value === null ? null : plot.top + (1 - (value - minValue) / span) * plotHeight;
  const yDomain: [number, number] = [minValue, maxValue];
  const resolvedLegend =
    legend === undefined
      ? [
          { color: "var(--primary)", label: "Quartile range" },
          { color: "var(--muted-foreground)", label: "Whisker range" },
        ]
      : legend;

  return (
    <div className={joinClassNames("border border-border/60 bg-muted/20 p-3", className)}>
      <svg viewBox="0 0 100 100" role="img" aria-label={ariaLabel} className="h-72 w-full">
        {resolvedYAxis.visible
          ? createChartSvgTicks(yDomain, resolvedYAxis.tickCount).map((tick) => {
              const y = yForValue(tick) ?? plot.top + plotHeight;

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
                  <line
                    x1={plot.left}
                    x2={plot.left + plotWidth}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeOpacity="0.55"
                    strokeWidth="0.25"
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
        {valuedData.map((datum, datumIndex) => {
          const x = plot.left + datumIndex * xStep + xStep / 2;
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
              {showValueLabels && medianY !== null ? (
                <text
                  x={x}
                  y={Math.max(4, medianY - 2)}
                  textAnchor="middle"
                  fill="var(--foreground)"
                  fontSize="3.2"
                  fontWeight="700"
                  paintOrder="stroke"
                  stroke="var(--background)"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                >
                  {formatValue(datum.median)}
                </text>
              ) : null}
              {resolvedXAxis.visible && valuedData.length <= 12 ? (
                <text
                  x={x}
                  y={98}
                  textAnchor="middle"
                  fill="var(--muted-foreground)"
                  fontSize="3.2"
                >
                  {truncateChartText(datum.label, Math.max(3, Math.floor(xStep / 2)))}
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

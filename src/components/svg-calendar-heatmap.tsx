import {
  ChartEmptyState,
  formatCompactNumber,
  formatNullableNumber,
  joinClassNames,
  renderChartSvgLegend,
} from "./shared";

import type { ChartCalendarHeatmapSvgProps } from "./types";
import type { JSX } from "react";

export function ChartCalendarHeatmapSvg<TProperties = Record<string, unknown>>({
  ariaLabel = "Chart calendar heatmap",
  className,
  data,
  formatDate = formatCalendarDate,
  formatValue = (datum) => formatNullableNumber(datum.value),
  legend,
  onDatumSelect,
  showMonthLabels = true,
  showWeekdayLabels = true,
}: ChartCalendarHeatmapSvgProps<TProperties>): JSX.Element {
  const days = Array.isArray(data) ? data : data.days;

  if (days.length === 0) {
    return <ChartEmptyState className={className}>No calendar heatmap data.</ChartEmptyState>;
  }

  const viewWidth = 160;
  const viewHeight = 104;
  const plot = {
    bottom: 4,
    left: showWeekdayLabels ? 13 : 3,
    right: 3,
    top: showMonthLabels ? 12 : 4,
  };
  const plotWidth = viewWidth - plot.left - plot.right;
  const plotHeight = viewHeight - plot.top - plot.bottom;
  const maxWeek = Math.max(...days.map((day) => day.week));
  const minWeek = Math.min(...days.map((day) => day.week));
  const weekCount = Math.max(1, maxWeek - minWeek + 1);
  const cellWidth = plotWidth / weekCount;
  const cellHeight = plotHeight / 7;
  const values = days.map((day) => day.value).filter((value): value is number => value !== null);
  const minValue = Array.isArray(data)
    ? values.length > 0
      ? Math.min(...values)
      : null
    : data.summary.minValue;
  const maxValue = Array.isArray(data)
    ? values.length > 0
      ? Math.max(...values)
      : null
    : data.summary.maxValue;
  const valueSpan = maxValue !== null && minValue !== null ? Math.max(1, maxValue - minValue) : 1;
  const resolvedLegend =
    legend === undefined
      ? [
          { color: "color-mix(in srgb, var(--primary) 16%, transparent)", label: "Low value" },
          { color: "color-mix(in srgb, var(--primary) 90%, transparent)", label: "High value" },
        ]
      : legend;
  const monthLabels = showMonthLabels ? getCalendarMonthLabels(days, minWeek) : [];

  return (
    <div className={joinClassNames("border border-border/60 bg-muted/20 p-3", className)}>
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        role="img"
        aria-label={ariaLabel}
        className="h-72 w-full"
      >
        {showWeekdayLabels
          ? ["Sun", "Tue", "Thu", "Sat"].map((label, index) => {
              const dayOfWeek = index * 2;
              const y = plot.top + (dayOfWeek + 0.65) * cellHeight;

              return (
                <text
                  key={label}
                  x={plot.left - 2}
                  y={y}
                  textAnchor="end"
                  fill="var(--muted-foreground)"
                  fontSize="3.2"
                >
                  {label}
                </text>
              );
            })
          : null}
        {monthLabels.map((label) => (
          <text
            key={`${label.month}-${label.week}`}
            x={plot.left + label.week * cellWidth}
            y={7}
            fill="var(--muted-foreground)"
            fontSize="3.2"
          >
            {label.month}
          </text>
        ))}
        {days.map((day) => {
          const x = plot.left + (day.week - minWeek) * cellWidth;
          const y = plot.top + day.dayOfWeek * cellHeight;
          const opacity =
            day.value === null || minValue === null || maxValue === null
              ? 0.12
              : 0.18 + ((day.value - minValue) / valueSpan) * 0.72;
          const label = `${formatDate(day.date)}: ${formatValue(day)}, ${formatCompactNumber(
            day.pointCount,
          )} points`;

          return (
            <rect
              key={day.id}
              data-chart-calendar-day={day.id}
              x={x}
              y={y}
              width={Math.max(0, cellWidth - 0.4)}
              height={Math.max(0, cellHeight - 0.4)}
              fill={day.value === null ? "var(--muted-foreground)" : "var(--primary)"}
              fillOpacity={opacity}
              stroke="var(--background)"
              strokeWidth="0.18"
              aria-label={label}
              onClick={() => onDatumSelect?.(day)}
            >
              <title>{label}</title>
            </rect>
          );
        })}
      </svg>
      {renderChartSvgLegend(resolvedLegend)}
    </div>
  );
}

function formatCalendarDate(date: Date) {
  if (!Number.isFinite(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function getCalendarMonthLabels(
  days: Array<{ date: Date; dayOfWeek: number; week: number }>,
  minWeek: number,
) {
  const labels: Array<{ month: string; week: number }> = [];
  let previousMonth = "";

  for (const day of days) {
    const month = new Intl.DateTimeFormat("en", { month: "short" }).format(day.date);

    if (month !== previousMonth && day.dayOfWeek <= 1) {
      labels.push({
        month,
        week: day.week - minWeek,
      });
      previousMonth = month;
    }
  }

  return labels;
}

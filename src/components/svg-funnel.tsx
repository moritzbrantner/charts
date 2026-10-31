import {
  ChartEmptyState,
  formatCompactNumber,
  joinClassNames,
  renderChartSvgLegend,
} from "./shared";

import type { ChartFunnelSvgProps } from "./types";
import type { JSX } from "react";

export function ChartFunnelSvg({
  ariaLabel = "Chart funnel",
  className,
  data,
  formatValue = formatCompactNumber,
  height = 320,
  legend,
  onDatumSelect,
  showValueLabels = true,
  width = 640,
}: ChartFunnelSvgProps): JSX.Element {
  if (data.length === 0) {
    return <ChartEmptyState className={className}>No funnel data.</ChartEmptyState>;
  }

  const padding = 24;
  const maxValue = Math.max(1, ...data.map((datum) => datum.value));
  const stepHeight = (height - padding * 2) / data.length;
  const resolvedLegend =
    legend === undefined
      ? [
          { color: "var(--chart-1)", label: "Largest stage", value: formatValue(maxValue) },
          {
            color: "var(--chart-4)",
            label: "Final stage",
            value: formatValue(data.at(-1)?.value ?? 0),
          },
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
        {data.map((datum, index) => {
          const next = data[index + 1];
          const previous = data[index - 1];
          const topWidth = (datum.value / maxValue) * (width - padding * 2);
          const bottomWidth = ((next?.value ?? datum.value) / maxValue) * (width - padding * 2);
          const y = padding + index * stepHeight;
          const topLeft = (width - topWidth) / 2;
          const bottomLeft = (width - bottomWidth) / 2;
          const label = `${datum.label}: ${formatValue(datum.value)}`;
          const retention =
            previous && previous.value > 0
              ? `${Math.round((datum.value / previous.value) * 100)}%`
              : null;
          const points = [
            `${topLeft},${y}`,
            `${topLeft + topWidth},${y}`,
            `${bottomLeft + bottomWidth},${y + stepHeight - 2}`,
            `${bottomLeft},${y + stepHeight - 2}`,
          ].join(" ");

          return (
            <g key={datum.id} aria-label={label} onClick={() => onDatumSelect?.(datum)}>
              <title>{label}</title>
              <polygon
                points={points}
                fill={datum.color ?? `var(--chart-${(index % 5) + 1})`}
                fillOpacity="0.78"
              />
              {stepHeight > 30 ? (
                <text
                  x={width / 2}
                  y={showValueLabels ? y + stepHeight / 2 - 2 : y + stepHeight / 2 + 4}
                  textAnchor="middle"
                  fill="var(--foreground)"
                  fontSize="12"
                  fontWeight="700"
                  paintOrder="stroke"
                  stroke="var(--background)"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  pointerEvents="none"
                >
                  {datum.label}
                </text>
              ) : null}
              {showValueLabels && stepHeight > 42 ? (
                <text
                  x={width / 2}
                  y={y + stepHeight / 2 + 14}
                  textAnchor="middle"
                  fill="var(--foreground)"
                  fontSize="11"
                  paintOrder="stroke"
                  stroke="var(--background)"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  pointerEvents="none"
                >
                  {retention
                    ? `${formatValue(datum.value)} (${retention})`
                    : formatValue(datum.value)}
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

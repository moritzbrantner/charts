import { Fragment } from "react";

import {
  ChartEmptyState,
  createChartSvgTicks,
  formatCompactNumber,
  formatNullableNumber,
  getDomainRatio,
  getNumericDomain,
  joinClassNames,
  renderChartSvgLegend,
  resolveChartSvgAxis,
  truncateChartText,
} from "./shared";

import type {
  ChartBoxPlotSvgProps,
  ChartFunnelSvgProps,
  ChartHeatmapGridProps,
  ChartScatterSvgProps,
  ChartWaterfallSvgProps,
} from "./types";
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

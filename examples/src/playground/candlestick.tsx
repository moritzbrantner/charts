import { formatCompact, formatHour } from "./data";

import type { PlaygroundLabel } from "./business";
import type { TelemetryProperties } from "./model";
import type { PlaygroundRenderRow } from "./playground-renderer";
import type {
  ChartAxisOrientation,
  ChartDensitySample,
  ChartSampleInteraction,
  ChartValueMode,
} from "@moritzbrantner/charts";

export type PlaygroundCandle = {
  close: number;
  high: number;
  id: string;
  label: string;
  low: number;
  open: number;
  sample: ChartDensitySample<TelemetryProperties>;
  x: number;
};

export function PlaygroundCandlestickChart({
  domain,
  labels,
  onSampleSelect,
  samples,
  selectedSampleIndex,
  showGrid,
  showLabels,
  showThreshold,
  threshold,
  visibleSeriesIds,
}: {
  domain: [number, number];
  labels: PlaygroundLabel[];
  onSampleSelect: (interaction: ChartSampleInteraction<TelemetryProperties>) => void;
  samples: ChartDensitySample<TelemetryProperties>[];
  selectedSampleIndex: number | null;
  showGrid: boolean;
  showLabels: boolean;
  showThreshold: boolean;
  threshold: number;
  visibleSeriesIds: ReadonlySet<string>;
}) {
  const candles = createPlaygroundCandles(samples).filter((candle) =>
    candle.close >= candle.open ? visibleSeriesIds.has("up") : visibleSeriesIds.has("down"),
  );
  const yValues = candles.flatMap((candle) => [candle.high, candle.low, candle.open, candle.close]);
  const minY = Math.min(...yValues, threshold);
  const maxY = Math.max(...yValues, threshold);
  const yPadding = Math.max((maxY - minY) * 0.08, 1);
  const yDomain: [number, number] = [minY - yPadding, maxY + yPadding];
  const width = 960;
  const height = 420;
  const margin = { bottom: 42, left: 58, right: 22, top: 24 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const candleWidth = Math.max(4, Math.min(18, (plotWidth / Math.max(candles.length, 1)) * 0.56));
  const xScale = (x: number) => {
    const span = Math.max(domain[1] - domain[0], Number.EPSILON);

    return margin.left + ((x - domain[0]) / span) * plotWidth;
  };
  const yScale = (value: number) => {
    const span = Math.max(yDomain[1] - yDomain[0], Number.EPSILON);

    return margin.top + (1 - (value - yDomain[0]) / span) * plotHeight;
  };
  const yTicks = createLinearTicks(yDomain, 5);
  const xTicks = candles.filter((_, index) => {
    const step = Math.max(1, Math.floor(candles.length / 5));

    return index % step === 0;
  });
  const thresholdY = yScale(threshold);

  return (
    <div className="h-[28rem] w-full overflow-hidden rounded-md border border-border/60 bg-muted/10">
      <svg
        aria-label="Candle chart"
        className="h-full w-full"
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {showGrid
          ? yTicks.map((tick) => {
              const y = yScale(tick);

              return (
                <line
                  key={tick}
                  x1={margin.left}
                  x2={width - margin.right}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeOpacity="0.7"
                />
              );
            })
          : null}
        {showThreshold ? (
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={thresholdY}
            y2={thresholdY}
            stroke="var(--muted-foreground)"
            strokeDasharray="6 6"
            strokeOpacity="0.7"
          />
        ) : null}
        {candles.map((candle) => {
          const x = xScale(candle.x);
          const highY = yScale(candle.high);
          const lowY = yScale(candle.low);
          const openY = yScale(candle.open);
          const closeY = yScale(candle.close);
          const up = candle.close >= candle.open;
          const color = up ? "var(--chart-2)" : "var(--chart-4)";
          const selected = selectedSampleIndex === candle.sample.index;
          const bodyY = Math.min(openY, closeY);
          const bodyHeight = Math.max(Math.abs(closeY - openY), 2);

          return (
            <g key={candle.id}>
              <line
                x1={x}
                x2={x}
                y1={highY}
                y2={lowY}
                stroke={color}
                strokeWidth={selected ? 3 : 2}
              />
              <rect
                x={x - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                fill={up ? color : "var(--background)"}
                stroke={color}
                strokeWidth={selected ? 3 : 2}
                onClick={(event) =>
                  onSampleSelect({
                    clientX: event.clientX,
                    clientY: event.clientY,
                    domainValue: candle.x,
                    sample: candle.sample,
                  })
                }
              />
            </g>
          );
        })}
        {showLabels
          ? labels.map((label) => {
              const candle = candles.find((candidate) =>
                typeof label.x === "number" ? candidate.x === label.x : candidate.label === label.x,
              );

              if (!candle) {
                return null;
              }

              const x = Math.min(
                width - margin.right - 92,
                Math.max(margin.left, xScale(candle.x)),
              );
              const yValue = typeof label.y === "number" ? label.y : candle.close;
              const y = Math.max(margin.top + 4, yScale(yValue) - 30);

              return (
                <g key={label.id}>
                  <rect
                    x={x}
                    y={y}
                    width="86"
                    height="24"
                    rx="4"
                    fill="var(--background)"
                    stroke="var(--border)"
                  />
                  <text x={x + 8} y={y + 16} fill="var(--foreground)" fontSize="12">
                    {label.text}
                  </text>
                </g>
              );
            })
          : null}
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={height - margin.bottom}
          y2={height - margin.bottom}
          stroke="var(--border)"
        />
        <line
          x1={margin.left}
          x2={margin.left}
          y1={margin.top}
          y2={height - margin.bottom}
          stroke="var(--border)"
        />
        {yTicks.map((tick) => (
          <text
            key={tick}
            x={margin.left - 10}
            y={yScale(tick) + 4}
            fill="var(--muted-foreground)"
            fontSize="12"
            textAnchor="end"
          >
            {formatCompact(tick)}
          </text>
        ))}
        {xTicks.map((candle) => (
          <text
            key={candle.id}
            x={xScale(candle.x)}
            y={height - 14}
            fill="var(--muted-foreground)"
            fontSize="12"
            textAnchor="middle"
          >
            {candle.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function createPlaygroundCandles(
  samples: ChartDensitySample<TelemetryProperties>[],
): PlaygroundCandle[] {
  return samples
    .map((sample): PlaygroundCandle | null => {
      if (
        sample.firstPoint === null ||
        sample.lastPoint === null ||
        sample.minY === null ||
        sample.maxY === null
      ) {
        return null;
      }

      return {
        close: sample.lastPoint.y,
        high: sample.maxY,
        id: `candle-${sample.index}`,
        label: formatHour(sample.x),
        low: sample.minY,
        open: sample.firstPoint.y,
        sample,
        x: sample.x,
      };
    })
    .filter((candle): candle is PlaygroundCandle => candle !== null);
}

export function createLinearTicks(domain: [number, number], count: number) {
  const [min, max] = domain;
  const span = max - min;

  if (span <= 0 || count <= 1) {
    return [min];
  }

  return Array.from({ length: count }, (_, index) => min + (span / (count - 1)) * index);
}

export function createPlaygroundLabels(
  rows: PlaygroundRenderRow[],
  valueMode: ChartValueMode,
  orientation: ChartAxisOrientation = "vertical",
) {
  const valuedRows = rows
    .map((row) => ({
      row,
      value: getPlaygroundRowValue(row, valueMode),
    }))
    .filter((entry): entry is { row: PlaygroundRenderRow; value: number } => entry.value !== null);

  if (valuedRows.length === 0) {
    return [];
  }

  const peak = valuedRows.reduce((highest, entry) =>
    entry.value > highest.value ? entry : highest,
  );
  const last = valuedRows[valuedRows.length - 1];

  return [
    {
      id: "peak",
      placements: ["top", "top-right", "right"] as const,
      priority: 90,
      text: `Peak ${formatCompact(peak.value)}`,
      x: orientation === "horizontal" ? peak.value : peak.row.x,
      y: orientation === "horizontal" ? peak.row.label : peak.value,
    },
    {
      id: "latest",
      placements: ["top", "top-right", "right"] as const,
      priority: 70,
      text: `Latest ${formatCompact(last.value)}`,
      x: orientation === "horizontal" ? last.value : last.row.x,
      y: orientation === "horizontal" ? last.row.label : last.value,
    },
  ];
}

export function getPlaygroundRowValue(row: PlaygroundRenderRow, valueMode: ChartValueMode) {
  const value = row[valueMode];

  return typeof value === "number" ? value : null;
}

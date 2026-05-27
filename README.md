# @moritzbrantner/charts

Density-aware chart indexing helpers for large numeric series.

The package adapts `@moritzbrantner/data-density` bins into chart-shaped samples,
renderer data, viewport summaries, and chart-specific React controls. It does
not own a primary chart renderer; Recharts, SVG, canvas, WebGL, or server-side
renderers can all consume the same sample contract.

## Installation

```sh
bun add @moritzbrantner/charts react recharts
```

The package is published to GitHub Packages. Configure the `@moritzbrantner`
scope in `.npmrc` before installing from a fresh project:

```ini
@moritzbrantner:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`@moritzbrantner/charts` expects React `^19.0.0` and Recharts `^3.0.0` as peer
dependencies. React 18 is intentionally not advertised until it has dedicated
peer and test coverage.

## Breaking migration

This version intentionally cleans up the experimental public API:

- `ChartDensityValueMode` is now `ChartValueMode`.
- `ChartRangeSelector` uses `value` and `onValueChange` instead of
  `activeRangeId` and `onRangeChange`.
- `ChartValueModeSelector` uses `value`, `onValueChange`, and `definitions`
  instead of `valueMode`, `onValueModeChange`, and `modes`.
- `ChartValueModePreview` receives a `definition` instead of a raw `mode`.

## Main APIs

- `createChartDensityIndex(points, options)` / `createChartSeriesIndex(points, options)`
- `createProgressiveChartDensityIndex(points, options)`
- `index.getChartSeries(query)` / `index.getBinnedSeries(query)`
- `createChartDensitySample(bin, valueMode)` / `createChartDensityViewportSummary(series)`
- `createChartRenderData(samples, options)` / `getChartGapAnnotations(samples)`
- `index.getHistogram(query)` / `index.getHeatmap(query)` /
  `index.getGroupedChartSeries(query)`
- `createGroupedChartRenderData(grouped, options)`
- `createChartBandRenderData(samples, options)` / `createChartBoxPlotData(samples, options)`
- `CHART_VALUE_MODE_DEFINITIONS`, `getChartValueModeDefinition(mode)`,
  `getChartValueModeDefinitions(modes)`
- `useProgressiveChartDensity(points, options)` / `useChartBinCount(options)`
- `BinnedChart`, `ChartMetricCard`, `ChartMetricStrip`, `ChartRangeSelector`,
  `ChartValueModeSelector`
- `ChartBackendStatus`, `ChartSampleSparkline`, `ChartHotBinRow`, `ChartValueModePreview`
- `layoutChartLabels`, `doChartLabelRectsIntersect`, `ChartLabelOverlay`

## Composable binned chart

Use `BinnedChart` when a chart should share the same composition model for
styling, responsive binning, render rows, wheel-domain changes, and a minimap.

```tsx
import { Line, LineChart } from "recharts";
import { BinnedChart } from "@moritzbrantner/charts";

export function TrendWithMinimap({ activeDomain, fullDomain, index, setActiveDomain }) {
  return (
    <BinnedChart
      chartClassName="h-72 w-full"
      config={{ average: { label: "Average", color: "var(--chart-1)" } }}
      domain={activeDomain}
      fullDomain={fullDomain}
      index={index}
      onDomainChange={setActiveDomain}
      renderDataOptions={{ modes: ["average"] }}
      valueMode="average"
    >
      {({ rows }) => (
        <LineChart data={rows}>
          <Line dataKey="average" dot={false} stroke="var(--color-average)" />
        </LineChart>
      )}
    </BinnedChart>
  );
}
```

## Responsive Recharts chart

```tsx
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  createChartDensityIndex,
  createChartRenderData,
  useChartBinCount,
} from "@moritzbrantner/charts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@moritzbrantner/ui";

const index = createChartDensityIndex(points);

export function DenseAreaChart() {
  const { containerRef, targetBinCount } = useChartBinCount();
  const series = index.getChartSeries({
    includeEmptyBins: true,
    targetBinCount,
    valueMode: "average",
    xDomain: [0, 1_440],
  });
  const chartData = createChartRenderData(series.samples, {
    modes: ["average"],
    xLabel: (sample) => `${Math.round(sample.x)}m`,
  }).rows;

  return (
    <div ref={containerRef}>
      <ChartContainer
        className="min-h-72"
        config={{ average: { label: "Average", color: "var(--chart-1)" } }}
      >
        <AreaChart data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            dataKey="average"
            fill="var(--color-average)"
            fillOpacity={0.16}
            stroke="var(--color-average)"
            type="monotone"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
```

## Linked detail pane

```tsx
import { useState } from "react";
import { ChartSampleSparkline, useProgressiveChartDensity } from "@moritzbrantner/charts";

export function LinkedChartDetails({ points }) {
  const { index } = useProgressiveChartDensity(points);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(null);
  const series = index.getChartSeries({
    includeEmptyBins: true,
    targetBinCount: 120,
    xDomain: [0, 1_440],
  });
  const selectedSample =
    series.samples.find((sample) => sample.index === selectedSampleIndex) ?? null;
  const point = selectedSample?.firstPoint
    ? index.getPointById(selectedSample.firstPoint.id)
    : null;

  return (
    <>
      <ChartSampleSparkline
        samples={series.samples}
        domain={series.summary.xDomain}
        selectedSampleIndex={selectedSampleIndex}
        onSampleSelect={(sample) => setSelectedSampleIndex(sample.index)}
      />
      <pre>{JSON.stringify(point?.properties ?? null, null, 2)}</pre>
    </>
  );
}
```

## Manual WASM warmup and fallback display

```tsx
import { ChartBackendStatus, useProgressiveChartDensity } from "@moritzbrantner/charts";

export function BackendPanel({ points }) {
  const { status, warmWasmNow } = useProgressiveChartDensity(points, {
    progressive: {
      warmup: "manual",
    },
  });

  return (
    <ChartBackendStatus
      status={status}
      onWarmNow={warmWasmNow}
      formatError={(error) => `Using hybrid JS fallback: ${String(error)}`}
    />
  );
}
```

## Server-side or renderer-agnostic data

```ts
import { createChartDensityIndex, createChartRenderData } from "@moritzbrantner/charts";

const index = createChartDensityIndex(points, { backend: "hybrid-js" });
const series = index.getChartSeries({
  includeEmptyBins: true,
  targetBinCount: 96,
  valueMode: "sum",
  xDomain: [360, 720],
});
const payload = createChartRenderData(series.samples, {
  gapBehavior: "preserve",
  includeMetrics: true,
  modes: ["sum", "count"],
});
```

## Choosing value modes

Use value-mode definitions when controls, axes, previews, and tooltips need
labels or formatting:

```ts
import { getChartValueModeDefinitions } from "@moritzbrantner/charts";

const definitions = getChartValueModeDefinitions(["average", "count", "max"]);
```

- `average`: mean y value per bin, usually best for trend lines.
- `count`: source-point count per bin, usually best as bars.
- `max`: highest y in each bin, useful for peaks and thresholds.
- `min`: lowest y in each bin, useful for floors and ranges.
- `sum`: total y in each bin, useful for volume and totals.
- `p50`, `p75`, `p90`, `p95`, `p99`: percentile values per bin, useful for
  medians, percentile lines, and latency-style dashboards. `p10` and `p25` are
  also available when explicitly requested for band and box-plot helpers.

## Distribution and grouped charts

Use the advanced index methods when a viewport needs distribution, heatmap, or
grouped data derived from the indexed source points:

```ts
const histogram = index.getHistogram({
  bucketCount: 24,
  valueAccessor: "y",
  xDomain: [360, 720],
});

const heatmap = index.getHeatmap({
  xBinCount: 48,
  xDomain: [360, 720],
  yBinCount: 12,
});

const grouped = index.getGroupedChartSeries({
  groupBy: { property: "plan" },
  targetBinCount: 96,
  valueMode: "count",
  xDomain: [360, 720],
});
const stackedRows = createGroupedChartRenderData(grouped, {
  xLabel: (sample) => `${Math.round(sample.x)}m`,
}).rows;
```

Percentile-enriched series power median lines, interquartile bands, and box plots:

```ts
const percentileSeries = index.getChartSeries({
  includeEmptyBins: true,
  percentiles: ["p25", "p50", "p75"],
  targetBinCount: 96,
  xDomain: [360, 720],
});

const bandRows = createChartBandRenderData(percentileSeries.samples, {
  lower: "p25",
  center: "p50",
  upper: "p75",
}).rows;
const boxPlotData = createChartBoxPlotData(percentileSeries.samples);
```

## Gap behavior

`createChartRenderData` supports four empty-bin policies:

- `preserve`: keep empty bins with `null` values. This is the default.
- `connect`: drop empty bins from rows and return gap annotations.
- `drop`: drop empty bins without annotations.
- `zero-fill`: keep empty bins and convert missing values to `0`.

```ts
const connected = createChartRenderData(series.samples, { gapBehavior: "connect" });
console.log(connected.annotations);
```

## Collision-safe labels

Use `ChartLabelOverlay` inside Recharts charts when explicit annotations should stay readable
without covering chart marks or other labels. The overlay converts data coordinates through the
active Recharts axes, measures and wraps label text with `@chenglou/pretext`, then places labels
around their anchors. Lower-priority labels are hidden when no clean placement is available.

```tsx
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartLabelOverlay } from "@moritzbrantner/charts";

function AnnotatedTrend({ rows }) {
  return (
    <LineChart data={rows}>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="label" />
      <YAxis />
      <Line dataKey="current" dot={false} stroke="var(--color-current)" />
      <ChartLabelOverlay
        labels={[
          {
            id: "launch",
            priority: 100,
            text: "Launch",
            x: "D23 00:00",
            y: 142,
          },
        ]}
        obstacles={rows.map((row) => ({
          id: row.label,
          kind: "mark",
          radius: 4,
          x: row.label,
          y: row.current,
        }))}
      />
    </LineChart>
  );
}
```

For renderer-agnostic use, call `layoutChartLabels(labels, options)` with pixel coordinates and
render the returned `ChartPlacedLabel` objects yourself. The `font` option should match the
rendered SVG text. Prefer a named font such as `Inter`; `system-ui` can be inaccurate for Pretext
measurement on some platforms.

## Progressive strategy

By default, `createChartDensityIndex` renders immediately from `hybrid-js`, warms
a `wasm-index` in an idle slot, then serves later queries from the WASM backend.
Pass `backend: "hybrid-js"` or `backend: "wasm-index"` to force one backend.

Open the local examples app for a combined example with responsive binning,
value-mode previews, viewport totals, sample selection, gap-safe render data,
and source-point lookup.

## Local examples

Run the examples page with:

```sh
bun dev
```

Vite serves the React examples app from `examples/` and aliases
`@moritzbrantner/charts` to the local `src/index.ts` entrypoint.

## API documentation

Generate the TypeDoc API reference with:

```sh
bun run docs
```

`bun run docs:check` validates the TypeDoc configuration without writing the
generated site.

## Verification

- `bun run test`
- `bun run test:coverage`
- `bun run docs:check`
- `bun run lint`
- `bun run format:check`
- `bun run build:examples`
- `bun run pack:check`
- `bun run test:e2e`
- `bun run build && bun run bench:large-data`

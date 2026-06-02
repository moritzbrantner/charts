# @moritzbrantner/charts

[![CI](https://github.com/moritzbrantner/charts/actions/workflows/ci.yml/badge.svg)](https://github.com/moritzbrantner/charts/actions/workflows/ci.yml)
[![Docs](https://github.com/moritzbrantner/charts/actions/workflows/docs.yml/badge.svg)](https://github.com/moritzbrantner/charts/actions/workflows/docs.yml)
[![npm version](https://img.shields.io/npm/v/@moritzbrantner/charts.svg)](https://www.npmjs.com/package/@moritzbrantner/charts)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Density-aware chart indexing helpers for large numeric series.

The package adapts `@moritzbrantner/data-density` bins into chart-shaped samples,
renderer data, viewport summaries, and chart-specific React controls. It does
not own a primary chart renderer; Recharts, SVG, canvas, WebGL, or server-side
renderers can all consume the same sample contract.

## What this solves

Dense charts need more than point slicing. `@moritzbrantner/charts` builds a
queryable density index and returns chart-ready samples for the current viewport,
including summaries, percentiles, gap annotations, grouped series, distribution
views, and React controls for Recharts-backed interfaces.

## Installation

```sh
bun add @moritzbrantner/charts react react-dom recharts
```

The package is published to public npm.

## Support matrix

| Dependency | Supported range             | Notes                                                         |
| ---------- | --------------------------- | ------------------------------------------------------------- |
| React      | `^19.0.0`                   | Required for exported React controls.                         |
| React DOM  | `^19.0.0`                   | Required for examples and React control rendering.            |
| Recharts   | `^3.0.0`                    | Used by the bundled chart components and examples.            |
| TypeScript | Repository compiler version | Public types are checked from the generated package artifact. |

## API stability

The package is pre-`1.0`. Public APIs may change, but intentional changes are
tracked through Changesets, changelog entries, and the committed API report.
Breaking changes should include migration notes.

## Breaking migration

This version intentionally cleans up the experimental public API:

- `ChartDensityValueMode` is now `ChartValueMode`.
- `ChartRangeSelector` uses `value` and `onValueChange` instead of
  `activeRangeId` and `onRangeChange`.
- `ChartValueModeSelector` uses `value`, `onValueChange`, and `definitions`
  instead of `valueMode`, `onValueModeChange`, and `modes`.
- `ChartValueModePreview` receives a `definition` instead of a raw `mode`.

## Quick start

```ts
import { createChartDensityIndex, createChartRenderData } from "@moritzbrantner/charts";

const index = createChartDensityIndex(points, { backend: "hybrid-js" });
const series = index.getChartSeries({
  includeEmptyBins: true,
  targetBinCount: 120,
  valueMode: "average",
  xDomain: [0, 1_440],
});
const rows = createChartRenderData(series.samples, {
  modes: ["average", "count"],
  xLabel: (sample) => `${Math.round(sample.x)}m`,
}).rows;
```

## Core concepts

- Density index: `createChartDensityIndex` adapts numeric points into a reusable
  viewport-queryable index.
- Samples: `index.getChartSeries(query)` returns one `ChartDensitySample` per
  visible bin with counts, y aggregates, percentiles, and first/last source
  points.
- Render data: `createChartRenderData` converts samples into renderer-friendly
  rows for Recharts, SVG, canvas, WebGL, or server-side payloads.
- Gap behavior: empty bins can be preserved, connected with annotations,
  dropped, or zero-filled.
- Progressive backend: `createProgressiveChartDensityIndex` renders immediately
  through the hybrid JS backend and can warm the WASM index for later queries.
- Labels: `layoutChartLabels` and `ChartLabelOverlay` place annotations while
  avoiding collisions with chart marks and other labels.

## API overview

- `createChartDensityIndex(points, options)` / `createChartSeriesIndex(points, options)`
- `createProgressiveChartDensityIndex(points, options)`
- `index.getChartSeries(query)` / `index.getBinnedSeries(query)`
- `createChartDensitySample(bin, valueMode)` / `createChartDensityViewportSummary(series)`
- `createChartRenderData(samples, options)` / `getChartGapAnnotations(samples)`
- `index.getHistogram(query)` / `index.getHeatmap(query)` /
  `index.getGroupedChartSeries(query)` / `index.getChartPoints(query)` /
  `index.getScatter(query)`
- `createGroupedChartRenderData(grouped, options)`
- `createChartBandRenderData(samples, options)` / `createChartBoxPlotData(samples, options)`
- `createChartWaterfallData(data, options)` / `createChartFunnelData(data)`
- `createChartTreemapLayout(root, options)` / `createChartSunburstLayout(root, options)` /
  `createChartIcicleLayout(root, options)` / `createChartCirclePackLayout(root, options)` /
  `createChartTreeLayout(root, options)` / `createChartFlameGraphLayout(root, options)` /
  `createChartRadialTreeLayout(root, options)` /
  `createChartIndentedTreeLayout(root, options)`
- `CHART_VALUE_MODE_DEFINITIONS`, `getChartValueModeDefinition(mode)`,
  `getChartValueModeDefinitions(modes)`
- `useProgressiveChartDensity(points, options)` / `useChartBinCount(options)`
- `BinnedChart`, `ChartMetricCard`, `ChartMetricStrip`, `ChartRangeSelector`,
  `ChartValueModeSelector`
- `ChartBackendStatus`, `ChartSampleSparkline`, `ChartHotBinRow`, `ChartValueModePreview`
- `ChartScatterSvg`, `ChartWaterfallSvg`, `ChartFunnelSvg`, `ChartTreemapSvg`,
  `ChartSunburstSvg`, `ChartIcicleSvg`, `ChartCirclePackSvg`, `ChartTreeSvg`,
  `ChartFlameGraphSvg`, `ChartRadialTreeSvg`, `ChartIndentedTreeSvg`,
  `ChartXAxisNavigationMenu`
- `layoutChartLabels`, `doChartLabelRectsIntersect`, `ChartLabelOverlay`

## Composable binned chart

Use `BinnedChart` when a chart should share the same composition model for
styling, responsive binning, render rows, direct domain navigation, wheel-domain
changes, and a minimap. When `onDomainChange` is provided, users can drag the
main chart to pan, Shift-drag or Alt-drag to zoom to a selected range,
double-click to reset to `fullDomain`, scroll horizontally or Shift-scroll to
pan, and Ctrl-scroll or Meta-scroll to zoom around the pointer.

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

Set `drag={false}` or `dragOptions={{ disabled: true }}` when a chart needs to
reserve pointer drags for custom overlays or renderer-specific interactions.

## Interactive side legend

Use `ChartWithLegend`, `ChartSeriesLegend`, and `useChartSeriesVisibility`
when a chart needs side controls for hiding and showing individual series. The
visibility hook is renderer-agnostic: it tells the caller which ids are visible,
and the caller decides whether to render Recharts marks, SVG paths, canvas
layers, or another renderer.

```tsx
import { Line, LineChart } from "recharts";
import {
  ChartSeriesLegend,
  ChartWithLegend,
  useChartSeriesVisibility,
} from "@moritzbrantner/charts";
import { ChartContainer } from "@moritzbrantner/ui";

const legendItems = [
  { id: "average", label: "Average", color: "var(--chart-1)" },
  { id: "rolling", label: "Rolling", color: "var(--chart-2)" },
];

export function TrendWithLegend({ rows }) {
  const visibility = useChartSeriesVisibility({
    itemIds: legendItems.map((item) => item.id),
  });

  return (
    <ChartWithLegend
      legend={
        <ChartSeriesLegend
          items={legendItems}
          hiddenIds={visibility.hiddenIds}
          onHiddenIdsChange={visibility.setHiddenIds}
        />
      }
    >
      <ChartContainer
        className="h-72 w-full"
        config={{
          average: { label: "Average", color: "var(--chart-1)" },
          rolling: { label: "Rolling", color: "var(--chart-2)" },
        }}
      >
        <LineChart data={rows}>
          {visibility.isVisible("average") ? (
            <Line dataKey="average" dot={false} stroke="var(--color-average)" />
          ) : null}
          {visibility.isVisible("rolling") ? (
            <Line dataKey="rolling" dot={false} stroke="var(--color-rolling)" />
          ) : null}
        </LineChart>
      </ChartContainer>
    </ChartWithLegend>
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

## Axis transforms

Use `ChartAxisTransformMenu` when a Recharts-backed chart should expose axis
range and scale controls. The helper validates log scale domains and falls back
to linear rendering when a data domain includes zero or negative values.

```tsx
import { useState } from "react";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartAxisTransformMenu,
  resolveChartAxisTransformStatus,
  type ChartAxisTransform,
} from "@moritzbrantner/charts";

export function TransformableChart({ rows }) {
  const [yAxis, setYAxis] = useState<ChartAxisTransform>({
    domain: null,
    scale: "linear",
  });
  const status = resolveChartAxisTransformStatus({
    dataDomain: yAxis.domain ?? [1, 1_000],
    scale: yAxis.scale,
  });

  return (
    <LineChart data={rows}>
      <XAxis dataKey="x" tickFormatter={(value) => `${value}m`} type="number" />
      <YAxis domain={yAxis.domain ?? ["auto", "auto"]} scale={status.renderScale} />
      <Line dataKey="average" dot={false} type="monotone" />
      <ChartAxisTransformMenu
        axis="y"
        dataDomain={[1, 1_000]}
        onValueChange={setYAxis}
        value={yAxis}
      />
    </LineChart>
  );
}
```

For switched axes, render Recharts with `layout="vertical"`, place numeric values
on `XAxis type="number"`, and place binned labels on `YAxis type="category"`.

Use `ChartXAxisNavigationMenu` when right-clicking the x-axis should navigate the
visible domain. The menu can zoom around the clicked x value, pan by one visible
window, reset to the full domain, or apply preset ranges.

```tsx
<LineChart data={rows}>
  <XAxis dataKey="x" domain={domain} type="number" />
  <YAxis />
  <Line dataKey="average" dot={false} />
  <ChartXAxisNavigationMenu
    domain={domain}
    fullDomain={fullDomain}
    formatValue={(value) => `${value}m`}
    onDomainChange={setDomain}
    ranges={ranges}
  />
</LineChart>
```

## Animation

`getRechartsAnimationProps` provides consistent Recharts mark animation props and
respects reduced-motion by default. `useChartAnimatedDomain` interpolates numeric
axis domains for rescale transitions, while `useChartPlaybackDomain` derives a
domain that expands over time for play/pause chart playback.

```tsx
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { getRechartsAnimationProps, useChartAnimatedDomain } from "@moritzbrantner/charts";

export function AnimatedChart({ rows, yDomain }) {
  const animatedYDomain = useChartAnimatedDomain({
    domain: yDomain,
    enabled: true,
  });
  const animation = getRechartsAnimationProps({
    enabled: true,
    mode: "draw-and-rescale",
  });

  return (
    <AreaChart data={rows}>
      <XAxis dataKey="x" type="number" />
      <YAxis domain={animatedYDomain} />
      <Area dataKey="average" type="monotone" {...animation} />
    </AreaChart>
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

Use the advanced index methods when a viewport needs distribution, heatmap,
scatter/bubble, or grouped data derived from the indexed source points:

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

const scatter = index.getScatter({
  maxPoints: 2_000,
  sizeAccessor: { metric: "revenue" },
  xDomain: [360, 720],
});
```

Percentile-enriched series power median lines, interquartile bands, and box
plots. Separate layout helpers cover waterfall, funnel, treemap, and sunburst
views:

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
const waterfallRows = createChartWaterfallData([
  { label: "Baseline", value: 120 },
  { label: "Expansion", value: 42 },
  { label: "Credits", value: -18 },
]);
const funnelRows = createChartFunnelData([
  { label: "Visits", value: 1_000 },
  { label: "Trials", value: 620 },
  { label: "Paid", value: 180 },
]);
const treemapNodes = createChartTreemapLayout(hierarchy, { width: 640, height: 320 });
const sunburstNodes = createChartSunburstLayout(hierarchy, { outerRadius: 160 });
const icicleNodes = createChartIcicleLayout(hierarchy, { width: 640, height: 320 });
const circlePackNodes = createChartCirclePackLayout(hierarchy, { width: 340, height: 340 });
const treeNodes = createChartTreeLayout(hierarchy, { width: 640, height: 320 });
const flameGraphNodes = createChartFlameGraphLayout(hierarchy, { width: 640, height: 320 });
const radialTreeNodes = createChartRadialTreeLayout(hierarchy, { width: 340, height: 340 });
const indentedTreeNodes = createChartIndentedTreeLayout(hierarchy, { width: 640 });
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

The `wasm-index` backend is provided by `@moritzbrantner/viz-engine`. It owns
compact numeric arrays for sorted x/y values and metric columns, and currently
accelerates binning, percentiles, histograms, and heatmaps. Grouped series,
render-row shaping, gap annotations, React controls, label layout, and derived
analytics stay in TypeScript so the public API remains renderer-agnostic and
easy to compose.

Use `hybrid-js` when you need the smallest runtime surface or are running in an
environment that does not allow WebAssembly. Use `wasm-index` when you want the
native kernel immediately and can pay construction cost up front. Use
`progressive` for interactive screens: the first render uses JavaScript, then
queries switch to WASM after warmup.

The WASM binary is embedded by `@moritzbrantner/viz-engine`, so consumers do not
need a special `.wasm` asset loader for the package import.
Benchmarks generally show histograms, heatmaps, and repeated packed series
queries as the primary WASM win cases.

Each index may expose `getBackendCapabilities()` for runtime inspection:

```ts
const capabilities = index.getBackendCapabilities?.();

if (capabilities?.usesWasm) {
  // The active backend is using the Rust/WASM kernel.
}
```

Open the local examples app for a combined example with responsive binning,
value-mode previews, viewport totals, sample selection, gap-safe render data,
and source-point lookup.

## D3-inspired kernel roadmap

The project is intentionally narrower than D3. The goal is a composable chart
data kernel, not a full visualization framework. Near-term kernel modules are:

- density indexes and viewport summaries
- percentile, histogram, and heatmap kernels
- future contour and bin transforms
- future stack and layout kernels
- future worker-backed indexing for non-blocking construction

## Examples app

The local examples app covers:

- responsive dense line/area charts
- grouped and stacked charts
- histogram and heatmap views
- percentile bands and box plots
- scatter, bubble, waterfall, funnel, treemap, and sunburst views
- collision-safe label overlays
- progressive backend status
- gap behavior and source-point lookup

## Local examples

Run the examples page with:

```sh
bun dev
```

Vite serves the React examples app from `examples/` and aliases
`@moritzbrantner/charts` to the local `src/index.ts` entrypoint.

## API documentation

Published API documentation is available at
<https://moritzbrantner.github.io/charts/>.

Generate the TypeDoc API reference with:

```sh
bun run docs
```

`bun run docs:check` validates the TypeDoc configuration without writing the
generated site.

## Verification

- `bun run verify`
- `bun run test`
- `bun run test:coverage`
- `bun run api:check`
- `bun run docs:check`
- `bun run lint`
- `bun run format:check`
- `bun run build:examples`
- `bun run pack:check`
- `bun run test:e2e`
- `bun run build && bun run bench:large-data`

## Releases

Releases are managed with Changesets and published to public npm with provenance
from GitHub Actions. Add a release note with:

```sh
bun run changeset
```

Versioning and changelog updates are generated by the release workflow.

See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for release gates, benchmark
budgets, and `1.0` readiness criteria.

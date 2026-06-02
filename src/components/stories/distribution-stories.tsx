import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartBoxPlotSvg,
  ChartHeatmapGrid,
  ChartPanel,
  ChartScatterSvg,
  createChartBoxPlotData,
  createChartDensityIndex,
} from "@moritzbrantner/charts";

import { createTelemetryPoints } from "../../testing/chart-fixtures";

import { formatStoryNumber, StoryChartContainer, StoryFrame } from "./story-support";

export function HistogramStory() {
  const index = useMemo(() => createChartDensityIndex(createTelemetryPoints()), []);
  const histogram = useMemo(
    () =>
      index.getHistogram({
        bucketCount: 16,
        includeEmptyBuckets: true,
        valueAccessor: { metric: "revenue" },
        xDomain: [0, 720],
      }),
    [index],
  );
  const rows = histogram.buckets.map((bucket) => ({
    count: bucket.pointCount,
    label: `${Math.round(bucket.value0)}-${Math.round(bucket.value1)}`,
  }));

  return (
    <StoryFrame title="Histogram">
      <ChartPanel title="Revenue distribution" description="Binned by metric value.">
        <StoryChartContainer className="h-80 w-full">
          <BarChart data={rows} margin={{ bottom: 8, left: 4, right: 16, top: 16 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" minTickGap={16} />
            <YAxis tickFormatter={formatStoryNumber} width={42} />
            <Bar dataKey="count" fill="var(--color-value)" isAnimationActive={false} />
          </BarChart>
        </StoryChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

export function HeatmapStory() {
  const index = useMemo(() => createChartDensityIndex(createTelemetryPoints()), []);
  const heatmap = useMemo(
    () =>
      index.getHeatmap({
        xBinCount: 24,
        xDomain: [0, 720],
        yBinCount: 12,
      }),
    [index],
  );

  return (
    <StoryFrame title="Heatmap">
      <ChartPanel title="Density heatmap" description="Normalized count by x/y cell.">
        <ChartHeatmapGrid cells={heatmap.cells} />
      </ChartPanel>
    </StoryFrame>
  );
}

export function BoxPlotStory() {
  const index = useMemo(() => createChartDensityIndex(createTelemetryPoints()), []);
  const series = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        percentiles: ["p25", "p50", "p75"],
        targetBinCount: 18,
        valueMode: "p50",
        xDomain: [0, 720],
      }),
    [index],
  );

  return (
    <StoryFrame title="Box plot">
      <ChartPanel title="Percentile spread" description="Whiskers and quartiles by time window.">
        <ChartBoxPlotSvg data={createChartBoxPlotData(series.samples)} />
      </ChartPanel>
    </StoryFrame>
  );
}

export function ScatterBubbleStory() {
  const index = useMemo(() => createChartDensityIndex(createTelemetryPoints()), []);
  const scatter = useMemo(() => index.getScatter({ maxPoints: 420, xDomain: [0, 720] }), [index]);
  const bubble = useMemo(
    () =>
      index.getScatter({ maxPoints: 420, sizeAccessor: { metric: "revenue" }, xDomain: [0, 720] }),
    [index],
  );

  return (
    <StoryFrame title="Scatter and bubble">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Scatter" description="Sampled source points in the active x domain.">
          <ChartScatterSvg series={scatter} />
        </ChartPanel>
        <ChartPanel title="Bubble" description="Bubble radius uses revenue metrics.">
          <ChartScatterSvg ariaLabel="Bubble chart" series={bubble} />
        </ChartPanel>
      </div>
    </StoryFrame>
  );
}

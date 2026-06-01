import { ChartContainer, type ChartConfig } from "@moritzbrantner/ui";
import { useMemo, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  BinnedChart,
  ChartAxisTransformMenu,
  ChartAnomalyMarkerList,
  ChartBackendStatus,
  ChartBoxPlotSvg,
  ChartFunnelSvg,
  ChartHeatmapGrid,
  ChartLabelOverlay,
  ChartPanel,
  ChartRangeSelector,
  ChartSampleSparkline,
  ChartScatterSvg,
  ChartSeriesLegend,
  ChartSunburstSvg,
  ChartThresholdMarker,
  ChartTreemapSvg,
  ChartWaterfallSvg,
  ChartXAxisNavigationMenu,
  ChartValueModeSelector,
  ChartYAxisRangeMenu,
  createChartBoxPlotData,
  createChartDensityIndex,
  createChartFunnelData,
  createChartRenderData,
  createChartSunburstLayout,
  createChartTreemapLayout,
  createChartWaterfallData,
  createGroupedChartRenderData,
  getRechartsAnimationProps,
  getChartAnomalyAnnotations,
  getChartThresholdAnnotations,
  useChartSeriesVisibility,
  type ChartAxisTransform,
  type ChartAxisRange,
  type ChartGapBehavior,
  type ChartRange,
  type ChartValueMode,
} from "@moritzbrantner/charts";

import {
  createGroupedPlanPoints,
  createOutlierPoints,
  createSparsePoints,
  createTelemetryPoints,
} from "./testing/chart-fixtures";

import type { Meta, StoryObj } from "@storybook/react-vite";

const chartConfig = {
  average: { color: "hsl(214 86% 46%)", label: "Average" },
  count: { color: "hsl(173 73% 32%)", label: "Count" },
  enterprise: { color: "hsl(214 86% 46%)", label: "Enterprise" },
  scale: { color: "hsl(173 73% 32%)", label: "Scale" },
  starter: { color: "hsl(38 92% 50%)", label: "Starter" },
  value: { color: "hsl(214 86% 46%)", label: "Value" },
} satisfies ChartConfig;

const ranges: ChartRange[] = [
  {
    description: "The most recent operating window.",
    domain: [480, 720],
    id: "recent",
    label: "Recent",
  },
  {
    description: "Launch and recovery period.",
    domain: [360, 600],
    id: "launch",
    label: "Launch",
  },
  {
    description: "Full deterministic fixture.",
    domain: [0, 720],
    id: "full",
    label: "Full",
  },
];

const meta = {
  parameters: {
    layout: "fullscreen",
  },
  title: "Charts/Quality",
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const DenseTrend: Story = {
  name: "BinnedChart/DenseTrend",
  render: () => <DenseTrendStory />,
};

export const GapBehaviors: Story = {
  name: "BinnedChart/GapBehaviors",
  render: () => <GapBehaviorsStory />,
};

export const GroupedStacked: Story = {
  name: "BinnedChart/GroupedStacked",
  render: () => <GroupedStackedStory />,
};

export const Histogram: Story = {
  name: "Distribution/Histogram",
  render: () => <HistogramStory />,
};

export const Heatmap: Story = {
  name: "Distribution/Heatmap",
  render: () => <HeatmapStory />,
};

export const BoxPlot: Story = {
  name: "Distribution/BoxPlot",
  render: () => <BoxPlotStory />,
};

export const ScatterBubble: Story = {
  name: "Distribution/ScatterBubble",
  render: () => <ScatterBubbleStory />,
};

export const WaterfallFunnel: Story = {
  name: "Business/WaterfallFunnel",
  render: () => <WaterfallFunnelStory />,
};

export const HierarchyCharts: Story = {
  name: "Hierarchy/TreemapSunburst",
  render: () => <HierarchyChartsStory />,
};

export const CrowdedOverlay: Story = {
  name: "Labels/CrowdedOverlay",
  render: () => <CrowdedOverlayStory />,
};

export const RangeSelector: Story = {
  name: "Controls/RangeSelector",
  render: () => <RangeSelectorStory />,
};

export const ValueModeSelector: Story = {
  name: "Controls/ValueModeSelector",
  render: () => <ValueModeSelectorStory />,
};

export const SeriesLegend: Story = {
  name: "Controls/SeriesLegend",
  render: () => <SeriesLegendStory />,
};

export const YAxisRangeMenu: Story = {
  name: "Controls/YAxisRangeMenu",
  render: () => <YAxisRangeMenuStory />,
};

export const AxisTransformMenu: Story = {
  name: "Controls/AxisTransformMenu",
  render: () => <AxisTransformMenuStory />,
};

export const XAxisNavigationMenu: Story = {
  name: "Controls/XAxisNavigationMenu",
  render: () => <XAxisNavigationMenuStory />,
};

export const AxisTransforms: Story = {
  name: "Charts/AxisTransforms",
  render: () => <AxisTransformsStory />,
};

export const AnimatedTrend: Story = {
  name: "Charts/AnimatedTrend",
  render: () => <AnimatedTrendStory />,
};

export const BackendStatus: Story = {
  name: "Status/BackendStatus",
  render: () => <BackendStatusStory />,
};

export const InteractiveSamples: Story = {
  name: "Sparkline/InteractiveSamples",
  render: () => <InteractiveSamplesStory />,
};

export const ThresholdsAndAnomalies: Story = {
  name: "Annotations/ThresholdsAndAnomalies",
  render: () => <ThresholdsAndAnomaliesStory />,
};

function StoryFrame({ children, title }: { children: ReactNode; title: string }) {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {children}
      </div>
    </main>
  );
}

function DenseTrendStory() {
  const points = useMemo(() => createTelemetryPoints(), []);
  const index = useMemo(() => createChartDensityIndex(points), [points]);
  const [domain, setDomain] = useState<[number, number]>(ranges[0].domain);
  const [valueMode, setValueMode] = useState<ChartValueMode>("average");

  return (
    <StoryFrame title="Dense trend">
      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <ChartPanel title="Viewport" description="Deterministic range and value controls.">
          <div className="grid gap-4">
            <ChartRangeSelector
              ranges={ranges}
              value={ranges.find((range) => rangesEqual(range.domain, domain))?.id ?? "recent"}
              onValueChange={(rangeId) => {
                const range = ranges.find((candidate) => candidate.id === rangeId);

                if (range) {
                  setDomain(range.domain);
                }
              }}
            />
            <ChartValueModeSelector value={valueMode} onValueChange={setValueMode} />
          </div>
        </ChartPanel>
        <ChartPanel title="Revenue density" description="Responsive bins with a draggable minimap.">
          <BinnedChart
            chartClassName="h-80 w-full"
            config={chartConfig}
            domain={domain}
            fullDomain={[0, 720]}
            index={index}
            onDomainChange={setDomain}
            valueMode={valueMode}
          >
            {({ rows }) => (
              <LineChart data={rows} margin={{ bottom: 8, left: 4, right: 16, top: 16 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" minTickGap={30} />
                <YAxis width={48} />
                <Line
                  dataKey="value"
                  dot={false}
                  isAnimationActive={false}
                  stroke="var(--color-average)"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            )}
          </BinnedChart>
        </ChartPanel>
      </div>
    </StoryFrame>
  );
}

function GapBehaviorsStory() {
  const points = useMemo(() => createSparsePoints(), []);
  const index = useMemo(() => createChartDensityIndex(points), [points]);
  const samples = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 72,
        valueMode: "average",
        xDomain: [0, 720],
      }).samples,
    [index],
  );
  const behaviors: ChartGapBehavior[] = ["preserve", "connect", "drop", "zero-fill"];

  return (
    <StoryFrame title="Gap behaviors">
      <div className="grid gap-4 md:grid-cols-2">
        {behaviors.map((behavior) => {
          const rows = createChartRenderData(samples, { gapBehavior: behavior }).rows;

          return (
            <ChartPanel key={behavior} title={behavior} description="Same sparse data fixture.">
              <ChartContainer className="h-56 w-full" config={chartConfig}>
                <LineChart data={rows} margin={{ bottom: 8, left: 4, right: 16, top: 16 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" hide />
                  <YAxis width={42} />
                  <Line
                    connectNulls={behavior === "connect"}
                    dataKey="value"
                    dot={false}
                    isAnimationActive={false}
                    stroke="var(--color-average)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ChartContainer>
            </ChartPanel>
          );
        })}
      </div>
    </StoryFrame>
  );
}

function GroupedStackedStory() {
  const points = useMemo(() => createGroupedPlanPoints(), []);
  const index = useMemo(() => createChartDensityIndex(points), [points]);
  const grouped = useMemo(
    () =>
      index.getGroupedChartSeries({
        groupBy: { property: "plan" },
        targetBinCount: 36,
        valueMode: "count",
        xDomain: [0, 720],
      }),
    [index],
  );
  const rows = useMemo(() => createGroupedChartRenderData(grouped).rows, [grouped]);
  const legendItems = grouped.groups.map((group) => ({
    color: `var(--color-${group.key})`,
    id: group.key,
    label: group.label,
    meta: String(group.series.summary.pointCount),
  }));
  const visibility = useChartSeriesVisibility({
    itemIds: grouped.groups.map((group) => group.key),
  });

  return (
    <StoryFrame title="Grouped stacked chart">
      <ChartPanel title="Plan mix" description="Grouped deterministic counts by account plan.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <ChartContainer className="h-80 w-full" config={chartConfig}>
            <AreaChart data={rows} margin={{ bottom: 8, left: 4, right: 16, top: 16 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" minTickGap={28} />
              <YAxis width={42} />
              {grouped.groups.map((group) =>
                visibility.isVisible(group.key) ? (
                  <Area
                    key={group.key}
                    dataKey={group.key}
                    fill={`var(--color-${group.key})`}
                    fillOpacity={0.32}
                    isAnimationActive={false}
                    stackId="plan"
                    stroke={`var(--color-${group.key})`}
                    type="monotone"
                  />
                ) : null,
              )}
            </AreaChart>
          </ChartContainer>
          <ChartSeriesLegend
            hiddenIds={visibility.hiddenIds}
            items={legendItems}
            onHiddenIdsChange={visibility.setHiddenIds}
            orientation="vertical"
            showCounts
          />
        </div>
      </ChartPanel>
    </StoryFrame>
  );
}

function HistogramStory() {
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
        <ChartContainer className="h-80 w-full" config={chartConfig}>
          <BarChart data={rows} margin={{ bottom: 8, left: 4, right: 16, top: 16 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" minTickGap={16} />
            <YAxis width={42} />
            <Bar dataKey="count" fill="var(--color-value)" isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

function HeatmapStory() {
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

function BoxPlotStory() {
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

function ScatterBubbleStory() {
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

function WaterfallFunnelStory() {
  const waterfall = createChartWaterfallData([
    { label: "Baseline", value: 120 },
    { label: "Expansion", value: 42 },
    { label: "Credits", value: -18 },
    { label: "Net", value: 27 },
  ]);
  const funnel = createChartFunnelData([
    { label: "Visits", value: 1000 },
    { label: "Trials", value: 620 },
    { label: "Active", value: 340 },
    { label: "Paid", value: 180 },
  ]);

  return (
    <StoryFrame title="Waterfall and funnel">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Waterfall" description="Cumulative contribution steps.">
          <ChartWaterfallSvg data={waterfall} />
        </ChartPanel>
        <ChartPanel title="Funnel" description="Stage retention and drop-off.">
          <ChartFunnelSvg data={funnel} />
        </ChartPanel>
      </div>
    </StoryFrame>
  );
}

function HierarchyChartsStory() {
  const hierarchy = {
    label: "Accounts",
    children: [
      {
        label: "Starter",
        children: [
          { label: "Direct", value: 24 },
          { label: "Partner", value: 18 },
        ],
      },
      {
        label: "Scale",
        children: [
          { label: "Direct", value: 16 },
          { label: "Marketplace", value: 11 },
        ],
      },
      {
        label: "Enterprise",
        children: [
          { label: "Partner", value: 9 },
          { label: "Marketplace", value: 7 },
        ],
      },
    ],
  };

  return (
    <StoryFrame title="Hierarchy charts">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Treemap" description="Rectangular hierarchy layout.">
          <ChartTreemapSvg
            data={createChartTreemapLayout(hierarchy, { height: 320, width: 640 })}
          />
        </ChartPanel>
        <ChartPanel title="Sunburst" description="Radial hierarchy layout.">
          <ChartSunburstSvg data={createChartSunburstLayout(hierarchy, { outerRadius: 150 })} />
        </ChartPanel>
      </div>
    </StoryFrame>
  );
}

function CrowdedOverlayStory() {
  const rows = [
    { label: "A", value: 42 },
    { label: "B", value: 78 },
    { label: "C", value: 64 },
    { label: "D", value: 92 },
    { label: "E", value: 58 },
    { label: "F", value: 86 },
  ];

  return (
    <StoryFrame title="Crowded labels">
      <ChartPanel title="Collision-managed labels" description="Dense labels with fixed priority.">
        <ChartContainer className="h-80 w-full" config={chartConfig}>
          <LineChart data={rows} margin={{ bottom: 24, left: 20, right: 24, top: 32 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" />
            <YAxis width={42} />
            <Line
              dataKey="value"
              dot={{ r: 3 }}
              isAnimationActive={false}
              stroke="var(--color-value)"
              strokeWidth={2}
              type="monotone"
            />
            <ChartLabelOverlay
              labels={[
                { id: "release", priority: 30, text: "Release", x: "B", y: 78 },
                { id: "incident", priority: 20, text: "Incident response", x: "C", y: 64 },
                { id: "campaign", priority: 10, text: "Campaign lift", x: "D", y: 92 },
                { id: "recovery", priority: 8, text: "Recovery", x: "E", y: 58 },
              ]}
              obstacles={rows.map((row) => ({ radius: 4, x: row.label, y: row.value }))}
            />
          </LineChart>
        </ChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

function RangeSelectorStory() {
  const [rangeId, setRangeId] = useState("recent");

  return (
    <StoryFrame title="Range selector">
      <ChartPanel title="Viewport ranges">
        <ChartRangeSelector ranges={ranges} value={rangeId} onValueChange={setRangeId} />
      </ChartPanel>
    </StoryFrame>
  );
}

function ValueModeSelectorStory() {
  const [valueMode, setValueMode] = useState<ChartValueMode>("average");

  return (
    <StoryFrame title="Value mode selector">
      <ChartPanel title="Aggregation mode">
        <ChartValueModeSelector value={valueMode} onValueChange={setValueMode} />
      </ChartPanel>
    </StoryFrame>
  );
}

function SeriesLegendStory() {
  const [hiddenIds, setHiddenIds] = useState<string[]>(["forecast"]);

  return (
    <StoryFrame title="Series legend">
      <ChartPanel title="Series visibility">
        <ChartSeriesLegend
          hiddenIds={hiddenIds}
          items={[
            {
              color: "hsl(214 86% 46%)",
              description: "Observed values",
              id: "actual",
              label: "Actual",
            },
            {
              color: "hsl(173 73% 32%)",
              description: "Rolling average",
              id: "rolling",
              label: "Rolling",
            },
            {
              color: "hsl(38 92% 50%)",
              description: "Projected values",
              id: "forecast",
              label: "Forecast",
            },
          ]}
          onHiddenIdsChange={setHiddenIds}
          showCounts
        />
      </ChartPanel>
    </StoryFrame>
  );
}

function YAxisRangeMenuStory() {
  const [range, setRange] = useState<ChartAxisRange>(null);

  return (
    <StoryFrame title="Y-axis range menu">
      <ChartPanel title="Context axis controls" description="Right-click the y-axis region.">
        <ChartContainer className="h-80 w-full" config={chartConfig}>
          <LineChart
            data={[
              { average: 42, label: "A", rolling: 48 },
              { average: 78, label: "B", rolling: 70 },
              { average: 64, label: "C", rolling: 68 },
              { average: 92, label: "D", rolling: 84 },
            ]}
            margin={{ bottom: 8, left: 20, right: 16, top: 16 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" />
            <YAxis domain={range ?? ["auto", "auto"]} width={58} />
            <Line
              dataKey="average"
              dot={false}
              isAnimationActive={false}
              stroke="var(--color-average)"
              strokeWidth={2}
              type="monotone"
            />
            <ChartYAxisRangeMenu
              dataDomain={[40, 96]}
              legendItems={[
                { color: "hsl(214 86% 46%)", id: "average", label: "Average" },
                { color: "hsl(173 73% 32%)", id: "rolling", label: "Rolling" },
              ]}
              onValueChange={setRange}
              value={range}
            />
          </LineChart>
        </ChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

function AxisTransformMenuStory() {
  const [transform, setTransform] = useState<ChartAxisTransform>({
    domain: null,
    scale: "linear",
  });

  return (
    <StoryFrame title="Axis transform menu">
      <ChartPanel title="Transform controls" description="Right-click the y-axis region.">
        <ChartContainer className="h-80 w-full" config={chartConfig}>
          <LineChart
            data={[
              { average: 12, label: "A" },
              { average: 24, label: "B" },
              { average: 96, label: "C" },
              { average: 320, label: "D" },
            ]}
            margin={{ bottom: 8, left: 20, right: 16, top: 16 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" />
            <YAxis
              domain={transform.domain ?? ["auto", "auto"]}
              scale={transform.scale}
              width={58}
            />
            <Line
              dataKey="average"
              dot={false}
              isAnimationActive={false}
              stroke="var(--color-average)"
              strokeWidth={2}
              type="monotone"
            />
            <ChartAxisTransformMenu
              axis="y"
              dataDomain={[12, 320]}
              legendItems={[{ color: "hsl(214 86% 46%)", id: "average", label: "Average" }]}
              onValueChange={setTransform}
              value={transform}
            />
          </LineChart>
        </ChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

function XAxisNavigationMenuStory() {
  const [domain, setDomain] = useState<[number, number]>([120, 520]);
  const rows = [
    { x: 0, value: 24 },
    { x: 120, value: 42 },
    { x: 240, value: 68 },
    { x: 360, value: 54 },
    { x: 480, value: 90 },
    { x: 720, value: 72 },
  ];

  return (
    <StoryFrame title="X-axis navigation menu">
      <ChartPanel title="Range navigation" description="Right-click the x-axis region.">
        <ChartContainer className="h-80 w-full" config={chartConfig}>
          <LineChart data={rows} margin={{ bottom: 28, left: 20, right: 16, top: 16 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="x" domain={domain} tickFormatter={formatStoryHour} type="number" />
            <YAxis width={58} />
            <Line
              dataKey="value"
              dot={false}
              isAnimationActive={false}
              stroke="var(--color-value)"
              strokeWidth={2}
              type="monotone"
            />
            <ChartXAxisNavigationMenu
              domain={domain}
              fullDomain={[0, 720]}
              formatValue={formatStoryHour}
              onDomainChange={setDomain}
            />
          </LineChart>
        </ChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

function AxisTransformsStory() {
  const points = useMemo(() => createTelemetryPoints(), []);
  const index = useMemo(() => createChartDensityIndex(points), [points]);
  const series = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 72,
        valueMode: "average",
        xDomain: [120, 720],
      }),
    [index],
  );
  const rows = useMemo(
    () =>
      createChartRenderData(series.samples, {
        modes: ["average"],
        xLabel: (sample) => String(sample.x),
      }).rows,
    [series.samples],
  );

  return (
    <StoryFrame title="Axis transforms">
      <ChartPanel title="Log value scale" description="Numeric x-axis with a logarithmic y-axis.">
        <ChartContainer className="h-80 w-full" config={chartConfig}>
          <LineChart data={rows} margin={{ bottom: 8, left: 4, right: 16, top: 16 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="x" domain={[120, 720]} tickFormatter={formatStoryHour} type="number" />
            <YAxis domain={[1, "auto"]} scale="log" width={58} />
            <Line
              dataKey="average"
              dot={false}
              isAnimationActive={false}
              stroke="var(--color-average)"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

function AnimatedTrendStory() {
  const points = useMemo(() => createTelemetryPoints(), []);
  const index = useMemo(() => createChartDensityIndex(points), [points]);
  const series = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 96,
        valueMode: "average",
        xDomain: [0, 720],
      }),
    [index],
  );
  const rows = useMemo(
    () =>
      createChartRenderData(series.samples, {
        modes: ["average"],
        xLabel: (sample) => String(sample.x),
      }).rows,
    [series.samples],
  );
  const animationProps = getRechartsAnimationProps({
    durationMs: 900,
    enabled: true,
    mode: "draw",
    respectReducedMotion: false,
  }) as ReturnType<typeof getRechartsAnimationProps> & {
    animationEasing: "ease";
  };

  return (
    <StoryFrame title="Animated trend">
      <ChartPanel title="Draw animation" description="Deterministic reveal animation settings.">
        <ChartContainer className="h-80 w-full" config={chartConfig}>
          <AreaChart data={rows} margin={{ bottom: 8, left: 4, right: 16, top: 16 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="x" domain={[0, 720]} tickFormatter={formatStoryHour} type="number" />
            <YAxis width={54} />
            <Area
              dataKey="average"
              fill="var(--color-average)"
              fillOpacity={0.2}
              stroke="var(--color-average)"
              strokeWidth={2}
              type="monotone"
              {...animationProps}
            />
          </AreaChart>
        </ChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

function BackendStatusStory() {
  return (
    <StoryFrame title="Backend status">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ChartPanel title="Scheduled">
          <ChartBackendStatus
            onWarmNow={() => undefined}
            status={{
              activeBackend: "hybrid-js",
              isWarming: false,
              wasmError: null,
              wasmReady: false,
            }}
          />
        </ChartPanel>
        <ChartPanel title="Warming">
          <ChartBackendStatus
            progress={62}
            status={{
              activeBackend: "hybrid-js",
              isWarming: true,
              wasmError: null,
              wasmReady: false,
            }}
          />
        </ChartPanel>
        <ChartPanel title="Ready">
          <ChartBackendStatus
            status={{
              activeBackend: "wasm-index",
              isWarming: false,
              wasmError: null,
              wasmReady: true,
            }}
          />
        </ChartPanel>
        <ChartPanel title="Fallback">
          <ChartBackendStatus
            status={{
              activeBackend: "hybrid-js",
              isWarming: false,
              wasmError: "load failed",
              wasmReady: false,
            }}
          />
        </ChartPanel>
      </div>
    </StoryFrame>
  );
}

function InteractiveSamplesStory() {
  const index = useMemo(() => createChartDensityIndex(createTelemetryPoints()), []);
  const series = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 64,
        xDomain: [0, 720],
      }),
    [index],
  );
  const [selected, setSelected] = useState(series.samples[24]?.index ?? null);

  return (
    <StoryFrame title="Interactive samples">
      <ChartPanel title="Sparkline selection">
        <ChartSampleSparkline
          domain={[0, 720]}
          samples={series.samples}
          selectedSampleIndex={selected}
          onSampleSelect={(sample) => setSelected(sample.index)}
        />
      </ChartPanel>
    </StoryFrame>
  );
}

function ThresholdsAndAnomaliesStory() {
  const index = useMemo(() => createChartDensityIndex(createOutlierPoints()), []);
  const series = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 96,
        xDomain: [0, 720],
      }),
    [index],
  );
  const thresholds = getChartThresholdAnnotations(series.samples, 150);
  const anomalies = getChartAnomalyAnnotations(series.samples, { sensitivity: 2.2 });

  return (
    <StoryFrame title="Thresholds and anomalies">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Threshold ranges">
          <ChartThresholdMarker annotations={thresholds} />
        </ChartPanel>
        <ChartPanel title="Anomalies">
          <ChartAnomalyMarkerList anomalies={anomalies} />
        </ChartPanel>
      </div>
    </StoryFrame>
  );
}

function rangesEqual(left: [number, number], right: [number, number]) {
  return left[0] === right[0] && left[1] === right[1];
}

function formatStoryHour(value: number) {
  return `${Math.round(value)}h`;
}

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
  ChartAnomalyMarkerList,
  ChartBackendStatus,
  ChartBoxPlotSvg,
  ChartHeatmapGrid,
  ChartLabelOverlay,
  ChartPanel,
  ChartRangeSelector,
  ChartSampleSparkline,
  ChartSeriesLegend,
  ChartThresholdMarker,
  ChartValueModeSelector,
  ChartYAxisRangeMenu,
  createChartBoxPlotData,
  createChartDensityIndex,
  createChartRenderData,
  createGroupedChartRenderData,
  getChartAnomalyAnnotations,
  getChartThresholdAnnotations,
  useChartSeriesVisibility,
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

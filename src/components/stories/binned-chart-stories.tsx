import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  BinnedChart,
  ChartPanel,
  ChartRangeSelector,
  ChartSeriesLegend,
  ChartValueModeSelector,
  createChartDensityIndex,
  createChartRenderData,
  createGroupedChartRenderData,
  getRechartsAnimationProps,
  useChartSeriesVisibility,
  type ChartGapBehavior,
  type ChartValueMode,
} from "@moritzbrantner/charts";

import {
  createGroupedPlanPoints,
  createSparsePoints,
  createTelemetryPoints,
} from "../../testing/chart-fixtures";

import {
  chartConfig,
  formatStoryHour,
  formatStoryNumber,
  ranges,
  rangesEqual,
  StoryChartContainer,
  StoryFrame,
} from "./story-support";

export function DenseTrendStory() {
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
                <YAxis tickFormatter={formatStoryNumber} width={48} />
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

export function GapBehaviorsStory() {
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
              <StoryChartContainer className="h-56 w-full">
                <LineChart data={rows} margin={{ bottom: 8, left: 4, right: 16, top: 16 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" hide />
                  <YAxis tickFormatter={formatStoryNumber} width={42} />
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
              </StoryChartContainer>
            </ChartPanel>
          );
        })}
      </div>
    </StoryFrame>
  );
}

export function GroupedStackedStory() {
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
          <StoryChartContainer className="h-80 w-full">
            <AreaChart data={rows} margin={{ bottom: 8, left: 4, right: 16, top: 16 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" minTickGap={28} />
              <YAxis tickFormatter={formatStoryNumber} width={42} />
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
          </StoryChartContainer>
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

export function AxisTransformsStory() {
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
        <StoryChartContainer className="h-80 w-full">
          <LineChart data={rows} margin={{ bottom: 8, left: 4, right: 16, top: 16 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="x" domain={[120, 720]} tickFormatter={formatStoryHour} type="number" />
            <YAxis domain={[1, "auto"]} scale="log" tickFormatter={formatStoryNumber} width={58} />
            <Line
              dataKey="average"
              dot={false}
              isAnimationActive={false}
              stroke="var(--color-average)"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </StoryChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

export function AnimatedTrendStory() {
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
        <StoryChartContainer className="h-80 w-full">
          <AreaChart data={rows} margin={{ bottom: 8, left: 4, right: 16, top: 16 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="x" domain={[0, 720]} tickFormatter={formatStoryHour} type="number" />
            <YAxis tickFormatter={formatStoryNumber} width={54} />
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
        </StoryChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

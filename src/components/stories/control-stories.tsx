import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartAxisTransformMenu,
  ChartLabelOverlay,
  ChartPanel,
  ChartRangeSelector,
  ChartSeriesLegend,
  ChartValueModeSelector,
  ChartXAxisNavigationMenu,
  ChartYAxisRangeMenu,
  type ChartAxisRange,
  type ChartAxisTransform,
  type ChartValueMode,
} from "@moritzbrantner/charts";

import {
  formatStoryHour,
  formatStoryNumber,
  ranges,
  StoryChartContainer,
  StoryFrame,
} from "./story-support";

export function CrowdedOverlayStory() {
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
        <StoryChartContainer className="h-80 w-full">
          <LineChart data={rows} margin={{ bottom: 24, left: 20, right: 24, top: 32 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={formatStoryNumber} width={42} />
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
        </StoryChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

export function RangeSelectorStory() {
  const [rangeId, setRangeId] = useState("recent");

  return (
    <StoryFrame title="Range selector">
      <ChartPanel title="Viewport ranges">
        <ChartRangeSelector ranges={ranges} value={rangeId} onValueChange={setRangeId} />
      </ChartPanel>
    </StoryFrame>
  );
}

export function ValueModeSelectorStory() {
  const [valueMode, setValueMode] = useState<ChartValueMode>("average");

  return (
    <StoryFrame title="Value mode selector">
      <ChartPanel title="Aggregation mode">
        <ChartValueModeSelector value={valueMode} onValueChange={setValueMode} />
      </ChartPanel>
    </StoryFrame>
  );
}

export function SeriesLegendStory() {
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

export function YAxisRangeMenuStory() {
  const [range, setRange] = useState<ChartAxisRange>(null);

  return (
    <StoryFrame title="Y-axis range menu">
      <ChartPanel title="Context axis controls" description="Right-click the y-axis region.">
        <StoryChartContainer className="h-80 w-full">
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
            <YAxis
              domain={range ?? ["auto", "auto"]}
              tickFormatter={formatStoryNumber}
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
        </StoryChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

export function AxisTransformMenuStory() {
  const [transform, setTransform] = useState<ChartAxisTransform>({
    domain: null,
    scale: "linear",
  });

  return (
    <StoryFrame title="Axis transform menu">
      <ChartPanel title="Transform controls" description="Right-click the y-axis region.">
        <StoryChartContainer className="h-80 w-full">
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
              tickFormatter={formatStoryNumber}
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
        </StoryChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

export function XAxisNavigationMenuStory() {
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
        <StoryChartContainer className="h-80 w-full">
          <LineChart data={rows} margin={{ bottom: 28, left: 20, right: 16, top: 16 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="x" domain={domain} tickFormatter={formatStoryHour} type="number" />
            <YAxis tickFormatter={formatStoryNumber} width={58} />
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
        </StoryChartContainer>
      </ChartPanel>
    </StoryFrame>
  );
}

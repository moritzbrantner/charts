import {
  ChartCirclePackSvg,
  ChartFlameGraphSvg,
  ChartFunnelSvg,
  ChartIcicleSvg,
  ChartIndentedTreeSvg,
  ChartPanel,
  ChartRadialTreeSvg,
  ChartSunburstSvg,
  ChartTreeSvg,
  ChartTreemapSvg,
  ChartWaterfallSvg,
  createChartCirclePackLayout,
  createChartFlameGraphLayout,
  createChartFunnelData,
  createChartIcicleLayout,
  createChartIndentedTreeLayout,
  createChartRadialTreeLayout,
  createChartSunburstLayout,
  createChartTreeLayout,
  createChartTreemapLayout,
  createChartWaterfallData,
} from "@moritzbrantner/charts";

import { StoryFrame } from "./story-support";

export function WaterfallFunnelStory() {
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

export function HierarchyChartsStory() {
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
            zoomable
          />
        </ChartPanel>
        <ChartPanel title="Sunburst" description="Radial hierarchy layout.">
          <ChartSunburstSvg data={createChartSunburstLayout(hierarchy, { outerRadius: 150 })} />
        </ChartPanel>
        <ChartPanel title="Icicle" description="Layered partition layout.">
          <ChartIcicleSvg data={createChartIcicleLayout(hierarchy, { height: 320, width: 640 })} />
        </ChartPanel>
        <ChartPanel title="Flame graph" description="Inverted hierarchy partition layout.">
          <ChartFlameGraphSvg
            data={createChartFlameGraphLayout(hierarchy, { height: 320, width: 640 })}
          />
        </ChartPanel>
        <ChartPanel title="Circle pack" description="Nested circle hierarchy layout.">
          <ChartCirclePackSvg
            data={createChartCirclePackLayout(hierarchy, { height: 340, width: 340 })}
          />
        </ChartPanel>
        <ChartPanel title="Tree" description="Node-link hierarchy layout.">
          <ChartTreeSvg data={createChartTreeLayout(hierarchy, { height: 320, width: 640 })} />
        </ChartPanel>
        <ChartPanel title="Radial tree" description="Circular node-link hierarchy layout.">
          <ChartRadialTreeSvg
            data={createChartRadialTreeLayout(hierarchy, { height: 340, width: 340 })}
          />
        </ChartPanel>
        <ChartPanel title="Indented tree" description="Tree rows with value bars.">
          <ChartIndentedTreeSvg data={createChartIndentedTreeLayout(hierarchy, { width: 640 })} />
        </ChartPanel>
      </div>
    </StoryFrame>
  );
}

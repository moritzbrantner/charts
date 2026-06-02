import {
  AnimatedTrendStory,
  AxisTransformsStory,
  DenseTrendStory,
  GapBehaviorsStory,
  GroupedStackedStory,
} from "./stories/binned-chart-stories";
import { HierarchyChartsStory, WaterfallFunnelStory } from "./stories/business-hierarchy-stories";
import {
  AxisTransformMenuStory,
  CrowdedOverlayStory,
  RangeSelectorStory,
  SeriesLegendStory,
  ValueModeSelectorStory,
  XAxisNavigationMenuStory,
  YAxisRangeMenuStory,
} from "./stories/control-stories";
import {
  BoxPlotStory,
  HeatmapStory,
  HistogramStory,
  ScatterBubbleStory,
} from "./stories/distribution-stories";
import {
  BackendStatusStory,
  InteractiveSamplesStory,
  ThresholdsAndAnomaliesStory,
} from "./stories/status-sparkline-annotation-stories";

import type { Meta, StoryObj } from "@storybook/react-vite";

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
  name: "Hierarchy/TreeLayouts",
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

import type {
  ChartAnimationMode,
  ChartCirclePackNode,
  ChartFlameGraphNode,
  ChartHierarchyNode,
  ChartIcicleNode,
  ChartIndentedTreeNode,
  ChartRadialTreeNode,
  ChartRange,
  ChartSeriesPoint,
  ChartSunburstNode,
  ChartTreeNode,
  ChartTreemapNode,
  IndexedChartSeriesPoint,
} from "@moritzbrantner/charts";

export type TelemetryProperties = {
  channel: "direct" | "partner" | "marketplace";
  note: string;
  plan: "starter" | "scale" | "enterprise";
};

export type ChartVariantId = "comparison" | "envelope" | "revenue" | "volume";

export type ExampleDataSetId = "telemetry" | "retail" | "operations" | "sparse";

export type PlaygroundChartType =
  | "area"
  | "bar"
  | "bubble"
  | "calendar-heatmap"
  | "candle"
  | "circle-pack"
  | "combo"
  | "flame-graph"
  | "funnel"
  | "heatmap"
  | "histogram"
  | "icicle"
  | "indented-tree"
  | "line"
  | "radial-tree"
  | "ridgeline"
  | "scatter"
  | "stacked"
  | "sunburst"
  | "tree"
  | "treemap"
  | "waterfall";

export type ChartPageId = `chart-${PlaygroundChartType}`;

export type ExamplePage = "compose" | "examples" | ChartPageId;

export type PlaygroundCurve = "linear" | "monotone" | "natural" | "step";

export type PlaygroundAnimationMode = ChartAnimationMode;

export type PlaygroundBusinessChartType =
  | "circle-pack"
  | "flame-graph"
  | "funnel"
  | "icicle"
  | "indented-tree"
  | "radial-tree"
  | "sunburst"
  | "tree"
  | "treemap"
  | "waterfall";

export type PlaygroundPlan = TelemetryProperties["plan"];

export type PlaygroundChannel = TelemetryProperties["channel"];

export type PlaygroundHierarchyPayload = {
  channel?: PlaygroundChannel;
  kind: "channel" | "plan" | "root";
  plan?: PlaygroundPlan;
};

export type PlaygroundHierarchy = ChartHierarchyNode<PlaygroundHierarchyPayload>;

export type PlaygroundHierarchySelection =
  | ChartCirclePackNode<PlaygroundHierarchyPayload>
  | ChartFlameGraphNode<PlaygroundHierarchyPayload>
  | ChartIcicleNode<PlaygroundHierarchyPayload>
  | ChartIndentedTreeNode<PlaygroundHierarchyPayload>
  | ChartRadialTreeNode<PlaygroundHierarchyPayload>
  | ChartSunburstNode<PlaygroundHierarchyPayload>
  | ChartTreeNode<PlaygroundHierarchyPayload>
  | ChartTreemapNode<PlaygroundHierarchyPayload>;

export type PlaygroundMetricAccessor = (
  point: IndexedChartSeriesPoint<TelemetryProperties>,
) => number;

export type ExampleDataSet = {
  description: string;
  id: ExampleDataSetId;
  label: string;
  points: ChartSeriesPoint<TelemetryProperties>[];
};

export const playgroundPlans: PlaygroundPlan[] = ["starter", "scale", "enterprise"];

export const playgroundChannels: PlaygroundChannel[] = ["direct", "partner", "marketplace"];

export const ranges: ChartRange[] = [
  {
    description: "Last seven days at hourly resolution.",
    domain: [23 * 24, 30 * 24],
    id: "week",
    label: "7 days",
  },
  {
    description: "Two weeks of day and night traffic cycles.",
    domain: [16 * 24, 30 * 24],
    id: "two-weeks",
    label: "14 days",
  },
  {
    description: "Full synthetic telemetry set with launch events and quiet windows.",
    domain: [0, 30 * 24],
    id: "month",
    label: "30 days",
  },
];

export const formatNumber = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
  notation: "compact",
});

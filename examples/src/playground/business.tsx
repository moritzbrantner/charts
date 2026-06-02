import { createChartFunnelData, createChartWaterfallData } from "@moritzbrantner/charts";

import { type createPlaygroundLabels } from "./candlestick";
import {
  formatCompact,
  formatNullableCompact,
  formatNullablePercent,
  formatPercent,
  titleCase,
} from "./data";
import { playgroundChannels, playgroundPlans } from "./model";
import { type getExampleBusinessMetric } from "./playground-renderer";

import type {
  ExampleDataSetId,
  PlaygroundChannel,
  PlaygroundChartType,
  PlaygroundHierarchy,
  PlaygroundHierarchySelection,
  PlaygroundMetricAccessor,
  PlaygroundPlan,
  TelemetryProperties,
} from "./model";
import type {
  ChartFunnelRow,
  ChartWaterfallRow,
  IndexedChartSeriesPoint,
} from "@moritzbrantner/charts";

export function createBusinessWaterfallData(
  currentPoints: Array<IndexedChartSeriesPoint<TelemetryProperties>>,
  previousPoints: Array<IndexedChartSeriesPoint<TelemetryProperties>>,
  metricAccessor: PlaygroundMetricAccessor,
  options: { hasPreviousWindow: boolean },
) {
  const currentByPlan = sumMetricByPlan(currentPoints, metricAccessor);
  const previousByPlan = sumMetricByPlan(previousPoints, metricAccessor);
  const previousTotal = sumMapValues(previousByPlan);

  return createChartWaterfallData([
    {
      id: "previous-window",
      label: options.hasPreviousWindow ? "Previous window" : "Start",
      value: previousTotal,
    },
    ...playgroundPlans.map((plan) => ({
      id: `${plan}-delta`,
      label: `${titleCase(plan)} delta`,
      value: (currentByPlan.get(plan) ?? 0) - (previousByPlan.get(plan) ?? 0),
    })),
  ]);
}

export function createBusinessFunnelData(
  currentPoints: Array<IndexedChartSeriesPoint<TelemetryProperties>>,
  datasetId: ExampleDataSetId,
  metricAccessor: PlaygroundMetricAccessor,
) {
  const labels =
    datasetId === "operations"
      ? ["Observed", "Elevated", "Incident-level", "Severe"]
      : ["Observed", "Above median", "High value", "Peak"];
  const values = currentPoints.map(metricAccessor).filter((value) => Number.isFinite(value));
  const p50 = getQuantile(values, 0.5);
  const p75 = getQuantile(values, 0.75);
  const p90 = getQuantile(values, 0.9);

  return createChartFunnelData([
    { id: "observed", label: labels[0] ?? "Observed", value: values.length },
    { id: "p50", label: labels[1] ?? "Above median", value: countAtOrAbove(values, p50) },
    { id: "p75", label: labels[2] ?? "High value", value: countAtOrAbove(values, p75) },
    { id: "p90", label: labels[3] ?? "Peak", value: countAtOrAbove(values, p90) },
  ]);
}

export function createBusinessHierarchy(
  currentPoints: Array<IndexedChartSeriesPoint<TelemetryProperties>>,
  datasetId: ExampleDataSetId,
  businessMetric: ReturnType<typeof getExampleBusinessMetric>,
  hiddenPlanIds: readonly string[],
): PlaygroundHierarchy {
  const planGroups = summarizeMetricByPlanAndChannel(currentPoints, businessMetric.accessor);
  const hiddenPlans = new Set(hiddenPlanIds);

  return {
    id: `${datasetId}-${businessMetric.label.toLowerCase()}-root`,
    label: `${businessMetric.label} by plan`,
    payload: { kind: "root" },
    children: playgroundPlans
      .filter((plan) => !hiddenPlans.has(plan))
      .map((plan) => {
        const planIndex = playgroundPlans.indexOf(plan);
        const channels = planGroups.get(plan) ?? new Map<PlaygroundChannel, number>();

        return {
          color: `var(--chart-${(planIndex % 5) + 1})`,
          id: plan,
          label: titleCase(plan),
          payload: { kind: "plan", plan },
          children: playgroundChannels.map((channel, channelIndex) => ({
            color: `var(--chart-${((planIndex + channelIndex) % 5) + 1})`,
            id: `${plan}-${channel}`,
            label: titleCase(channel),
            payload: { channel, kind: "channel", plan },
            value: channels.get(channel) ?? 0,
          })),
        };
      }),
  };
}

export function summarizeMetricByPlanAndChannel(
  points: Array<IndexedChartSeriesPoint<TelemetryProperties>>,
  metricAccessor: PlaygroundMetricAccessor,
) {
  const planGroups = new Map<PlaygroundPlan, Map<PlaygroundChannel, number>>();

  for (const point of points) {
    const plan = point.properties.plan;
    const channel = point.properties.channel;
    const channels = planGroups.get(plan) ?? new Map<PlaygroundChannel, number>();

    channels.set(channel, (channels.get(channel) ?? 0) + metricAccessor(point));
    planGroups.set(plan, channels);
  }

  return planGroups;
}

export function sumMetricByPlan(
  points: Array<IndexedChartSeriesPoint<TelemetryProperties>>,
  metricAccessor: PlaygroundMetricAccessor,
) {
  const sums = new Map<PlaygroundPlan, number>();

  for (const point of points) {
    const plan = point.properties.plan;

    sums.set(plan, (sums.get(plan) ?? 0) + metricAccessor(point));
  }

  return sums;
}

export function sumMapValues(values: ReadonlyMap<unknown, number>) {
  return Array.from(values.values()).reduce((sum, value) => sum + value, 0);
}

export function getQuantile(values: number[], quantile: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const rank = (sorted.length - 1) * quantile;
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  const lower = sorted[lowerIndex] ?? 0;
  const upper = sorted[upperIndex] ?? lower;

  return lower + (upper - lower) * (rank - lowerIndex);
}

export function countAtOrAbove(values: number[], threshold: number) {
  return values.filter((value) => value >= threshold).length;
}

export function getHierarchyValue(node: PlaygroundHierarchy): number {
  if (typeof node.value === "number") {
    return node.value;
  }

  return (node.children ?? []).reduce((sum, child) => sum + getHierarchyValue(child), 0);
}

export function renderPlaygroundSelectionDetails({
  businessMetric,
  chartType,
  hierarchy,
  hierarchyTotal,
  selectedFunnelRow,
  selectedHierarchyNode,
  selectedWaterfallRow,
}: {
  businessMetric: ReturnType<typeof getExampleBusinessMetric>;
  chartType: PlaygroundChartType;
  hierarchy: PlaygroundHierarchy;
  hierarchyTotal: number;
  selectedFunnelRow: ChartFunnelRow | null;
  selectedHierarchyNode: PlaygroundHierarchySelection | null;
  selectedWaterfallRow: ChartWaterfallRow | null;
}) {
  if (chartType === "waterfall" && selectedWaterfallRow) {
    return (
      <PlaygroundDetailRow
        label={selectedWaterfallRow.label}
        items={[
          ["Delta", businessMetric.formatValue(selectedWaterfallRow.value)],
          ["Running total", businessMetric.formatValue(selectedWaterfallRow.end)],
        ]}
      />
    );
  }

  if (chartType === "funnel" && selectedFunnelRow) {
    return (
      <PlaygroundDetailRow
        label={selectedFunnelRow.label}
        items={[
          ["Count", formatCompact(selectedFunnelRow.value)],
          ["Of first", formatPercent(selectedFunnelRow.percentOfFirst)],
          ["Of previous", formatNullablePercent(selectedFunnelRow.percentOfPrevious)],
          ["Drop-off", formatNullableCompact(selectedFunnelRow.dropOff)],
        ]}
      />
    );
  }

  if (
    (chartType === "circle-pack" ||
      chartType === "flame-graph" ||
      chartType === "icicle" ||
      chartType === "indented-tree" ||
      chartType === "radial-tree" ||
      chartType === "sunburst" ||
      chartType === "tree" ||
      chartType === "treemap") &&
    selectedHierarchyNode
  ) {
    const parent = findHierarchyNode(hierarchy, selectedHierarchyNode.parentId);
    const percentOfRoot = hierarchyTotal > 0 ? selectedHierarchyNode.value / hierarchyTotal : 0;

    return (
      <PlaygroundDetailRow
        label={selectedHierarchyNode.label}
        items={[
          [businessMetric.label, businessMetric.formatValue(selectedHierarchyNode.value)],
          ["Of total", formatPercent(percentOfRoot)],
          ["Parent", parent?.label ?? "Root"],
        ]}
      />
    );
  }

  return null;
}

export function PlaygroundDetailRow({
  items,
  label,
}: {
  items: Array<[label: string, value: string]>;
  label: string;
}) {
  return (
    <div
      aria-label="Selected chart item"
      className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/25 px-3 py-2 text-sm"
      data-testid="playground-selection-details"
    >
      <span className="font-medium text-foreground">{label}</span>
      {items.map(([itemLabel, value]) => (
        <span key={itemLabel} className="text-muted-foreground">
          {itemLabel}: <span className="font-medium text-foreground">{value}</span>
        </span>
      ))}
    </div>
  );
}

export function findHierarchyNode(
  node: PlaygroundHierarchy,
  id: string | null,
): PlaygroundHierarchy | null {
  if (id === null) {
    return null;
  }

  if (node.id === id) {
    return node;
  }

  for (const child of node.children ?? []) {
    const match = findHierarchyNode(child, id);

    if (match) {
      return match;
    }
  }

  return null;
}

export type PlaygroundLabel = ReturnType<typeof createPlaygroundLabels>[number];

export function PlaygroundActiveLabels({ labels }: { labels: PlaygroundLabel[] }) {
  if (labels.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Active chart labels"
      className="flex flex-wrap gap-2"
      data-testid="playground-active-labels"
    >
      {labels.map((label) => (
        <span
          key={label.id}
          className="rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground"
        >
          {label.text}
        </span>
      ))}
    </div>
  );
}

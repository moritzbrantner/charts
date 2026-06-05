import { ChartTooltip, ChartTooltipContent } from "@moritzbrantner/ui";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartAxisTransformMenu,
  ChartLabelOverlay,
  ChartSampleInteractionOverlay,
  ChartXAxisNavigationMenu,
  type createChartDensityIndex,
  type createChartRenderData,
  type getRechartsAnimationProps,
  type resolveChartAxisTransformStatus,
  type ChartAxesTransform,
  type ChartAxisOrientation,
  type ChartDensitySample,
  type ChartGapBehavior,
  type ChartLegendItem,
  type ChartSampleInteraction,
  type ChartValueMode,
} from "@moritzbrantner/charts";

import { formatCompact, formatCurrency, formatHour, titleCase } from "./data";
import { playgroundPlans } from "./model";

import type {
  ExampleDataSet,
  ExampleDataSetId,
  PlaygroundBusinessChartType,
  PlaygroundChartType,
  PlaygroundCurve,
  PlaygroundMetricAccessor,
  TelemetryProperties,
} from "./model";

export type PlaygroundRenderRow = ReturnType<
  typeof createChartRenderData<TelemetryProperties>
>["rows"][number];

export type PlaygroundGroupedSeries = ReturnType<
  ReturnType<typeof createChartDensityIndex<TelemetryProperties>>["getGroupedChartSeries"]
>;

export function renderPlaygroundChart({
  animationProps,
  axesTransform,
  barRadius,
  chartType,
  curve,
  domain,
  fillOpacity,
  fullDomain,
  gapBehavior,
  grouped,
  groupedRows,
  hiddenLegendIds,
  histogramRows,
  labels,
  legendItems,
  onAxesTransformChange,
  onDomainChange,
  onHiddenLegendIdsChange,
  onSampleSelect,
  orientation,
  rows,
  samples,
  selectedSampleIndex,
  showGrid,
  showThreshold,
  strokeWidth,
  threshold,
  valueMode,
  visibleSeriesIds,
  timeAxisStatus,
  valueAxisDomain,
  valueAxisStatus,
  verticalXDomain,
  yAxisDataDomain,
}: {
  animationProps: ReturnType<typeof getRechartsAnimationProps>;
  axesTransform: ChartAxesTransform;
  barRadius: number;
  chartType: PlaygroundChartType;
  curve: PlaygroundCurve;
  domain: [number, number];
  fillOpacity: number;
  fullDomain: [number, number];
  gapBehavior: ChartGapBehavior;
  grouped: PlaygroundGroupedSeries;
  groupedRows: Array<Record<string, unknown>>;
  hiddenLegendIds: readonly string[];
  histogramRows: Array<{ count: number; label: string }>;
  labels: Array<{
    id: string;
    placements: readonly ["top", "top-right", "right"];
    priority: number;
    text: string;
    x: number | string;
    y: number | string;
  }>;
  legendItems: readonly ChartLegendItem[];
  onAxesTransformChange: (transform: ChartAxesTransform) => void;
  onDomainChange: (domain: [number, number]) => void;
  onHiddenLegendIdsChange: (hiddenIds: string[]) => void;
  onSampleSelect: (interaction: ChartSampleInteraction<TelemetryProperties>) => void;
  orientation: ChartAxisOrientation;
  rows: PlaygroundRenderRow[];
  samples: ChartDensitySample<TelemetryProperties>[];
  selectedSampleIndex: number | null;
  showGrid: boolean;
  showThreshold: boolean;
  strokeWidth: number;
  threshold: number;
  valueMode: ChartValueMode;
  visibleSeriesIds: ReadonlySet<string>;
  timeAxisStatus: ReturnType<typeof resolveChartAxisTransformStatus>;
  valueAxisDomain: [number, number];
  valueAxisStatus: ReturnType<typeof resolveChartAxisTransformStatus>;
  verticalXDomain: [number, number];
  yAxisDataDomain: [number, number] | null;
}) {
  const commonMargin = { bottom: 8, left: 4, right: 14, top: 12 };
  const connectNulls = gapBehavior === "connect";
  const rechartsAnimationProps = animationProps as typeof animationProps & {
    animationEasing: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
  };
  const valueAxisRenderDomain = yAxisDataDomain ? valueAxisDomain : (["auto", "auto"] as const);
  const thresholdLine = showThreshold ? (
    <ReferenceLine
      y={orientation === "vertical" ? threshold : undefined}
      x={orientation === "horizontal" ? threshold : undefined}
      stroke="var(--muted-foreground)"
      strokeDasharray="4 4"
      strokeOpacity={0.7}
    />
  ) : null;
  const grid = showGrid ? <CartesianGrid vertical={orientation === "horizontal"} /> : null;
  const sampleOverlay = (
    <ChartSampleInteractionOverlay
      domain={domain}
      orientation={orientation}
      samples={samples}
      selectedSampleIndex={selectedSampleIndex}
      onSampleSelect={onSampleSelect}
    />
  );
  const axisTransformMenu = (
    <ChartAxisTransformMenu
      axis={orientation === "vertical" ? "y" : "x"}
      dataDomain={yAxisDataDomain}
      hiddenIds={hiddenLegendIds}
      legendItems={legendItems}
      onHiddenIdsChange={onHiddenLegendIdsChange}
      onValueChange={(transform) => {
        onAxesTransformChange({
          ...axesTransform,
          [orientation === "vertical" ? "y" : "x"]: transform,
        });
      }}
      orientation={orientation === "vertical" ? "left" : "bottom"}
      value={orientation === "vertical" ? axesTransform.y : axesTransform.x}
    />
  );
  const xAxisNavigationMenu =
    orientation === "vertical" ? (
      <ChartXAxisNavigationMenu
        domain={domain}
        fullDomain={fullDomain}
        formatValue={formatHour}
        onDomainChange={onDomainChange}
      />
    ) : null;

  const verticalXAxis = (
    <XAxis
      allowDataOverflow={axesTransform.x.domain !== null}
      axisLine={false}
      dataKey="x"
      domain={verticalXDomain}
      minTickGap={26}
      scale={timeAxisStatus.renderScale}
      tickFormatter={formatHour}
      tickLine={false}
      type="number"
    />
  );
  const verticalYAxis = (
    <YAxis
      allowDataOverflow={axesTransform.y.domain !== null}
      axisLine={false}
      domain={valueAxisRenderDomain}
      scale={valueAxisStatus.renderScale}
      tickFormatter={formatCompact}
      tickLine={false}
      width={52}
    />
  );
  const horizontalXAxis = (
    <XAxis
      allowDataOverflow={axesTransform.x.domain !== null}
      axisLine={false}
      domain={valueAxisRenderDomain}
      scale={valueAxisStatus.renderScale}
      tickLine={false}
      type="number"
    />
  );
  const horizontalYAxis = (
    <YAxis
      axisLine={false}
      dataKey="label"
      interval="preserveStartEnd"
      tickLine={false}
      type="category"
      width={72}
    />
  );

  if (orientation === "horizontal") {
    switch (chartType) {
      case "bar":
      case "histogram":
      case "stacked":
        return (
          <BarChart
            data={
              chartType === "histogram"
                ? histogramRows
                : chartType === "stacked"
                  ? groupedRows
                  : rows
            }
            layout="vertical"
            margin={commonMargin}
          >
            {grid}
            {horizontalXAxis}
            {horizontalYAxis}
            <ChartTooltip content={<ChartTooltipContent />} />
            {thresholdLine}
            {chartType === "stacked" ? (
              grouped.groups.map((group, index) =>
                visibleSeriesIds.has(group.key) ? (
                  <Bar
                    key={group.key}
                    dataKey={group.key}
                    fill={`var(--chart-${(index % 5) + 1})`}
                    radius={barRadius}
                    stackId="playground"
                    {...rechartsAnimationProps}
                  />
                ) : null,
              )
            ) : visibleSeriesIds.has(chartType === "histogram" ? "count" : valueMode) ? (
              <Bar
                dataKey={chartType === "histogram" ? "count" : valueMode}
                fill={chartType === "histogram" ? "var(--color-count)" : "var(--color-value)"}
                radius={barRadius}
                {...rechartsAnimationProps}
              />
            ) : null}
            {axisTransformMenu}
            {chartType === "histogram" ? null : sampleOverlay}
          </BarChart>
        );
      case "combo":
      case "line":
      case "area":
        return (
          <LineChart data={rows} layout="vertical" margin={commonMargin}>
            {grid}
            {horizontalXAxis}
            {horizontalYAxis}
            <ChartTooltip content={<ChartTooltipContent />} />
            {thresholdLine}
            {visibleSeriesIds.has(valueMode) ? (
              <Line
                connectNulls={connectNulls}
                dataKey={valueMode}
                dot={false}
                stroke="var(--color-value)"
                strokeWidth={strokeWidth}
                type={curve}
                {...rechartsAnimationProps}
              />
            ) : null}
            {chartType === "combo" && visibleSeriesIds.has("rolling") ? (
              <Line
                connectNulls={connectNulls}
                dataKey="rolling"
                dot={false}
                stroke="var(--color-rolling)"
                strokeWidth={Math.max(1, strokeWidth + 0.6)}
                type={curve}
                {...rechartsAnimationProps}
              />
            ) : null}
            <ChartLabelOverlay labels={labels} maxWidth={96} />
            {axisTransformMenu}
            {sampleOverlay}
          </LineChart>
        );
      case "candle":
      case "bubble":
      case "calendar-heatmap":
      case "funnel":
      case "heatmap":
      case "ridgeline":
      case "scatter":
      case "sunburst":
      case "treemap":
      case "waterfall":
        return null;
    }
  }

  switch (chartType) {
    case "candle":
    case "bubble":
    case "calendar-heatmap":
    case "funnel":
    case "ridgeline":
    case "scatter":
    case "sunburst":
    case "treemap":
    case "waterfall":
      return null;
    case "bar":
      return (
        <BarChart data={rows} margin={commonMargin}>
          {grid}
          {verticalXAxis}
          {verticalYAxis}
          <ChartTooltip content={<ChartTooltipContent />} />
          {thresholdLine}
          {visibleSeriesIds.has(valueMode) ? (
            <Bar
              dataKey={valueMode}
              fill="var(--color-value)"
              radius={barRadius}
              {...rechartsAnimationProps}
            />
          ) : null}
          <ChartLabelOverlay labels={labels} maxWidth={96} />
          {axisTransformMenu}
          {xAxisNavigationMenu}
          {sampleOverlay}
        </BarChart>
      );
    case "combo":
      return (
        <AreaChart data={rows} margin={commonMargin}>
          {grid}
          {verticalXAxis}
          {verticalYAxis}
          <ChartTooltip content={<ChartTooltipContent />} />
          {thresholdLine}
          {visibleSeriesIds.has(valueMode) ? (
            <Area
              connectNulls={connectNulls}
              dataKey={valueMode}
              fill="var(--color-value)"
              fillOpacity={fillOpacity / 100}
              stroke="var(--color-value)"
              strokeWidth={strokeWidth}
              type={curve}
              {...rechartsAnimationProps}
            />
          ) : null}
          {visibleSeriesIds.has("rolling") ? (
            <Line
              connectNulls={connectNulls}
              dataKey="rolling"
              dot={false}
              stroke="var(--color-rolling)"
              strokeWidth={Math.max(1, strokeWidth + 0.6)}
              type={curve}
              {...rechartsAnimationProps}
            />
          ) : null}
          <ChartLabelOverlay labels={labels} maxWidth={96} />
          {axisTransformMenu}
          {xAxisNavigationMenu}
          {sampleOverlay}
        </AreaChart>
      );
    case "histogram":
      return (
        <BarChart data={histogramRows} margin={commonMargin}>
          {grid}
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} />
          {verticalYAxis}
          <ChartTooltip content={<ChartTooltipContent />} />
          {visibleSeriesIds.has("count") ? (
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={barRadius}
              {...rechartsAnimationProps}
            />
          ) : null}
          {axisTransformMenu}
        </BarChart>
      );
    case "line":
      return (
        <LineChart data={rows} margin={commonMargin}>
          {grid}
          {verticalXAxis}
          {verticalYAxis}
          <ChartTooltip content={<ChartTooltipContent />} />
          {thresholdLine}
          {visibleSeriesIds.has(valueMode) ? (
            <Line
              connectNulls={connectNulls}
              dataKey={valueMode}
              dot={false}
              stroke="var(--color-value)"
              strokeWidth={strokeWidth}
              type={curve}
              {...rechartsAnimationProps}
            />
          ) : null}
          {visibleSeriesIds.has("rolling") ? (
            <Line
              connectNulls={connectNulls}
              dataKey="rolling"
              dot={false}
              stroke="var(--color-rolling)"
              strokeOpacity={0.65}
              strokeWidth={Math.max(1, strokeWidth - 0.2)}
              type={curve}
              {...rechartsAnimationProps}
            />
          ) : null}
          <ChartLabelOverlay labels={labels} maxWidth={96} />
          {axisTransformMenu}
          {xAxisNavigationMenu}
          {sampleOverlay}
        </LineChart>
      );
    case "stacked":
      return (
        <BarChart data={groupedRows} margin={commonMargin}>
          {grid}
          {verticalXAxis}
          {verticalYAxis}
          <ChartTooltip content={<ChartTooltipContent />} />
          {grouped.groups.map((group, index) =>
            visibleSeriesIds.has(group.key) ? (
              <Bar
                key={group.key}
                dataKey={group.key}
                fill={`var(--chart-${(index % 5) + 1})`}
                radius={barRadius}
                stackId="playground"
                {...rechartsAnimationProps}
              />
            ) : null,
          )}
          {axisTransformMenu}
          {xAxisNavigationMenu}
          {sampleOverlay}
        </BarChart>
      );
    case "heatmap":
    case "area":
      return (
        <AreaChart data={rows} margin={commonMargin}>
          {grid}
          {verticalXAxis}
          {verticalYAxis}
          <ChartTooltip content={<ChartTooltipContent />} />
          {thresholdLine}
          {visibleSeriesIds.has(valueMode) ? (
            <Area
              connectNulls={connectNulls}
              dataKey={valueMode}
              fill="var(--color-value)"
              fillOpacity={fillOpacity / 100}
              stroke="var(--color-value)"
              strokeWidth={strokeWidth}
              type={curve}
              {...rechartsAnimationProps}
            />
          ) : null}
          <ChartLabelOverlay labels={labels} maxWidth={96} />
          {axisTransformMenu}
          {xAxisNavigationMenu}
          {sampleOverlay}
        </AreaChart>
      );
  }
}

export function isChartInteractionControl(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        [
          "[role='dialog']",
          "button",
          "input",
          "select",
          "textarea",
          "[data-chart-axis-transform-trigger]",
          "[data-chart-y-axis-range-trigger]",
        ].join(", "),
      ),
    )
  );
}

export function getPlaygroundYAxisDataKeys({
  chartType,
  grouped,
  valueMode,
  visibleSeriesIds,
}: {
  chartType: PlaygroundChartType;
  grouped: PlaygroundGroupedSeries;
  valueMode: ChartValueMode;
  visibleSeriesIds: ReadonlySet<string>;
}): string[] {
  switch (chartType) {
    case "histogram":
      return visibleSeriesIds.has("count") ? ["count"] : [];
    case "stacked":
      return grouped.groups
        .map((group) => group.key)
        .filter((groupKey) => visibleSeriesIds.has(groupKey));
    case "combo":
    case "line":
      return [valueMode, "rolling"].filter((dataKey) => visibleSeriesIds.has(dataKey));
    case "bar":
    case "area":
      return visibleSeriesIds.has(valueMode) ? [valueMode] : [];
    case "bubble":
    case "calendar-heatmap":
    case "candle":
    case "circle-pack":
    case "flame-graph":
    case "funnel":
    case "heatmap":
    case "icicle":
    case "indented-tree":
    case "radial-tree":
    case "ridgeline":
    case "scatter":
    case "sunburst":
    case "tree":
    case "treemap":
    case "waterfall":
      return [];
  }
}

export function getPlaygroundYAxisRows({
  chartType,
  groupedRows,
  histogramRows,
  renderRows,
}: {
  chartType: PlaygroundChartType;
  groupedRows: Array<Record<string, unknown>>;
  histogramRows: Array<{ count: number; label: string }>;
  renderRows: PlaygroundRenderRow[];
}): readonly Record<string, unknown>[] {
  if (chartType === "histogram") {
    return histogramRows;
  }

  if (chartType === "stacked") {
    return groupedRows;
  }

  return renderRows;
}

export function createPlaygroundLegendItems({
  chartType,
  definitionLabel,
  grouped,
  valueMode,
}: {
  chartType: PlaygroundChartType;
  definitionLabel: string;
  grouped: PlaygroundGroupedSeries;
  valueMode: ChartValueMode;
}): ChartLegendItem[] {
  switch (chartType) {
    case "combo":
    case "line":
      return [
        {
          color: "var(--chart-1)",
          id: valueMode,
          label: definitionLabel,
        },
        {
          color: "var(--chart-2)",
          id: "rolling",
          label: "Rolling",
        },
      ];
    case "histogram":
      return [
        {
          color: "var(--chart-4)",
          id: "count",
          label: "Count",
        },
      ];
    case "stacked":
      return grouped.groups.map((group, index) => ({
        color: `var(--chart-${(index % 5) + 1})`,
        id: group.key,
        label: group.label,
        meta: formatCompact(group.pointCount),
      }));
    case "heatmap":
      return [
        {
          color: "var(--chart-1)",
          disabled: true,
          id: "heatmap",
          label: "Density",
        },
      ];
    case "calendar-heatmap":
      return [
        {
          color: "var(--chart-1)",
          disabled: true,
          id: "calendar-heatmap",
          label: "Daily value",
        },
      ];
    case "ridgeline":
      return [
        {
          color: "var(--chart-1)",
          disabled: true,
          id: "ridgeline",
          label: "Grouped distribution",
        },
      ];
    case "scatter":
      return [
        {
          color: "var(--chart-1)",
          id: "scatter",
          label: "Points",
        },
      ];
    case "bubble":
      return [
        {
          color: "var(--chart-1)",
          id: "bubble",
          label: "Revenue size",
        },
      ];
    case "waterfall":
      return [
        { color: "var(--chart-1)", id: "positive", label: "Positive" },
        { color: "var(--destructive)", id: "negative", label: "Negative" },
      ];
    case "circle-pack":
    case "flame-graph":
    case "icicle":
    case "indented-tree":
    case "radial-tree":
    case "treemap":
    case "tree":
    case "sunburst":
      return playgroundPlans.map((plan, index) => ({
        color: `var(--chart-${(index % 5) + 1})`,
        id: plan,
        label: titleCase(plan),
      }));
    case "funnel":
      return [];
    case "candle":
      return [
        {
          color: "var(--chart-2)",
          id: "up",
          label: "Close up",
        },
        {
          color: "var(--chart-4)",
          id: "down",
          label: "Close down",
        },
      ];
    case "area":
    case "bar":
      return [
        {
          color: "var(--chart-1)",
          id: valueMode,
          label: definitionLabel,
        },
      ];
  }
}

export function isBusinessHierarchyChart(
  chartType: PlaygroundChartType,
): chartType is PlaygroundBusinessChartType {
  return (
    chartType === "funnel" ||
    chartType === "circle-pack" ||
    chartType === "flame-graph" ||
    chartType === "icicle" ||
    chartType === "indented-tree" ||
    chartType === "radial-tree" ||
    chartType === "sunburst" ||
    chartType === "tree" ||
    chartType === "treemap" ||
    chartType === "waterfall"
  );
}

export function getPlaygroundChartCapabilities(chartType: PlaygroundChartType) {
  const isBusinessHierarchy = isBusinessHierarchyChart(chartType);
  const isHierarchy =
    chartType === "circle-pack" ||
    chartType === "flame-graph" ||
    chartType === "icicle" ||
    chartType === "indented-tree" ||
    chartType === "radial-tree" ||
    chartType === "sunburst" ||
    chartType === "tree" ||
    chartType === "treemap";

  return {
    advancedControls: !isBusinessHierarchy,
    directDomainInteraction: !isBusinessHierarchy,
    grid: !isBusinessHierarchy,
    labels: !isBusinessHierarchy,
    legend: isHierarchy || !isBusinessHierarchy,
    minimap: true,
    playback: !isBusinessHierarchy,
    styleControls: !isBusinessHierarchy,
    threshold: !isBusinessHierarchy,
    valueMode: !isBusinessHierarchy,
  };
}

export function getExampleBusinessMetric(datasetId: ExampleDataSetId): {
  accessor: PlaygroundMetricAccessor;
  formatValue: (value: number) => string;
  label: string;
} {
  if (datasetId === "operations") {
    return {
      accessor: (point) => point.y,
      formatValue: formatCompact,
      label: "Load",
    };
  }

  return {
    accessor: (point) => point.metrics.revenue ?? 0,
    formatValue: formatCurrency,
    label: "Revenue",
  };
}

export function getPlaygroundChartDescription(
  chartType: PlaygroundChartType,
  selectedDataset: ExampleDataSet,
  businessMetric: ReturnType<typeof getExampleBusinessMetric>,
) {
  switch (chartType) {
    case "waterfall":
      return `Current window change by plan, measured by ${businessMetric.label.toLowerCase()}.`;
    case "funnel":
      return `Viewport stages based on ${businessMetric.label.toLowerCase()} percentiles.`;
    case "treemap":
    case "sunburst":
      return `${businessMetric.label} by plan and channel.`;
    case "area":
    case "bar":
    case "bubble":
    case "calendar-heatmap":
    case "candle":
    case "combo":
    case "heatmap":
    case "histogram":
    case "line":
    case "ridgeline":
    case "scatter":
    case "stacked":
      return selectedDataset.description;
  }
}

export function createPreviousDomain(domain: [number, number], fullDomain: [number, number]) {
  const span = domain[1] - domain[0];

  if (span <= 0 || domain[0] <= fullDomain[0]) {
    return null;
  }

  const end = Math.max(fullDomain[0], domain[0]);
  const start = Math.max(fullDomain[0], end - span);

  return start < end ? ([start, end] satisfies [number, number]) : null;
}

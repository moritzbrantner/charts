import { Badge, ToggleGroup, ToggleGroupItem } from "@moritzbrantner/ui";
import { useMemo, useState } from "react";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  BinnedChart,
  CHART_VALUE_MODE_DEFINITIONS,
  ChartAnomalyMarkerList,
  ChartBackendStatus,
  ChartBoxPlotSvg,
  ChartCalendarHeatmapSvg,
  ChartDerivedMetricCard,
  ChartHeatmapGrid,
  ChartHotBinRow,
  ChartLabelOverlay,
  ChartMetricCard,
  ChartMetricStrip,
  ChartPanel,
  ChartRidgelineSvg,
  ChartSampleSparkline,
  ChartSeriesLegend,
  ChartThresholdMarker,
  ChartValueModePreview,
  ChartWithLegend,
  ChartYAxisRangeMenu,
  createChartBandRenderData,
  createChartBoxPlotData,
  createChartCalendarHeatmapData,
  createChartDensityIndex,
  createChartDensityViewportSummary,
  createChartRidgelineData,
  createChartRenderData,
  createCumulativeChartSeries,
  createDeltaChartSeries,
  createGroupedChartRenderData,
  createRollingChartSeries,
  getChartAnomalyAnnotations,
  getChartDataYBounds,
  getChartThresholdAnnotations,
  measureChartSeries,
  useChartSeriesVisibility,
  useProgressiveChartDensity,
} from "@moritzbrantner/charts";

import {
  analyticsChartConfig,
  bandChartConfig,
  chartConfig,
  formatCompact,
  formatCurrency,
  formatHour,
  gapDescription,
  variantChartConfig,
} from "./data";

import type { ChartVariantId, TelemetryProperties } from "./model";
import type {
  ChartAxisRange,
  ChartDensitySample,
  ChartRange,
  ChartSeriesPoint,
  ChartValueMode,
} from "@moritzbrantner/charts";

export function ValueModeExamples({
  activeRange,
  index,
  onValueModeChange,
  valueMode,
}: {
  activeRange: ChartRange;
  index: ReturnType<typeof createChartDensityIndex<TelemetryProperties>>;
  onValueModeChange: (mode: ChartValueMode) => void;
  valueMode: ChartValueMode;
}) {
  const measuredByMode = useMemo(
    () =>
      CHART_VALUE_MODE_DEFINITIONS.map((definition) => ({
        definition,
        measured: measureChartSeries(index, {
          includeEmptyBins: true,
          targetBinCount: 72,
          valueMode: definition.id,
          xDomain: activeRange.domain,
        }),
      })),
    [activeRange.domain, index],
  );

  return (
    <section className="grid gap-4" data-testid="value-mode-examples">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Value mode previews</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            The same viewport rendered as average, count, extrema, and sum series.
          </p>
        </div>
        <Badge variant="outline" className="w-fit rounded-full">
          {activeRange.label}
        </Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {measuredByMode.map(({ definition, measured }) => (
          <ChartValueModePreview
            key={definition.id}
            active={valueMode === definition.id}
            definition={definition}
            measured={measured}
            onSelect={() => onValueModeChange(definition.id)}
          />
        ))}
      </div>
    </section>
  );
}

export function AnalyticsExamples({
  activeRange,
  index,
}: {
  activeRange: ChartRange;
  index: ReturnType<typeof createChartDensityIndex<TelemetryProperties>>;
}) {
  const series = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 96,
        valueMode: "average",
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, index],
  );
  const previousDomain = useMemo(
    (): [number, number] => [
      Math.max(0, activeRange.domain[0] - 7 * 24),
      Math.max(0, activeRange.domain[1] - 7 * 24),
    ],
    [activeRange.domain],
  );
  const previousSeries = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 96,
        valueMode: "average",
        xDomain: previousDomain,
      }),
    [index, previousDomain],
  );
  const rollingAverage = useMemo(
    () =>
      createRollingChartSeries(series.samples, {
        accessor: "average",
        minPoints: 3,
        windowSize: 9,
      }),
    [series.samples],
  );
  const cumulativeRevenue = useMemo(
    () => createCumulativeChartSeries(series.samples, { metric: "revenue" }),
    [series.samples],
  );
  const revenueDelta = useMemo(
    () =>
      createDeltaChartSeries(series.samples, {
        accessor: { metric: "revenue" },
        mode: "percent",
        offset: 12,
      }),
    [series.samples],
  );
  const renderRows = useMemo(
    () =>
      createChartRenderData(series.samples, {
        derived: {
          rollingAverage,
        },
        modes: ["average"],
        xLabel: (sample) => formatHour(sample.x),
      }).rows,
    [rollingAverage, series.samples],
  );
  const cumulativeRows = useMemo(
    () =>
      createChartRenderData(series.samples, {
        derived: {
          cumulativeRevenue,
          revenueDelta,
        },
        modes: ["average"],
        xLabel: (sample) => formatHour(sample.x),
      }).rows,
    [cumulativeRevenue, revenueDelta, series.samples],
  );
  const thresholdAnnotations = useMemo(
    () =>
      getChartThresholdAnnotations(series.samples, 185, {
        accessor: "average",
        direction: "above",
      }),
    [series.samples],
  );
  const anomalies = useMemo(
    () =>
      getChartAnomalyAnnotations(series.samples, {
        accessor: "average",
        sensitivity: 2.5,
      }),
    [series.samples],
  );
  const currentRevenue = createChartDensityViewportSummary(series).metrics.revenue ?? null;
  const previousRevenue = createChartDensityViewportSummary(previousSeries).metrics.revenue ?? null;

  return (
    <section className="grid gap-4" data-testid="analytics-examples">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Analytics helpers</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Derived series, threshold ranges, and anomaly lists built from binned samples.
          </p>
        </div>
        <Badge variant="outline" className="w-fit rounded-full">
          {activeRange.label}
        </Badge>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ChartPanel
          title="Rolling average"
          description="Average samples with a centered rolling baseline."
        >
          <ChartContainer className="h-80 w-full" config={analyticsChartConfig}>
            <LineChart data={renderRows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
              <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="average"
                dot={false}
                isAnimationActive={false}
                stroke="var(--color-average)"
                strokeOpacity={0.45}
                strokeWidth={1.8}
                type="monotone"
              />
              <Line
                dataKey="rollingAverage"
                dot={false}
                isAnimationActive={false}
                stroke="var(--color-rollingAverage)"
                strokeWidth={2.6}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>
        </ChartPanel>

        <div className="grid gap-4">
          <ChartDerivedMetricCard
            label="Revenue delta"
            value={currentRevenue}
            previousValue={previousRevenue}
            formatValue={(value) => (value === null ? "n/a" : formatCurrency(value))}
          />
          <ChartPanel title="Threshold ranges" description="Average value above 185.">
            <ChartThresholdMarker
              annotations={thresholdAnnotations}
              formatLabel={(annotation) =>
                `${formatHour(annotation.startX)} to ${formatHour(annotation.endX)}`
              }
            />
          </ChartPanel>
          <ChartPanel title="Anomaly markers" description="Spike detection from sample values.">
            <ChartAnomalyMarkerList
              anomalies={anomalies}
              formatValue={(value) => formatCompact(value)}
            />
          </ChartPanel>
        </div>
      </div>
      <ChartPanel
        title="Cumulative revenue"
        description="Metric-derived cumulative series with percent deltas available in each row."
      >
        <ChartContainer className="h-64 w-full" config={analyticsChartConfig}>
          <AreaChart data={cumulativeRows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
            <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={60} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="cumulativeRevenue"
              fill="var(--color-cumulativeRevenue)"
              fillOpacity={0.14}
              isAnimationActive={false}
              stroke="var(--color-cumulativeRevenue)"
              strokeWidth={2}
              type="monotone"
            />
            <Line
              dataKey="revenueDelta"
              dot={false}
              isAnimationActive={false}
              stroke="var(--color-revenueDelta)"
              strokeDasharray="4 4"
              strokeWidth={1.8}
              type="monotone"
            />
          </AreaChart>
        </ChartContainer>
      </ChartPanel>
    </section>
  );
}

export function ChartVariantExamples({
  activeRange,
  fullDomain,
  index,
  onDomainChange,
}: {
  activeRange: ChartRange;
  fullDomain: [number, number];
  index: ReturnType<typeof createChartDensityIndex<TelemetryProperties>>;
  onDomainChange: (domain: [number, number]) => void;
}) {
  const [previewVariant, setPreviewVariant] = useState<ChartVariantId>("envelope");
  const previewOption =
    chartVariantOptions.find((option) => option.id === previewVariant) ?? chartVariantOptions[0];

  return (
    <section className="grid gap-4" data-testid="chart-variant-examples">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Chart variants</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Multi-line comparisons and bar views built from the same binned viewport.
          </p>
        </div>
        <Badge variant="outline" className="w-fit rounded-full">
          {activeRange.label}
        </Badge>
      </div>
      <ChartPanel
        badge="Preview"
        title={previewOption.title}
        description={previewOption.description}
      >
        <div className="grid gap-4">
          <ToggleGroup
            type="single"
            value={previewVariant}
            onValueChange={(nextVariant) => {
              if (isChartVariantId(nextVariant)) {
                setPreviewVariant(nextVariant);
              }
            }}
            className="flex flex-wrap justify-start gap-2"
            aria-label="Chart variant preview"
          >
            {chartVariantOptions.map((option) => (
              <ToggleGroupItem
                key={option.id}
                value={option.id}
                aria-label={`${option.label} ${option.title}`}
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <BinnedVariantChart
            activeRange={activeRange}
            chartClassName="h-[26rem] w-full"
            fullDomain={fullDomain}
            index={index}
            onDomainChange={onDomainChange}
            variant={previewVariant}
          />
        </div>
      </ChartPanel>
    </section>
  );
}

export function BinnedVariantChart({
  activeRange,
  chartClassName,
  fullDomain,
  index,
  onDomainChange,
  variant,
}: {
  activeRange: ChartRange;
  chartClassName: string;
  fullDomain: [number, number];
  index: ReturnType<typeof createChartDensityIndex<TelemetryProperties>>;
  onDomainChange: (domain: [number, number]) => void;
  variant: ChartVariantId;
}) {
  return (
    <BinnedChart
      binCountOptions={{
        defaultBinCount: 84,
        maxBinCount: 180,
        minBinCount: 36,
        pixelsPerBin: 10,
        step: 12,
      }}
      chartClassName={chartClassName}
      config={variantChartConfig}
      domain={activeRange.domain}
      formatDomainValue={formatHour}
      fullDomain={fullDomain}
      index={index}
      onDomainChange={onDomainChange}
      renderDataOptions={variantRenderDataOptions}
      valueMode="average"
    >
      {({ rows }) => renderVariantChart(variant, createVariantRows(rows))}
    </BinnedChart>
  );
}

export type ChartVariantRow = {
  current: number | null;
  floor: number | null;
  label: string;
  peak: number | null;
  previous: number | null;
  revenueK: number | null;
  target: number | null;
  volume: number | null;
  x: number;
};

export type ChartVariantSourceRow = {
  average: number | null;
  count: number | null;
  label: string;
  max: number | null;
  metrics?: Record<string, number>;
  min: number | null;
  pointCount: number;
  x: number;
};

export const variantRenderDataOptions = {
  includeMetrics: true,
  modes: ["average", "count", "max", "min", "sum"],
  xLabel: (sample: ChartDensitySample<TelemetryProperties>) => formatHour(sample.x),
} as const;

export function createVariantRows(rows: ChartVariantSourceRow[]): ChartVariantRow[] {
  return rows.map((row) => {
    const average = row.average ?? null;

    return {
      current: average,
      floor: row.min,
      label: row.label,
      peak: row.max,
      previous: average === null ? null : average * (0.86 + Math.sin(row.x / 20) * 0.07),
      revenueK:
        row.metrics?.revenue === undefined || row.pointCount === 0
          ? null
          : row.metrics.revenue / 1_000,
      target: average === null ? null : 126 + Math.sin(row.x / 42) * 10,
      volume: row.count,
      x: row.x,
    };
  });
}

export const chartVariantOptions: Array<{
  description: string;
  id: ChartVariantId;
  label: string;
  title: string;
}> = [
  {
    description: "Average, maximum, and minimum values per bin.",
    id: "envelope",
    label: "Envelope",
    title: "Envelope lines",
  },
  {
    description: "Current viewport compared with a previous-period baseline and target.",
    id: "comparison",
    label: "Compare",
    title: "Comparison lines",
  },
  {
    description: "Source point counts per bin.",
    id: "volume",
    label: "Volume",
    title: "Volume bars",
  },
  {
    description: "Aggregated revenue per bin, shown in thousands.",
    id: "revenue",
    label: "Revenue",
    title: "Revenue bars",
  },
];

export function isChartVariantId(value: string): value is ChartVariantId {
  return chartVariantOptions.some((option) => option.id === value);
}

export function renderVariantChart(variant: ChartVariantId, rows: ChartVariantRow[]) {
  switch (variant) {
    case "comparison":
      return (
        <LineChart data={rows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={48} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            dataKey="previous"
            dot={false}
            isAnimationActive={false}
            stroke="var(--color-previous)"
            strokeDasharray="5 5"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="target"
            dot={false}
            isAnimationActive={false}
            stroke="var(--color-target)"
            strokeDasharray="2 4"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="current"
            dot={false}
            isAnimationActive={false}
            stroke="var(--color-current)"
            strokeWidth={2.4}
            type="monotone"
          />
          <ChartLabelOverlay
            labels={createAnnotationLabels(rows)}
            obstacles={createLineObstacles(rows, ["current", "previous", "target"])}
            maxWidth={112}
          />
        </LineChart>
      );
    case "revenue":
      return (
        <BarChart data={rows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={42} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="revenueK" fill="var(--color-revenueK)" radius={0} />
        </BarChart>
      );
    case "volume":
      return (
        <BarChart data={rows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={42} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="volume" fill="var(--color-volume)" radius={0} />
        </BarChart>
      );
    case "envelope":
      return (
        <LineChart data={rows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={48} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            dataKey="peak"
            dot={false}
            isAnimationActive={false}
            stroke="var(--color-peak)"
            strokeWidth={1.75}
            type="monotone"
          />
          <Line
            dataKey="current"
            dot={false}
            isAnimationActive={false}
            stroke="var(--color-current)"
            strokeWidth={2.4}
            type="monotone"
          />
          <Line
            dataKey="floor"
            dot={false}
            isAnimationActive={false}
            stroke="var(--color-floor)"
            strokeWidth={1.75}
            type="monotone"
          />
          <ChartLabelOverlay
            labels={createAnnotationLabels(rows)}
            obstacles={createLineObstacles(rows, ["current", "peak", "floor"])}
            maxWidth={112}
          />
        </LineChart>
      );
  }
}

export function ComposedChartExamples({
  activeRange,
  index,
}: {
  activeRange: ChartRange;
  index: ReturnType<typeof createChartDensityIndex<TelemetryProperties>>;
}) {
  const [lineYAxisRange, setLineYAxisRange] = useState<ChartAxisRange>(null);
  const series = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 96,
        valueMode: "average",
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, index],
  );
  const rollingAverage = useMemo(
    () =>
      createRollingChartSeries(series.samples, {
        accessor: "average",
        minPoints: 3,
        windowSize: 9,
      }),
    [series.samples],
  );
  const cumulativeRevenue = useMemo(
    () => createCumulativeChartSeries(series.samples, { metric: "revenue" }),
    [series.samples],
  );
  const revenueDelta = useMemo(
    () =>
      createDeltaChartSeries(series.samples, {
        accessor: { metric: "revenue" },
        mode: "percent",
        offset: 12,
      }),
    [series.samples],
  );
  const rows = useMemo(
    () =>
      createChartRenderData(series.samples, {
        derived: {
          cumulativeRevenue,
          revenueDelta,
          rollingAverage,
        },
        modes: ["average"],
        xLabel: (sample) => formatHour(sample.x),
      }).rows,
    [cumulativeRevenue, revenueDelta, rollingAverage, series.samples],
  );
  const lineLegendItems = useMemo(
    () => [
      { id: "average", label: "Average", color: "var(--chart-1)" },
      { id: "rollingAverage", label: "Rolling avg", color: "var(--chart-2)" },
      {
        id: "cumulativeRevenue",
        label: "Cumulative revenue",
        color: "var(--chart-5)",
      },
      { id: "revenueDelta", label: "Revenue delta", color: "var(--chart-4)" },
    ],
    [],
  );
  const lineVisibility = useChartSeriesVisibility({
    itemIds: lineLegendItems.map((item) => item.id),
  });
  const lineYAxisBounds = getChartDataYBounds(rows, lineVisibility.visibleIds);
  const lineYAxisDataDomain =
    lineYAxisBounds.minY === null || lineYAxisBounds.maxY === null
      ? null
      : ([lineYAxisBounds.minY, lineYAxisBounds.maxY] satisfies [number, number]);
  const lineYAxisDomain = lineYAxisRange ?? (["auto", "auto"] as const);
  const grouped = useMemo(
    () =>
      index.getGroupedChartSeries({
        groupBy: (point) => point.properties.plan,
        includeEmptyBins: true,
        maxGroups: 3,
        targetBinCount: 84,
        valueMode: "count",
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, index],
  );
  const groupedRows = useMemo(
    () =>
      createGroupedChartRenderData(grouped, {
        xLabel: (sample) => formatHour(sample.x),
      }).rows,
    [grouped],
  );
  const groupedConfig = useMemo(
    () =>
      Object.fromEntries(
        grouped.groups.map((group, index) => [
          group.key,
          {
            color: `var(--chart-${(index % 5) + 1})`,
            label: group.label,
          },
        ]),
      ),
    [grouped.groups],
  );
  const groupedLegendItems = useMemo(
    () =>
      grouped.groups.map((group, index) => ({
        id: group.key,
        label: group.label,
        color: `var(--chart-${(index % 5) + 1})`,
        meta: formatCompact(group.pointCount),
      })),
    [grouped.groups],
  );
  const groupedVisibility = useChartSeriesVisibility({
    itemIds: groupedLegendItems.map((item) => item.id),
  });

  return (
    <section className="grid gap-4" data-testid="composed-chart-examples">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Composed charts</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Side legends and shared visibility state layered around regular chart renderers.
          </p>
        </div>
        <Badge variant="outline" className="w-fit rounded-full">
          {activeRange.label}
        </Badge>
      </div>
      <div className="grid gap-4">
        <ChartPanel
          title="Multi-line with side legend"
          description="Toggle derived lines without changing the underlying binned rows."
        >
          <ChartWithLegend
            legend={
              <ChartSeriesLegend
                items={lineLegendItems}
                hiddenIds={lineVisibility.hiddenIds}
                onHiddenIdsChange={lineVisibility.setHiddenIds}
              />
            }
          >
            <ChartContainer className="h-80 w-full" config={analyticsChartConfig}>
              <LineChart data={rows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
                <YAxis
                  allowDataOverflow={lineYAxisRange !== null}
                  domain={lineYAxisDomain}
                  tickFormatter={formatCompact}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                {lineVisibility.isVisible("average") ? (
                  <Line
                    dataKey="average"
                    dot={false}
                    isAnimationActive={false}
                    stroke="var(--color-average)"
                    strokeWidth={2}
                    type="monotone"
                  />
                ) : null}
                {lineVisibility.isVisible("rollingAverage") ? (
                  <Line
                    dataKey="rollingAverage"
                    dot={false}
                    isAnimationActive={false}
                    stroke="var(--color-rollingAverage)"
                    strokeWidth={2.4}
                    type="monotone"
                  />
                ) : null}
                {lineVisibility.isVisible("cumulativeRevenue") ? (
                  <Line
                    dataKey="cumulativeRevenue"
                    dot={false}
                    isAnimationActive={false}
                    stroke="var(--color-cumulativeRevenue)"
                    strokeWidth={1.8}
                    type="monotone"
                  />
                ) : null}
                {lineVisibility.isVisible("revenueDelta") ? (
                  <Line
                    dataKey="revenueDelta"
                    dot={false}
                    isAnimationActive={false}
                    stroke="var(--color-revenueDelta)"
                    strokeDasharray="4 4"
                    strokeWidth={1.8}
                    type="monotone"
                  />
                ) : null}
                <ChartYAxisRangeMenu
                  dataDomain={lineYAxisDataDomain}
                  hiddenIds={lineVisibility.hiddenIds}
                  legendItems={lineLegendItems}
                  onHiddenIdsChange={lineVisibility.setHiddenIds}
                  onValueChange={setLineYAxisRange}
                  value={lineYAxisRange}
                />
              </LineChart>
            </ChartContainer>
          </ChartWithLegend>
        </ChartPanel>

        <ChartPanel
          title="Grouped bars with side legend"
          description="Hide or show plan groups while keeping the stack composition intact."
        >
          <ChartWithLegend
            legend={
              <ChartSeriesLegend
                items={groupedLegendItems}
                hiddenIds={groupedVisibility.hiddenIds}
                onHiddenIdsChange={groupedVisibility.setHiddenIds}
              />
            }
            legendSide="left"
          >
            <ChartContainer className="h-72 w-full" config={groupedConfig}>
              <BarChart data={groupedRows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
                <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={42} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {grouped.groups.map((group, index) =>
                  groupedVisibility.isVisible(group.key) ? (
                    <Bar
                      key={group.key}
                      dataKey={group.key}
                      fill={`var(--chart-${(index % 5) + 1})`}
                      radius={0}
                      stackId="plan"
                    />
                  ) : null,
                )}
              </BarChart>
            </ChartContainer>
          </ChartWithLegend>
        </ChartPanel>
      </div>
    </section>
  );
}

export function createAnnotationLabels(rows: ChartVariantRow[]) {
  const annotations = [
    {
      id: "maintenance-dip",
      priority: 80,
      targetX: 12.75 * 24,
      text: "Maintenance dip",
    },
    {
      id: "release-lift",
      priority: 100,
      targetX: 18.5 * 24,
      text: "Release lift",
    },
    {
      id: "campaign-pulse",
      priority: 120,
      targetX: 23 * 24,
      text: "Campaign pulse",
    },
  ];

  return annotations
    .map((annotation) => {
      const row = getNearestChartRow(rows, annotation.targetX);

      if (!row || row.current === null) {
        return null;
      }

      return {
        id: annotation.id,
        placements: ["top-right", "top", "right", "bottom-right"] as const,
        priority: annotation.priority,
        text: annotation.text,
        x: row.label,
        y: row.current,
      };
    })
    .filter((annotation) => annotation !== null);
}

export function createLineObstacles(rows: ChartVariantRow[], keys: Array<keyof ChartVariantRow>) {
  return rows.flatMap((row) =>
    keys.flatMap((key) => {
      const value = row[key];

      if (typeof value !== "number") {
        return [];
      }

      return [
        {
          id: `${row.label}-${String(key)}`,
          kind: "mark" as const,
          radius: 3,
          x: row.label,
          y: value,
        },
      ];
    }),
  );
}

export function getNearestChartRow(rows: ChartVariantRow[], targetX: number) {
  return rows.reduce<ChartVariantRow | null>((nearest, row) => {
    if (!nearest) {
      return row;
    }

    return Math.abs(row.x - targetX) < Math.abs(nearest.x - targetX) ? row : nearest;
  }, null);
}

export function DistributionExamples({
  activeRange,
  index,
}: {
  activeRange: ChartRange;
  index: ReturnType<typeof createChartDensityIndex<TelemetryProperties>>;
}) {
  const histogram = useMemo(
    () =>
      index.getHistogram({
        bucketCount: 24,
        valueAccessor: "y",
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, index],
  );
  const heatmap = useMemo(
    () =>
      index.getHeatmap({
        xBinCount: 36,
        xDomain: activeRange.domain,
        yBinCount: 12,
      }),
    [activeRange.domain, index],
  );
  const sourcePoints = useMemo(
    () => index.getChartPoints({ maxPoints: 20_000, xDomain: activeRange.domain }).points,
    [activeRange.domain, index],
  );
  const calendarHeatmap = useMemo(
    () =>
      createChartCalendarHeatmapData(sourcePoints, {
        dayMs: 24,
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, sourcePoints],
  );
  const ridgeline = useMemo(
    () =>
      createChartRidgelineData(sourcePoints, {
        bucketCount: 24,
        groupBy: (point) => point.properties.plan,
        maxGroups: 4,
        valueAccessor: "y",
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, sourcePoints],
  );
  const grouped = useMemo(
    () =>
      index.getGroupedChartSeries({
        groupBy: (point) => point.properties.plan,
        includeEmptyBins: true,
        targetBinCount: 72,
        valueMode: "count",
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, index],
  );
  const groupedRows = useMemo(
    () =>
      createGroupedChartRenderData(grouped, {
        xLabel: (sample) => formatHour(sample.x),
      }).rows,
    [grouped],
  );
  const percentileSeries = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        percentiles: ["p25", "p50", "p75"],
        targetBinCount: 96,
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, index],
  );
  const bandRows = useMemo(
    () =>
      createChartBandRenderData(percentileSeries.samples, {
        center: "p50",
        lower: "p25",
        upper: "p75",
        xLabel: (sample) => formatHour(sample.x),
      }).rows,
    [percentileSeries.samples],
  );
  const boxData = useMemo(
    () =>
      createChartBoxPlotData(percentileSeries.samples, {
        xLabel: (sample) => formatHour(sample.x),
      }),
    [percentileSeries.samples],
  );
  const histogramRows = histogram.buckets.map((bucket) => ({
    count: bucket.pointCount,
    label: `${formatCompact(bucket.value0)}-${formatCompact(bucket.value1)}`,
  }));
  const groupedConfig = Object.fromEntries(
    grouped.groups.map((group, index) => [
      group.key,
      {
        color: `var(--chart-${(index % 5) + 1})`,
        label: group.label,
      },
    ]),
  );

  return (
    <section className="grid gap-4" data-testid="distribution-examples">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Distribution charts</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Histogram, heatmap, calendar heatmap, ridgeline, grouped stacks, percentile bands, and
            box plots from the same index.
          </p>
        </div>
        <Badge variant="outline" className="w-fit rounded-full">
          {activeRange.label}
        </Badge>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Histogram"
          description="Distribution of y values in the active viewport."
        >
          <ChartContainer
            className="h-72 w-full"
            config={{ count: { color: "var(--chart-4)", label: "Count" } }}
          >
            <BarChart data={histogramRows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
              <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={42} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={0} />
            </BarChart>
          </ChartContainer>
        </ChartPanel>

        <ChartPanel title="Heatmap" description="X bins crossed with y-value buckets.">
          <ChartHeatmapGrid
            cells={heatmap.cells}
            formatX={formatHour}
            formatY={formatCompact}
            formatValue={(cell) => `${formatCompact(cell.pointCount)} points`}
          />
        </ChartPanel>

        <ChartPanel title="Calendar heatmap" description="Daily buckets across the active range.">
          <ChartCalendarHeatmapSvg
            data={calendarHeatmap}
            formatValue={(day) => (day.value === null ? "n/a" : formatCompact(day.value))}
          />
        </ChartPanel>

        <ChartPanel title="Ridgeline plot" description="Y-value distributions grouped by plan.">
          <ChartRidgelineSvg data={ridgeline} formatValue={formatCompact} />
        </ChartPanel>

        <ChartPanel title="Stacked by plan" description="Point counts grouped by plan.">
          <ChartContainer className="h-72 w-full" config={groupedConfig}>
            <BarChart data={groupedRows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
              <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={42} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {grouped.groups.map((group, index) => (
                <Bar
                  key={group.key}
                  dataKey={group.key}
                  fill={`var(--chart-${(index % 5) + 1})`}
                  radius={0}
                  stackId="plan"
                />
              ))}
            </BarChart>
          </ChartContainer>
        </ChartPanel>

        <ChartPanel title="Percentile band" description="Interquartile range with median line.">
          <ChartContainer className="h-72 w-full" config={bandChartConfig}>
            <AreaChart data={bandRows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
              <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="range"
                fill="var(--color-range)"
                fillOpacity={0.18}
                isAnimationActive={false}
                stroke="var(--color-range)"
                strokeWidth={1.2}
                type="monotone"
              />
              <Line
                dataKey="center"
                dot={false}
                isAnimationActive={false}
                stroke="var(--color-center)"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        </ChartPanel>
      </div>

      <ChartPanel title="Box plot" description="P25, median, P75, min, and max per x bin.">
        <ChartBoxPlotSvg
          data={boxData}
          formatValue={(value) => (value === null ? "n/a" : formatCompact(value))}
        />
      </ChartPanel>
    </section>
  );
}

export function SparklineExample({
  activeRange,
  index,
  valueMode,
}: {
  activeRange: ChartRange;
  index: ReturnType<typeof createChartDensityIndex<TelemetryProperties>>;
  valueMode: ChartValueMode;
}) {
  const series = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 96,
        valueMode,
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, index, valueMode],
  );
  const hotSample = useMemo(
    () =>
      [...series.samples]
        .filter((sample) => sample.pointCount > 0)
        .sort((left, right) => (right.metrics.revenue ?? 0) - (left.metrics.revenue ?? 0))[0],
    [series.samples],
  );
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(
    hotSample?.index ?? null,
  );
  const selectedSample = useMemo(
    () =>
      series.samples.find((sample) => sample.index === selectedSampleIndex) ?? hotSample ?? null,
    [hotSample, selectedSampleIndex, series.samples],
  );
  const selectedPoint = selectedSample?.firstPoint
    ? index.getPointById(selectedSample.firstPoint.id)
    : null;

  return (
    <ChartPanel
      title="Linked sparkline"
      description="SVG sparkline selection connected to source-point lookup and bin metrics."
    >
      <div className="grid gap-5">
        <ChartSampleSparkline
          domain={activeRange.domain}
          samples={series.samples}
          selectedSampleIndex={selectedSample?.index ?? null}
          formatDomainValue={formatHour}
          formatSampleLabel={(sample) => `${formatHour(sample.x0)}-${formatHour(sample.x1)}`}
          onSampleSelect={(sample) => setSelectedSampleIndex(sample.index)}
        />
        {selectedSample ? <ChartHotBinRow sample={selectedSample} formatX={formatHour} /> : null}
        <div className="grid gap-3 md:grid-cols-3">
          <ChartMetricStrip
            label="Selected x"
            value={selectedSample ? formatHour(selectedSample.x) : "n/a"}
          />
          <ChartMetricStrip
            label="First point"
            value={selectedPoint?.properties.note ?? "No point"}
          />
          <ChartMetricStrip label="Plan" value={selectedPoint?.properties.plan ?? "n/a"} />
        </div>
      </div>
    </ChartPanel>
  );
}

export function BackendExample({ points }: { points: ChartSeriesPoint<TelemetryProperties>[] }) {
  const progressiveOptions = useMemo(
    () => ({
      progressive: {
        warmup: "manual" as const,
      },
    }),
    [],
  );
  const { index, status, warmWasmNow } = useProgressiveChartDensity(points, progressiveOptions);
  const series = index.getChartSeries({
    includeEmptyBins: true,
    targetBinCount: 48,
    valueMode: "count",
    xDomain: [23 * 24, 30 * 24],
  });
  const summary = createChartDensityViewportSummary(series);

  return (
    <ChartPanel
      title="Progressive backend"
      description="Manual WASM warmup with JS fallback status."
    >
      <div className="grid gap-5">
        <ChartBackendStatus status={status} onWarmNow={warmWasmNow} />
        <ChartMetricCard
          label="Active viewport"
          value={formatCompact(summary.itemCount)}
          hint={`${summary.binCount} bins served by ${status.activeBackend}`}
        />
      </div>
    </ChartPanel>
  );
}

export function GapBehaviorExample({
  points,
}: {
  points: ChartSeriesPoint<TelemetryProperties>[];
}) {
  const index = useMemo(() => createChartDensityIndex(points, { backend: "auto" }), [points]);
  const series = index.getChartSeries({
    includeEmptyBins: true,
    targetBinCount: 120,
    valueMode: "average",
    xDomain: [0, 96],
  });
  const behaviors = ["preserve", "connect", "zero-fill"] as const;

  return (
    <section className="grid gap-4" data-testid="gap-behavior-example">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Gap behavior</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Empty-bin policies applied to the same sparse series.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {behaviors.map((behavior) => {
          const renderData = createChartRenderData(series.samples, {
            gapBehavior: behavior,
            modes: ["average"],
            xLabel: (sample) => formatHour(sample.x),
          });

          return (
            <ChartPanel
              key={behavior}
              title={behavior}
              badge={`${renderData.annotations.length} gaps`}
              description={gapDescription(behavior)}
            >
              <ChartContainer className="h-52 w-full" config={chartConfig("Average")}>
                <LineChart
                  data={renderData.rows}
                  margin={{ bottom: 8, left: 0, right: 10, top: 10 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis
                    tickFormatter={formatCompact}
                    tickLine={false}
                    axisLine={false}
                    width={42}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="average"
                    dot={false}
                    isAnimationActive={false}
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ChartContainer>
            </ChartPanel>
          );
        })}
      </div>
    </section>
  );
}

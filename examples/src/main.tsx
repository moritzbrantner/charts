import {
  ActionMenu,
  Badge,
  Button,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ContextActionMenu,
  Label,
  type MenuActionItem,
  NativeSelect,
  NativeSelectOption,
  Slider,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  copyText,
} from "@moritzbrantner/ui";
import { StrictMode, useCallback, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
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
  BinnedChart,
  CHART_VALUE_MODE_DEFINITIONS,
  ChartAnomalyMarkerList,
  ChartBackendStatus,
  ChartBoxPlotSvg,
  ChartDerivedMetricCard,
  ChartDomainMinimap,
  ChartHeatmapGrid,
  ChartHotBinRow,
  ChartLabelOverlay,
  ChartMetricCard,
  ChartMetricStrip,
  ChartPanel,
  ChartRangeSelector,
  ChartSampleInteractionOverlay,
  ChartSampleSparkline,
  ChartThresholdMarker,
  ChartValueModePreview,
  ChartValueModeSelector,
  createCumulativeChartSeries,
  createDeltaChartSeries,
  createChartBandRenderData,
  createChartBoxPlotData,
  createChartDensityIndex,
  createChartDensityViewportSummary,
  createGroupedChartRenderData,
  createChartRenderData,
  createRollingChartSeries,
  getChartAnomalyAnnotations,
  getChartThresholdAnnotations,
  getChartValueModeDefinition,
  measureChartSeries,
  useChartBinCount,
  useChartWheelDomain,
  useProgressiveChartDensity,
  type ChartDensitySample,
  type ChartGapBehavior,
  type ChartRange,
  type ChartSampleInteraction,
  type ChartSeriesPoint,
  type ChartValueMode,
} from "@moritzbrantner/charts";
import "./styles.css";

type TelemetryProperties = {
  channel: "direct" | "partner" | "marketplace";
  note: string;
  plan: "starter" | "scale" | "enterprise";
};

type ChartVariantId = "comparison" | "envelope" | "revenue" | "volume";
type ExampleDataSetId = "telemetry" | "retail" | "operations" | "sparse";
type PlaygroundChartType = "area" | "bar" | "combo" | "heatmap" | "histogram" | "line" | "stacked";
type PlaygroundCurve = "linear" | "monotone" | "natural" | "step";

type ExampleDataSet = {
  description: string;
  id: ExampleDataSetId;
  label: string;
  points: ChartSeriesPoint<TelemetryProperties>[];
};

const ranges: ChartRange[] = [
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

const formatNumber = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
  notation: "compact",
});

function App() {
  const datasets = useMemo(() => createExampleDataSets(), []);
  const [datasetId, setDatasetId] = useState<ExampleDataSetId>("telemetry");
  const selectedDataset = datasets.find((dataset) => dataset.id === datasetId) ?? datasets[0];
  const points = selectedDataset.points;
  const gapPoints = useMemo(() => createGapPoints(), []);
  const [rangeId, setRangeId] = useState("week");
  const [activeDomain, setActiveDomain] = useState<[number, number]>(ranges[0].domain);
  const [valueMode, setValueMode] = useState<ChartValueMode>("average");
  const selectedRange = ranges.find((range) => range.id === rangeId) ?? ranges[0];
  const activeRange = useMemo(
    () => ({
      ...selectedRange,
      domain: activeDomain,
    }),
    [activeDomain, selectedRange],
  );
  const index = useMemo(() => createChartDensityIndex(points, { backend: "hybrid-js" }), [points]);
  const bounds = index.getSeriesBounds();
  const fullDomain: [number, number] = bounds ? [bounds.minX, bounds.maxX] : activeDomain;
  const fullSeries = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 180,
        valueMode: "average",
        xDomain: [0, 30 * 24],
      }),
    [index],
  );
  const fullSummary = createChartDensityViewportSummary(fullSeries);
  const handleDataSetChange = (nextDatasetId: ExampleDataSetId) => {
    setDatasetId(nextDatasetId);
    setRangeId("week");
    setActiveDomain(ranges[0].domain);
  };
  const handleRangeChange = (nextRangeId: string) => {
    const nextRange = ranges.find((range) => range.id === nextRangeId);

    if (!nextRange) {
      return;
    }

    setRangeId(nextRangeId);
    setActiveDomain(nextRange.domain);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/70 bg-card/50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                Examples
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  @moritzbrantner/charts
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  Density-aware chart helpers, render data, and React controls across loadable
                  datasets and common product analytics views.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[42rem] lg:grid-cols-4">
              <ChartMetricStrip label="Points" value={formatCompact(points.length)} />
              <ChartMetricStrip label="Dataset" value={selectedDataset.label} />
              <ChartMetricStrip
                label="Revenue"
                value={formatCurrency(fullSummary.metrics.revenue ?? 0)}
              />
              <ChartMetricStrip
                label="Domain"
                value={bounds ? `${formatHour(bounds.minX)}-${formatHour(bounds.maxX)}` : "n/a"}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <ChartPanel title="Viewport" description="Switch the domain used by each chart query.">
            <ChartRangeSelector
              ranges={ranges}
              value={rangeId}
              formatDomain={(domain) => `${formatHour(domain[0])} to ${formatHour(domain[1])}`}
              onValueChange={handleRangeChange}
            />
          </ChartPanel>
          <DenseTrendExample
            activeRange={activeRange}
            fullDomain={fullDomain}
            index={index}
            onDomainChange={setActiveDomain}
            valueMode={valueMode}
            onValueModeChange={setValueMode}
          />
        </section>

        <ChartPlayground
          activeRange={activeRange}
          datasets={datasets}
          fullDomain={fullDomain}
          index={index}
          onDataSetChange={handleDataSetChange}
          onDomainChange={setActiveDomain}
          onRangeChange={handleRangeChange}
          onValueModeChange={setValueMode}
          rangeId={rangeId}
          selectedDataset={selectedDataset}
          valueMode={valueMode}
        />

        <ValueModeExamples
          activeRange={activeRange}
          index={index}
          valueMode={valueMode}
          onValueModeChange={setValueMode}
        />

        <AnalyticsExamples activeRange={activeRange} index={index} />

        <ChartVariantExamples
          activeRange={activeRange}
          fullDomain={fullDomain}
          index={index}
          onDomainChange={setActiveDomain}
        />

        <DistributionExamples activeRange={activeRange} index={index} />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <SparklineExample activeRange={activeRange} index={index} valueMode={valueMode} />
          <BackendExample points={points} />
        </section>

        <GapBehaviorExample points={gapPoints} />
      </div>
    </main>
  );
}

function ChartPlayground({
  activeRange,
  datasets,
  fullDomain,
  index,
  onDataSetChange,
  onDomainChange,
  onRangeChange,
  onValueModeChange,
  rangeId,
  selectedDataset,
  valueMode,
}: {
  activeRange: ChartRange;
  datasets: ExampleDataSet[];
  fullDomain: [number, number];
  index: ReturnType<typeof createChartDensityIndex<TelemetryProperties>>;
  onDataSetChange: (id: ExampleDataSetId) => void;
  onDomainChange: (domain: [number, number]) => void;
  onRangeChange: (rangeId: string) => void;
  onValueModeChange: (mode: ChartValueMode) => void;
  rangeId: string;
  selectedDataset: ExampleDataSet;
  valueMode: ChartValueMode;
}) {
  const [chartType, setChartType] = useState<PlaygroundChartType>("area");
  const [targetBinCount, setTargetBinCount] = useState(120);
  const [histogramBuckets, setHistogramBuckets] = useState(24);
  const [heatmapYBins, setHeatmapYBins] = useState(12);
  const [rollingWindow, setRollingWindow] = useState(9);
  const [threshold, setThreshold] = useState(185);
  const [strokeWidth, setStrokeWidth] = useState(2.2);
  const [fillOpacity, setFillOpacity] = useState(18);
  const [barRadius, setBarRadius] = useState(0);
  const [curve, setCurve] = useState<PlaygroundCurve>("monotone");
  const [gapBehavior, setGapBehavior] = useState<ChartGapBehavior>("preserve");
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showThreshold, setShowThreshold] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(null);
  const definition = getChartValueModeDefinition(valueMode);
  const series = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount,
        valueMode,
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, index, targetBinCount, valueMode],
  );
  const rollingSeries = useMemo(
    () =>
      createRollingChartSeries(series.samples, {
        accessor: valueMode,
        minPoints: 2,
        windowSize: rollingWindow,
      }),
    [rollingWindow, series.samples, valueMode],
  );
  const renderRows = useMemo(
    () =>
      createChartRenderData(series.samples, {
        derived: {
          rolling: rollingSeries,
        },
        gapBehavior,
        includeMetrics: true,
        modes: [valueMode],
        xLabel: (sample) => formatHour(sample.x),
      }).rows,
    [gapBehavior, rollingSeries, series.samples, valueMode],
  );
  const histogram = useMemo(
    () =>
      index.getHistogram({
        bucketCount: histogramBuckets,
        valueAccessor: "y",
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, histogramBuckets, index],
  );
  const heatmap = useMemo(
    () =>
      index.getHeatmap({
        xBinCount: Math.max(6, Math.round(targetBinCount / 3)),
        xDomain: activeRange.domain,
        yBinCount: heatmapYBins,
      }),
    [activeRange.domain, heatmapYBins, index, targetBinCount],
  );
  const grouped = useMemo(
    () =>
      index.getGroupedChartSeries({
        groupBy: (point) => point.properties.plan,
        includeEmptyBins: true,
        maxGroups: 3,
        targetBinCount,
        valueMode: "count",
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, index, targetBinCount],
  );
  const groupedRows = useMemo(
    () =>
      createGroupedChartRenderData(grouped, {
        xLabel: (sample) => formatHour(sample.x),
      }).rows,
    [grouped],
  );
  const minimapSeries = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 180,
        valueMode,
        xDomain: fullDomain,
      }),
    [fullDomain, index, valueMode],
  );
  const histogramRows = histogram.buckets.map((bucket) => ({
    count: bucket.pointCount,
    label: `${formatCompact(bucket.value0)}-${formatCompact(bucket.value1)}`,
  }));
  const thresholdAnnotations = useMemo(
    () =>
      getChartThresholdAnnotations(series.samples, threshold, {
        accessor: valueMode,
        direction: "above",
      }),
    [series.samples, threshold, valueMode],
  );
  const summary = createChartDensityViewportSummary(series);
  const labels = showLabels ? createPlaygroundLabels(renderRows, valueMode) : [];
  const config = playgroundChartConfig(valueMode, definition.label);
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
    <section className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Chart playground</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Load a synthetic dataset, pick a renderer, and tune the query and visual parameters.
          </p>
        </div>
        <Badge variant="outline" className="w-fit rounded-full">
          {formatCompact(summary.itemCount)} points in view
        </Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ChartPanel
          badge={selectedDataset.label}
          title={playgroundChartTitles[chartType]}
          description={selectedDataset.description}
        >
          <div className="grid gap-4">
            {chartType === "heatmap" ? (
              <ChartHeatmapGrid
                cells={heatmap.cells}
                formatX={formatHour}
                formatY={formatCompact}
                formatValue={(cell) => `${formatCompact(cell.pointCount)} points`}
              />
            ) : (
              <ChartContainer
                className={`w-full ${chartType === "histogram" ? "h-80" : "h-[28rem]"}`}
                config={chartType === "stacked" ? groupedConfig : config}
              >
                {renderPlaygroundChart({
                  barRadius,
                  chartType,
                  curve,
                  domain: activeRange.domain,
                  fillOpacity,
                  gapBehavior,
                  histogramRows,
                  labels,
                  onSampleSelect: (interaction) => setSelectedSampleIndex(interaction.sample.index),
                  rows: renderRows,
                  samples: series.samples,
                  selectedSampleIndex,
                  showGrid,
                  showThreshold,
                  strokeWidth,
                  threshold,
                  valueMode,
                  grouped,
                  groupedRows,
                })}
              </ChartContainer>
            )}

            {showThreshold && thresholdAnnotations.length > 0 ? (
              <ChartThresholdMarker
                annotations={thresholdAnnotations}
                formatLabel={(annotation) =>
                  `${formatHour(annotation.startX)} to ${formatHour(annotation.endX)}`
                }
              />
            ) : null}

            {showMinimap ? (
              <ChartDomainMinimap
                domain={activeRange.domain}
                fullDomain={fullDomain}
                samples={minimapSeries.samples}
                formatDomainValue={formatHour}
                onDomainChange={onDomainChange}
              />
            ) : null}
          </div>
        </ChartPanel>

        <ChartPanel title="Knobs" description="Configuration controls for the active preview.">
          <div className="grid gap-5">
            <div className="grid gap-3">
              <ControlSelect
                label="Dataset"
                value={selectedDataset.id}
                onChange={(value) => {
                  if (isExampleDataSetId(value)) {
                    onDataSetChange(value);
                  }
                }}
              >
                {datasets.map((dataset) => (
                  <NativeSelectOption key={dataset.id} value={dataset.id}>
                    {dataset.label}
                  </NativeSelectOption>
                ))}
              </ControlSelect>
              <ControlSelect label="Viewport" value={rangeId} onChange={onRangeChange}>
                {ranges.map((range) => (
                  <NativeSelectOption key={range.id} value={range.id}>
                    {range.label}
                  </NativeSelectOption>
                ))}
              </ControlSelect>
              <ControlSelect
                label="Chart"
                value={chartType}
                onChange={(value) => {
                  if (isPlaygroundChartType(value)) {
                    setChartType(value);
                  }
                }}
              >
                {playgroundChartOptions.map((option) => (
                  <NativeSelectOption key={option.id} value={option.id}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </ControlSelect>
              <ControlSelect
                label="Value"
                value={valueMode}
                onChange={(value) => {
                  if (isChartValueMode(value)) {
                    onValueModeChange(value);
                  }
                }}
              >
                {CHART_VALUE_MODE_DEFINITIONS.map((mode) => (
                  <NativeSelectOption key={mode.id} value={mode.id}>
                    {mode.label}
                  </NativeSelectOption>
                ))}
              </ControlSelect>
            </div>

            <div className="grid gap-4">
              <KnobSlider
                label="Bins"
                max={240}
                min={12}
                onValueChange={setTargetBinCount}
                step={6}
                value={targetBinCount}
              />
              <KnobSlider
                label="Histogram buckets"
                max={60}
                min={6}
                onValueChange={setHistogramBuckets}
                step={3}
                value={histogramBuckets}
              />
              <KnobSlider
                label="Heatmap y bins"
                max={24}
                min={4}
                onValueChange={setHeatmapYBins}
                step={1}
                value={heatmapYBins}
              />
              <KnobSlider
                label="Rolling window"
                max={31}
                min={1}
                onValueChange={setRollingWindow}
                step={2}
                value={rollingWindow}
              />
              <KnobSlider
                label="Threshold"
                max={320}
                min={20}
                onValueChange={setThreshold}
                step={5}
                value={threshold}
              />
              <KnobSlider
                label="Stroke"
                max={5}
                min={1}
                onValueChange={setStrokeWidth}
                step={0.2}
                suffix="px"
                value={strokeWidth}
              />
              <KnobSlider
                label="Fill"
                max={60}
                min={0}
                onValueChange={setFillOpacity}
                step={2}
                suffix="%"
                value={fillOpacity}
              />
              <KnobSlider
                label="Bar radius"
                max={12}
                min={0}
                onValueChange={setBarRadius}
                step={1}
                suffix="px"
                value={barRadius}
              />
            </div>

            <div className="grid gap-3">
              <ControlSelect
                label="Curve"
                value={curve}
                onChange={(value) => {
                  if (isPlaygroundCurve(value)) {
                    setCurve(value);
                  }
                }}
              >
                {playgroundCurveOptions.map((option) => (
                  <NativeSelectOption key={option.id} value={option.id}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </ControlSelect>
              <ControlSelect
                label="Gaps"
                value={gapBehavior}
                onChange={(value) => {
                  if (isChartGapBehavior(value)) {
                    setGapBehavior(value);
                  }
                }}
              >
                {chartGapBehaviorOptions.map((option) => (
                  <NativeSelectOption key={option.id} value={option.id}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </ControlSelect>
            </div>

            <div className="grid gap-3">
              <SwitchKnob label="Grid" checked={showGrid} onCheckedChange={setShowGrid} />
              <SwitchKnob label="Labels" checked={showLabels} onCheckedChange={setShowLabels} />
              <SwitchKnob
                label="Threshold"
                checked={showThreshold}
                onCheckedChange={setShowThreshold}
              />
              <SwitchKnob label="Minimap" checked={showMinimap} onCheckedChange={setShowMinimap} />
            </div>
          </div>
        </ChartPanel>
      </div>
    </section>
  );
}

type PlaygroundRenderRow = ReturnType<
  typeof createChartRenderData<TelemetryProperties>
>["rows"][number];
type PlaygroundGroupedSeries = ReturnType<
  ReturnType<typeof createChartDensityIndex<TelemetryProperties>>["getGroupedChartSeries"]
>;

function renderPlaygroundChart({
  barRadius,
  chartType,
  curve,
  domain,
  fillOpacity,
  gapBehavior,
  grouped,
  groupedRows,
  histogramRows,
  labels,
  onSampleSelect,
  rows,
  samples,
  selectedSampleIndex,
  showGrid,
  showThreshold,
  strokeWidth,
  threshold,
  valueMode,
}: {
  barRadius: number;
  chartType: PlaygroundChartType;
  curve: PlaygroundCurve;
  domain: [number, number];
  fillOpacity: number;
  gapBehavior: ChartGapBehavior;
  grouped: PlaygroundGroupedSeries;
  groupedRows: Array<Record<string, unknown>>;
  histogramRows: Array<{ count: number; label: string }>;
  labels: Array<{
    id: string;
    placements: readonly ["top", "top-right", "right"];
    priority: number;
    text: string;
    x: string;
    y: number;
  }>;
  onSampleSelect: (interaction: ChartSampleInteraction<TelemetryProperties>) => void;
  rows: PlaygroundRenderRow[];
  samples: ChartDensitySample<TelemetryProperties>[];
  selectedSampleIndex: number | null;
  showGrid: boolean;
  showThreshold: boolean;
  strokeWidth: number;
  threshold: number;
  valueMode: ChartValueMode;
}) {
  const commonMargin = { bottom: 8, left: 4, right: 14, top: 12 };
  const connectNulls = gapBehavior === "connect";
  const thresholdLine = showThreshold ? (
    <ReferenceLine
      y={threshold}
      stroke="var(--muted-foreground)"
      strokeDasharray="4 4"
      strokeOpacity={0.7}
    />
  ) : null;
  const grid = showGrid ? <CartesianGrid vertical={false} /> : null;
  const sampleOverlay = (
    <ChartSampleInteractionOverlay
      domain={domain}
      samples={samples}
      selectedSampleIndex={selectedSampleIndex}
      onSampleSelect={onSampleSelect}
    />
  );

  switch (chartType) {
    case "bar":
      return (
        <BarChart data={rows} margin={commonMargin}>
          {grid}
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis tickLine={false} axisLine={false} width={52} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {thresholdLine}
          <Bar dataKey={valueMode} fill="var(--color-value)" radius={barRadius} />
          <ChartLabelOverlay labels={labels} maxWidth={96} />
          {sampleOverlay}
        </BarChart>
      );
    case "combo":
      return (
        <AreaChart data={rows} margin={commonMargin}>
          {grid}
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis tickLine={false} axisLine={false} width={52} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {thresholdLine}
          <Area
            connectNulls={connectNulls}
            dataKey={valueMode}
            fill="var(--color-value)"
            fillOpacity={fillOpacity / 100}
            isAnimationActive={false}
            stroke="var(--color-value)"
            strokeWidth={strokeWidth}
            type={curve}
          />
          <Line
            connectNulls={connectNulls}
            dataKey="rolling"
            dot={false}
            isAnimationActive={false}
            stroke="var(--color-rolling)"
            strokeWidth={Math.max(1, strokeWidth + 0.6)}
            type={curve}
          />
          <ChartLabelOverlay labels={labels} maxWidth={96} />
          {sampleOverlay}
        </AreaChart>
      );
    case "histogram":
      return (
        <BarChart data={histogramRows} margin={commonMargin}>
          {grid}
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} />
          <YAxis tickLine={false} axisLine={false} width={46} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={barRadius} />
        </BarChart>
      );
    case "line":
      return (
        <LineChart data={rows} margin={commonMargin}>
          {grid}
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis tickLine={false} axisLine={false} width={52} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {thresholdLine}
          <Line
            connectNulls={connectNulls}
            dataKey={valueMode}
            dot={false}
            isAnimationActive={false}
            stroke="var(--color-value)"
            strokeWidth={strokeWidth}
            type={curve}
          />
          <Line
            connectNulls={connectNulls}
            dataKey="rolling"
            dot={false}
            isAnimationActive={false}
            stroke="var(--color-rolling)"
            strokeOpacity={0.65}
            strokeWidth={Math.max(1, strokeWidth - 0.2)}
            type={curve}
          />
          <ChartLabelOverlay labels={labels} maxWidth={96} />
          {sampleOverlay}
        </LineChart>
      );
    case "stacked":
      return (
        <BarChart data={groupedRows} margin={commonMargin}>
          {grid}
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis tickLine={false} axisLine={false} width={46} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {grouped.groups.map((group, index) => (
            <Bar
              key={group.key}
              dataKey={group.key}
              fill={`var(--chart-${(index % 5) + 1})`}
              radius={barRadius}
              stackId="playground"
            />
          ))}
          {sampleOverlay}
        </BarChart>
      );
    case "heatmap":
    case "area":
      return (
        <AreaChart data={rows} margin={commonMargin}>
          {grid}
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis tickLine={false} axisLine={false} width={52} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {thresholdLine}
          <Area
            connectNulls={connectNulls}
            dataKey={valueMode}
            fill="var(--color-value)"
            fillOpacity={fillOpacity / 100}
            isAnimationActive={false}
            stroke="var(--color-value)"
            strokeWidth={strokeWidth}
            type={curve}
          />
          <ChartLabelOverlay labels={labels} maxWidth={96} />
          {sampleOverlay}
        </AreaChart>
      );
  }
}

function createPlaygroundLabels(rows: PlaygroundRenderRow[], valueMode: ChartValueMode) {
  const valuedRows = rows
    .map((row) => ({
      row,
      value: getPlaygroundRowValue(row, valueMode),
    }))
    .filter((entry): entry is { row: PlaygroundRenderRow; value: number } => entry.value !== null);

  if (valuedRows.length === 0) {
    return [];
  }

  const peak = valuedRows.reduce((highest, entry) =>
    entry.value > highest.value ? entry : highest,
  );
  const last = valuedRows[valuedRows.length - 1];

  return [
    {
      id: "peak",
      placements: ["top", "top-right", "right"] as const,
      priority: 90,
      text: `Peak ${formatCompact(peak.value)}`,
      x: peak.row.label,
      y: peak.value,
    },
    {
      id: "latest",
      placements: ["top", "top-right", "right"] as const,
      priority: 70,
      text: `Latest ${formatCompact(last.value)}`,
      x: last.row.label,
      y: last.value,
    },
  ];
}

function getPlaygroundRowValue(row: PlaygroundRenderRow, valueMode: ChartValueMode) {
  const value = row[valueMode];

  return typeof value === "number" ? value : null;
}

function ControlSelect({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <NativeSelect value={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {children}
      </NativeSelect>
    </label>
  );
}

function KnobSlider({
  label,
  max,
  min,
  onValueChange,
  step,
  suffix = "",
  value,
}: {
  label: string;
  max: number;
  min: number;
  onValueChange: (value: number) => void;
  step: number;
  suffix?: string;
  value: number;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        <span className="tabular-nums text-sm font-medium">
          {Number.isInteger(value) ? value : value.toFixed(1)}
          {suffix}
        </span>
      </div>
      <Slider
        max={max}
        min={min}
        step={step}
        value={[value]}
        onValueChange={(nextValue) => onValueChange(nextValue[0] ?? value)}
        thumbAriaLabel={label}
      />
    </div>
  );
}

function SwitchKnob({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

const playgroundChartOptions: Array<{ id: PlaygroundChartType; label: string }> = [
  { id: "area", label: "Area" },
  { id: "line", label: "Line" },
  { id: "bar", label: "Bar" },
  { id: "combo", label: "Area + rolling" },
  { id: "histogram", label: "Histogram" },
  { id: "heatmap", label: "Heatmap" },
  { id: "stacked", label: "Stacked bars" },
];

const playgroundChartTitles: Record<PlaygroundChartType, string> = {
  area: "Area chart",
  bar: "Bar chart",
  combo: "Area chart with rolling line",
  heatmap: "Heatmap",
  histogram: "Histogram",
  line: "Line chart",
  stacked: "Stacked bars",
};

const playgroundCurveOptions: Array<{ id: PlaygroundCurve; label: string }> = [
  { id: "monotone", label: "Monotone" },
  { id: "linear", label: "Linear" },
  { id: "natural", label: "Natural" },
  { id: "step", label: "Step" },
];

const chartGapBehaviorOptions: Array<{ id: ChartGapBehavior; label: string }> = [
  { id: "preserve", label: "Preserve" },
  { id: "connect", label: "Connect" },
  { id: "zero-fill", label: "Zero fill" },
  { id: "drop", label: "Drop" },
];

function playgroundChartConfig(valueMode: ChartValueMode, valueLabel: string) {
  return {
    [valueMode]: {
      color: "var(--chart-1)",
      label: valueLabel,
    },
    count: {
      color: "var(--chart-4)",
      label: "Count",
    },
    rolling: {
      color: "var(--chart-2)",
      label: "Rolling",
    },
    value: {
      color: "var(--chart-1)",
      label: valueLabel,
    },
  };
}

function isExampleDataSetId(value: string): value is ExampleDataSetId {
  return ["operations", "retail", "sparse", "telemetry"].includes(value);
}

function isPlaygroundChartType(value: string): value is PlaygroundChartType {
  return playgroundChartOptions.some((option) => option.id === value);
}

function isPlaygroundCurve(value: string): value is PlaygroundCurve {
  return playgroundCurveOptions.some((option) => option.id === value);
}

function isChartGapBehavior(value: string): value is ChartGapBehavior {
  return chartGapBehaviorOptions.some((option) => option.id === value);
}

function isChartValueMode(value: string): value is ChartValueMode {
  return CHART_VALUE_MODE_DEFINITIONS.some((definition) => definition.id === value);
}

function DenseTrendExample({
  activeRange,
  fullDomain,
  index,
  onDomainChange,
  onValueModeChange,
  valueMode,
}: {
  activeRange: ChartRange;
  fullDomain: [number, number];
  index: ReturnType<typeof createChartDensityIndex<TelemetryProperties>>;
  onDomainChange: (domain: [number, number]) => void;
  onValueModeChange: (mode: ChartValueMode) => void;
  valueMode: ChartValueMode;
}) {
  const {
    containerRef: binCountContainerRef,
    isAuto,
    resetAuto,
    setManualBinCount,
    targetBinCount,
    width,
  } = useChartBinCount({
    defaultBinCount: 120,
    maxBinCount: 240,
    minBinCount: 36,
    pixelsPerBin: 9,
    step: 12,
  });
  const { containerRef: wheelContainerRef } = useChartWheelDomain<HTMLDivElement>({
    domain: activeRange.domain,
    fullDomain,
    onDomainChange,
  });
  const chartContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      binCountContainerRef(node);
      wheelContainerRef(node);
    },
    [binCountContainerRef, wheelContainerRef],
  );
  const measured = useMemo(
    () =>
      measureChartSeries(index, {
        includeEmptyBins: true,
        targetBinCount,
        valueMode,
        xDomain: activeRange.domain,
      }),
    [activeRange.domain, index, targetBinCount, valueMode],
  );
  const minimapSeries = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 180,
        valueMode,
        xDomain: fullDomain,
      }),
    [fullDomain, index, valueMode],
  );
  const definition = getChartValueModeDefinition(valueMode);
  const renderData = useMemo(
    () =>
      createChartRenderData(measured.series.samples, {
        includeSample: true,
        modes: [valueMode],
        xLabel: (sample) => formatHour(sample.x),
      }).rows,
    [measured.series.samples, valueMode],
  );
  const summary = useMemo(
    () => createChartDensityViewportSummary(measured.series),
    [measured.series],
  );
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(null);
  const [contextInteraction, setContextInteraction] =
    useState<ChartSampleInteraction<TelemetryProperties> | null>(null);
  const selectedSample = useMemo(
    () => measured.series.samples.find((sample) => sample.index === selectedSampleIndex) ?? null,
    [measured.series.samples, selectedSampleIndex],
  );
  const selectedPoint = selectedSample?.firstPoint
    ? index.getPointById(selectedSample.firstPoint.id)
    : null;
  const actionSample = contextInteraction?.sample ?? selectedSample;
  const binActionItems = useMemo(() => createBinActionItems(Boolean(actionSample)), [actionSample]);
  const handleSampleSelect = useCallback(
    (interaction: ChartSampleInteraction<TelemetryProperties>) => {
      setSelectedSampleIndex(interaction.sample.index);
      setContextInteraction(interaction);
    },
    [],
  );
  const handleBinAction = useCallback(
    (id: string) => {
      if (id === "reset-domain") {
        onDomainChange(fullDomain);
        return;
      }

      const sample = contextInteraction?.sample ?? selectedSample;

      if (!sample) {
        return;
      }

      switch (id) {
        case "select-bin":
          setSelectedSampleIndex(sample.index);
          break;
        case "zoom-bin":
          onDomainChange(createPaddedBinDomain(sample, fullDomain));
          break;
        case "copy-range":
          void copyText(formatSampleRange(sample));
          break;
        case "copy-summary":
          void copyText(formatSampleSummary(sample, valueMode, definition.axisLabel));
          break;
      }
    },
    [
      contextInteraction,
      definition.axisLabel,
      fullDomain,
      onDomainChange,
      selectedSample,
      valueMode,
    ],
  );
  const actionMenuHeader = actionSample ? (
    <div className="grid gap-1 px-2 py-1.5 text-sm">
      <span className="font-medium">{formatSampleRange(actionSample)}</span>
      <span className="text-xs text-muted-foreground">
        {formatCompact(actionSample.pointCount)} points
      </span>
    </div>
  ) : null;
  const sampleOverlay = (
    <ChartSampleInteractionOverlay
      domain={activeRange.domain}
      samples={measured.series.samples}
      selectedSampleIndex={selectedSample?.index ?? null}
      onSampleContextMenu={(interaction) => setContextInteraction(interaction)}
      onSampleSelect={handleSampleSelect}
    />
  );

  return (
    <ChartPanel
      badge={`${targetBinCount} bins`}
      title="Responsive dense trend"
      description="Auto-binned Recharts output using the selected value mode."
    >
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <ChartValueModeSelector value={valueMode} onValueChange={onValueModeChange} />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setManualBinCount(72)}>
              72 bins
            </Button>
            <Button type="button" variant="outline" onClick={() => setManualBinCount(168)}>
              168 bins
            </Button>
            <Button type="button" variant="ghost" disabled={isAuto} onClick={resetAuto}>
              Auto
            </Button>
            <ActionMenu
              label="Selected bin actions"
              items={binActionItems}
              header={actionMenuHeader}
              onItemSelect={handleBinAction}
              trigger={
                <Button type="button" variant="outline" disabled={!selectedSample}>
                  Actions
                </Button>
              }
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <ChartMetricCard
            label="Query"
            value={`${measured.queryMs.toFixed(2)} ms`}
            hint={`${summary.sampleCount} samples from ${formatCompact(summary.itemCount)} points`}
          />
          <ChartMetricCard
            label={definition.axisLabel}
            value={formatCompact(summary.metrics.revenue ?? 0)}
            hint="Revenue metric carried through binned samples"
          />
          <ChartMetricCard
            label="Width"
            value={width ? `${Math.round(width)} px` : "measuring"}
            hint={isAuto ? "Bin count follows container width" : "Manual bin count is active"}
          />
        </div>
        <ContextActionMenu
          items={binActionItems}
          header={actionMenuHeader}
          onItemSelect={handleBinAction}
          onOpenChange={(open) => {
            if (!open) {
              setContextInteraction(null);
            }
          }}
        >
          <div ref={chartContainerRef}>
            <ChartContainer className="h-[24rem] w-full" config={chartConfig(definition.label)}>
              {definition.renderer === "bar" ? (
                <BarChart data={renderData} margin={{ bottom: 8, left: 8, right: 12, top: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
                  <YAxis tickLine={false} axisLine={false} width={56} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={0} />
                  {sampleOverlay}
                </BarChart>
              ) : (
                <AreaChart data={renderData} margin={{ bottom: 8, left: 8, right: 12, top: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
                  <YAxis tickLine={false} axisLine={false} width={56} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="value"
                    fill="var(--color-value)"
                    fillOpacity={0.18}
                    isAnimationActive={false}
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    type="monotone"
                  />
                  {sampleOverlay}
                </AreaChart>
              )}
            </ChartContainer>
          </div>
        </ContextActionMenu>
        {selectedSample ? (
          <div className="grid gap-3">
            <ChartHotBinRow sample={selectedSample} formatX={formatHour} />
            <div className="grid gap-3 md:grid-cols-4">
              <ChartMetricStrip label="Selected x" value={formatHour(selectedSample.x)} />
              <ChartMetricStrip label="Points" value={formatCompact(selectedSample.pointCount)} />
              <ChartMetricStrip
                label={definition.axisLabel}
                value={formatSampleModeValue(selectedSample, valueMode)}
              />
              <ChartMetricStrip
                label="First point"
                value={selectedPoint?.properties.note ?? "No point"}
              />
            </div>
          </div>
        ) : null}
        <ChartDomainMinimap
          domain={activeRange.domain}
          fullDomain={fullDomain}
          samples={minimapSeries.samples}
          formatDomainValue={formatHour}
          onDomainChange={onDomainChange}
        />
      </div>
    </ChartPanel>
  );
}

function createBinActionItems(hasSample: boolean): MenuActionItem[] {
  return [
    {
      disabled: !hasSample,
      id: "select-bin",
      label: "Select bin",
    },
    {
      disabled: !hasSample,
      id: "zoom-bin",
      label: "Zoom to bin",
    },
    {
      disabled: !hasSample,
      id: "copy-range",
      label: "Copy x range",
    },
    {
      disabled: !hasSample,
      id: "copy-summary",
      label: "Copy bin summary",
    },
    {
      id: "reset-domain",
      label: "Reset viewport",
    },
  ];
}

function createPaddedBinDomain<TProperties>(
  sample: ChartDensitySample<TProperties>,
  fullDomain: [number, number],
): [number, number] {
  const fullSpan = fullDomain[1] - fullDomain[0];
  const binSpan = Math.max(sample.x1 - sample.x0, fullSpan / 200, Number.EPSILON);
  const padding = binSpan * 2;
  const span = Math.min(fullSpan, binSpan + padding * 2);
  const midpoint = (sample.x0 + sample.x1) / 2;
  const left = midpoint - span / 2;
  const right = midpoint + span / 2;

  if (span >= fullSpan) {
    return fullDomain;
  }

  if (left < fullDomain[0]) {
    return [fullDomain[0], fullDomain[0] + span];
  }

  if (right > fullDomain[1]) {
    return [fullDomain[1] - span, fullDomain[1]];
  }

  return [left, right];
}

function formatSampleRange<TProperties>(sample: ChartDensitySample<TProperties>) {
  return `${formatHour(sample.x0)} to ${formatHour(sample.x1)}`;
}

function formatSampleSummary<TProperties>(
  sample: ChartDensitySample<TProperties>,
  valueMode: ChartValueMode,
  valueLabel: string,
) {
  const primaryMetric = getPrimarySampleMetric(sample);
  const lines = [
    `Range: ${formatSampleRange(sample)}`,
    `Points: ${formatCompact(sample.pointCount)}`,
    `${valueLabel}: ${formatSampleModeValue(sample, valueMode)}`,
  ];

  if (primaryMetric) {
    lines.push(`${primaryMetric[0]}: ${formatCompact(primaryMetric[1])}`);
  }

  return lines.join("\n");
}

function getPrimarySampleMetric<TProperties>(sample: ChartDensitySample<TProperties>) {
  const entries = Object.entries(sample.metrics);

  return entries.find(([metricKey]) => metricKey === "revenue") ?? entries[0] ?? null;
}

function formatSampleModeValue<TProperties>(
  sample: ChartDensitySample<TProperties>,
  valueMode: ChartValueMode,
) {
  const value = getSampleModeValue(sample, valueMode);

  return value === null ? "n/a" : formatCompact(value);
}

function getSampleModeValue<TProperties>(
  sample: ChartDensitySample<TProperties>,
  valueMode: ChartValueMode,
) {
  switch (valueMode) {
    case "average":
      return sample.averageY;
    case "count":
      return sample.pointCount;
    case "max":
      return sample.maxY;
    case "min":
      return sample.minY;
    case "p10":
      return sample.p10;
    case "p25":
      return sample.p25;
    case "p50":
      return sample.p50;
    case "p75":
      return sample.p75;
    case "p90":
      return sample.p90;
    case "p95":
      return sample.p95;
    case "p99":
      return sample.p99;
    case "sum":
      return sample.sumY;
  }
}

function ValueModeExamples({
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
    <section className="grid gap-4">
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

function AnalyticsExamples({
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
    <section className="grid gap-4">
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
              <YAxis tickLine={false} axisLine={false} width={48} />
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
            <YAxis tickLine={false} axisLine={false} width={60} />
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

function ChartVariantExamples({
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
    <section className="grid gap-4">
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
              <ToggleGroupItem key={option.id} value={option.id} aria-label={option.title}>
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
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Envelope lines"
          description="Average, maximum, and minimum values per bin."
        >
          <BinnedVariantChart
            activeRange={activeRange}
            chartClassName="h-72 w-full"
            fullDomain={fullDomain}
            index={index}
            onDomainChange={onDomainChange}
            variant="envelope"
          />
        </ChartPanel>

        <ChartPanel
          title="Comparison lines"
          description="Current viewport compared with a previous-period baseline and target."
        >
          <BinnedVariantChart
            activeRange={activeRange}
            chartClassName="h-72 w-full"
            fullDomain={fullDomain}
            index={index}
            onDomainChange={onDomainChange}
            variant="comparison"
          />
        </ChartPanel>

        <ChartPanel title="Volume bars" description="Source point counts per bin.">
          <BinnedVariantChart
            activeRange={activeRange}
            chartClassName="h-64 w-full"
            fullDomain={fullDomain}
            index={index}
            onDomainChange={onDomainChange}
            variant="volume"
          />
        </ChartPanel>

        <ChartPanel
          title="Revenue bars"
          description="Aggregated revenue per bin, shown in thousands."
        >
          <BinnedVariantChart
            activeRange={activeRange}
            chartClassName="h-64 w-full"
            fullDomain={fullDomain}
            index={index}
            onDomainChange={onDomainChange}
            variant="revenue"
          />
        </ChartPanel>
      </div>
    </section>
  );
}

function BinnedVariantChart({
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

type ChartVariantRow = {
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

type ChartVariantSourceRow = {
  average: number | null;
  count: number | null;
  label: string;
  max: number | null;
  metrics?: Record<string, number>;
  min: number | null;
  pointCount: number;
  x: number;
};

const variantRenderDataOptions = {
  includeMetrics: true,
  modes: ["average", "count", "max", "min", "sum"],
  xLabel: (sample: ChartDensitySample<TelemetryProperties>) => formatHour(sample.x),
} as const;

function createVariantRows(rows: ChartVariantSourceRow[]): ChartVariantRow[] {
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

const chartVariantOptions: Array<{
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

function isChartVariantId(value: string): value is ChartVariantId {
  return chartVariantOptions.some((option) => option.id === value);
}

function renderVariantChart(variant: ChartVariantId, rows: ChartVariantRow[]) {
  switch (variant) {
    case "comparison":
      return (
        <LineChart data={rows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis tickLine={false} axisLine={false} width={48} />
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
          <YAxis tickLine={false} axisLine={false} width={42} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="revenueK" fill="var(--color-revenueK)" radius={0} />
        </BarChart>
      );
    case "volume":
      return (
        <BarChart data={rows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis tickLine={false} axisLine={false} width={42} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="volume" fill="var(--color-volume)" radius={0} />
        </BarChart>
      );
    case "envelope":
      return (
        <LineChart data={rows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis tickLine={false} axisLine={false} width={48} />
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

function createAnnotationLabels(rows: ChartVariantRow[]) {
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

function createLineObstacles(rows: ChartVariantRow[], keys: Array<keyof ChartVariantRow>) {
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

function getNearestChartRow(rows: ChartVariantRow[], targetX: number) {
  return rows.reduce<ChartVariantRow | null>((nearest, row) => {
    if (!nearest) {
      return row;
    }

    return Math.abs(row.x - targetX) < Math.abs(nearest.x - targetX) ? row : nearest;
  }, null);
}

function DistributionExamples({
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
    <section className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Distribution charts</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Histogram, heatmap, grouped stacks, percentile bands, and box plots from the same index.
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
              <YAxis tickLine={false} axisLine={false} width={42} />
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

        <ChartPanel title="Stacked by plan" description="Point counts grouped by plan.">
          <ChartContainer className="h-72 w-full" config={groupedConfig}>
            <BarChart data={groupedRows} margin={{ bottom: 8, left: 4, right: 14, top: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
              <YAxis tickLine={false} axisLine={false} width={42} />
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
              <YAxis tickLine={false} axisLine={false} width={48} />
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

function SparklineExample({
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

function BackendExample({ points }: { points: ChartSeriesPoint<TelemetryProperties>[] }) {
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

function GapBehaviorExample({ points }: { points: ChartSeriesPoint<TelemetryProperties>[] }) {
  const index = useMemo(() => createChartDensityIndex(points, { backend: "hybrid-js" }), [points]);
  const series = index.getChartSeries({
    includeEmptyBins: true,
    targetBinCount: 120,
    valueMode: "average",
    xDomain: [0, 96],
  });
  const behaviors = ["preserve", "connect", "zero-fill"] as const;

  return (
    <section className="grid gap-4">
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
                  <YAxis tickLine={false} axisLine={false} width={42} />
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

function createExampleDataSets(): ExampleDataSet[] {
  const telemetry = createTelemetryPoints();

  return [
    {
      description:
        "Product telemetry with release lift, campaign pulse, quiet windows, and spikes.",
      id: "telemetry",
      label: "Product telemetry",
      points: telemetry,
    },
    {
      description:
        "Retail demand with weekday cadence, weekend peaks, launch lift, and sale spikes.",
      id: "retail",
      label: "Retail demand",
      points: createRetailPoints(),
    },
    {
      description:
        "Operations load with incidents, recovery periods, and a stronger latency metric.",
      id: "operations",
      label: "Operations load",
      points: createOperationsPoints(),
    },
    {
      description: "Sparse telemetry with intentional empty windows for gap behavior testing.",
      id: "sparse",
      label: "Sparse gaps",
      points: createSparsePoints(telemetry),
    },
  ];
}

function createTelemetryPoints(): ChartSeriesPoint<TelemetryProperties>[] {
  const points: ChartSeriesPoint<TelemetryProperties>[] = [];
  const channels: TelemetryProperties["channel"][] = ["direct", "partner", "marketplace"];
  const plans: TelemetryProperties["plan"][] = ["starter", "scale", "enterprise"];

  for (let hour = 0; hour <= 30 * 24; hour += 0.25) {
    const day = hour / 24;
    const dayCycle = Math.sin((hour / 24) * Math.PI * 2 - 0.8);
    const weekCycle = Math.sin((day / 7) * Math.PI * 2);
    const releaseLift = day > 18 ? 18 * Math.log1p(day - 18) : 0;
    const campaignPulse = Math.exp(-Math.pow(day - 23, 2) / 9) * 36;
    const analyticsSpike = Math.exp(-Math.pow(day - 26, 2) / 0.03) * 150;
    const maintenanceDip = day > 12 && day < 13.5 ? -22 : 0;
    const quietPeriod = day > 8 && day < 9.25 ? -38 : 0;
    const deterministicNoise = seededWave(hour * 9.731) * 9;
    const y = Math.max(
      4,
      92 +
        dayCycle * 26 +
        weekCycle * 12 +
        releaseLift +
        campaignPulse +
        analyticsSpike +
        maintenanceDip +
        quietPeriod +
        deterministicNoise,
    );
    const revenue = y * (18 + seededWave(hour * 0.73) * 4);

    points.push({
      id: `hour-${hour.toFixed(2)}`,
      label: formatHour(hour),
      metrics: {
        latency: Math.max(20, 120 - y * 0.32 + seededWave(hour * 2.2) * 12),
        revenue,
        signups: Math.max(0, Math.round(y / 9 + seededWave(hour * 1.6) * 3)),
      },
      properties: {
        channel: channels[Math.floor(hour * 3) % channels.length],
        note: `Sample ${formatHour(hour)}`,
        plan: plans[Math.floor(hour / 11) % plans.length],
      },
      x: hour,
      y,
    });
  }

  return points;
}

function createRetailPoints(): ChartSeriesPoint<TelemetryProperties>[] {
  const points: ChartSeriesPoint<TelemetryProperties>[] = [];
  const channels: TelemetryProperties["channel"][] = ["marketplace", "direct", "partner"];
  const plans: TelemetryProperties["plan"][] = ["starter", "scale", "enterprise"];

  for (let hour = 0; hour <= 30 * 24; hour += 0.25) {
    const day = hour / 24;
    const hourOfDay = hour % 24;
    const dailyTraffic = Math.max(0, Math.sin(((hourOfDay - 7) / 24) * Math.PI));
    const eveningPeak = Math.exp(-Math.pow(hourOfDay - 20, 2) / 14) * 42;
    const weekend = Math.floor(day) % 7 >= 5 ? 36 : 0;
    const launchLift = day > 14 ? 12 * Math.log1p(day - 14) : 0;
    const flashSale = Math.exp(-Math.pow(day - 21, 2) / 0.12) * 140;
    const stockoutDip = day > 24.5 && day < 25.5 ? -68 : 0;
    const deterministicNoise = seededWave(hour * 5.31) * 11;
    const y = Math.max(
      6,
      44 +
        dailyTraffic * 86 +
        eveningPeak +
        weekend +
        launchLift +
        flashSale +
        stockoutDip +
        deterministicNoise,
    );
    const revenue = y * (28 + weekend * 0.18 + seededWave(hour * 0.41) * 6);

    points.push({
      id: `retail-${hour.toFixed(2)}`,
      label: formatHour(hour),
      metrics: {
        latency: Math.max(35, 170 - y * 0.26 + seededWave(hour * 1.9) * 18),
        revenue,
        signups: Math.max(0, Math.round(y / 11 + seededWave(hour * 1.2) * 4)),
      },
      properties: {
        channel: channels[Math.floor(hour / 5) % channels.length],
        note: `Retail sample ${formatHour(hour)}`,
        plan: plans[Math.floor((hour + 9) / 17) % plans.length],
      },
      x: hour,
      y,
    });
  }

  return points;
}

function createOperationsPoints(): ChartSeriesPoint<TelemetryProperties>[] {
  const points: ChartSeriesPoint<TelemetryProperties>[] = [];
  const channels: TelemetryProperties["channel"][] = ["direct", "partner", "marketplace"];
  const plans: TelemetryProperties["plan"][] = ["enterprise", "scale", "starter"];

  for (let hour = 0; hour <= 30 * 24; hour += 0.25) {
    const day = hour / 24;
    const hourOfDay = hour % 24;
    const businessHours = hourOfDay >= 8 && hourOfDay <= 18 ? 44 : 10;
    const weeklyBatch = Math.max(0, Math.sin((day / 7) * Math.PI * 2 - 1.1)) * 28;
    const incidentA = Math.exp(-Math.pow(day - 6.5, 2) / 0.05) * 125;
    const incidentB = Math.exp(-Math.pow(day - 19.75, 2) / 0.08) * 165;
    const recovery = day > 20 && day < 22 ? -34 : 0;
    const deterministicNoise = seededWave(hour * 8.17) * 13;
    const y = Math.max(
      3,
      58 + businessHours + weeklyBatch + incidentA + incidentB + recovery + deterministicNoise,
    );

    points.push({
      id: `ops-${hour.toFixed(2)}`,
      label: formatHour(hour),
      metrics: {
        latency: Math.max(25, 80 + y * 0.72 + seededWave(hour * 2.8) * 25),
        revenue: Math.max(0, (180 - y) * 13 + seededWave(hour * 0.62) * 80),
        signups: Math.max(0, Math.round(26 - y / 12 + seededWave(hour * 1.44) * 2)),
      },
      properties: {
        channel: channels[Math.floor(hour / 7) % channels.length],
        note: `Ops sample ${formatHour(hour)}`,
        plan: plans[Math.floor(hour / 13) % plans.length],
      },
      x: hour,
      y,
    });
  }

  return points;
}

function createSparsePoints(
  source: ChartSeriesPoint<TelemetryProperties>[],
): ChartSeriesPoint<TelemetryProperties>[] {
  return source
    .filter((point) => {
      const day = point.x / 24;

      return (
        !(day > 4.2 && day < 5.8) &&
        !(day > 10.5 && day < 13.25) &&
        !(day > 17.7 && day < 18.9) &&
        !(day > 26 && day < 28.4) &&
        Math.floor(point.x * 4) % 3 !== 0
      );
    })
    .map((point) => {
      const properties = point.properties ?? {
        channel: "direct" as const,
        note: point.label ?? "Sparse sample",
        plan: "starter" as const,
      };

      return {
        ...point,
        id: `sparse-${point.id}`,
        metrics: {
          ...point.metrics,
          revenue: (point.metrics?.revenue ?? 0) * 0.82,
        },
        properties: {
          channel: properties.channel,
          note: `Sparse ${point.label ?? formatHour(point.x)}`,
          plan: properties.plan,
        },
        y: Math.max(2, point.y * 0.78 + Math.sin(point.x / 4) * 18),
      };
    });
}

function createGapPoints(): ChartSeriesPoint<TelemetryProperties>[] {
  return createTelemetryPoints()
    .filter((point) => {
      const x = point.x;

      return x < 96 && !(x > 18 && x < 28) && !(x > 44 && x < 52) && !(x > 73 && x < 84);
    })
    .map((point) => ({
      ...point,
      id: `gap-${point.id}`,
      y: point.y * 0.72 + Math.sin(point.x / 3) * 8,
    }));
}

function chartConfig(label: string) {
  return {
    value: {
      color: "var(--chart-1)",
      label,
    },
    average: {
      color: "var(--chart-1)",
      label,
    },
  };
}

const variantChartConfig = {
  current: {
    color: "var(--chart-1)",
    label: "Current",
  },
  floor: {
    color: "var(--chart-3)",
    label: "Minimum",
  },
  peak: {
    color: "var(--chart-2)",
    label: "Maximum",
  },
  previous: {
    color: "var(--chart-4)",
    label: "Previous",
  },
  revenueK: {
    color: "var(--chart-5)",
    label: "Revenue (k)",
  },
  target: {
    color: "var(--muted-foreground)",
    label: "Target",
  },
  volume: {
    color: "var(--chart-4)",
    label: "Volume",
  },
};

const analyticsChartConfig = {
  average: {
    color: "var(--chart-1)",
    label: "Average",
  },
  cumulativeRevenue: {
    color: "var(--chart-5)",
    label: "Cumulative revenue",
  },
  revenueDelta: {
    color: "var(--chart-4)",
    label: "Revenue delta %",
  },
  rollingAverage: {
    color: "var(--chart-2)",
    label: "Rolling average",
  },
};

const bandChartConfig = {
  center: {
    color: "var(--chart-1)",
    label: "Median",
  },
  range: {
    color: "var(--chart-2)",
    label: "P25-P75",
  },
};

function gapDescription(behavior: "preserve" | "connect" | "zero-fill") {
  switch (behavior) {
    case "connect":
      return "Drops empty rows and returns annotations for missing spans.";
    case "zero-fill":
      return "Keeps empty bins and renders them as zero values.";
    case "preserve":
      return "Keeps empty bins as null values for renderer-native gaps.";
  }
}

function formatHour(value: number) {
  const day = Math.floor(value / 24) + 1;
  const hour = Math.round(value % 24);

  return `D${day} ${hour.toString().padStart(2, "0")}:00`;
}

function formatCompact(value: number) {
  return formatNumber.format(value);
}

function formatCurrency(value: number) {
  return `$${formatNumber.format(value)}`;
}

function seededWave(seed: number) {
  return Math.sin(seed * 12.9898) * Math.cos(seed * 78.233);
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

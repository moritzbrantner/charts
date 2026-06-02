import {
  Badge,
  Button,
  ChartContainer,
  ContextActionMenu,
  NativeSelectOption,
} from "@moritzbrantner/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CHART_VALUE_MODE_DEFINITIONS,
  ChartCirclePackSvg,
  ChartDomainMinimap,
  ChartFlameGraphSvg,
  ChartFunnelSvg,
  ChartHeatmapGrid,
  ChartIcicleSvg,
  ChartIndentedTreeSvg,
  ChartMetricStrip,
  ChartPanel,
  ChartRadialTreeSvg,
  ChartRangeSelector,
  ChartScatterSvg,
  ChartSeriesLegend,
  ChartSunburstSvg,
  ChartThresholdMarker,
  ChartTreeSvg,
  ChartTreemapSvg,
  ChartWaterfallSvg,
  ChartWithLegend,
  createChartCirclePackLayout,
  createChartDensityIndex,
  createChartDensityViewportSummary,
  createChartFlameGraphLayout,
  createChartIcicleLayout,
  createChartIndentedTreeLayout,
  createChartRadialTreeLayout,
  createChartRenderData,
  createChartSunburstLayout,
  createChartTreeLayout,
  createChartTreemapLayout,
  createGroupedChartRenderData,
  createRollingChartSeries,
  getChartAxisScaleDefinitions,
  getChartDataYBounds,
  getChartThresholdAnnotations,
  getChartValueModeDefinition,
  getRechartsAnimationProps,
  resolveChartAxisTransformStatus,
  useChartAnimatedDomain,
  useChartDragDomain,
  useChartPlaybackDomain,
  useChartWheelDomain,
} from "@moritzbrantner/charts";

import {
  PlaygroundActiveLabels,
  createBusinessFunnelData,
  createBusinessHierarchy,
  createBusinessWaterfallData,
  getHierarchyValue,
  renderPlaygroundSelectionDetails,
} from "./business";
import { PlaygroundCandlestickChart, createPlaygroundLabels } from "./candlestick";
import {
  ControlSelect,
  KnobSlider,
  SwitchKnob,
  chartAxisOrientationOptions,
  chartGapBehaviorOptions,
  chartPageLinks,
  isChartAxisOrientation,
  isChartAxisScale,
  isChartGapBehavior,
  isChartValueMode,
  isExampleDataSetId,
  isPlaygroundAnimationMode,
  isPlaygroundChartType,
  isPlaygroundCurve,
  playgroundAnimationOptions,
  playgroundChartConfig,
  playgroundChartOptions,
  playgroundChartTitles,
  playgroundCurveOptions,
} from "./controls";
import {
  createExampleDataSets,
  createGapPoints,
  formatCompact,
  formatCurrency,
  formatHour,
} from "./data";
import { DenseTrendExample } from "./dense-trend";
import {
  AnalyticsExamples,
  BackendExample,
  ChartVariantExamples,
  ComposedChartExamples,
  DistributionExamples,
  GapBehaviorExample,
  SparklineExample,
  ValueModeExamples,
} from "./example-sections";
import { ranges } from "./model";
import {
  createPlaygroundLegendItems,
  createPreviousDomain,
  getExampleBusinessMetric,
  getPlaygroundChartCapabilities,
  getPlaygroundChartDescription,
  getPlaygroundYAxisDataKeys,
  getPlaygroundYAxisRows,
  isChartInteractionControl,
  renderPlaygroundChart,
} from "./playground-renderer";

import type {
  ExampleDataSet,
  ExampleDataSetId,
  ExamplePage,
  PlaygroundAnimationMode,
  PlaygroundChartType,
  PlaygroundCurve,
  PlaygroundHierarchySelection,
  TelemetryProperties,
} from "./model";
import type {
  ChartAxesTransform,
  ChartAxisOrientation,
  ChartFunnelRow,
  ChartGapBehavior,
  ChartRange,
  ChartValueMode,
  ChartWaterfallRow,
} from "@moritzbrantner/charts";
import type { MenuActionItem } from "@moritzbrantner/ui";
import type { ReactNode } from "react";

export function App() {
  const page = getExamplePage();
  const chartPageType = getChartPageType(page);
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
  const index = useMemo(() => createChartDensityIndex(points, { backend: "auto" }), [points]);
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
      <header className="border-b border-border/70 bg-background/95">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <a href="./" className="text-sm font-semibold tracking-tight">
            @moritzbrantner/charts
          </a>
          <ExampleNav page={page} />
        </div>
      </header>
      <section className="border-b border-border/70 bg-card/50" data-testid="examples-hero">
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
        {page === "compose" || chartPageType ? (
          <ChartPlayground
            activeRange={activeRange}
            datasets={datasets}
            fixedChartType={chartPageType}
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
        ) : (
          <>
            <section
              className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]"
              data-testid="dense-trend-example"
            >
              <ChartPanel
                title="Viewport"
                description="Switch the domain used by each chart query."
              >
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

            <DeferredExampleMount testId="value-mode-examples" title="Value modes">
              <ValueModeExamples
                activeRange={activeRange}
                index={index}
                valueMode={valueMode}
                onValueModeChange={setValueMode}
              />
            </DeferredExampleMount>

            <DeferredExampleMount testId="analytics-examples" title="Analytics cards">
              <AnalyticsExamples activeRange={activeRange} index={index} />
            </DeferredExampleMount>

            <DeferredExampleMount testId="chart-variant-examples" title="Chart variants">
              <ChartVariantExamples
                activeRange={activeRange}
                fullDomain={fullDomain}
                index={index}
                onDomainChange={setActiveDomain}
              />
            </DeferredExampleMount>

            <DeferredExampleMount testId="composed-chart-examples" title="Composed charts">
              <ComposedChartExamples activeRange={activeRange} index={index} />
            </DeferredExampleMount>

            <DeferredExampleMount testId="distribution-examples" title="Distribution charts">
              <DistributionExamples activeRange={activeRange} index={index} />
            </DeferredExampleMount>

            <DeferredExampleMount
              className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
              testId="linked-and-progressive-examples"
              title="Linked and progressive examples"
            >
              <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <SparklineExample activeRange={activeRange} index={index} valueMode={valueMode} />
                <BackendExample points={points} />
              </section>
            </DeferredExampleMount>

            <DeferredExampleMount testId="gap-behavior-example" title="Gap behavior">
              <GapBehaviorExample points={gapPoints} />
            </DeferredExampleMount>
          </>
        )}
      </div>
    </main>
  );
}

export function DeferredExampleMount({
  children,
  className = "grid gap-4",
  testId,
  title,
}: {
  children: ReactNode;
  className?: string;
  testId: string;
  title: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      return;
    }

    const node = rootRef.current;

    if (!node || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div ref={rootRef}>
      {isVisible ? (
        children
      ) : (
        <section className={className} data-testid={testId} style={{ minHeight: "24rem" }}>
          <ChartPanel title={title} description="This example mounts when it enters the viewport.">
            <div className="h-48 rounded-md border border-dashed border-border/80 bg-muted/20" />
          </ChartPanel>
        </section>
      )}
    </div>
  );
}

export function getExamplePage(): ExamplePage {
  const pathname = window.location.pathname.replace(/\/$/, "");
  const filename = pathname.split("/").pop() ?? "";

  if (filename === "compose" || filename === "compose.html") {
    return "compose";
  }

  const chartPage = chartPageLinks.find(
    (link) => filename === link.path || filename === link.path.replace(/\.html$/, ""),
  );

  return chartPage ? chartPage.id : "examples";
}

export function getChartPageType(page: ExamplePage): PlaygroundChartType | null {
  return page.startsWith("chart-") ? (page.slice("chart-".length) as PlaygroundChartType) : null;
}

export function ExampleNav({ page }: { page: ExamplePage }) {
  const links: Array<{ href: string; id: ExamplePage; label: string }> = [
    { href: "./", id: "examples", label: "Examples" },
    { href: "./compose.html", id: "compose", label: "Compose" },
    ...chartPageLinks.map((link) => ({
      href: `./${link.path}`,
      id: link.id,
      label: link.label,
    })),
  ];

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Examples navigation">
      {links.map((link) => {
        const active = page === link.id;

        return (
          <a
            key={link.id}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/70 bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}

export function ChartPlayground({
  activeRange,
  datasets,
  fixedChartType,
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
  fixedChartType?: PlaygroundChartType | null;
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
  const [selectedChartType, setSelectedChartType] = useState<PlaygroundChartType>("area");
  const chartType = fixedChartType ?? selectedChartType;
  const chartCapabilities = getPlaygroundChartCapabilities(chartType);
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
  const [showLegend, setShowLegend] = useState(true);
  const [showThreshold, setShowThreshold] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [playbackEnabled, setPlaybackEnabled] = useState(false);
  const [animationMode, setAnimationMode] = useState<PlaygroundAnimationMode>("none");
  const [axesTransform, setAxesTransform] = useState<ChartAxesTransform>({
    orientation: "vertical",
    x: { domain: null, scale: "linear" },
    y: { domain: null, scale: "linear" },
  });
  const [hiddenLegendIds, setHiddenLegendIds] = useState<string[]>([]);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(null);
  const [selectedWaterfallRow, setSelectedWaterfallRow] = useState<ChartWaterfallRow | null>(null);
  const [selectedFunnelRow, setSelectedFunnelRow] = useState<ChartFunnelRow | null>(null);
  const [selectedHierarchyNode, setSelectedHierarchyNode] =
    useState<PlaygroundHierarchySelection | null>(null);
  const [treemapFocusId, setTreemapFocusId] = useState<string | null>(null);
  const clearBusinessSelections = useCallback(() => {
    setSelectedWaterfallRow(null);
    setSelectedFunnelRow(null);
    setSelectedHierarchyNode(null);
    setTreemapFocusId(null);
  }, []);
  const playback = useChartPlaybackDomain({
    enabled: playbackEnabled && chartCapabilities.playback,
    fullDomain,
    playing: false,
  });
  const effectiveDomain =
    playbackEnabled && chartCapabilities.playback ? playback.domain : activeRange.domain;
  const handleInteractiveDomainChange = useCallback(
    (domain: [number, number]) => {
      setPlaybackEnabled(false);
      clearBusinessSelections();
      onDomainChange(domain);
    },
    [clearBusinessSelections, onDomainChange],
  );
  const { containerRef: wheelContainerRef, onWheel: handlePreviewWheel } =
    useChartWheelDomain<HTMLDivElement>({
      domain: effectiveDomain,
      fullDomain,
      onDomainChange: handleInteractiveDomainChange,
    });
  const {
    containerRef: dragContainerRef,
    isDragging: isPreviewDomainDragging,
    onDoubleClick: handlePreviewDomainDoubleClick,
    onPointerCancel: handlePreviewDomainPointerCancel,
    onPointerDown: handlePreviewDomainPointerDown,
    onPointerMove: handlePreviewDomainPointerMove,
    onPointerUp: handlePreviewDomainPointerUp,
    selection: previewDomainSelection,
  } = useChartDragDomain<HTMLDivElement>({
    domain: effectiveDomain,
    fullDomain,
    onDomainChange: handleInteractiveDomainChange,
  });
  const supportsAxisOrientation =
    chartType !== "bubble" &&
    chartType !== "candle" &&
    chartType !== "funnel" &&
    chartType !== "heatmap" &&
    chartType !== "scatter" &&
    chartType !== "sunburst" &&
    chartType !== "treemap" &&
    chartType !== "waterfall";
  const axisOrientation: ChartAxisOrientation = supportsAxisOrientation
    ? axesTransform.orientation
    : "vertical";
  const definition = getChartValueModeDefinition(valueMode);
  const definitionLabel = definition.label;
  const series = useMemo(
    () =>
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount,
        valueMode,
        xDomain: effectiveDomain,
      }),
    [effectiveDomain, index, targetBinCount, valueMode],
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
      chartType === "histogram"
        ? index.getHistogram({
            bucketCount: histogramBuckets,
            valueAccessor: "y",
            xDomain: effectiveDomain,
          })
        : { buckets: [] },
    [effectiveDomain, chartType, histogramBuckets, index],
  );
  const heatmap = useMemo(
    () =>
      chartType === "heatmap"
        ? index.getHeatmap({
            xBinCount: Math.max(6, Math.round(targetBinCount / 3)),
            xDomain: effectiveDomain,
            yBinCount: heatmapYBins,
          })
        : { cells: [] },
    [effectiveDomain, chartType, heatmapYBins, index, targetBinCount],
  );
  const grouped = useMemo(
    () =>
      index.getGroupedChartSeries({
        groupBy: (point) => point.properties.plan,
        includeEmptyBins: true,
        maxGroups: 3,
        targetBinCount,
        valueMode: "count",
        xDomain: effectiveDomain,
      }),
    [effectiveDomain, index, targetBinCount],
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
  const scatter = useMemo(
    () =>
      index.getScatter({
        maxPoints: Math.max(120, targetBinCount * 8),
        sizeAccessor: chartType === "bubble" ? { metric: "revenue" } : undefined,
        xDomain: effectiveDomain,
      }),
    [chartType, effectiveDomain, index, targetBinCount],
  );
  const businessMetric = useMemo(
    () => getExampleBusinessMetric(selectedDataset.id),
    [selectedDataset.id],
  );
  const currentPoints = useMemo(
    () => index.getChartPoints({ maxPoints: 5_000, xDomain: effectiveDomain }).points,
    [effectiveDomain, index],
  );
  const previousDomain = useMemo(
    () => createPreviousDomain(effectiveDomain, fullDomain),
    [effectiveDomain, fullDomain],
  );
  const previousPoints = useMemo(
    () =>
      previousDomain
        ? index.getChartPoints({ maxPoints: 5_000, xDomain: previousDomain }).points
        : [],
    [index, previousDomain],
  );
  const waterfallData = useMemo(
    () =>
      createBusinessWaterfallData(currentPoints, previousPoints, businessMetric.accessor, {
        hasPreviousWindow: previousDomain !== null,
      }),
    [businessMetric.accessor, currentPoints, previousDomain, previousPoints],
  );
  const funnelData = useMemo(
    () => createBusinessFunnelData(currentPoints, selectedDataset.id, businessMetric.accessor),
    [businessMetric.accessor, currentPoints, selectedDataset.id],
  );
  const hierarchy = useMemo(
    () =>
      createBusinessHierarchy(currentPoints, selectedDataset.id, businessMetric, hiddenLegendIds),
    [businessMetric, currentPoints, hiddenLegendIds, selectedDataset.id],
  );
  const hierarchyTotal = getHierarchyValue(hierarchy);
  const treemapData = useMemo(
    () => createChartTreemapLayout(hierarchy, { height: 320, padding: 3, width: 640 }),
    [hierarchy],
  );
  const sunburstData = useMemo(
    () => createChartSunburstLayout(hierarchy, { outerRadius: 160 }),
    [hierarchy],
  );
  const icicleData = useMemo(
    () => createChartIcicleLayout(hierarchy, { height: 320, padding: 3, width: 640 }),
    [hierarchy],
  );
  const flameGraphData = useMemo(
    () => createChartFlameGraphLayout(hierarchy, { height: 320, padding: 3, width: 640 }),
    [hierarchy],
  );
  const circlePackData = useMemo(
    () => createChartCirclePackLayout(hierarchy, { height: 340, padding: 4, width: 340 }),
    [hierarchy],
  );
  const treeData = useMemo(
    () => createChartTreeLayout(hierarchy, { height: 320, width: 640 }),
    [hierarchy],
  );
  const radialTreeData = useMemo(
    () => createChartRadialTreeLayout(hierarchy, { height: 340, outerRadius: 150, width: 340 }),
    [hierarchy],
  );
  const indentedTreeData = useMemo(
    () => createChartIndentedTreeLayout(hierarchy, { width: 640 }),
    [hierarchy],
  );
  const activeShowLabels = showLabels && chartCapabilities.labels;
  const activeShowThreshold = showThreshold && chartCapabilities.threshold;
  const activeShowMinimap = showMinimap && chartCapabilities.minimap;
  const labels = activeShowLabels
    ? createPlaygroundLabels(renderRows, valueMode, axisOrientation)
    : [];
  const config = playgroundChartConfig(valueMode, definitionLabel);
  const groupedConfig = Object.fromEntries(
    grouped.groups.map((group, index) => [
      group.key,
      {
        color: `var(--chart-${(index % 5) + 1})`,
        label: group.label,
      },
    ]),
  );
  const legendItems = createPlaygroundLegendItems({
    chartType,
    definitionLabel,
    grouped,
    valueMode,
  });
  const hasLegendItems = legendItems.length > 1;
  const activeShowLegend = showLegend && chartCapabilities.legend && hasLegendItems;
  const activeHiddenLegendIds = hasLegendItems ? hiddenLegendIds : [];
  const visibleSeriesIds = new Set(
    legendItems.filter((item) => !activeHiddenLegendIds.includes(item.id)).map((item) => item.id),
  );
  const yAxisDataKeys = getPlaygroundYAxisDataKeys({
    chartType,
    grouped,
    valueMode,
    visibleSeriesIds,
  });
  const yAxisRows = getPlaygroundYAxisRows({
    chartType,
    groupedRows,
    histogramRows,
    renderRows,
  });
  const yAxisBounds = getChartDataYBounds(yAxisRows, yAxisDataKeys);
  const yAxisDataDomain =
    yAxisBounds.minY === null || yAxisBounds.maxY === null
      ? null
      : ([yAxisBounds.minY, yAxisBounds.maxY] satisfies [number, number]);
  const valueAxisTransform = axisOrientation === "horizontal" ? axesTransform.x : axesTransform.y;
  const timeAxisTransform = axisOrientation === "horizontal" ? axesTransform.y : axesTransform.x;
  const valueAxisStatus = resolveChartAxisTransformStatus({
    dataDomain: valueAxisTransform.domain ?? yAxisDataDomain,
    scale: valueAxisTransform.scale,
  });
  const timeAxisStatus = resolveChartAxisTransformStatus({
    dataDomain: timeAxisTransform.domain ?? effectiveDomain,
    scale: timeAxisTransform.scale,
  });
  const shouldAnimateDraw = animationMode === "draw" || animationMode === "draw-and-rescale";
  const shouldAnimateRescale = animationMode === "rescale" || animationMode === "draw-and-rescale";
  const animationProps = getRechartsAnimationProps({
    enabled: shouldAnimateDraw,
    mode: shouldAnimateDraw ? "draw" : "none",
  });
  const verticalXDomain = useChartAnimatedDomain({
    domain: axesTransform.x.domain ?? effectiveDomain,
    enabled: shouldAnimateRescale && axisOrientation === "vertical",
  });
  const valueAxisDomain = useChartAnimatedDomain({
    domain: valueAxisTransform.domain ?? yAxisDataDomain ?? [0, 1],
    enabled: shouldAnimateRescale && yAxisDataDomain !== null,
  });
  const chartContextMenuHeader = (
    <div className="grid gap-1 px-2 py-1.5 text-sm">
      <span className="font-medium">Chart options</span>
      <span className="text-xs text-muted-foreground">{playgroundChartTitles[chartType]}</span>
    </div>
  );
  const chartContextMenuItems = useMemo<MenuActionItem[]>(() => {
    const items: MenuActionItem[] = [];
    const valueModeOptions = CHART_VALUE_MODE_DEFINITIONS.filter((mode) =>
      ["average", "count", "max", "sum"].includes(mode.id),
    );

    if (!fixedChartType) {
      items.push({
        id: "chart-type",
        label: "Chart",
        options: playgroundChartOptions.map((option) => ({
          id: `chart-type-${option.id}`,
          label: option.label,
          value: option.id,
        })),
        type: "radio-group",
        value: chartType,
        onValueChange: (value) => {
          if (isPlaygroundChartType(value)) {
            clearBusinessSelections();
            setSelectedChartType(value);
          }
        },
      });
    }

    if (chartCapabilities.valueMode) {
      items.push({
        id: "value-mode",
        label: "Value",
        options: valueModeOptions.map((mode) => ({
          id: `value-mode-${mode.id}`,
          label: mode.label,
          value: mode.id,
        })),
        type: "radio-group",
        value: valueMode,
        onValueChange: (value) => {
          if (isChartValueMode(value)) {
            onValueModeChange(value);
          }
        },
      });
    }

    if (supportsAxisOrientation) {
      items.push({
        id: "axis-orientation",
        label: "Axes",
        options: chartAxisOrientationOptions.map((option) => ({
          id: `axis-orientation-${option.id}`,
          label: option.label,
          value: option.id,
        })),
        type: "radio-group",
        value: axesTransform.orientation,
        onValueChange: (value) => {
          if (isChartAxisOrientation(value)) {
            setAxesTransform((current) => ({ ...current, orientation: value }));
          }
        },
      });
    }

    if (chartCapabilities.advancedControls) {
      items.push({
        id: "y-scale",
        label: "Y scale",
        options: getChartAxisScaleDefinitions().map((definition) => ({
          id: `y-scale-${definition.id}`,
          label: definition.label,
          value: definition.id,
        })),
        type: "radio-group",
        value: axesTransform.y.scale,
        onValueChange: (value) => {
          if (isChartAxisScale(value)) {
            setAxesTransform((current) => ({
              ...current,
              y: { ...current.y, scale: value },
            }));
          }
        },
      });
    }

    items.push({ id: "display-separator", type: "separator" });

    if (chartCapabilities.grid) {
      items.push({
        checked: showGrid,
        id: "toggle-grid",
        label: "Grid",
        onCheckedChange: setShowGrid,
        type: "checkbox",
      });
    }

    if (chartCapabilities.labels) {
      items.push({
        checked: showLabels,
        id: "toggle-labels",
        label: "Labels",
        onCheckedChange: setShowLabels,
        type: "checkbox",
      });
    }

    if (chartCapabilities.legend && hasLegendItems) {
      items.push({
        checked: showLegend,
        id: "toggle-legend",
        label: "Legend",
        onCheckedChange: setShowLegend,
        type: "checkbox",
      });
    }

    if (chartCapabilities.threshold) {
      items.push({
        checked: showThreshold,
        id: "toggle-threshold",
        label: "Threshold",
        onCheckedChange: setShowThreshold,
        type: "checkbox",
      });
    }

    if (chartCapabilities.minimap) {
      items.push({
        checked: showMinimap,
        id: "toggle-minimap",
        label: "Minimap",
        onCheckedChange: setShowMinimap,
        type: "checkbox",
      });
    }

    items.push(
      { id: "viewport-separator", type: "separator" },
      {
        disabled: effectiveDomain[0] === fullDomain[0] && effectiveDomain[1] === fullDomain[1],
        id: "reset-viewport",
        label: "Reset viewport",
        onSelect: () => handleInteractiveDomainChange(fullDomain),
      },
    );

    return items;
  }, [
    axesTransform.orientation,
    axesTransform.y,
    chartCapabilities.advancedControls,
    chartCapabilities.grid,
    chartCapabilities.labels,
    chartCapabilities.legend,
    chartCapabilities.minimap,
    chartCapabilities.threshold,
    chartCapabilities.valueMode,
    chartType,
    clearBusinessSelections,
    effectiveDomain,
    fixedChartType,
    fullDomain,
    handleInteractiveDomainChange,
    hasLegendItems,
    onValueModeChange,
    showGrid,
    showLabels,
    showLegend,
    showMinimap,
    showThreshold,
    supportsAxisOrientation,
    valueMode,
  ]);
  const selectionDetails = renderPlaygroundSelectionDetails({
    businessMetric,
    chartType,
    hierarchy,
    hierarchyTotal,
    selectedFunnelRow,
    selectedHierarchyNode,
    selectedWaterfallRow,
  });
  const chartCanvas = (
    <ContextActionMenu
      contentProps={{ "aria-label": "Chart options menu" }}
      header={chartContextMenuHeader}
      items={chartContextMenuItems}
      label="Chart options"
    >
      <div
        ref={chartCapabilities.directDomainInteraction ? dragContainerRef : undefined}
        className="relative select-none"
        data-chart-domain-drag-frame={chartCapabilities.directDomainInteraction ? "" : undefined}
        data-chart-domain-dragging={
          chartCapabilities.directDomainInteraction && isPreviewDomainDragging ? "true" : undefined
        }
        onDoubleClick={
          chartCapabilities.directDomainInteraction ? handlePreviewDomainDoubleClick : undefined
        }
        onPointerCancel={
          chartCapabilities.directDomainInteraction ? handlePreviewDomainPointerCancel : undefined
        }
        onPointerDown={(event) => {
          if (!chartCapabilities.directDomainInteraction) {
            return;
          }

          if (isChartInteractionControl(event.target)) {
            return;
          }

          handlePreviewDomainPointerDown(event);
        }}
        onPointerMove={
          chartCapabilities.directDomainInteraction ? handlePreviewDomainPointerMove : undefined
        }
        onPointerUp={
          chartCapabilities.directDomainInteraction ? handlePreviewDomainPointerUp : undefined
        }
      >
        {chartType === "scatter" || chartType === "bubble" ? (
          <ChartScatterSvg
            series={scatter}
            xDomain={effectiveDomain}
            formatValue={formatCompact}
            ariaLabel={chartType === "bubble" ? "Bubble chart" : "Scatter plot"}
          />
        ) : chartType === "waterfall" ? (
          <ChartWaterfallSvg
            data={waterfallData}
            formatValue={businessMetric.formatValue}
            onDatumSelect={setSelectedWaterfallRow}
          />
        ) : chartType === "funnel" ? (
          <ChartFunnelSvg
            data={funnelData}
            formatValue={formatCompact}
            onDatumSelect={setSelectedFunnelRow}
          />
        ) : chartType === "treemap" ? (
          <ChartTreemapSvg
            data={treemapData}
            focusedNodeId={treemapFocusId}
            formatValue={businessMetric.formatValue}
            onFocusedNodeChange={setTreemapFocusId}
            onNodeSelect={setSelectedHierarchyNode}
            zoomable
          />
        ) : chartType === "sunburst" ? (
          <ChartSunburstSvg
            data={sunburstData}
            formatValue={businessMetric.formatValue}
            onNodeSelect={setSelectedHierarchyNode}
          />
        ) : chartType === "icicle" ? (
          <ChartIcicleSvg
            data={icicleData}
            formatValue={businessMetric.formatValue}
            onNodeSelect={setSelectedHierarchyNode}
          />
        ) : chartType === "flame-graph" ? (
          <ChartFlameGraphSvg
            data={flameGraphData}
            formatValue={businessMetric.formatValue}
            onNodeSelect={setSelectedHierarchyNode}
          />
        ) : chartType === "circle-pack" ? (
          <ChartCirclePackSvg
            data={circlePackData}
            formatValue={businessMetric.formatValue}
            onNodeSelect={setSelectedHierarchyNode}
          />
        ) : chartType === "tree" ? (
          <ChartTreeSvg
            data={treeData}
            formatValue={businessMetric.formatValue}
            onNodeSelect={setSelectedHierarchyNode}
          />
        ) : chartType === "radial-tree" ? (
          <ChartRadialTreeSvg
            data={radialTreeData}
            formatValue={businessMetric.formatValue}
            onNodeSelect={setSelectedHierarchyNode}
          />
        ) : chartType === "indented-tree" ? (
          <ChartIndentedTreeSvg
            data={indentedTreeData}
            formatValue={businessMetric.formatValue}
            onNodeSelect={setSelectedHierarchyNode}
          />
        ) : chartType === "heatmap" ? (
          <ChartHeatmapGrid
            cells={heatmap.cells}
            formatX={formatHour}
            formatY={formatCompact}
            formatValue={(cell) => `${formatCompact(cell.pointCount)} points`}
          />
        ) : chartType === "candle" ? (
          <PlaygroundCandlestickChart
            domain={effectiveDomain}
            labels={labels}
            samples={series.samples}
            selectedSampleIndex={selectedSampleIndex}
            showGrid={showGrid}
            showLabels={activeShowLabels}
            showThreshold={activeShowThreshold}
            threshold={threshold}
            visibleSeriesIds={visibleSeriesIds}
            onSampleSelect={(interaction) => setSelectedSampleIndex(interaction.sample.index)}
          />
        ) : (
          <ChartContainer
            className={`w-full ${chartType === "histogram" ? "h-80" : "h-[28rem]"}`}
            config={chartType === "stacked" ? groupedConfig : config}
          >
            {renderPlaygroundChart({
              animationProps,
              axesTransform,
              barRadius,
              chartType,
              curve,
              domain: effectiveDomain,
              fillOpacity,
              fullDomain,
              gapBehavior,
              histogramRows,
              labels,
              onSampleSelect: (interaction) => setSelectedSampleIndex(interaction.sample.index),
              rows: renderRows,
              samples: series.samples,
              selectedSampleIndex,
              showGrid,
              showThreshold: activeShowThreshold,
              strokeWidth,
              threshold,
              valueMode,
              visibleSeriesIds,
              grouped,
              groupedRows,
              hiddenLegendIds,
              legendItems,
              orientation: axisOrientation,
              onAxesTransformChange: setAxesTransform,
              onDomainChange: handleInteractiveDomainChange,
              onHiddenLegendIdsChange: setHiddenLegendIds,
              timeAxisStatus,
              valueAxisDomain,
              valueAxisStatus,
              verticalXDomain,
              yAxisDataDomain,
            })}
          </ChartContainer>
        )}
        {chartCapabilities.directDomainInteraction && previewDomainSelection ? (
          <div
            data-chart-domain-selection=""
            className="pointer-events-none absolute inset-y-0 border-x border-primary bg-primary/15"
            style={{
              left: `${previewDomainSelection.left}px`,
              width: `${previewDomainSelection.width}px`,
            }}
          />
        ) : null}
      </div>
    </ContextActionMenu>
  );
  const chartPreview = (
    <div
      ref={chartCapabilities.directDomainInteraction ? wheelContainerRef : undefined}
      className="grid gap-4"
      onWheel={chartCapabilities.directDomainInteraction ? handlePreviewWheel : undefined}
    >
      {chartCanvas}

      {selectionDetails}

      {activeShowLabels ? <PlaygroundActiveLabels labels={labels} /> : null}

      {activeShowThreshold && thresholdAnnotations.length > 0 ? (
        <ChartThresholdMarker
          annotations={thresholdAnnotations}
          formatLabel={(annotation) =>
            `${formatHour(annotation.startX)} to ${formatHour(annotation.endX)}`
          }
        />
      ) : null}

      {activeShowMinimap ? (
        <ChartDomainMinimap
          domain={effectiveDomain}
          fullDomain={fullDomain}
          samples={minimapSeries.samples}
          formatDomainValue={formatHour}
          onDomainChange={handleInteractiveDomainChange}
        />
      ) : null}
    </div>
  );

  return (
    <section className="grid gap-4" data-testid="chart-playground-example">
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
          description={getPlaygroundChartDescription(chartType, selectedDataset, businessMetric)}
        >
          {activeShowLegend ? (
            <ChartWithLegend
              legendMode="floating"
              legendTitle="Series"
              onLegendHide={() => setShowLegend(false)}
              legend={
                <ChartSeriesLegend
                  items={legendItems}
                  hiddenIds={hiddenLegendIds}
                  onHiddenIdsChange={setHiddenLegendIds}
                />
              }
            >
              {chartPreview}
            </ChartWithLegend>
          ) : (
            chartPreview
          )}
        </ChartPanel>

        <ChartPanel title="Knobs" description="Controls for the active chart.">
          <div className="grid gap-5">
            <div className="grid gap-3">
              <ControlSelect
                label="Dataset"
                value={selectedDataset.id}
                onChange={(value) => {
                  if (isExampleDataSetId(value)) {
                    clearBusinessSelections();
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
              <ControlSelect
                label="Viewport"
                value={rangeId}
                onChange={(value) => {
                  clearBusinessSelections();
                  onRangeChange(value);
                }}
              >
                {ranges.map((range) => (
                  <NativeSelectOption key={range.id} value={range.id}>
                    {range.label}
                  </NativeSelectOption>
                ))}
              </ControlSelect>
              <ControlSelect
                label="Chart"
                value={chartType}
                disabled={Boolean(fixedChartType)}
                onChange={(value) => {
                  if (!fixedChartType && isPlaygroundChartType(value)) {
                    clearBusinessSelections();
                    setSelectedChartType(value);
                  }
                }}
              >
                {playgroundChartOptions.map((option) => (
                  <NativeSelectOption key={option.id} value={option.id}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </ControlSelect>
              {chartCapabilities.valueMode ? (
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
              ) : null}
            </div>

            {chartCapabilities.styleControls ? (
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
            ) : null}

            {chartCapabilities.advancedControls ? (
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
                <ControlSelect
                  label="Axes"
                  value={axesTransform.orientation}
                  onChange={(value) => {
                    if (isChartAxisOrientation(value)) {
                      setAxesTransform((current) => ({ ...current, orientation: value }));
                    }
                  }}
                >
                  {chartAxisOrientationOptions.map((option) => (
                    <NativeSelectOption
                      key={option.id}
                      value={option.id}
                      disabled={!supportsAxisOrientation && option.id === "horizontal"}
                    >
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </ControlSelect>
                <ControlSelect
                  label="X scale"
                  value={axesTransform.x.scale}
                  onChange={(value) => {
                    if (isChartAxisScale(value)) {
                      setAxesTransform((current) => ({
                        ...current,
                        x: { ...current.x, scale: value },
                      }));
                    }
                  }}
                >
                  {getChartAxisScaleDefinitions().map((option) => (
                    <NativeSelectOption key={option.id} value={option.id}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </ControlSelect>
                <ControlSelect
                  label="Y scale"
                  value={axesTransform.y.scale}
                  onChange={(value) => {
                    if (isChartAxisScale(value)) {
                      setAxesTransform((current) => ({
                        ...current,
                        y: { ...current.y, scale: value },
                      }));
                    }
                  }}
                >
                  {getChartAxisScaleDefinitions().map((option) => (
                    <NativeSelectOption key={option.id} value={option.id}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </ControlSelect>
                <ControlSelect
                  label="Animation"
                  value={animationMode}
                  onChange={(value) => {
                    if (isPlaygroundAnimationMode(value)) {
                      setAnimationMode(value);
                    }
                  }}
                >
                  {playgroundAnimationOptions.map((option) => (
                    <NativeSelectOption key={option.id} value={option.id}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </ControlSelect>
              </div>
            ) : null}

            <div className="grid gap-3">
              {chartCapabilities.grid ? (
                <SwitchKnob label="Grid" checked={showGrid} onCheckedChange={setShowGrid} />
              ) : null}
              {chartCapabilities.labels ? (
                <SwitchKnob label="Labels" checked={showLabels} onCheckedChange={setShowLabels} />
              ) : null}
              {chartCapabilities.legend && hasLegendItems ? (
                <SwitchKnob label="Legend" checked={showLegend} onCheckedChange={setShowLegend} />
              ) : null}
              {chartCapabilities.threshold ? (
                <SwitchKnob
                  label="Threshold"
                  checked={showThreshold}
                  onCheckedChange={setShowThreshold}
                />
              ) : null}
              {chartCapabilities.minimap ? (
                <SwitchKnob
                  label="Minimap"
                  checked={showMinimap}
                  onCheckedChange={setShowMinimap}
                />
              ) : null}
              {chartCapabilities.playback ? (
                <SwitchKnob
                  label="Playback"
                  checked={playbackEnabled}
                  onCheckedChange={setPlaybackEnabled}
                />
              ) : null}
              {playbackEnabled && chartCapabilities.playback ? (
                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={playback.play}>
                    Play
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={playback.pause}>
                    Pause
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={playback.reset}>
                    Reset
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </ChartPanel>
      </div>
    </section>
  );
}

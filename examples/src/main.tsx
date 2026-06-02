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
import {
  StrictMode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  ChartAxisTransformMenu,
  ChartAnomalyMarkerList,
  ChartBackendStatus,
  ChartBoxPlotSvg,
  ChartCirclePackSvg,
  ChartDerivedMetricCard,
  ChartDomainMinimap,
  ChartFlameGraphSvg,
  ChartFunnelSvg,
  ChartHeatmapGrid,
  ChartHotBinRow,
  ChartIcicleSvg,
  ChartIndentedTreeSvg,
  ChartLabelOverlay,
  type ChartLegendItem,
  ChartMetricCard,
  ChartMetricStrip,
  ChartPanel,
  ChartRangeSelector,
  ChartSampleInteractionOverlay,
  ChartSampleSparkline,
  ChartScatterSvg,
  ChartSeriesLegend,
  ChartSunburstSvg,
  ChartThresholdMarker,
  ChartRadialTreeSvg,
  ChartTreeSvg,
  ChartTreemapSvg,
  ChartWaterfallSvg,
  ChartXAxisNavigationMenu,
  ChartYAxisRangeMenu,
  ChartValueModePreview,
  ChartValueModeSelector,
  ChartWithLegend,
  createCumulativeChartSeries,
  createDeltaChartSeries,
  createChartBandRenderData,
  createChartBoxPlotData,
  createChartCirclePackLayout,
  createChartDensityIndex,
  createChartDensityViewportSummary,
  createChartFlameGraphLayout,
  createChartFunnelData,
  createChartIcicleLayout,
  createChartIndentedTreeLayout,
  createChartTreemapLayout,
  createChartRadialTreeLayout,
  createChartTreeLayout,
  createChartWaterfallData,
  createGroupedChartRenderData,
  createChartRenderData,
  createRollingChartSeries,
  createChartSunburstLayout,
  getChartAnomalyAnnotations,
  getChartAxisScaleDefinitions,
  getChartDataYBounds,
  getRechartsAnimationProps,
  getChartThresholdAnnotations,
  getChartValueModeDefinition,
  measureChartSeries,
  resolveChartAxisTransformStatus,
  useChartAnimatedDomain,
  useChartBinCount,
  useChartDragDomain,
  useChartPlaybackDomain,
  useChartSeriesVisibility,
  useChartWheelDomain,
  useProgressiveChartDensity,
  type ChartAnimationMode,
  type ChartAxesTransform,
  type ChartAxisRange,
  type ChartAxisScale,
  type ChartCirclePackNode,
  type ChartDensitySample,
  type ChartFlameGraphNode,
  type ChartFunnelRow,
  type ChartGapBehavior,
  type ChartAxisOrientation,
  type ChartHierarchyNode,
  type ChartIcicleNode,
  type ChartIndentedTreeNode,
  type IndexedChartSeriesPoint,
  type ChartRange,
  type ChartSampleInteraction,
  type ChartSeriesPoint,
  type ChartSunburstNode,
  type ChartRadialTreeNode,
  type ChartTreeNode,
  type ChartTreemapNode,
  type ChartValueMode,
  type ChartWaterfallRow,
} from "@moritzbrantner/charts";
import "./styles.css";

type TelemetryProperties = {
  channel: "direct" | "partner" | "marketplace";
  note: string;
  plan: "starter" | "scale" | "enterprise";
};

type ChartVariantId = "comparison" | "envelope" | "revenue" | "volume";
type ExampleDataSetId = "telemetry" | "retail" | "operations" | "sparse";
type PlaygroundChartType =
  | "area"
  | "bar"
  | "bubble"
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
  | "scatter"
  | "stacked"
  | "sunburst"
  | "tree"
  | "treemap"
  | "waterfall";
type ChartPageId = `chart-${PlaygroundChartType}`;
type ExamplePage = "compose" | "examples" | ChartPageId;
type PlaygroundCurve = "linear" | "monotone" | "natural" | "step";
type PlaygroundAnimationMode = ChartAnimationMode;
type PlaygroundBusinessChartType =
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
type PlaygroundPlan = TelemetryProperties["plan"];
type PlaygroundChannel = TelemetryProperties["channel"];
type PlaygroundHierarchyPayload = {
  channel?: PlaygroundChannel;
  kind: "channel" | "plan" | "root";
  plan?: PlaygroundPlan;
};
type PlaygroundHierarchy = ChartHierarchyNode<PlaygroundHierarchyPayload>;
type PlaygroundHierarchySelection =
  | ChartCirclePackNode<PlaygroundHierarchyPayload>
  | ChartFlameGraphNode<PlaygroundHierarchyPayload>
  | ChartIcicleNode<PlaygroundHierarchyPayload>
  | ChartIndentedTreeNode<PlaygroundHierarchyPayload>
  | ChartRadialTreeNode<PlaygroundHierarchyPayload>
  | ChartSunburstNode<PlaygroundHierarchyPayload>
  | ChartTreeNode<PlaygroundHierarchyPayload>
  | ChartTreemapNode<PlaygroundHierarchyPayload>;
type PlaygroundMetricAccessor = (point: IndexedChartSeriesPoint<TelemetryProperties>) => number;

type ExampleDataSet = {
  description: string;
  id: ExampleDataSetId;
  label: string;
  points: ChartSeriesPoint<TelemetryProperties>[];
};

const playgroundPlans: PlaygroundPlan[] = ["starter", "scale", "enterprise"];
const playgroundChannels: PlaygroundChannel[] = ["direct", "partner", "marketplace"];

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

function DeferredExampleMount({
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

function getExamplePage(): ExamplePage {
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

function getChartPageType(page: ExamplePage): PlaygroundChartType | null {
  return page.startsWith("chart-") ? (page.slice("chart-".length) as PlaygroundChartType) : null;
}

function ExampleNav({ page }: { page: ExamplePage }) {
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

function ChartPlayground({
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

type PlaygroundRenderRow = ReturnType<
  typeof createChartRenderData<TelemetryProperties>
>["rows"][number];
type PlaygroundGroupedSeries = ReturnType<
  ReturnType<typeof createChartDensityIndex<TelemetryProperties>>["getGroupedChartSeries"]
>;

function renderPlaygroundChart({
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
      case "funnel":
      case "heatmap":
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
    case "funnel":
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

function isChartInteractionControl(target: EventTarget | null) {
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

function getPlaygroundYAxisDataKeys({
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
    case "candle":
    case "circle-pack":
    case "flame-graph":
    case "funnel":
    case "heatmap":
    case "icicle":
    case "indented-tree":
    case "radial-tree":
    case "scatter":
    case "sunburst":
    case "tree":
    case "treemap":
    case "waterfall":
      return [];
  }
}

function getPlaygroundYAxisRows({
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

function createPlaygroundLegendItems({
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

function isBusinessHierarchyChart(
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

function getPlaygroundChartCapabilities(chartType: PlaygroundChartType) {
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

function getExampleBusinessMetric(datasetId: ExampleDataSetId): {
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

function getPlaygroundChartDescription(
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
    case "candle":
    case "combo":
    case "heatmap":
    case "histogram":
    case "line":
    case "scatter":
    case "stacked":
      return selectedDataset.description;
  }
}

function createPreviousDomain(domain: [number, number], fullDomain: [number, number]) {
  const span = domain[1] - domain[0];

  if (span <= 0 || domain[0] <= fullDomain[0]) {
    return null;
  }

  const end = Math.max(fullDomain[0], domain[0]);
  const start = Math.max(fullDomain[0], end - span);

  return start < end ? ([start, end] satisfies [number, number]) : null;
}

function createBusinessWaterfallData(
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

function createBusinessFunnelData(
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

function createBusinessHierarchy(
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

function summarizeMetricByPlanAndChannel(
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

function sumMetricByPlan(
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

function sumMapValues(values: ReadonlyMap<unknown, number>) {
  return Array.from(values.values()).reduce((sum, value) => sum + value, 0);
}

function getQuantile(values: number[], quantile: number) {
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

function countAtOrAbove(values: number[], threshold: number) {
  return values.filter((value) => value >= threshold).length;
}

function getHierarchyValue(node: PlaygroundHierarchy): number {
  if (typeof node.value === "number") {
    return node.value;
  }

  return (node.children ?? []).reduce((sum, child) => sum + getHierarchyValue(child), 0);
}

function renderPlaygroundSelectionDetails({
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

function PlaygroundDetailRow({
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

function findHierarchyNode(
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

type PlaygroundLabel = ReturnType<typeof createPlaygroundLabels>[number];

function PlaygroundActiveLabels({ labels }: { labels: PlaygroundLabel[] }) {
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

type PlaygroundCandle = {
  close: number;
  high: number;
  id: string;
  label: string;
  low: number;
  open: number;
  sample: ChartDensitySample<TelemetryProperties>;
  x: number;
};

function PlaygroundCandlestickChart({
  domain,
  labels,
  onSampleSelect,
  samples,
  selectedSampleIndex,
  showGrid,
  showLabels,
  showThreshold,
  threshold,
  visibleSeriesIds,
}: {
  domain: [number, number];
  labels: PlaygroundLabel[];
  onSampleSelect: (interaction: ChartSampleInteraction<TelemetryProperties>) => void;
  samples: ChartDensitySample<TelemetryProperties>[];
  selectedSampleIndex: number | null;
  showGrid: boolean;
  showLabels: boolean;
  showThreshold: boolean;
  threshold: number;
  visibleSeriesIds: ReadonlySet<string>;
}) {
  const candles = createPlaygroundCandles(samples).filter((candle) =>
    candle.close >= candle.open ? visibleSeriesIds.has("up") : visibleSeriesIds.has("down"),
  );
  const yValues = candles.flatMap((candle) => [candle.high, candle.low, candle.open, candle.close]);
  const minY = Math.min(...yValues, threshold);
  const maxY = Math.max(...yValues, threshold);
  const yPadding = Math.max((maxY - minY) * 0.08, 1);
  const yDomain: [number, number] = [minY - yPadding, maxY + yPadding];
  const width = 960;
  const height = 420;
  const margin = { bottom: 42, left: 58, right: 22, top: 24 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const candleWidth = Math.max(4, Math.min(18, (plotWidth / Math.max(candles.length, 1)) * 0.56));
  const xScale = (x: number) => {
    const span = Math.max(domain[1] - domain[0], Number.EPSILON);

    return margin.left + ((x - domain[0]) / span) * plotWidth;
  };
  const yScale = (value: number) => {
    const span = Math.max(yDomain[1] - yDomain[0], Number.EPSILON);

    return margin.top + (1 - (value - yDomain[0]) / span) * plotHeight;
  };
  const yTicks = createLinearTicks(yDomain, 5);
  const xTicks = candles.filter((_, index) => {
    const step = Math.max(1, Math.floor(candles.length / 5));

    return index % step === 0;
  });
  const thresholdY = yScale(threshold);

  return (
    <div className="h-[28rem] w-full overflow-hidden rounded-md border border-border/60 bg-muted/10">
      <svg
        aria-label="Candle chart"
        className="h-full w-full"
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {showGrid
          ? yTicks.map((tick) => {
              const y = yScale(tick);

              return (
                <line
                  key={tick}
                  x1={margin.left}
                  x2={width - margin.right}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeOpacity="0.7"
                />
              );
            })
          : null}
        {showThreshold ? (
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={thresholdY}
            y2={thresholdY}
            stroke="var(--muted-foreground)"
            strokeDasharray="6 6"
            strokeOpacity="0.7"
          />
        ) : null}
        {candles.map((candle) => {
          const x = xScale(candle.x);
          const highY = yScale(candle.high);
          const lowY = yScale(candle.low);
          const openY = yScale(candle.open);
          const closeY = yScale(candle.close);
          const up = candle.close >= candle.open;
          const color = up ? "var(--chart-2)" : "var(--chart-4)";
          const selected = selectedSampleIndex === candle.sample.index;
          const bodyY = Math.min(openY, closeY);
          const bodyHeight = Math.max(Math.abs(closeY - openY), 2);

          return (
            <g key={candle.id}>
              <line
                x1={x}
                x2={x}
                y1={highY}
                y2={lowY}
                stroke={color}
                strokeWidth={selected ? 3 : 2}
              />
              <rect
                x={x - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                fill={up ? color : "var(--background)"}
                stroke={color}
                strokeWidth={selected ? 3 : 2}
                onClick={(event) =>
                  onSampleSelect({
                    clientX: event.clientX,
                    clientY: event.clientY,
                    domainValue: candle.x,
                    sample: candle.sample,
                  })
                }
              />
            </g>
          );
        })}
        {showLabels
          ? labels.map((label) => {
              const candle = candles.find((candidate) =>
                typeof label.x === "number" ? candidate.x === label.x : candidate.label === label.x,
              );

              if (!candle) {
                return null;
              }

              const x = Math.min(
                width - margin.right - 92,
                Math.max(margin.left, xScale(candle.x)),
              );
              const yValue = typeof label.y === "number" ? label.y : candle.close;
              const y = Math.max(margin.top + 4, yScale(yValue) - 30);

              return (
                <g key={label.id}>
                  <rect
                    x={x}
                    y={y}
                    width="86"
                    height="24"
                    rx="4"
                    fill="var(--background)"
                    stroke="var(--border)"
                  />
                  <text x={x + 8} y={y + 16} fill="var(--foreground)" fontSize="12">
                    {label.text}
                  </text>
                </g>
              );
            })
          : null}
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={height - margin.bottom}
          y2={height - margin.bottom}
          stroke="var(--border)"
        />
        <line
          x1={margin.left}
          x2={margin.left}
          y1={margin.top}
          y2={height - margin.bottom}
          stroke="var(--border)"
        />
        {yTicks.map((tick) => (
          <text
            key={tick}
            x={margin.left - 10}
            y={yScale(tick) + 4}
            fill="var(--muted-foreground)"
            fontSize="12"
            textAnchor="end"
          >
            {formatCompact(tick)}
          </text>
        ))}
        {xTicks.map((candle) => (
          <text
            key={candle.id}
            x={xScale(candle.x)}
            y={height - 14}
            fill="var(--muted-foreground)"
            fontSize="12"
            textAnchor="middle"
          >
            {candle.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function createPlaygroundCandles(
  samples: ChartDensitySample<TelemetryProperties>[],
): PlaygroundCandle[] {
  return samples
    .map((sample): PlaygroundCandle | null => {
      if (
        sample.firstPoint === null ||
        sample.lastPoint === null ||
        sample.minY === null ||
        sample.maxY === null
      ) {
        return null;
      }

      return {
        close: sample.lastPoint.y,
        high: sample.maxY,
        id: `candle-${sample.index}`,
        label: formatHour(sample.x),
        low: sample.minY,
        open: sample.firstPoint.y,
        sample,
        x: sample.x,
      };
    })
    .filter((candle): candle is PlaygroundCandle => candle !== null);
}

function createLinearTicks(domain: [number, number], count: number) {
  const [min, max] = domain;
  const span = max - min;

  if (span <= 0 || count <= 1) {
    return [min];
  }

  return Array.from({ length: count }, (_, index) => min + (span / (count - 1)) * index);
}

function createPlaygroundLabels(
  rows: PlaygroundRenderRow[],
  valueMode: ChartValueMode,
  orientation: ChartAxisOrientation = "vertical",
) {
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
      x: orientation === "horizontal" ? peak.value : peak.row.x,
      y: orientation === "horizontal" ? peak.row.label : peak.value,
    },
    {
      id: "latest",
      placements: ["top", "top-right", "right"] as const,
      priority: 70,
      text: `Latest ${formatCompact(last.value)}`,
      x: orientation === "horizontal" ? last.value : last.row.x,
      y: orientation === "horizontal" ? last.row.label : last.value,
    },
  ];
}

function getPlaygroundRowValue(row: PlaygroundRenderRow, valueMode: ChartValueMode) {
  const value = row[valueMode];

  return typeof value === "number" ? value : null;
}

function ControlSelect({
  children,
  disabled = false,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <NativeSelect
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
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
  { id: "scatter", label: "Scatter" },
  { id: "bubble", label: "Bubble" },
  { id: "candle", label: "Candle" },
  { id: "combo", label: "Area + rolling" },
  { id: "histogram", label: "Histogram" },
  { id: "heatmap", label: "Heatmap" },
  { id: "stacked", label: "Stacked bars" },
  { id: "waterfall", label: "Waterfall" },
  { id: "funnel", label: "Funnel" },
  { id: "treemap", label: "Treemap" },
  { id: "sunburst", label: "Sunburst" },
  { id: "icicle", label: "Icicle" },
  { id: "flame-graph", label: "Flame graph" },
  { id: "circle-pack", label: "Circle pack" },
  { id: "tree", label: "Tree" },
  { id: "radial-tree", label: "Radial tree" },
  { id: "indented-tree", label: "Indented tree" },
];

const chartPageLinks: Array<{
  id: ChartPageId;
  label: string;
  path: string;
}> = playgroundChartOptions.map((option) => ({
  id: `chart-${option.id}`,
  label: option.label,
  path: `${option.id}.html`,
}));

const playgroundChartTitles: Record<PlaygroundChartType, string> = {
  area: "Area chart",
  bar: "Bar chart",
  bubble: "Bubble chart",
  candle: "Candle chart",
  "circle-pack": "Circle pack chart",
  combo: "Area chart with rolling line",
  "flame-graph": "Flame graph",
  funnel: "Funnel chart",
  heatmap: "Heatmap",
  histogram: "Histogram",
  icicle: "Icicle chart",
  "indented-tree": "Indented tree chart",
  line: "Line chart",
  "radial-tree": "Radial tree chart",
  scatter: "Scatter plot",
  stacked: "Stacked bars",
  sunburst: "Sunburst chart",
  tree: "Tree chart",
  treemap: "Treemap",
  waterfall: "Waterfall chart",
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

const chartAxisOrientationOptions: Array<{ id: ChartAxisOrientation; label: string }> = [
  { id: "vertical", label: "Vertical" },
  { id: "horizontal", label: "Horizontal" },
];

const playgroundAnimationOptions: Array<{ id: PlaygroundAnimationMode; label: string }> = [
  { id: "none", label: "None" },
  { id: "draw", label: "Draw" },
  { id: "rescale", label: "Rescale" },
  { id: "draw-and-rescale", label: "Draw + rescale" },
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

function isChartAxisOrientation(value: string): value is ChartAxisOrientation {
  return chartAxisOrientationOptions.some((option) => option.id === value);
}

function isChartAxisScale(value: string): value is ChartAxisScale {
  return getChartAxisScaleDefinitions().some((definition) => definition.id === value);
}

function isPlaygroundAnimationMode(value: string): value is PlaygroundAnimationMode {
  return playgroundAnimationOptions.some((option) => option.id === value);
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
  const {
    containerRef: dragContainerRef,
    isDragging: isDomainDragging,
    onDoubleClick: handleDomainDoubleClick,
    onPointerCancel: handleDomainPointerCancel,
    onPointerDown: handleDomainPointerDown,
    onPointerMove: handleDomainPointerMove,
    onPointerUp: handleDomainPointerUp,
    selection: domainSelection,
  } = useChartDragDomain<HTMLDivElement>({
    domain: activeRange.domain,
    fullDomain,
    onDomainChange,
  });
  const chartContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      binCountContainerRef(node);
      wheelContainerRef(node);
      dragContainerRef(node);
    },
    [binCountContainerRef, dragContainerRef, wheelContainerRef],
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
          <div
            ref={chartContainerRef}
            className="relative select-none"
            data-chart-domain-drag-frame=""
            data-chart-domain-dragging={isDomainDragging ? "true" : undefined}
            onDoubleClick={handleDomainDoubleClick}
            onPointerCancel={handleDomainPointerCancel}
            onPointerDown={handleDomainPointerDown}
            onPointerMove={handleDomainPointerMove}
            onPointerUp={handleDomainPointerUp}
          >
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
            {domainSelection ? (
              <div
                data-chart-domain-selection=""
                className="pointer-events-none absolute inset-y-0 border-x border-primary bg-primary/15"
                style={{
                  left: `${domainSelection.left}px`,
                  width: `${domainSelection.width}px`,
                }}
              />
            ) : null}
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

function ComposedChartExamples({
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
                <YAxis tickLine={false} axisLine={false} width={42} />
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
    <section className="grid gap-4" data-testid="distribution-examples">
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

function formatNullableCompact(value: number | null) {
  return value === null ? "n/a" : formatCompact(value);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatNullablePercent(value: number | null) {
  return value === null ? "n/a" : formatPercent(value);
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
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

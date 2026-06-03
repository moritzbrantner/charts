import { Badge, ChartContainer, ContextActionMenu } from "@moritzbrantner/ui";
import { useCallback, useMemo, useState } from "react";

import {
  ChartCirclePackSvg,
  ChartCalendarHeatmapSvg,
  ChartDomainMinimap,
  ChartFlameGraphSvg,
  ChartFunnelSvg,
  ChartHeatmapGrid,
  ChartIcicleSvg,
  ChartIndentedTreeSvg,
  ChartPanel,
  ChartRadialTreeSvg,
  ChartRidgelineSvg,
  ChartScatterSvg,
  ChartSeriesLegend,
  ChartSunburstSvg,
  ChartThresholdMarker,
  ChartTreeSvg,
  ChartTreemapSvg,
  ChartWaterfallSvg,
  ChartWithLegend,
  createChartCirclePackLayout,
  createChartCalendarHeatmapData,
  createChartDensityViewportSummary,
  createChartFlameGraphLayout,
  createChartIcicleLayout,
  createChartIndentedTreeLayout,
  createChartRadialTreeLayout,
  createChartRidgelineData,
  createChartRenderData,
  createChartSunburstLayout,
  createChartTreeLayout,
  createChartTreemapLayout,
  createGroupedChartRenderData,
  createRollingChartSeries,
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
import { playgroundChartConfig, playgroundChartTitles } from "./controls";
import { formatCompact, formatHour } from "./data";
import { PlaygroundControlPanel } from "./playground-control-panel";
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
import { usePlaygroundContextMenu } from "./use-playground-context-menu";

import type {
  ExampleDataSet,
  ExampleDataSetId,
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
  createChartDensityIndex,
} from "@moritzbrantner/charts";

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
    chartType !== "calendar-heatmap" &&
    chartType !== "candle" &&
    chartType !== "funnel" &&
    chartType !== "heatmap" &&
    chartType !== "ridgeline" &&
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
  const distributionPoints = useMemo(
    () =>
      chartType === "calendar-heatmap" || chartType === "ridgeline"
        ? index.getChartPoints({ maxPoints: 20_000, xDomain: effectiveDomain }).points
        : [],
    [chartType, effectiveDomain, index],
  );
  const calendarHeatmap = useMemo(
    () =>
      createChartCalendarHeatmapData(distributionPoints, {
        dayMs: 24,
        xDomain: effectiveDomain,
      }),
    [distributionPoints, effectiveDomain],
  );
  const ridgeline = useMemo(
    () =>
      createChartRidgelineData(distributionPoints, {
        bucketCount: 24,
        groupBy: (point) => point.properties.plan,
        maxGroups: 4,
        valueAccessor: "y",
        xDomain: effectiveDomain,
      }),
    [distributionPoints, effectiveDomain],
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
  const { header: chartContextMenuHeader, items: chartContextMenuItems } = usePlaygroundContextMenu(
    {
      axesTransform,
      chartCapabilities,
      chartType,
      clearBusinessSelections,
      effectiveDomain,
      fixedChartType,
      fullDomain,
      handleInteractiveDomainChange,
      hasLegendItems,
      onValueModeChange,
      setAxesTransform,
      setSelectedChartType,
      setShowGrid,
      setShowLabels,
      setShowLegend,
      setShowMinimap,
      setShowThreshold,
      showGrid,
      showLabels,
      showLegend,
      showMinimap,
      showThreshold,
      supportsAxisOrientation,
      valueMode,
    },
  );
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
        ) : chartType === "calendar-heatmap" ? (
          <ChartCalendarHeatmapSvg
            data={calendarHeatmap}
            formatValue={(day) => (day.value === null ? "n/a" : formatCompact(day.value))}
          />
        ) : chartType === "ridgeline" ? (
          <ChartRidgelineSvg data={ridgeline} formatValue={formatCompact} />
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
        <PlaygroundControlPanel
          animationMode={animationMode}
          axesTransform={axesTransform}
          barRadius={barRadius}
          chartCapabilities={chartCapabilities}
          chartType={chartType}
          clearBusinessSelections={clearBusinessSelections}
          curve={curve}
          datasets={datasets}
          fillOpacity={fillOpacity}
          fixedChartType={fixedChartType}
          gapBehavior={gapBehavior}
          hasLegendItems={hasLegendItems}
          heatmapYBins={heatmapYBins}
          histogramBuckets={histogramBuckets}
          onDataSetChange={onDataSetChange}
          onRangeChange={onRangeChange}
          onValueModeChange={onValueModeChange}
          playback={playback}
          playbackEnabled={playbackEnabled}
          rangeId={rangeId}
          rollingWindow={rollingWindow}
          selectedDataset={selectedDataset}
          setAnimationMode={setAnimationMode}
          setAxesTransform={setAxesTransform}
          setBarRadius={setBarRadius}
          setCurve={setCurve}
          setFillOpacity={setFillOpacity}
          setGapBehavior={setGapBehavior}
          setHeatmapYBins={setHeatmapYBins}
          setHistogramBuckets={setHistogramBuckets}
          setPlaybackEnabled={setPlaybackEnabled}
          setRollingWindow={setRollingWindow}
          setSelectedChartType={setSelectedChartType}
          setShowGrid={setShowGrid}
          setShowLabels={setShowLabels}
          setShowLegend={setShowLegend}
          setShowMinimap={setShowMinimap}
          setShowThreshold={setShowThreshold}
          setStrokeWidth={setStrokeWidth}
          setTargetBinCount={setTargetBinCount}
          setThreshold={setThreshold}
          showGrid={showGrid}
          showLabels={showLabels}
          showLegend={showLegend}
          showMinimap={showMinimap}
          showThreshold={showThreshold}
          strokeWidth={strokeWidth}
          supportsAxisOrientation={supportsAxisOrientation}
          targetBinCount={targetBinCount}
          threshold={threshold}
          valueMode={valueMode}
        />
      </div>
    </section>
  );
}

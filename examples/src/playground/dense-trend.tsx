import {
  ActionMenu,
  Button,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ContextActionMenu,
  copyText,
} from "@moritzbrantner/ui";
import { useCallback, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartDomainMinimap,
  ChartHotBinRow,
  ChartMetricCard,
  ChartMetricStrip,
  ChartPanel,
  ChartSampleInteractionOverlay,
  ChartValueModeSelector,
  type createChartDensityIndex,
  createChartDensityViewportSummary,
  createChartRenderData,
  getChartValueModeDefinition,
  measureChartSeries,
  useChartBinCount,
  useChartDragDomain,
  useChartWheelDomain,
  type ChartDensitySample,
  type ChartRange,
  type ChartSampleInteraction,
  type ChartValueMode,
} from "@moritzbrantner/charts";

import { chartConfig, formatCompact, formatHour } from "./data";

import type { TelemetryProperties } from "./model";
import type { MenuActionItem } from "@moritzbrantner/ui";

export function DenseTrendExample({
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
                  <YAxis
                    tickFormatter={formatCompact}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={0} />
                  {sampleOverlay}
                </BarChart>
              ) : (
                <AreaChart data={renderData} margin={{ bottom: 8, left: 8, right: 12, top: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
                  <YAxis
                    tickFormatter={formatCompact}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                  />
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

export function createBinActionItems(hasSample: boolean): MenuActionItem[] {
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

export function createPaddedBinDomain<TProperties>(
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

export function formatSampleRange<TProperties>(sample: ChartDensitySample<TProperties>) {
  return `${formatHour(sample.x0)} to ${formatHour(sample.x1)}`;
}

export function formatSampleSummary<TProperties>(
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

export function getPrimarySampleMetric<TProperties>(sample: ChartDensitySample<TProperties>) {
  const entries = Object.entries(sample.metrics);

  return entries.find(([metricKey]) => metricKey === "revenue") ?? entries[0] ?? null;
}

export function formatSampleModeValue<TProperties>(
  sample: ChartDensitySample<TProperties>,
  valueMode: ChartValueMode,
) {
  const value = getSampleModeValue(sample, valueMode);

  return value === null ? "n/a" : formatCompact(value);
}

export function getSampleModeValue<TProperties>(
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

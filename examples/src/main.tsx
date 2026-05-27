import { StrictMode, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
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
  Badge,
  Button,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@moritzbrantner/ui";
import {
  CHART_VALUE_MODE_DEFINITIONS,
  ChartBackendStatus,
  ChartHotBinRow,
  ChartMetricCard,
  ChartMetricStrip,
  ChartPanel,
  ChartRangeSelector,
  ChartSampleSparkline,
  ChartValueModePreview,
  ChartValueModeSelector,
  createChartDensityIndex,
  createChartDensityViewportSummary,
  createChartRenderData,
  getChartValueModeDefinition,
  measureChartSeries,
  useChartBinCount,
  useProgressiveChartDensity,
  type ChartDensitySample,
  type ChartRange,
  type ChartSeriesPoint,
  type ChartValueMode,
} from "@moritzbrantner/charts";
import "./styles.css";

type TelemetryProperties = {
  channel: "direct" | "partner" | "marketplace";
  note: string;
  plan: "starter" | "scale" | "enterprise";
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
  const points = useMemo(() => createTelemetryPoints(), []);
  const gapPoints = useMemo(() => createGapPoints(), []);
  const [rangeId, setRangeId] = useState("week");
  const [valueMode, setValueMode] = useState<ChartValueMode>("average");
  const activeRange = ranges.find((range) => range.id === rangeId) ?? ranges[0];
  const index = useMemo(() => createChartDensityIndex(points, { backend: "hybrid-js" }), [points]);
  const bounds = index.getSeriesBounds();
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
                  Density-aware chart helpers, render data, and React controls across common
                  product analytics views.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:w-[34rem]">
              <ChartMetricStrip label="Points" value={formatCompact(points.length)} />
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
              onValueChange={setRangeId}
            />
          </ChartPanel>
          <DenseTrendExample
            activeRange={activeRange}
            index={index}
            valueMode={valueMode}
            onValueModeChange={setValueMode}
          />
        </section>

        <ValueModeExamples
          activeRange={activeRange}
          index={index}
          valueMode={valueMode}
          onValueModeChange={setValueMode}
        />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <SparklineExample activeRange={activeRange} index={index} valueMode={valueMode} />
          <BackendExample points={points} />
        </section>

        <GapBehaviorExample points={gapPoints} />
      </div>
    </main>
  );
}

function DenseTrendExample({
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
  const { containerRef, isAuto, resetAuto, setManualBinCount, targetBinCount, width } =
    useChartBinCount({
      defaultBinCount: 120,
      maxBinCount: 240,
      minBinCount: 36,
      pixelsPerBin: 9,
      step: 12,
    });
  const measured = measureChartSeries(index, {
    includeEmptyBins: true,
    targetBinCount,
    valueMode,
    xDomain: activeRange.domain,
  });
  const definition = getChartValueModeDefinition(valueMode);
  const renderData = createChartRenderData(measured.series.samples, {
    includeSample: true,
    modes: [valueMode],
    xLabel: (sample) => formatHour(sample.x),
  }).rows;
  const summary = createChartDensityViewportSummary(measured.series);

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
        <div ref={containerRef}>
          <ChartContainer className="h-[24rem] w-full" config={chartConfig(definition.label)}>
            {definition.renderer === "bar" ? (
              <BarChart data={renderData} margin={{ bottom: 8, left: 8, right: 12, top: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={26} />
                <YAxis tickLine={false} axisLine={false} width={56} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={0} />
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
              </AreaChart>
            )}
          </ChartContainer>
        </div>
      </div>
    </ChartPanel>
  );
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
  const measuredByMode = CHART_VALUE_MODE_DEFINITIONS.map((definition) => ({
    definition,
    measured: measureChartSeries(index, {
      includeEmptyBins: true,
      targetBinCount: 72,
      valueMode: definition.id,
      xDomain: activeRange.domain,
    }),
  }));

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

function SparklineExample({
  activeRange,
  index,
  valueMode,
}: {
  activeRange: ChartRange;
  index: ReturnType<typeof createChartDensityIndex<TelemetryProperties>>;
  valueMode: ChartValueMode;
}) {
  const series = index.getChartSeries({
    includeEmptyBins: true,
    targetBinCount: 96,
    valueMode,
    xDomain: activeRange.domain,
  });
  const hotSample = [...series.samples]
    .filter((sample) => sample.pointCount > 0)
    .sort((left, right) => (right.metrics.revenue ?? 0) - (left.metrics.revenue ?? 0))[0];
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(
    hotSample?.index ?? null,
  );
  const selectedSample =
    series.samples.find((sample) => sample.index === selectedSampleIndex) ?? hotSample ?? null;
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
          <ChartMetricStrip label="Selected x" value={selectedSample ? formatHour(selectedSample.x) : "n/a"} />
          <ChartMetricStrip
            label="First point"
            value={selectedPoint?.properties.note ?? "No point"}
          />
          <ChartMetricStrip
            label="Plan"
            value={selectedPoint?.properties.plan ?? "n/a"}
          />
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
    <ChartPanel title="Progressive backend" description="Manual WASM warmup with JS fallback status.">
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
                <LineChart data={renderData.rows} margin={{ bottom: 8, left: 0, right: 10, top: 10 }}>
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
    const maintenanceDip = day > 12 && day < 13.5 ? -22 : 0;
    const deterministicNoise = seededWave(hour * 9.731) * 9;
    const y = Math.max(
      4,
      92 + dayCycle * 26 + weekCycle * 12 + releaseLift + campaignPulse + maintenanceDip + deterministicNoise,
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

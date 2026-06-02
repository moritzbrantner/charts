import { Badge } from "@moritzbrantner/ui";
import { useMemo, useState } from "react";

import {
  ChartMetricStrip,
  ChartPanel,
  ChartRangeSelector,
  createChartDensityIndex,
  createChartDensityViewportSummary,
} from "@moritzbrantner/charts";

import { ChartPlayground } from "./chart-playground";
import {
  createExampleDataSets,
  createGapPoints,
  formatCompact,
  formatCurrency,
  formatHour,
} from "./data";
import { DeferredExampleMount } from "./deferred-example-mount";
import { DenseTrendExample } from "./dense-trend";
import { ExampleNav } from "./example-nav";
import { getChartPageType, getExamplePage } from "./example-routing";
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

import type { ExampleDataSetId } from "./model";
import type { ChartValueMode } from "@moritzbrantner/charts";

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

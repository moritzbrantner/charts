import { useMemo, useState } from "react";

import { ChartPanel, ChartRangeSelector, createChartDensityIndex } from "@moritzbrantner/charts";

import { ChartPlayground } from "./chart-playground";
import { createExampleDataSets, createGapPoints, formatHour } from "./data";
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
    <main className="charts-site">
      <header className="site-header">
        <a className="site-header__brand" href="./">
          @moritzbrantner/charts
        </a>
        <ExampleNav page={page} />
      </header>

      <section className="hero" data-testid="examples-hero">
        <div className="hero__copy">
          <p className="hero__eyebrow">Examples</p>
          <h1>@moritzbrantner/charts</h1>
          <p className="hero__description">
            Density-aware chart helpers, render data, and React controls for large numeric series,
            common product analytics views, and renderer-agnostic workflows.
          </p>
        </div>
      </section>

      <div className="content-grid">
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

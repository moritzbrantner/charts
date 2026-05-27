import { describe, expect, test } from "vitest";

import {
  createChartDensityIndex,
  createChartRenderData,
  createCumulativeChartSeries,
  createDeltaChartSeries,
  createRollingChartSeries,
  getChartAnomalyAnnotations,
  getChartSampleValue,
  getChartThresholdAnnotations,
  type ChartDensitySample,
} from "@moritzbrantner/charts";

describe("chart analytics", () => {
  test("reads default sample values, value modes, metrics, and custom accessors", () => {
    const [sample] = createSamples([2, 8], [{ revenue: 12 }, { revenue: 18 }]);

    expect(getChartSampleValue(sample!, undefined)).toBe(2);
    expect(getChartSampleValue(sample!, "average")).toBe(2);
    expect(getChartSampleValue(sample!, "count")).toBe(1);
    expect(getChartSampleValue(sample!, "max")).toBe(2);
    expect(getChartSampleValue(sample!, "min")).toBe(2);
    expect(getChartSampleValue(sample!, "sum")).toBe(2);
    expect(getChartSampleValue(sample!, { metric: "revenue" })).toBe(12);
    expect(getChartSampleValue(sample!, { metric: "missing" })).toBeNull();
    expect(getChartSampleValue(sample!, (nextSample) => (nextSample.y ?? 0) * 2)).toBe(4);
  });

  test("creates centered rolling averages and respects minimum point counts", () => {
    const samples = createSamples([2, null, 6, 10, null]);
    const rolling = createRollingChartSeries(samples, {
      minPoints: 2,
      windowSize: 3,
    });

    expect(rolling.map((point) => point.value)).toEqual([null, 4, 8, 8, null]);
  });

  test("creates rolling sums, minimums, and maximums", () => {
    const samples = createSamples([2, 4, 6]);

    expect(
      createRollingChartSeries(samples, { statistic: "sum", windowSize: 3 }).map(
        (point) => point.value,
      ),
    ).toEqual([6, 12, 10]);
    expect(
      createRollingChartSeries(samples, { statistic: "min", windowSize: 3 }).map(
        (point) => point.value,
      ),
    ).toEqual([2, 2, 4]);
    expect(
      createRollingChartSeries(samples, { statistic: "max", windowSize: 3 }).map(
        (point) => point.value,
      ),
    ).toEqual([4, 6, 6]);
  });

  test("creates absolute and percent deltas with null and zero guards", () => {
    const samples = createSamples([10, 15, null, 0, 5]);

    expect(createDeltaChartSeries(samples).map((point) => point.value)).toEqual([
      null,
      5,
      null,
      null,
      5,
    ]);
    expect(
      createDeltaChartSeries(samples, { mode: "percent", offset: 1 }).map((point) => point.value),
    ).toEqual([null, 50, null, null, null]);
  });

  test("creates cumulative series and skips null samples", () => {
    const samples = createSamples([2, null, 6, 10, null]);

    expect(createCumulativeChartSeries(samples).map((point) => point.value)).toEqual([
      2,
      null,
      8,
      18,
      null,
    ]);
  });

  test("merges contiguous above-threshold runs", () => {
    const samples = createSamples([1, 5, 6, 2, 7, 8]);
    const annotations = getChartThresholdAnnotations(samples, 4);

    expect(annotations).toMatchObject([
      { direction: "above", sampleCount: 2, startIndex: 1, endIndex: 2 },
      { direction: "above", sampleCount: 2, startIndex: 4, endIndex: 5 },
    ]);
  });

  test("merges contiguous below-threshold runs", () => {
    const samples = createSamples([1, 5, 6, 2, 7, 8]);
    const annotations = getChartThresholdAnnotations(samples, 3, { direction: "below" });

    expect(annotations).toMatchObject([
      { direction: "below", sampleCount: 1, startIndex: 0, endIndex: 0 },
      { direction: "below", sampleCount: 1, startIndex: 3, endIndex: 3 },
    ]);
  });

  test("detects anomalies when enough samples exceed sensitivity", () => {
    const tooFewSamples = createSamples([10, 10, 100]);
    const samples = createSamples([...Array.from({ length: 20 }, () => 10), 1_000]);

    expect(getChartAnomalyAnnotations(tooFewSamples)).toEqual([]);
    expect(getChartAnomalyAnnotations(samples)).toMatchObject([
      {
        index: 20,
        value: 1_000,
      },
    ]);
  });

  test("aligns derived render data by sample index", () => {
    const samples = createSamples([2, null, 6]);
    const derived = createCumulativeChartSeries(samples);
    const renderData = createChartRenderData(samples, {
      derived: {
        cumulative: derived,
        doubled: (sample) => (sample.y === null ? null : sample.y * 2),
      },
      includeSample: true,
    });

    expect(renderData.rows.map((row) => row.cumulative)).toEqual([2, null, 8]);
    expect(renderData.rows.map((row) => row.doubled)).toEqual([4, null, 12]);
    expect(renderData.rows[2]?.sample).toBe(samples[2]);
  });
});

function createSamples(
  values: Array<number | null>,
  metrics: Array<Record<string, number>> = [],
): Array<ChartDensitySample> {
  const points = values.flatMap((value, index) =>
    value === null
      ? []
      : [
          {
            id: `point-${index}`,
            metrics: metrics[index] ?? { count: 1 },
            x: index + 0.5,
            y: value,
          },
        ],
  );
  const index = createChartDensityIndex(points, { backend: "hybrid-js" });

  return index.getChartSeries({
    includeEmptyBins: true,
    targetBinCount: values.length,
    xDomain: [0, values.length],
  }).samples;
}

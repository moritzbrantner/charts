import { describe, expect, test } from "vitest";

import {
  createChartDensityIndex,
  createChartDensitySample,
  createChartDensityViewportSummary,
  createChartBandRenderData,
  createChartBoxPlotData,
  createGroupedChartRenderData,
  createChartRenderData,
  createProgressiveChartDensityIndex,
  getChartGapAnnotations,
  getChartValueModeDefinition,
  getChartValueModeDefinitions,
  type ChartValueMode,
} from "@moritzbrantner/charts";

describe("@moritzbrantner/charts", () => {
  test("adapts data-density bins into chart samples", () => {
    const index = createChartDensityIndex(
      Array.from({ length: 12 }, (_, pointIndex) => ({
        id: `point-${pointIndex}`,
        metrics: { orders: 1 },
        x: pointIndex,
        y: pointIndex % 4,
      })),
    );

    const series = index.getChartSeries({
      targetBinCount: 3,
      valueMode: "count",
      xDomain: [0, 11],
    });

    expect(series.samples).toHaveLength(3);
    expect(series.summary.pointCount).toBe(12);
    expect(series.summary.metrics.orders).toBe(12);
    expect(series.summary.valueMode).toBe("count");
    expect(series.samples.map((sample) => sample.y)).toEqual([4, 4, 4]);
    expect(createChartDensityViewportSummary(series)).toMatchObject({
      binCount: 3,
      itemCount: 12,
      kind: "chart",
      metricKeys: ["orders"],
      metrics: { orders: 12 },
      sampleCount: 3,
      valueMode: "count",
      xDomain: [0, 11],
    });
    expect(index.getPointById("point-5")?.y).toBe(1);
  });

  test("derives a renderable sample from a single bin", () => {
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 2 },
      { id: "b", x: 1, y: 6 },
    ]);
    const [bin] = index.getBinnedSeries({ targetBinCount: 1, xDomain: [0, 1] }).bins;
    const sample = createChartDensitySample(bin!, "average");

    expect(sample.x).toBe(0.5);
    expect(sample.y).toBe(4);
    expect(sample.minY).toBe(2);
    expect(sample.maxY).toBe(6);
  });

  test("keeps chart samples in parity across density backends", () => {
    const points = [
      { id: "b", x: 5, y: 10, metrics: { orders: 1 } },
      { id: "a", x: 0, y: 2, metrics: { orders: 1 } },
      { id: "c", x: 5, y: -2, metrics: { orders: 1 } },
      { id: "d", x: 20, y: 8, metrics: { orders: 1 } },
      { id: "invalid", x: Number.NaN, y: 100, metrics: { orders: 100 } },
    ];
    const hybrid = createChartDensityIndex(points, { backend: "hybrid-js" });
    const wasm = createChartDensityIndex(points, { backend: "wasm-index" });
    const valueModes: ChartValueMode[] = ["average", "count", "max", "min", "sum"];

    for (const valueMode of valueModes) {
      const query = {
        includeEmptyBins: true,
        targetBinCount: 4,
        valueMode,
        xDomain: [20, 0] as [number, number],
      };

      expect(wasm.getChartSeries(query)).toEqual(hybrid.getChartSeries(query));
      expect(createChartDensityViewportSummary(wasm.getChartSeries(query))).toEqual(
        createChartDensityViewportSummary(hybrid.getChartSeries(query)),
      );
    }
  });

  test("creates high-volume chart samples through the dense-data WASM backend", () => {
    const points = Array.from({ length: 5_000 }, (_, pointIndex) => ({
      id: `point-${pointIndex}`,
      metrics: {
        orders: 1,
        revenue: pointIndex % 37,
        unstable: pointIndex % 2 === 0 ? Number.NaN : pointIndex,
      },
      properties: {
        segment: pointIndex % 5,
      },
      x: pointIndex % 2 === 0 ? pointIndex : 5_000 - pointIndex,
      y: Math.sin(pointIndex / 10) * 25 + (pointIndex % 13),
    }));
    const snapshot = structuredClone(points);
    const expectedPoints = points.filter((point) => point.id !== "point-17");
    const index = createChartDensityIndex(
      [
        ...points,
        {
          id: "invalid",
          metrics: { orders: 100, revenue: 100 },
          properties: { segment: 0 },
          x: Number.NaN,
          y: 10,
        },
      ],
      {
        backend: "wasm-index",
        filterPoint(point) {
          return point.id !== "point-17";
        },
      },
    );

    const series = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 128,
      valueMode: "average",
      xDomain: [0, 5_000],
    });

    expect(series.samples).toHaveLength(128);
    expect(series.summary.binCount).toBe(128);
    expect(series.summary.pointCount).toBe(expectedPoints.length);
    expect(series.summary.metrics.orders).toBe(expectedPoints.length);
    expect(series.summary.metrics.revenue).toBe(
      expectedPoints.reduce((total, point) => total + point.metrics.revenue, 0),
    );
    expect(series.summary.metrics.unstable).toBe(
      expectedPoints
        .filter((point) => Number.isFinite(point.metrics.unstable))
        .reduce((total, point) => total + point.metrics.unstable, 0),
    );
    expect(series.samples.every((sample) => sample.x >= sample.x0 && sample.x <= sample.x1)).toBe(
      true,
    );
    expect(createChartDensityViewportSummary(series)).toMatchObject({
      binCount: 128,
      itemCount: expectedPoints.length,
      kind: "chart",
      metricKeys: ["orders", "revenue", "unstable"],
      sampleCount: 128,
      valueMode: "average",
    });
    expect(index.getPointById("point-2500")?.properties.segment).toBe(0);
    expect(index.getPointById("invalid")).toBeNull();
    expect(points).toEqual(snapshot);
  });

  test("keeps dense-data-backed chart value modes correct with empty and duplicate bins", () => {
    const index = createChartDensityIndex(
      [
        { id: "a", metrics: { count: 1 }, x: 0, y: 2 },
        { id: "b", metrics: { count: 1 }, x: 0, y: 8 },
        { id: "c", metrics: { count: 1 }, x: 20, y: -4 },
      ],
      { backend: "wasm-index" },
    );
    const query = {
      includeEmptyBins: true,
      targetBinCount: 4,
      xDomain: [0, 40] as [number, number],
    };

    expect(
      index.getChartSeries({ ...query, valueMode: "average" }).samples.map((sample) => sample.y),
    ).toEqual([5, null, -4, null]);
    expect(
      index.getChartSeries({ ...query, valueMode: "count" }).samples.map((sample) => sample.y),
    ).toEqual([2, null, 1, null]);
    expect(
      index.getChartSeries({ ...query, valueMode: "max" }).samples.map((sample) => sample.y),
    ).toEqual([8, null, -4, null]);
    expect(
      index.getChartSeries({ ...query, valueMode: "min" }).samples.map((sample) => sample.y),
    ).toEqual([2, null, -4, null]);
    expect(
      index.getChartSeries({ ...query, valueMode: "sum" }).samples.map((sample) => sample.y),
    ).toEqual([10, null, -4, null]);
  });

  test("exposes chart value mode definitions", () => {
    expect(getChartValueModeDefinition("count")).toMatchObject({
      axisLabel: "Point count",
      id: "count",
      label: "Count",
      renderer: "bar",
    });
    expect(getChartValueModeDefinition("p50")).toMatchObject({
      id: "p50",
      label: "Median",
    });
    expect(getChartValueModeDefinitions(["p25", "p75"]).map((definition) => definition.id)).toEqual(
      ["p25", "p75"],
    );
    expect(getChartValueModeDefinitions(["min", "max"]).map((definition) => definition.id)).toEqual(
      ["min", "max"],
    );
    expect(() => getChartValueModeDefinition("median" as ChartValueMode)).toThrow(
      "Unknown chart value mode: median",
    );
  });

  test("creates histogram buckets from selected viewport values and metrics", () => {
    const index = createChartDensityIndex(
      [
        { id: "a", metrics: { revenue: 2 }, x: 0, y: 1 },
        { id: "b", metrics: { revenue: 3 }, x: 1, y: 5 },
        { id: "c", metrics: { revenue: 7 }, x: 10, y: 9 },
      ],
      { backend: "hybrid-js" },
    );

    const histogram = index.getHistogram({
      bucketCount: 4,
      valueDomain: [0, 8],
      xDomain: [0, 2],
    });

    expect(histogram.buckets.map((bucket) => bucket.pointCount)).toEqual([1, 0, 1, 0]);
    expect(histogram.summary).toMatchObject({
      bucketCount: 4,
      metrics: { revenue: 5 },
      pointCount: 2,
      valueDomain: [0, 8],
      xDomain: [0, 2],
    });
    expect(index.getHistogram({ bucketCount: 4, includeEmptyBuckets: false }).buckets.length).toBe(
      3,
    );
  });

  test("creates normalized heatmap cells and can drop empty cells", () => {
    const index = createChartDensityIndex([
      { id: "a", metrics: { revenue: 1 }, x: 0.5, y: 1 },
      { id: "b", metrics: { revenue: 2 }, x: 0.75, y: 1.5 },
      { id: "c", metrics: { revenue: 4 }, x: 1.5, y: 9 },
    ]);

    const heatmap = index.getHeatmap({
      xBinCount: 2,
      xDomain: [0, 2],
      yBinCount: 2,
      yDomain: [0, 10],
    });

    expect(heatmap.cells).toHaveLength(4);
    expect(heatmap.summary).toMatchObject({
      maxCellCount: 2,
      metrics: { revenue: 7 },
      pointCount: 3,
      xBinCount: 2,
      yBinCount: 2,
    });
    expect(heatmap.cells.map((cell) => cell.value)).toEqual([1, 0, 0, 0.5]);
    expect(
      index.getHeatmap({
        includeEmptyCells: false,
        xBinCount: 2,
        xDomain: [0, 2],
        yBinCount: 2,
        yDomain: [0, 10],
      }).cells,
    ).toHaveLength(2);
  });

  test("creates grouped chart series and grouped render rows", () => {
    const index = createChartDensityIndex([
      { id: "a", metrics: { revenue: 1 }, properties: { plan: "pro" }, x: 0.5, y: 2 },
      { id: "b", metrics: { revenue: 1 }, properties: { plan: "pro" }, x: 1.5, y: 4 },
      { id: "c", metrics: { revenue: 1 }, properties: { plan: "team" }, x: 0.5, y: 6 },
      { id: "d", metrics: { revenue: 1 }, properties: { plan: "free" }, x: 1.5, y: 8 },
    ]);

    const grouped = index.getGroupedChartSeries({
      groupBy: { property: "plan" },
      maxGroups: 1,
      targetBinCount: 2,
      valueMode: "count",
      xDomain: [0, 2],
    });

    expect(grouped.groups.map((group) => group.label)).toEqual(["pro", "Other"]);
    expect(grouped.groups.every((group) => group.series.samples.length === 2)).toBe(true);

    const rows = createGroupedChartRenderData(grouped).rows;
    const percentRows = createGroupedChartRenderData(grouped, { percent: true }).rows;

    expect(rows).toMatchObject([
      { pro: 1, __other: 1, total: 2 },
      { pro: 1, __other: 1, total: 2 },
    ]);
    expect(percentRows).toMatchObject([
      { pro: 50, __other: 50, total: 2 },
      { pro: 50, __other: 50, total: 2 },
    ]);
  });

  test("creates percentile-enriched chart series across backends", () => {
    const points = [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 0.2, y: 10 },
      { id: "c", x: 0.4, y: 20 },
      { id: "d", x: 2.4, y: 100 },
    ];
    const hybrid = createChartDensityIndex(points, { backend: "hybrid-js" });
    const wasm = createChartDensityIndex(points, { backend: "wasm-index" });
    const query = {
      includeEmptyBins: true,
      percentiles: ["p25", "p75"] as const,
      targetBinCount: 3,
      valueMode: "p50" as const,
      xDomain: [0, 3] as [number, number],
    };
    const series = hybrid.getChartSeries(query);

    expect(series.samples.map((sample) => sample.y)).toEqual([10, null, 100]);
    expect(series.samples.map((sample) => sample.p25)).toEqual([5, null, 100]);
    expect(series.samples.map((sample) => sample.p75)).toEqual([15, null, 100]);
    expect(wasm.getChartSeries(query)).toEqual(series);
  });

  test("creates band and box plot data from chart samples", () => {
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 0.2, y: 10 },
      { id: "c", x: 0.4, y: 20 },
      { id: "d", x: 1.4, y: 100 },
    ]);
    const samples = index.getChartSeries({
      includeEmptyBins: true,
      percentiles: ["p25", "p50", "p75"],
      targetBinCount: 3,
      xDomain: [0, 3],
    }).samples;

    expect(createChartBandRenderData(samples).rows[0]).toMatchObject({
      center: 10,
      lower: 0,
      range: [0, 20],
      upper: 20,
    });
    expect(
      createChartBandRenderData(samples, {
        lower: () => 5,
        upper: () => 1,
      }).rows[0]?.range,
    ).toEqual([1, 5]);
    expect(
      createChartBandRenderData(samples, {
        center: "p50",
        lower: "p25",
        upper: "p75",
      }).rows[0],
    ).toMatchObject({
      center: 10,
      range: [5, 15],
    });
    expect(createChartBoxPlotData(samples)[0]).toMatchObject({
      lowerWhisker: 0,
      median: 10,
      q1: 5,
      q3: 15,
      upperWhisker: 20,
    });
    expect(
      createChartBoxPlotData([
        createChartDensitySample({
          averageY: 1,
          firstPoint: null,
          index: 0,
          lastPoint: null,
          maxY: 1,
          metrics: {},
          minY: 1,
          pointCount: 1,
          sumY: 1,
          x0: 0,
          x1: 1,
        }),
      ])[0],
    ).toMatchObject({
      median: null,
      q1: null,
      q3: null,
    });
  });

  test("creates renderer data with configurable gap behavior", () => {
    const index = createChartDensityIndex(
      [
        { id: "a", x: 0, y: 2, metrics: { orders: 1 } },
        { id: "b", x: 20, y: 8, metrics: { orders: 2 } },
      ],
      { backend: "hybrid-js" },
    );
    const samples = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 5,
      valueMode: "average",
      xDomain: [0, 50],
    }).samples;

    expect(createChartRenderData(samples).rows.map((row) => row.value)).toEqual([
      2,
      null,
      8,
      null,
      null,
    ]);
    expect(
      createChartRenderData(samples, {
        gapBehavior: "connect",
        includeMetrics: true,
        includeSample: true,
        xLabel: (sample) => `x-${sample.index}`,
      }),
    ).toMatchObject({
      annotations: [
        { endIndex: 1, sampleCount: 1, startIndex: 1 },
        { endIndex: 4, sampleCount: 2, startIndex: 3 },
      ],
      rows: [
        { label: "x-0", metrics: { orders: 1 }, sample: samples[0], value: 2 },
        { label: "x-2", metrics: { orders: 2 }, sample: samples[2], value: 8 },
      ],
    });
    expect(createChartRenderData(samples, { gapBehavior: "drop" }).annotations).toEqual([]);
    expect(createChartRenderData(samples, { gapBehavior: "drop" }).rows).toHaveLength(2);
    expect(
      createChartRenderData(samples, { gapBehavior: "zero-fill" }).rows.map((row) => row.value),
    ).toEqual([2, 0, 8, 0, 0]);
  });

  test("describes one or more empty chart sample runs", () => {
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 2 },
      { id: "b", x: 30, y: 8 },
    ]);
    const samples = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 6,
      xDomain: [0, 60],
    }).samples;

    expect(getChartGapAnnotations(samples)).toMatchObject([
      { endIndex: 2, sampleCount: 2, startIndex: 1 },
      { endIndex: 5, sampleCount: 2, startIndex: 4 },
    ]);
  });

  test("progressively renders with hybrid-js and switches to wasm-index after warmup", async () => {
    const scheduledWarmups: Array<() => void> = [];
    const points = Array.from({ length: 200 }, (_, pointIndex) => ({
      id: `point-${pointIndex}`,
      metrics: { count: 1, revenue: pointIndex % 9 },
      x: pointIndex % 2 === 0 ? pointIndex : 200 - pointIndex,
      y: pointIndex % 17,
    }));
    const index = createProgressiveChartDensityIndex(points, {
      progressive: {
        scheduler(warmup) {
          scheduledWarmups.push(warmup);
        },
      },
    });
    const query = {
      includeEmptyBins: true,
      targetBinCount: 16,
      valueMode: "average" as const,
      xDomain: [0, 200] as [number, number],
    };
    const firstSeries = index.getChartSeries(query);

    expect(index.getProgressiveStatus()).toMatchObject({
      activeBackend: "hybrid-js",
      isWarming: false,
      wasmReady: false,
    });
    expect(firstSeries.summary.pointCount).toBe(200);
    expect(scheduledWarmups).toHaveLength(1);

    scheduledWarmups[0]?.();
    await index.whenWasmReady();

    expect(index.getProgressiveStatus()).toMatchObject({
      activeBackend: "wasm-index",
      isWarming: false,
      wasmError: null,
      wasmReady: true,
    });
    expect(index.getChartSeries(query)).toEqual(firstSeries);
  });

  test("can defer wasm-index construction until an interaction warms it manually", async () => {
    const index = createProgressiveChartDensityIndex(
      Array.from({ length: 50 }, (_, pointIndex) => ({
        id: `point-${pointIndex}`,
        metrics: { count: 1 },
        x: pointIndex,
        y: pointIndex % 5,
      })),
      {
        progressive: {
          warmup: "manual",
        },
      },
    );

    expect(index.getActiveBackend()).toBe("hybrid-js");
    expect(index.getChartSeries({ targetBinCount: 5, xDomain: [0, 49] }).summary.pointCount).toBe(
      50,
    );

    await index.warmWasmIndex();

    expect(index.getActiveBackend()).toBe("wasm-index");
    expect(index.getPointById("point-20")?.y).toBe(0);
  });
});

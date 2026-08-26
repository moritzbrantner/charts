import { describe, expect, test, vi } from "vitest";

import {
  createChartDensityIndex,
  createChartDensityWorkerIndex,
  createChartDensitySample,
  createChartDensityViewportSummary,
  createChartBandRenderData,
  createChartBoxPlotData,
  createChartCalendarHeatmapData,
  createChartCirclePackLayout,
  createChartFlameGraphLayout,
  createChartFunnelData,
  createChartIcicleLayout,
  createChartIndentedTreeLayout,
  createGroupedChartRenderData,
  createChartRidgelineData,
  createChartRenderData,
  createChartRadialTreeLayout,
  createChartSunburstLayout,
  createChartTreeLayout,
  createChartTreemapLayout,
  createChartWaterfallData,
  createProgressiveChartDensityIndex,
  getChartGapAnnotations,
  getChartValueModeDefinition,
  getChartValueModeDefinitions,
  resolveChartDensityBackendPolicy,
  type ChartHeatmapQuery,
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

  test("queries visible chart points with stride sampling", () => {
    const index = createChartDensityIndex(
      Array.from({ length: 10 }, (_, pointIndex) => ({
        id: `point-${pointIndex}`,
        metrics: { count: 1 },
        x: pointIndex,
        y: pointIndex * 2,
      })),
      { backend: "hybrid-js" },
    );
    const series = index.getChartPoints({ maxPoints: 3, xDomain: [2, 8] });

    expect(series.summary.pointCount).toBe(7);
    expect(series.summary.sampledPointCount).toBe(3);
    expect(series.summary.metrics.count).toBe(7);
    expect(series.points.map((point) => point.id)).toEqual(["point-2", "point-4", "point-6"]);
  });

  test("creates scatter points with y filtering and bubble sizing", () => {
    const index = createChartDensityIndex(
      [
        { id: "a", metrics: { revenue: 0 }, x: 0, y: 1 },
        { id: "b", metrics: { revenue: 50 }, x: 1, y: 5 },
        { id: "c", metrics: { revenue: 100 }, x: 2, y: 9 },
      ],
      { backend: "hybrid-js" },
    );
    const scatter = index.getScatter({
      sizeAccessor: { metric: "revenue" },
      xDomain: [0, 2],
      yDomain: [2, 10],
    });

    expect(scatter.points.map((point) => point.id)).toEqual(["b", "c"]);
    expect(scatter.summary.pointCount).toBe(2);
    expect(scatter.summary.minSizeValue).toBe(50);
    expect(scatter.summary.maxSizeValue).toBe(100);
    expect(scatter.points[1]!.radius).toBeGreaterThan(scatter.points[0]!.radius);
  });

  test("creates waterfall and funnel rows", () => {
    expect(
      createChartWaterfallData([
        { label: "Start", value: 100 },
        { label: "Loss", value: -25 },
        { label: "Gain", value: 10 },
      ]).map((row) => [row.start, row.end, row.negative]),
    ).toEqual([
      [0, 100, false],
      [100, 75, true],
      [75, 85, false],
    ]);

    expect(
      createChartFunnelData([
        { label: "Visitors", value: 100 },
        { label: "Trials", value: 50 },
        { label: "Paid", value: 25 },
      ]).map((row) => [row.percentOfFirst, row.percentOfPrevious, row.dropOff]),
    ).toEqual([
      [1, null, null],
      [0.5, 0.5, 50],
      [0.25, 0.5, 25],
    ]);
  });

  test("creates finite hierarchy layouts inside bounds", () => {
    const hierarchy = {
      label: "Root",
      children: [
        { label: "A", value: 3 },
        { label: "B", value: 1 },
      ],
    };
    const treemap = createChartTreemapLayout(hierarchy, { height: 100, padding: 2, width: 200 });
    const sunburst = createChartSunburstLayout(hierarchy, { outerRadius: 80 });
    const icicle = createChartIcicleLayout(hierarchy, { height: 100, padding: 2, width: 200 });
    const flameGraph = createChartFlameGraphLayout(hierarchy, {
      height: 100,
      padding: 2,
      width: 200,
    });
    const circlePack = createChartCirclePackLayout(hierarchy, { height: 160, width: 160 });
    const tree = createChartTreeLayout(hierarchy, { height: 100, width: 200 });
    const radialTree = createChartRadialTreeLayout(hierarchy, { height: 160, width: 160 });
    const indentedTree = createChartIndentedTreeLayout(hierarchy, { width: 200 });

    expect(treemap).toHaveLength(3);
    for (const node of treemap) {
      expect(Number.isFinite(node.x + node.y + node.width + node.height)).toBe(true);
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.x + node.width).toBeLessThanOrEqual(200);
      expect(node.y + node.height).toBeLessThanOrEqual(100);
    }

    expect(sunburst).toHaveLength(3);
    for (const node of sunburst) {
      expect(
        Number.isFinite(node.startAngle + node.endAngle + node.innerRadius + node.outerRadius),
      ).toBe(true);
      expect(node.outerRadius).toBeLessThanOrEqual(80);
    }

    expect(icicle).toHaveLength(3);
    for (const node of icicle) {
      expect(Number.isFinite(node.x + node.y + node.width + node.height)).toBe(true);
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.x + node.width).toBeLessThanOrEqual(200);
      expect(node.y + node.height).toBeLessThanOrEqual(100);
    }

    expect(flameGraph).toHaveLength(3);
    for (const node of flameGraph) {
      expect(Number.isFinite(node.x + node.y + node.width + node.height)).toBe(true);
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.x + node.width).toBeLessThanOrEqual(200);
      expect(node.y + node.height).toBeLessThanOrEqual(100);
    }

    expect(circlePack).toHaveLength(3);
    for (const node of circlePack) {
      expect(Number.isFinite(node.x + node.y + node.radius)).toBe(true);
      expect(node.x - node.radius).toBeGreaterThanOrEqual(0);
      expect(node.y - node.radius).toBeGreaterThanOrEqual(0);
      expect(node.x + node.radius).toBeLessThanOrEqual(160);
      expect(node.y + node.radius).toBeLessThanOrEqual(160);
    }

    expect(tree).toHaveLength(3);
    for (const node of tree) {
      expect(Number.isFinite(node.x + node.y)).toBe(true);
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(200);
      expect(node.y).toBeLessThanOrEqual(100);
    }

    expect(radialTree).toHaveLength(3);
    for (const node of radialTree) {
      expect(Number.isFinite(node.angle + node.radius + node.x + node.y)).toBe(true);
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(160);
      expect(node.y).toBeLessThanOrEqual(160);
    }

    expect(indentedTree).toHaveLength(3);
    for (const node of indentedTree) {
      expect(Number.isFinite(node.x + node.y + node.width + node.height)).toBe(true);
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.x + node.width).toBeLessThanOrEqual(200);
    }
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

  test("keeps wasm chart series in parity across edge-case data shapes", () => {
    const scenarios = [
      {
        name: "empty",
        points: [],
      },
      {
        name: "sorted",
        points: Array.from({ length: 24 }, (_, pointIndex) => ({
          id: `sorted-${pointIndex}`,
          metrics: { count: 1, revenue: pointIndex % 5 },
          x: pointIndex,
          y: pointIndex % 7,
        })),
      },
      {
        name: "reverse",
        points: Array.from({ length: 24 }, (_, pointIndex) => ({
          id: `reverse-${pointIndex}`,
          metrics: { count: 1, revenue: pointIndex % 5 },
          x: 24 - pointIndex,
          y: pointIndex % 7,
        })),
      },
      {
        name: "random-and-invalid",
        points: Array.from({ length: 24 }, (_, pointIndex) => ({
          id: `random-${pointIndex}`,
          metrics: {
            count: 1,
            missingSometimes: pointIndex % 3 === 0 ? Number.NaN : pointIndex,
          },
          x: pointIndex === 5 ? Number.POSITIVE_INFINITY : (pointIndex * 17) % 24,
          y: pointIndex === 9 ? Number.NaN : Math.sin(pointIndex / 3) * 10,
        })),
      },
      {
        name: "duplicates",
        points: Array.from({ length: 24 }, (_, pointIndex) => ({
          id: `duplicate-${pointIndex}`,
          metrics: { count: 1 },
          x: Math.floor(pointIndex / 4),
          y: pointIndex - 12,
        })),
      },
      {
        name: "no-metrics",
        points: Array.from({ length: 24 }, (_, pointIndex) => ({
          id: `metricless-${pointIndex}`,
          x: pointIndex,
          y: pointIndex % 3,
        })),
      },
      {
        name: "many-metrics",
        points: Array.from({ length: 24 }, (_, pointIndex) => ({
          id: `wide-${pointIndex}`,
          metrics: Object.fromEntries(
            Array.from({ length: 10 }, (_, metricIndex) => [
              `metric${metricIndex}`,
              pointIndex + metricIndex,
            ]),
          ),
          x: pointIndex,
          y: pointIndex % 5,
        })),
      },
    ];
    const queries = [
      { includeEmptyBins: true, targetBinCount: 8, xDomain: [20, 0] as [number, number] },
      { includeEmptyBins: false, targetBinCount: 6, xDomain: [0, 6] as [number, number] },
      { includeEmptyBins: true, targetBinCount: 4, xDomain: [2, 2] as [number, number] },
      { includeEmptyBins: true, targetBinCount: 4, xDomain: [100, 110] as [number, number] },
    ];
    const valueModes: ChartValueMode[] = [
      "average",
      "count",
      "max",
      "min",
      "sum",
      "p10",
      "p25",
      "p50",
      "p75",
      "p90",
      "p95",
      "p99",
    ];

    for (const scenario of scenarios) {
      const hybrid = createChartDensityIndex(scenario.points, { backend: "hybrid-js" });
      const wasm = createChartDensityIndex(scenario.points, { backend: "wasm-index" });

      for (const query of queries) {
        for (const valueMode of valueModes) {
          expect(
            publicChartSeries(
              wasm.getChartSeries({
                ...query,
                percentiles: ["p10", "p25", "p50", "p75", "p90", "p95", "p99"],
                valueMode,
              }),
            ),
            `${scenario.name} ${valueMode} ${query.xDomain.join("-")}`,
          ).toEqual(
            publicChartSeries(
              hybrid.getChartSeries({
                ...query,
                percentiles: ["p10", "p25", "p50", "p75", "p90", "p95", "p99"],
                valueMode,
              }),
            ),
          );
        }
      }
    }
  });

  test("caches exact binned and chart queries with an LRU cap", () => {
    const index = createChartDensityIndex(
      [
        { id: "a", x: 0, y: 2 },
        { id: "b", x: 1, y: 4 },
        { id: "c", x: 2, y: 6 },
      ],
      { backend: "hybrid-js", cache: { maxEntries: 1 } },
    );
    const firstChart = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 2,
      valueMode: "average",
      xDomain: [0, 2],
    });
    const firstChartAgain = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 2,
      valueMode: "average",
      xDomain: [2, 0],
    });

    expect(firstChartAgain).toBe(firstChart);

    index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 3,
      valueMode: "average",
      xDomain: [0, 2],
    });

    expect(
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 2,
        valueMode: "average",
        xDomain: [0, 2],
      }),
    ).toEqual(firstChart);
    expect(
      index.getChartSeries({
        includeEmptyBins: true,
        targetBinCount: 2,
        valueMode: "average",
        xDomain: [0, 2],
      }),
    ).not.toBe(firstChart);

    const firstBinned = index.getBinnedSeries({
      includeEmptyBins: true,
      targetBinCount: 2,
      xDomain: [0, 2],
    });

    expect(
      index.getBinnedSeries({
        includeEmptyBins: true,
        targetBinCount: 2,
        xDomain: [2, 0],
      }),
    ).toBe(firstBinned);
  });

  test("keeps point-store range queries and auto aggregate bins in scan parity", () => {
    const points = [
      { id: "a", metrics: { revenue: 2 }, x: 0, y: 2 },
      { id: "b", metrics: { revenue: 3 }, x: 1, y: 6 },
      { id: "c", metrics: { revenue: 5 }, x: 1, y: -2 },
      { id: "d", metrics: { revenue: 7 }, x: 2, y: 10 },
      { id: "e", metrics: { revenue: 11 }, x: 3, y: 4 },
      { id: "f", metrics: { revenue: 13 }, x: 4, y: 8 },
    ];
    const hybrid = createChartDensityIndex(points, {
      backend: "hybrid-js",
      cache: { enabled: false },
    });
    const auto = createChartDensityIndex(points, { backend: "auto", cache: { enabled: false } });
    const queries = [
      { includeEmptyBins: true, targetBinCount: 4, xDomain: [0, 4] as [number, number] },
      { includeEmptyBins: true, targetBinCount: 4, xDomain: [4, 0] as [number, number] },
      { includeEmptyBins: false, targetBinCount: 8, xDomain: [0.5, 2] as [number, number] },
      { includeEmptyBins: true, targetBinCount: 3, xDomain: [2, 2] as [number, number] },
    ];
    const valueModes: ChartValueMode[] = ["average", "count", "min", "max", "sum"];

    for (const query of queries) {
      expect(auto.getBinnedSeries(query)).toEqual(hybrid.getBinnedSeries(query));

      for (const valueMode of valueModes) {
        expect(publicChartSeries(auto.getChartSeries({ ...query, valueMode }))).toEqual(
          publicChartSeries(hybrid.getChartSeries({ ...query, valueMode })),
        );
      }

      expect(
        publicChartSeries(
          auto.getChartSeries({
            ...query,
            percentiles: ["p25", "p50", "p75"],
            valueMode: "p50",
          }),
        ),
      ).toEqual(
        publicChartSeries(
          hybrid.getChartSeries({
            ...query,
            percentiles: ["p25", "p50", "p75"],
            valueMode: "p50",
          }),
        ),
      );
    }
  });

  test("routes only supported high-volume chart queries toward WASM", () => {
    expect(
      resolveChartDensityBackendPolicy({
        operationKind: "chart",
        pointCount: 200_000,
        requestedModes: ["average"],
      }),
    ).toBe("wasm-index");
    expect(
      resolveChartDensityBackendPolicy({
        hasPercentiles: true,
        operationKind: "chart",
        pointCount: 200_000,
      }),
    ).toBe("hybrid-js");
  });

  test("keeps the explicit WASM route correct before optional acceleration is enabled", () => {
    const points = Array.from({ length: 48 }, (_, pointIndex) => ({
      id: `point-${pointIndex}`,
      metrics: Object.fromEntries(
        Array.from({ length: 9 }, (_, metricIndex) => [
          metricIndex === 0 ? "count" : `metric${metricIndex}`,
          metricIndex === 0 ? 1 : pointIndex % (metricIndex + 2),
        ]),
      ),
      x: pointIndex % 2 === 0 ? pointIndex : 48 - pointIndex,
      y: Math.sin(pointIndex / 4) * 10,
    }));
    const hybridIndex = createChartDensityIndex(points, { backend: "hybrid-js" });
    const wasmIndex = createChartDensityIndex(points, { backend: "wasm-index" });
    const binnedQuery = {
      includeEmptyBins: false,
      targetBinCount: 10,
      xDomain: [0, 48] as [number, number],
    };
    const chartQuery = {
      includeEmptyBins: true,
      targetBinCount: 12,
      valueMode: "sum" as const,
      xDomain: [48, 0] as [number, number],
    };
    const percentileQuery = {
      includeEmptyBins: true,
      percentiles: ["p25", "p50", "p75"] as const,
      targetBinCount: 8,
      valueMode: "p50" as const,
      xDomain: [0, 48] as [number, number],
    };

    expect(wasmIndex.getBackendCapabilities?.()).toMatchObject({
      backend: "wasm-index",
      usesWasm: false,
    });
    expect(wasmIndex.getBinnedSeries(binnedQuery)).toEqual(
      hybridIndex.getBinnedSeries(binnedQuery),
    );
    expect(publicChartSeries(wasmIndex.getChartSeries(chartQuery))).toEqual(
      publicChartSeries(hybridIndex.getChartSeries(chartQuery)),
    );
    expect(publicChartSeries(wasmIndex.getChartSeries(percentileQuery))).toEqual(
      publicChartSeries(hybridIndex.getChartSeries(percentileQuery)),
    );
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

  test("keeps histogram and heatmap queries in parity across backends", () => {
    const points = Array.from({ length: 60 }, (_, pointIndex) => ({
      id: `point-${pointIndex}`,
      metrics: {
        count: 1,
        latency: pointIndex % 11,
        revenue: pointIndex % 4 === 0 ? Number.NaN : pointIndex * 2,
      },
      x: pointIndex % 2 === 0 ? pointIndex : 60 - pointIndex,
      y: Math.cos(pointIndex / 5) * 20,
    }));
    const hybrid = createChartDensityIndex(points, { backend: "hybrid-js" });
    const wasm = createChartDensityIndex(points, { backend: "wasm-index" });
    const heatmapQueries: Array<ChartHeatmapQuery<Record<string, unknown>>> = [
      {
        xBinCount: 6,
        xDomain: [0, 60],
        yBinCount: 4,
      },
      {
        valueAccessor: { metric: "latency" },
        xBinCount: 6,
        xDomain: [0, 60],
        yBinCount: 4,
      },
      {
        includeEmptyCells: false,
        valueAccessor: { metric: "latency" },
        xBinCount: 6,
        xDomain: [0, 60],
        yBinCount: 4,
      },
      {
        xBinCount: 6,
        xDomain: [0, 60],
        yBinCount: 4,
        yDomain: [-20, 20],
      },
    ];

    expect(wasm.getHistogram({ bucketCount: 7 })).toEqual(hybrid.getHistogram({ bucketCount: 7 }));
    expect(
      wasm.getHistogram({
        bucketCount: 5,
        includeEmptyBuckets: false,
        valueAccessor: { metric: "latency" },
        valueDomain: [0, 10],
        xDomain: [10, 40],
      }),
    ).toEqual(
      hybrid.getHistogram({
        bucketCount: 5,
        includeEmptyBuckets: false,
        valueAccessor: { metric: "latency" },
        valueDomain: [0, 10],
        xDomain: [10, 40],
      }),
    );

    for (const query of heatmapQueries) {
      expect(wasm.getHeatmap(query)).toEqual(hybrid.getHeatmap(query));
    }
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

  test("creates calendar heatmap days from source points", () => {
    const data = createChartCalendarHeatmapData(
      [
        { id: "a", metrics: { revenue: 1 }, x: 1, y: 2 },
        { id: "b", metrics: { revenue: 3 }, x: 2, y: 4 },
        { id: "c", metrics: { revenue: 5 }, x: 25, y: 8 },
      ],
      {
        dayMs: 24,
        xDomain: [0, 72],
      },
    );

    expect(data.days).toHaveLength(3);
    expect(data.days.map((day) => day.pointCount)).toEqual([2, 1, 0]);
    expect(data.days.map((day) => day.value)).toEqual([3, 8, null]);
    expect(data.days[0]?.firstPoint?.id).toBe("a");
    expect(data.days[0]?.lastPoint?.id).toBe("b");
    expect(data.days[0]).toMatchObject({
      metrics: { revenue: 4 },
      x0: 0,
      x1: 24,
    });
    expect(data.summary).toMatchObject({
      dayCount: 3,
      maxValue: 8,
      minValue: 3,
      pointCount: 3,
      xDomain: [0, 72],
    });
  });

  test("calendar heatmap can omit empty days and respects x domains", () => {
    const data = createChartCalendarHeatmapData(
      [
        { id: "a", x: 1, y: 2 },
        { id: "b", x: 25, y: 4 },
        { id: "c", x: 49, y: 6 },
      ],
      {
        dayMs: 24,
        includeEmptyDays: false,
        xDomain: [24, 48],
      },
    );

    expect(data.days).toHaveLength(1);
    expect(data.days[0]).toMatchObject({
      pointCount: 1,
      value: 4,
      x0: 24,
    });
    expect(data.summary.pointCount).toBe(1);
  });

  test("calendar heatmap supports custom value accessors", () => {
    const data = createChartCalendarHeatmapData(
      [
        { id: "a", metrics: { revenue: 2 }, x: 0, y: 100 },
        { id: "b", metrics: { revenue: 6 }, x: 12, y: 200 },
      ],
      {
        dayMs: 24,
        valueAccessor: { metric: "revenue" },
        xDomain: [0, 24],
      },
    );

    expect(data.days[0]?.value).toBe(4);
  });

  test("creates ridgeline grouped histograms", () => {
    const data = createChartRidgelineData(
      [
        { id: "a", properties: { plan: "pro" }, x: 0, y: 1 },
        { id: "b", properties: { plan: "pro" }, x: 1, y: 3 },
        { id: "c", properties: { plan: "team" }, x: 2, y: 9 },
        { id: "d", properties: { plan: "team" }, x: 3, y: Number.NaN },
      ],
      {
        bucketCount: 4,
        groupBy: { property: "plan" },
        valueDomain: [0, 10],
        xDomain: [0, 2],
      },
    );

    expect(data.groups.map((group) => group.groupLabel)).toEqual(["pro", "team"]);
    expect(data.groups[0]?.buckets.map((bucket) => bucket.pointCount)).toEqual([1, 1, 0, 0]);
    expect(data.groups[1]?.buckets.map((bucket) => bucket.pointCount)).toEqual([0, 0, 0, 1]);
    expect(data.summary).toMatchObject({
      bucketCount: 4,
      groupCount: 2,
      maxCount: 1,
      pointCount: 3,
      valueDomain: [0, 10],
      xDomain: [0, 2],
    });
  });

  test("ridgeline merges overflow groups into other", () => {
    const data = createChartRidgelineData(
      [
        { properties: { plan: "a" }, x: 0, y: 1 },
        { properties: { plan: "a" }, x: 1, y: 2 },
        { properties: { plan: "b" }, x: 2, y: 3 },
        { properties: { plan: "c" }, x: 3, y: 4 },
      ],
      {
        bucketCount: 2,
        groupBy: (point) => point.properties.plan,
        maxGroups: 1,
      },
    );

    expect(data.groups.map((group) => group.groupId)).toEqual(["a", "__other"]);
    expect(data.groups.map((group) => group.pointCount)).toEqual([2, 2]);
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
    expect(publicChartSeries(wasm.getChartSeries(query))).toEqual(publicChartSeries(series));
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
    const heatmapQuery = {
      includeEmptyCells: false,
      xBinCount: 8,
      xDomain: [0, 200] as [number, number],
      yBinCount: 4,
      yDomain: [0, 16] as [number, number],
    };
    const firstHeatmap = index.getHeatmap(heatmapQuery);

    expect(index.getProgressiveStatus()).toMatchObject({
      activeBackend: "hybrid-js",
      isWarming: false,
      wasmReady: false,
    });
    expect(firstSeries.summary.pointCount).toBe(200);
    expect(firstHeatmap.summary.pointCount).toBe(200);
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
    expect(index.getHeatmap(heatmapQuery)).toEqual(firstHeatmap);
  });

  test("builds a wasm-index in a worker and serves async density queries", async () => {
    const points = Array.from({ length: 80 }, (_, pointIndex) => ({
      id: `point-${pointIndex}`,
      metrics: { count: 1, revenue: pointIndex % 11 },
      x: pointIndex,
      y: pointIndex % 13,
    }));
    const query = {
      includeEmptyBins: true,
      targetBinCount: 8,
      valueMode: "average" as const,
      xDomain: [0, 79] as [number, number],
    };
    const workerIndex = createChartDensityWorkerIndex(
      points,
      {},
      {
        createWorker: () => new TestChartDensityWorker() as unknown as Worker,
      },
    );
    const expected = createChartDensityIndex(points, { backend: "wasm-index" }).getChartSeries(
      query,
    );

    expect(workerIndex).not.toBeNull();
    await workerIndex?.whenReady();

    expect(await workerIndex?.getBackendCapabilities()).toMatchObject({
      backend: "wasm-index",
      usesWasm: false,
    });
    expect(await workerIndex?.getChartSeries(query)).toEqual(expected);

    workerIndex?.terminate();
  });

  test("can warm a worker-backed index progressively without blocking sync queries", async () => {
    const scheduledWarmups: Array<() => void> = [];
    const onWorkerReady = vi.fn();
    const points = Array.from({ length: 120 }, (_, pointIndex) => ({
      id: `point-${pointIndex}`,
      metrics: { count: 1 },
      x: pointIndex,
      y: pointIndex % 7,
    }));
    const index = createProgressiveChartDensityIndex(points, {
      progressive: {
        onWorkerReady,
        scheduler(warmup) {
          scheduledWarmups.push(warmup);
        },
        worker: {
          createWorker: () => new TestChartDensityWorker() as unknown as Worker,
        },
      },
    });

    expect(index.getActiveBackend()).toBe("hybrid-js");
    expect(scheduledWarmups).toHaveLength(1);

    scheduledWarmups[0]?.();

    expect(index.getProgressiveStatus()).toMatchObject({
      activeBackend: "hybrid-js",
      isWorkerBuilding: true,
      workerReady: false,
      wasmReady: false,
    });

    const workerIndex = await index.whenWorkerReady();

    expect(workerIndex).not.toBeNull();
    expect(index.getActiveBackend()).toBe("hybrid-js");
    expect(index.getProgressiveStatus()).toMatchObject({
      activeBackend: "hybrid-js",
      isWorkerBuilding: false,
      workerError: null,
      workerReady: true,
      wasmReady: false,
    });
    expect(onWorkerReady).toHaveBeenCalledTimes(1);
    expect(await workerIndex?.getPointById("point-20")).toMatchObject({ y: 6 });

    workerIndex?.terminate();
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

  test("reports backend capabilities", async () => {
    const hybrid = createChartDensityIndex([{ x: 0, y: 1 }], { backend: "hybrid-js" });
    const wasm = createChartDensityIndex([{ x: 0, y: 1 }], { backend: "wasm-index" });
    const progressive = createProgressiveChartDensityIndex([{ x: 0, y: 1 }], {
      progressive: { warmup: "manual" },
    });

    expect(hybrid.getBackendCapabilities?.()).toMatchObject({
      backend: "hybrid-js",
      usesWasm: false,
    });
    expect(wasm.getBackendCapabilities?.()).toMatchObject({
      backend: "wasm-index",
      supportsGroupedSeries: true,
      usesWasm: false,
    });
    expect(progressive.getBackendCapabilities?.()).toMatchObject({
      backend: "hybrid-js",
      usesWasm: false,
    });

    await progressive.warmWasmIndex();

    expect(progressive.getBackendCapabilities?.()).toMatchObject({
      backend: "wasm-index",
      usesWasm: false,
    });
  });
});

class TestChartDensityWorker {
  #index: ReturnType<typeof createChartDensityIndex> | null = null;
  #listeners = new Map<string, Set<(event: MessageEvent) => void>>();

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    const listeners = this.#listeners.get(type) ?? new Set<(event: MessageEvent) => void>();

    listeners.add(listener);
    this.#listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    this.#listeners.get(type)?.delete(listener);
  }

  postMessage(message: {
    method?: string;
    options?: Parameters<typeof createChartDensityIndex>[1];
    pointId?: string;
    points?: Parameters<typeof createChartDensityIndex>[0];
    query?: unknown;
    requestId: number;
    type: "build" | "dispose" | "query";
  }) {
    setTimeout(() => {
      try {
        if (message.type === "build") {
          this.#index = createChartDensityIndex(message.points ?? [], {
            ...message.options,
            backend: "wasm-index",
          });
          this.#emit("message", { requestId: message.requestId, type: "built" });
          return;
        }

        if (message.type === "dispose") {
          this.#index = null;
          return;
        }

        if (!this.#index) {
          throw new Error("Worker index is not ready.");
        }

        this.#emit("message", {
          requestId: message.requestId,
          result: this.#query(message),
          type: "result",
        });
      } catch (error) {
        this.#emit("message", {
          error: {
            message: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : undefined,
          },
          requestId: message.requestId,
          type: "error",
        });
      }
    }, 0);
  }

  terminate() {
    this.#listeners.clear();
    this.#index = null;
  }

  #emit(type: string, data: unknown) {
    for (const listener of this.#listeners.get(type) ?? []) {
      listener({ data } as MessageEvent);
    }
  }

  #query(message: { method?: string; pointId?: string; query?: unknown }) {
    switch (message.method) {
      case "getBackendCapabilities":
        return this.#index?.getBackendCapabilities?.();
      case "getBinnedSeries":
        return this.#index?.getBinnedSeries(
          message.query as Parameters<
            ReturnType<typeof createChartDensityIndex>["getBinnedSeries"]
          >[0],
        );
      case "getChartSeries":
        return this.#index?.getChartSeries(
          message.query as Parameters<
            ReturnType<typeof createChartDensityIndex>["getChartSeries"]
          >[0],
        );
      case "getHeatmap":
        return this.#index?.getHeatmap(
          message.query as Parameters<ReturnType<typeof createChartDensityIndex>["getHeatmap"]>[0],
        );
      case "getHistogram":
        return this.#index?.getHistogram(
          message.query as Parameters<
            ReturnType<typeof createChartDensityIndex>["getHistogram"]
          >[0],
        );
      case "getPointById":
        return this.#index?.getPointById(message.pointId ?? "");
      case "getSeriesBounds":
        return this.#index?.getSeriesBounds();
      default:
        throw new Error(`Unsupported worker method: ${message.method ?? "unknown"}`);
    }
  }
}

function publicChartSeries<TSeries extends { bins: Array<Record<string, unknown>> }>(
  series: TSeries,
): TSeries {
  return {
    ...series,
    bins: series.bins.map((bin) => {
      const publicBin = { ...bin };

      delete publicBin.points;

      return publicBin;
    }),
  };
}

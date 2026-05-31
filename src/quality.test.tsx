import { fireEvent, render, screen } from "@testing-library/react";
import { Line, LineChart, YAxis } from "recharts";
import { describe, expect, test, vi } from "vitest";

import {
  ChartRangeSelector,
  ChartValueModeSelector,
  ChartYAxisRangeMenu,
  createChartDensityIndex,
  createChartRenderData,
  doChartLabelRectsIntersect,
  layoutChartLabels,
  type ChartGapBehavior,
  type ChartValueMode,
} from "@moritzbrantner/charts";

import {
  createLargeDeterministicPoints,
  createSparsePoints,
  createTelemetryPoints,
} from "./testing/chart-fixtures";

describe("chart quality invariants", () => {
  test("emits finite render row numbers for dense and sparse data", () => {
    const index = createChartDensityIndex(createSparsePoints());
    const series = index.getChartSeries({
      includeEmptyBins: true,
      percentiles: ["p25", "p50", "p75"],
      targetBinCount: 96,
      valueMode: "p50",
      xDomain: [720, 0],
    });
    const renderData = createChartRenderData(series.samples, {
      includeMetrics: true,
      includeSample: true,
      modes: ["average", "count", "max", "min", "sum", "p25", "p50", "p75"],
    });

    for (const row of renderData.rows) {
      for (const value of Object.values(row)) {
        if (typeof value === "number") {
          expect(Number.isFinite(value)).toBe(true);
        }
      }
    }
  });

  test("keeps gap behavior row counts and annotations deterministic", () => {
    const samples = createChartDensityIndex(createSparsePoints()).getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 48,
      xDomain: [0, 720],
    }).samples;
    const expectations: Record<ChartGapBehavior, { rows: number }> = {
      connect: { rows: samples.filter((sample) => sample.y !== null).length },
      drop: { rows: samples.filter((sample) => sample.y !== null).length },
      preserve: { rows: samples.length },
      "zero-fill": { rows: samples.length },
    };
    let annotationCount = 0;

    for (const [gapBehavior, expected] of Object.entries(expectations) as Array<
      [ChartGapBehavior, { annotations: number; rows: number }]
    >) {
      const renderData = createChartRenderData(samples, { gapBehavior });

      expect(renderData.rows).toHaveLength(expected.rows);
      annotationCount += renderData.annotations.length;
      for (const annotation of renderData.annotations) {
        expect(annotation.startIndex).toBeLessThanOrEqual(annotation.endIndex);
        expect(annotation.sampleCount).toBeGreaterThan(0);
        expect(Number.isFinite(annotation.startX)).toBe(true);
        expect(Number.isFinite(annotation.endX)).toBe(true);
      }
    }

    expect(annotationCount).toBeGreaterThan(0);
  });

  test("keeps percentile rows in parity across chart backends", () => {
    const points = createSparsePoints();
    const hybrid = createChartDensityIndex(points, { backend: "hybrid-js" });
    const wasm = createChartDensityIndex(points, { backend: "wasm-index" });
    const valueModes: ChartValueMode[] = ["p25", "p50", "p75"];

    for (const valueMode of valueModes) {
      const query = {
        includeEmptyBins: true,
        percentiles: ["p25", "p50", "p75"] as const,
        targetBinCount: 72,
        valueMode,
        xDomain: [720, 0] as [number, number],
      };

      expect(createChartRenderData(wasm.getChartSeries(query).samples).rows).toEqual(
        createChartRenderData(hybrid.getChartSeries(query).samples).rows,
      );
    }
  });

  test("places visible labels inside bounds without overlaps", () => {
    const labels = layoutChartLabels(
      [
        { anchor: { x: 80, y: 80 }, id: "release", priority: 20, text: "Release" },
        { anchor: { x: 120, y: 84 }, id: "campaign", priority: 10, text: "Campaign" },
        { anchor: { x: 160, y: 88 }, id: "recovery", priority: 5, text: "Recovery" },
      ],
      {
        boundary: { height: 220, width: 260, x: 0, y: 0 },
        collisionPadding: 4,
      },
    );
    const visible = labels.filter((label) => !label.hidden);

    expect(visible.length).toBeGreaterThan(1);
    for (const label of visible) {
      expect(label.rect).not.toBeNull();
      expect(label.rect!.x).toBeGreaterThanOrEqual(0);
      expect(label.rect!.y).toBeGreaterThanOrEqual(0);
      expect(label.rect!.x + label.rect!.width).toBeLessThanOrEqual(260);
      expect(label.rect!.y + label.rect!.height).toBeLessThanOrEqual(220);
    }

    for (let leftIndex = 0; leftIndex < visible.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < visible.length; rightIndex += 1) {
        expect(
          doChartLabelRectsIntersect(visible[leftIndex]!.rect!, visible[rightIndex]!.rect!, 3),
        ).toBe(false);
      }
    }
  });

  test("exposes accessible names for core controls", () => {
    render(
      <>
        <ChartRangeSelector
          ranges={[
            { domain: [0, 10], id: "short", label: "Short" },
            { domain: [0, 100], id: "long", label: "Long" },
          ]}
          value="short"
          onValueChange={vi.fn()}
        />
        <ChartValueModeSelector value="average" onValueChange={vi.fn()} />
      </>,
    );

    expect(screen.getByRole("radiogroup", { name: "Chart range" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Short/ })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Chart value mode" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Average" })).toBeTruthy();
  });

  test("keeps y-axis range validation in the dialog and retains an editable field", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <LineChart
        width={400}
        height={260}
        data={[
          { average: 20, label: "A" },
          { average: 80, label: "B" },
        ]}
      >
        <YAxis width={60} />
        <Line dataKey="average" dot={false} isAnimationActive={false} />
        <ChartYAxisRangeMenu dataDomain={[20, 80]} onValueChange={onValueChange} value={null} />
      </LineChart>,
    );
    const trigger = container.querySelector("[data-chart-y-axis-range-trigger]");

    expect(trigger).toBeTruthy();
    fireEvent.contextMenu(trigger!);
    fireEvent.change(screen.getByLabelText("Min"), { target: { value: "90" } });
    fireEvent.change(screen.getByLabelText("Max"), { target: { value: "80" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByText("Max must be greater than min.")).toBeTruthy();
    expect(screen.getByLabelText("Max")).toBeTruthy();
  });

  test("runs a large deterministic density query within a CI-safe budget without mutating input", () => {
    const points = createLargeDeterministicPoints(20_000);
    const snapshot = structuredClone(points);
    const index = createChartDensityIndex(points, { backend: "hybrid-js" });
    const startedAt = performance.now();
    const series = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 240,
      valueMode: "average",
      xDomain: [0, 19_999],
    });
    const elapsedMs = performance.now() - startedAt;

    expect(series.samples).toHaveLength(240);
    expect(series.summary.pointCount).toBe(20_000);
    expect(elapsedMs).toBeLessThan(1_500);
    expect(points).toEqual(snapshot);
  });

  test("keeps telemetry fixture deterministic", () => {
    expect(createTelemetryPoints()).toEqual(createTelemetryPoints());
  });
});

import { afterEach, describe, expect, test } from "vitest";

import { createChartDensityIndex } from "./density";
import { disableChartWasm, enableChartWasm, isChartWasmEnabled } from "./wasm-runtime";

afterEach(() => disableChartWasm());

describe("owned chart WASM kernel", () => {
  test("accelerates basic binning without changing chart semantics", () => {
    if (!enableChartWasm()) {
      return;
    }

    expect(isChartWasmEnabled()).toBe(true);

    const points = Array.from({ length: 512 }, (_, index) => ({
      id: `point-${index}`,
      metrics: { count: 1, revenue: index % 17 },
      x: (index * 37) % 512,
      y: Math.sin(index / 9) * 20,
    }));
    const hybrid = createChartDensityIndex(points, { backend: "hybrid-js" });
    const wasm = createChartDensityIndex(points, { backend: "wasm-index" });
    const query = {
      includeEmptyBins: true,
      targetBinCount: 32,
      valueMode: "average" as const,
      xDomain: [0, 511] as [number, number],
    };

    expect(wasm.getBackendCapabilities?.()).toMatchObject({
      backend: "wasm-index",
      usesWasm: true,
    });
    expect(wasm.getChartSeries(query)).toEqual(hybrid.getChartSeries(query));
  });
});

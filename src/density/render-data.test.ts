import { describe, expect, test } from "vitest";

import { createChartRenderData, createGroupedChartRenderData } from "./render-data";

import type { ChartDerivedPoint } from "../analytics";
import type { ChartDensitySample, ChartGroupedDensitySeries } from "./types";

function sample(index: number, y: number | null) {
  return { index, pointCount: 1, x: index, x0: index, x1: index + 1, y } as ChartDensitySample;
}

describe("indexed render-data lookups", () => {
  test("derived point arrays resolve to the first point per index, or null", () => {
    const { rows } = createChartRenderData([sample(0, 1), sample(1, 2), sample(2, 3)], {
      derived: {
        fn: (item) => (item.y ?? 0) * 10,
        points: [
          { index: 1, value: null },
          { index: 1, value: 99 },
          { index: 0, value: 5 },
        ] as ChartDerivedPoint[],
      },
    });

    expect(rows.map((row) => [row.points, row.fn])).toEqual([
      [5, 10],
      [null, 20],
      [null, 30],
    ]);
  });

  test("grouped rows use the first sample per index and null for missing samples", () => {
    const grouped = {
      groups: [
        { key: "a", series: { samples: [sample(0, 1), sample(1, 3)] } },
        { key: "b", series: { samples: [sample(1, 1), sample(1, 100)] } },
      ],
    } as unknown as ChartGroupedDensitySeries;

    const { rows } = createGroupedChartRenderData(grouped, { keyPrefix: "g_" });

    expect(rows.map((row) => [row.g_a, row.g_b, row.total])).toEqual([
      [1, null, 1],
      [3, 1, 4],
    ]);
  });
});

import { describe, expect, test } from "vitest";

import { createChartBinTransform, createChartContours } from "./transforms";

describe("chart transforms", () => {
  test("bins generic data with deterministic boundary semantics", () => {
    const source = [
      { id: "zero", value: 0 },
      { id: "one", value: 1 },
      { id: "two", value: 2 },
      { id: "three", value: 3 },
      { id: "four", value: 4 },
      { id: "invalid", value: Number.NaN },
    ];
    const transformed = createChartBinTransform(source, {
      binCount: 2,
      domain: [4, 0],
      value: (datum) => datum.value,
    });

    expect(transformed.summary).toEqual({
      binCount: 2,
      binnedItemCount: 5,
      requestedBinCount: 2,
      sourceItemCount: 6,
      valueDomain: [0, 4],
    });
    expect(transformed.bins.map((bin) => [bin.x0, bin.x1, bin.count])).toEqual([
      [0, 2, 2],
      [2, 4, 3],
    ]);
    expect(transformed.bins[1]!.items.map((item) => item.id)).toEqual(["two", "three", "four"]);
  });

  test("can omit empty bins without changing requested bin geometry", () => {
    const transformed = createChartBinTransform([0, 10], {
      binCount: 4,
      domain: [0, 10],
      includeEmptyBins: false,
      value: (value) => value,
    });

    expect(transformed.summary.binCount).toBe(2);
    expect(transformed.summary.requestedBinCount).toBe(4);
    expect(transformed.bins.map((bin) => bin.index)).toEqual([0, 3]);
    expect(transformed.bins.map((bin) => [bin.x0, bin.x1])).toEqual([
      [0, 2.5],
      [7.5, 10],
    ]);
  });

  test("handles degenerate bin domains without duplicate assignment", () => {
    const transformed = createChartBinTransform([2, 2, 3], {
      binCount: 3,
      domain: [2, 2],
      value: (value) => value,
    });

    expect(transformed.summary.binnedItemCount).toBe(2);
    expect(transformed.bins.map((bin) => bin.count)).toEqual([2, 0, 0]);
    expect(transformed.bins.every((bin) => bin.x0 === 2 && bin.x1 === 2)).toBe(true);
  });

  test("extracts and stitches a contour across adjacent cells", () => {
    const [contour] = createChartContours(
      {
        values: [0, 0, 0, 1, 1, 1],
        xCount: 3,
        xDomain: [10, 30],
        yCount: 2,
        yDomain: [100, 200],
      },
      { thresholds: [0.5] },
    );

    expect(contour).toEqual({
      lines: [
        {
          closed: false,
          points: [
            { x: 10, y: 150 },
            { x: 20, y: 150 },
            { x: 30, y: 150 },
          ],
        },
      ],
      threshold: 0.5,
    });
  });

  test("uses the cell center to resolve ambiguous marching-squares cells", () => {
    const [contour] = createChartContours(
      {
        values: [1, 0, 0, 1],
        xCount: 2,
        yCount: 2,
      },
      { thresholds: [0.5] },
    );

    expect(contour!.lines).toHaveLength(2);
    expect(contour!.lines.every((line) => line.closed === false)).toBe(true);
    expect(contour!.lines.map((line) => line.points)).toEqual([
      [
        { x: 0.5, y: 0 },
        { x: 1, y: 0.5 },
      ],
      [
        { x: 0.5, y: 1 },
        { x: 0, y: 0.5 },
      ],
    ]);
  });

  test("normalizes contour thresholds and rejects malformed grids", () => {
    const contours = createChartContours(
      {
        values: [0, 1, 0, 1],
        xCount: 2,
        yCount: 2,
      },
      { thresholds: [0.75, Number.NaN, 0.25, 0.75] },
    );

    expect(contours.map((contour) => contour.threshold)).toEqual([0.25, 0.75]);
    expect(() =>
      createChartContours(
        {
          values: [0, 1, 2],
          xCount: 2,
          yCount: 2,
        },
        { thresholds: [1] },
      ),
    ).toThrow("values must contain exactly 4 entries");
  });
});

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

  test("bins the full finite numeric range without overflowing geometry", () => {
    const transformed = createChartBinTransform([-Number.MAX_VALUE, 0, Number.MAX_VALUE], {
      binCount: 2,
      domain: [-Number.MAX_VALUE, Number.MAX_VALUE],
      value: (value) => value,
    });

    expect(transformed.summary.binnedItemCount).toBe(3);
    expect(transformed.bins.map((bin) => bin.count)).toEqual([1, 2]);
    expect(transformed.bins.map((bin) => [bin.x0, bin.x1])).toEqual([
      [-Number.MAX_VALUE, 0],
      [0, Number.MAX_VALUE],
    ]);
    expect(transformed.bins.every((bin) => Number.isFinite(bin.x))).toBe(true);
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

  test("stitches an open contour from a component endpoint", () => {
    const values = Array.from({ length: 25 }, (_, index) => {
      const x = index % 5;
      const y = Math.floor(index / 5);
      return (x - 2) ** 2 + (y - 4) ** 2;
    });
    const [contour] = createChartContours(
      {
        values,
        xCount: 5,
        yCount: 5,
      },
      { thresholds: [2.25] },
    );

    expect(contour!.lines).toHaveLength(1);
    const line = contour!.lines[0]!;
    expect(line.closed).toBe(false);
    expect(line.points.length).toBeGreaterThan(2);
    expect(line.points[0]!.y).toBe(4);
    expect(line.points.at(-1)!.y).toBe(4);
  });

  test("preserves distinct contour endpoints at large coordinate offsets", () => {
    const [contour] = createChartContours(
      {
        values: [0, 0, 1, 1],
        xCount: 2,
        xDomain: [1e15, 1e15 + 1],
        yCount: 2,
      },
      { thresholds: [0.5] },
    );

    expect(contour!.lines).toHaveLength(1);
    const line = contour!.lines[0]!;
    expect(line.closed).toBe(false);
    expect(line.points.map((point) => point.x).sort((left, right) => left - right)).toEqual([
      1e15,
      1e15 + 1,
    ]);
    expect(line.points.every((point) => point.y === 0.5)).toBe(true);
  });

  test("maps the full finite contour domain without overflowing coordinates", () => {
    const [contour] = createChartContours(
      {
        values: [0, 0, 1, 1],
        xCount: 2,
        xDomain: [-Number.MAX_VALUE, Number.MAX_VALUE],
        yCount: 2,
      },
      { thresholds: [0.5] },
    );

    expect(contour!.lines).toHaveLength(1);
    const line = contour!.lines[0]!;
    expect(line.points.map((point) => point.x).sort((left, right) => left - right)).toEqual([
      -Number.MAX_VALUE,
      Number.MAX_VALUE,
    ]);
    expect(line.points.every((point) => Number.isFinite(point.x) && point.y === 0.5)).toBe(true);
  });

  test("interpolates contours across the full finite scalar range", () => {
    const [contour] = createChartContours(
      {
        values: [-Number.MAX_VALUE, -Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE],
        xCount: 2,
        yCount: 2,
      },
      { thresholds: [0] },
    );

    expect(contour!.lines).toHaveLength(1);
    expect(contour!.lines[0]!.points).toEqual([
      { x: 0, y: 0.5 },
      { x: 1, y: 0.5 },
    ]);
  });

  test("filters zero-length segments at exact-threshold vertices", () => {
    const [contour] = createChartContours(
      {
        values: [-2, -1, 0, -1, 0, 1, 0, 1, 2],
        xCount: 3,
        yCount: 3,
      },
      { thresholds: [0] },
    );

    expect(contour!.lines).toHaveLength(1);
    const points = contour!.lines[0]!.points;
    expect(points).toHaveLength(3);
    expect(new Set(points.map((point) => `${point.x},${point.y}`)).size).toBe(3);
    expect(points).toContainEqual({ x: 1, y: 1 });
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

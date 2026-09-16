import { describe, expect, test } from "vitest";

import { createChartStackTransform } from "./stack";

describe("createChartStackTransform", () => {
  test("uses explicit series order and evaluates each requested value exactly once", () => {
    const source = [
      { alpha: 1, beta: 2, id: "first" },
      { alpha: 3, beta: 4, id: "second" },
    ];
    const calls: string[] = [];
    const transformed = createChartStackTransform(source, {
      keys: ["alpha", "beta"] as const,
      order: ["beta", "alpha"] as const,
      value: (datum, key, datumIndex) => {
        calls.push(`${datumIndex}:${key}`);
        return datum[key];
      },
    });

    expect(calls).toEqual(["0:beta", "0:alpha", "1:beta", "1:alpha"]);
    expect(transformed.domain).toEqual([0, 7]);
    expect(transformed.series.map((series) => series.key)).toEqual(["beta", "alpha"]);
    expect(
      transformed.series.map((series) =>
        series.points.map((point) => [point.start, point.end, point.value]),
      ),
    ).toEqual([
      [
        [0, 2, 2],
        [0, 4, 4],
      ],
      [
        [2, 3, 1],
        [4, 7, 3],
      ],
    ]);
    expect(transformed.series[0]!.points[0]!.datum).toBe(source[0]);
  });

  test("separates positive and negative values with the default diverging offset", () => {
    const [datum] = [{ debit: -2, fee: -1, income: 5, taxCredit: 3 }];
    const transformed = createChartStackTransform([datum], {
      keys: ["income", "debit", "taxCredit", "fee"] as const,
      value: (row, key) => row[key],
    });

    expect(transformed.domain).toEqual([-3, 8]);
    expect(transformed.series.map((series) => series.points[0])).toEqual([
      expect.objectContaining({ start: 0, end: 5, value: 5 }),
      expect.objectContaining({ start: -2, end: 0, value: -2 }),
      expect.objectContaining({ start: 5, end: 8, value: 3 }),
      expect.objectContaining({ start: -3, end: -2, value: -1 }),
    ]);
  });

  test("supports zero offset when cumulative signed stacking is explicitly requested", () => {
    const transformed = createChartStackTransform([{ first: 3, second: -5, third: 4 }], {
      keys: ["first", "second", "third"] as const,
      offset: "zero",
      value: (datum, key) => datum[key],
    });

    expect(transformed.domain).toEqual([-2, 3]);
    expect(transformed.series.map((series) => series.points[0])).toEqual([
      expect.objectContaining({ start: 0, end: 3 }),
      expect.objectContaining({ start: 3, end: -2 }),
      expect.objectContaining({ start: -2, end: 2 }),
    ]);
  });

  test("preserves missing values as undefined zero-width stack points", () => {
    const transformed = createChartStackTransform([{ alpha: null, beta: 2 }], {
      keys: ["alpha", "beta"] as const,
      value: (datum, key) => datum[key],
    });

    expect(transformed.series[0]!.points[0]).toEqual({
      datum: { alpha: null, beta: 2 },
      datumIndex: 0,
      defined: false,
      end: 0,
      start: 0,
      value: 0,
    });
    expect(transformed.series[1]!.points[0]).toEqual(
      expect.objectContaining({ defined: true, start: 0, end: 2, value: 2 }),
    );
  });

  test("rejects malformed configuration and non-finite values", () => {
    expect(() =>
      createChartStackTransform([{ a: 1 }], {
        keys: ["a", "a"],
        value: (datum) => datum.a,
      }),
    ).toThrow("keys must not contain duplicate keys");

    expect(() =>
      createChartStackTransform([{ a: 1, b: 2 }], {
        keys: ["a", "b"] as const,
        order: ["a"] as const,
        value: (datum, key) => datum[key],
      }),
    ).toThrow("order must contain every stack key exactly once");

    expect(() =>
      createChartStackTransform([{ a: 1 }], {
        keys: ["a"] as const,
        offset: "center" as never,
        value: (datum) => datum.a,
      }),
    ).toThrow('offset must be "diverging" or "zero"');

    expect(() =>
      createChartStackTransform([{ a: Number.NaN }], {
        keys: ["a"] as const,
        value: (datum) => datum.a,
      }),
    ).toThrow('stack value for key "a" at datum 0 must be finite');

    expect(() =>
      createChartStackTransform([{ a: Number.MAX_VALUE, b: Number.MAX_VALUE }], {
        keys: ["a", "b"] as const,
        value: (datum, key) => datum[key],
      }),
    ).toThrow('stack boundary for key "b" at datum 0 must be finite');
  });
});

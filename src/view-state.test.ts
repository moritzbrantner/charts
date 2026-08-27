import { describe, expect, test } from "vitest";

import { decodeChartViewState, encodeChartViewState } from "./view-state";

describe("chart view state", () => {
  test("round-trips durable shareable state deterministically", () => {
    const encoded = encodeChartViewState({
      domain: [10, 20],
      hiddenSeries: ["beta", "alpha", "alpha"],
      selectedSampleIndex: 4,
      valueMode: "average",
    });

    expect(encoded).toBe("domain=10%2C20&hidden=alpha%2Cbeta&sample=4&mode=average");
    expect(decodeChartViewState(encoded)).toEqual({
      domain: [10, 20],
      hiddenSeries: ["alpha", "beta"],
      selectedSampleIndex: 4,
      valueMode: "average",
    });
  });

  test("ignores invalid URL state", () => {
    expect(decodeChartViewState("domain=20,10&sample=-2&mode=wat")).toEqual({});
  });
});

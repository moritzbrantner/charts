import { describe, expect, test } from "vitest";

import { decodeChartViewState, encodeChartViewState } from "./view-state";

describe("chart view state", () => {
  test("round-trips durable shareable state", () => {
    const encoded = encodeChartViewState({
      domain: [20, 80],
      hiddenSeriesIds: ["revenue", "cost", "revenue"],
      selectedPointId: "point-42",
      valueMode: "p50",
    });

    expect(decodeChartViewState(encoded)).toEqual({
      domain: [20, 80],
      hiddenSeriesIds: ["cost", "revenue"],
      selectedPointId: "point-42",
      valueMode: "p50",
    });
  });

  test("ignores malformed state instead of inventing values", () => {
    expect(decodeChartViewState("chart.domain=a,b&chart.value=median&chart.hidden=,,")).toEqual({});
  });
});

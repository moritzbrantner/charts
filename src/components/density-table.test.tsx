import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ChartDensityTable } from "./density-table";

const sample = {
  averageY: 2,
  firstPoint: null,
  index: 0,
  lastPoint: null,
  maxY: 3,
  metrics: {},
  minY: 1,
  p10: null,
  p25: null,
  p50: null,
  p75: null,
  p90: null,
  p95: null,
  p99: null,
  pointCount: 2,
  sumY: 4,
  x: 10,
  x0: 9,
  x1: 11,
  y: 2,
};

describe("ChartDensityTable", () => {
  test("exposes chart values through semantic table structure", () => {
    render(<ChartDensityTable samples={[sample]} />);

    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByText("Chart values")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Average" })).toBeTruthy();
    expect(screen.getAllByRole("cell", { name: "2" })).toHaveLength(2);
  });
});

import { render, screen } from "@testing-library/react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { describe, expect, test } from "vitest";

import {
  ChartLabelOverlay,
  doChartLabelRectsIntersect,
  layoutChartLabels,
} from "@moritzbrantner/charts";

describe("chart label layout", () => {
  test("places a single label inside the boundary", () => {
    const [label] = layoutChartLabels(
      [
        {
          anchor: { x: 100, y: 100 },
          id: "release",
          text: "Release",
        },
      ],
      {
        boundary: { height: 200, width: 200, x: 0, y: 0 },
      },
    );

    expect(label?.hidden).toBe(false);
    expect(label?.placement).toBe("top");
    expect(label?.rect?.x).toBeGreaterThanOrEqual(0);
    expect(label?.rect?.y).toBeGreaterThanOrEqual(0);
  });

  test("wraps long text into multiple measured lines", () => {
    const [label] = layoutChartLabels(
      [
        {
          anchor: { x: 150, y: 150 },
          id: "long",
          text: "Campaign pulse lifted enterprise traffic",
        },
      ],
      {
        boundary: { height: 300, width: 300, x: 0, y: 0 },
        maxWidth: 72,
      },
    );

    expect(label?.hidden).toBe(false);
    expect(label?.lines.length).toBeGreaterThan(1);
  });

  test("rejects candidates that overlap obstacles", () => {
    const [label] = layoutChartLabels(
      [
        {
          anchor: { x: 100, y: 100 },
          id: "blocked-top",
          placements: ["top", "bottom"],
          text: "Blocked",
        },
      ],
      {
        boundary: { height: 220, width: 220, x: 0, y: 0 },
        obstacles: [
          {
            rect: { height: 34, width: 80, x: 60, y: 62 },
          },
        ],
      },
    );

    expect(label?.hidden).toBe(false);
    expect(label?.placement).toBe("bottom");
  });

  test("rejects candidates that overlap already placed labels", () => {
    const labels = layoutChartLabels(
      [
        {
          anchor: { x: 100, y: 100 },
          id: "first",
          placements: ["top"],
          text: "First",
        },
        {
          anchor: { x: 100, y: 100 },
          id: "second",
          placements: ["top"],
          text: "Second",
        },
      ],
      {
        boundary: { height: 220, width: 220, x: 0, y: 0 },
      },
    );

    expect(labels[0]?.hidden).toBe(false);
    expect(labels[1]?.hidden).toBe(true);
  });

  test("places higher-priority labels first", () => {
    const labels = layoutChartLabels(
      [
        {
          anchor: { x: 100, y: 100 },
          id: "low",
          placements: ["top"],
          priority: 1,
          text: "Low",
        },
        {
          anchor: { x: 100, y: 100 },
          id: "high",
          placements: ["top"],
          priority: 100,
          text: "High",
        },
      ],
      {
        boundary: { height: 220, width: 220, x: 0, y: 0 },
      },
    );

    expect(labels[0]?.hidden).toBe(true);
    expect(labels[1]?.hidden).toBe(false);
  });

  test("hides labels when all valid placements are blocked", () => {
    const [label] = layoutChartLabels(
      [
        {
          anchor: { x: 100, y: 100 },
          id: "blocked",
          placements: ["top"],
          text: "Blocked",
        },
      ],
      {
        boundary: { height: 220, width: 220, x: 0, y: 0 },
        obstacles: [
          {
            rect: { height: 40, width: 100, x: 50, y: 55 },
          },
        ],
      },
    );

    expect(label?.hidden).toBe(true);
    expect(label?.rect).toBeNull();
  });

  test("rejects leader lines that cross obstacles", () => {
    const [label] = layoutChartLabels(
      [
        {
          anchor: { x: 100, y: 100 },
          id: "leader-crossing",
          placements: ["top-right"],
          text: "Crossing",
        },
      ],
      {
        boundary: { height: 220, width: 220, x: 0, y: 0 },
        leaderLine: "always",
        obstacles: [
          {
            rect: { height: 8, width: 8, x: 102, y: 90 },
          },
        ],
      },
    );

    expect(label?.hidden).toBe(true);
  });

  test("respects custom placement order", () => {
    const [label] = layoutChartLabels(
      [
        {
          anchor: { x: 100, y: 100 },
          id: "ordered",
          placements: ["bottom", "top"],
          text: "Ordered",
        },
      ],
      {
        boundary: { height: 220, width: 220, x: 0, y: 0 },
      },
    );

    expect(label?.placement).toBe("bottom");
  });

  test("respects leader line modes", () => {
    const baseLabel = {
      anchor: { x: 100, y: 100 },
      id: "leader",
      placements: ["top-right"] as const,
      text: "Leader",
    };
    const options = {
      boundary: { height: 220, width: 220, x: 0, y: 0 },
    };

    const [withoutLeader] = layoutChartLabels([baseLabel], {
      ...options,
      leaderLine: "never",
    });
    const [autoLeader] = layoutChartLabels([baseLabel], {
      ...options,
      leaderLine: "auto",
    });
    const [forcedLeader] = layoutChartLabels(
      [
        {
          ...baseLabel,
          placements: ["top"] as const,
        },
      ],
      {
        ...options,
        leaderLine: "always",
      },
    );

    expect(withoutLeader?.leaderLine).toBeNull();
    expect(autoLeader?.leaderLine).not.toBeNull();
    expect(forcedLeader?.leaderLine).not.toBeNull();
  });

  test("checks padded rect intersections", () => {
    expect(
      doChartLabelRectsIntersect(
        { height: 10, width: 10, x: 0, y: 0 },
        { height: 10, width: 10, x: 12, y: 0 },
        1,
      ),
    ).toBe(false);
    expect(
      doChartLabelRectsIntersect(
        { height: 10, width: 10, x: 0, y: 0 },
        { height: 10, width: 10, x: 12, y: 0 },
        3,
      ),
    ).toBe(true);
  });
});

describe("ChartLabelOverlay", () => {
  test("renders visible SVG labels in a Recharts chart", () => {
    render(
      <LineChart
        width={400}
        height={260}
        data={[
          { label: "A", value: 20 },
          { label: "B", value: 80 },
          { label: "C", value: 40 },
        ]}
        margin={{ bottom: 20, left: 20, right: 20, top: 20 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" />
        <YAxis />
        <Line dataKey="value" dot={false} isAnimationActive={false} />
        <ChartLabelOverlay
          labels={[
            {
              id: "peak",
              priority: 10,
              text: "Peak",
              x: "B",
              y: 80,
            },
          ]}
        />
      </LineChart>,
    );

    expect(screen.getByText("Peak")).toBeTruthy();
    expect(screen.getByText("Peak").closest("g")?.getAttribute("data-chart-label-id")).toBe("peak");
  });

  test("does not render hidden labels", () => {
    render(
      <LineChart
        width={320}
        height={220}
        data={[
          { label: "A", value: 20 },
          { label: "B", value: 80 },
        ]}
        margin={{ bottom: 20, left: 20, right: 20, top: 20 }}
      >
        <XAxis dataKey="label" />
        <YAxis />
        <Line dataKey="value" dot={false} isAnimationActive={false} />
        <ChartLabelOverlay
          labels={[
            {
              id: "hidden",
              placements: ["top"],
              text: "Hidden label",
              x: "B",
              y: 80,
            },
          ]}
          pixelObstacles={[{ rect: { height: 220, width: 320, x: 0, y: 0 } }]}
        />
      </LineChart>,
    );

    expect(screen.queryByText("Hidden label")).toBeNull();
  });

  test("combines data obstacles, pixel obstacles, and keeps pointer events disabled", () => {
    const { container } = render(
      <LineChart
        width={420}
        height={260}
        data={[
          { label: "A", value: 20 },
          { label: "B", value: 80 },
          { label: "C", value: 40 },
        ]}
        margin={{ bottom: 20, left: 20, right: 20, top: 20 }}
      >
        <XAxis dataKey="label" />
        <YAxis />
        <Line dataKey="value" dot={false} isAnimationActive={false} />
        <ChartLabelOverlay
          labels={[
            {
              id: "shifted",
              placements: ["top", "bottom"],
              text: "Shifted",
              x: "B",
              y: 80,
            },
          ]}
          obstacles={[{ x: "B", y: 80, radius: 4 }]}
          pixelObstacles={[{ rect: { height: 20, width: 20, x: 0, y: 0 } }]}
        />
      </LineChart>,
    );

    const overlay = container.querySelector("g[pointer-events='none']");

    expect(screen.getByText("Shifted")).toBeTruthy();
    expect(overlay).toBeTruthy();
  });

  test("supports custom label rendering", () => {
    render(
      <LineChart
        width={360}
        height={220}
        data={[
          { label: "A", value: 20 },
          { label: "B", value: 80 },
        ]}
        margin={{ bottom: 20, left: 20, right: 20, top: 20 }}
      >
        <XAxis dataKey="label" />
        <YAxis />
        <Line dataKey="value" dot={false} isAnimationActive={false} />
        <ChartLabelOverlay
          labels={[{ id: "custom", text: "Custom", x: "B", y: 80 }]}
          renderLabel={(label) =>
            label.rect ? (
              <text x={label.rect.x} y={label.rect.y}>
                Custom renderer
              </text>
            ) : null
          }
        />
      </LineChart>,
    );

    expect(screen.getByText("Custom renderer")).toBeTruthy();
  });
});

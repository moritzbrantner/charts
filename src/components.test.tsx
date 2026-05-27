import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { Line, LineChart } from "recharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  BinnedChart,
  ChartAnomalyMarkerList,
  ChartBackendStatus,
  ChartDerivedMetricCard,
  ChartDomainMinimap,
  ChartRangeSelector,
  ChartSampleSparkline,
  ChartThresholdMarker,
  ChartValueModeSelector,
  createChartDensityIndex,
  getChartAnomalyAnnotations,
  getChartThresholdAnnotations,
  getChartValueModeDefinitions,
  getChartSampleYBounds,
  measureChartSeries,
  useChartBinCount,
  useChartWheelDomain,
} from "@moritzbrantner/charts";

describe("@moritzbrantner/charts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders default value modes and selects a mode", () => {
    const onValueChange = vi.fn();

    render(<ChartValueModeSelector value="average" onValueChange={onValueChange} />);

    for (const mode of ["Average", "Count", "Maximum", "Minimum", "Sum"]) {
      expect(screen.getByRole("radio", { name: mode })).toBeTruthy();
    }

    expect(screen.getByRole("radio", { name: "Average" }).getAttribute("aria-checked")).toBe(
      "true",
    );

    fireEvent.click(screen.getByRole("radio", { name: "Count" }));

    expect(onValueChange).toHaveBeenCalledWith("count");
  });

  test("renders selected value mode definitions", () => {
    render(
      <ChartValueModeSelector
        value="min"
        definitions={getChartValueModeDefinitions(["min", "max"])}
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: "Minimum" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Average" })).toBeNull();
  });

  test("renders chart ranges and selects a range", () => {
    const onValueChange = vi.fn();

    render(
      <ChartRangeSelector
        value="day"
        formatDomain={(domain) => `${domain[0]} to ${domain[1]}`}
        onValueChange={onValueChange}
        ranges={[
          {
            description: "Full source domain.",
            domain: [0, 24],
            id: "day",
            label: "Day",
          },
          {
            description: "Focused source domain.",
            domain: [8, 12],
            id: "focus",
            label: "Focus",
          },
        ]}
      />,
    );

    expect(screen.getByRole("radiogroup", { name: "Chart range" })).toBeTruthy();
    expect(screen.getByText("Day")).toBeTruthy();
    expect(screen.getByText("0 to 24")).toBeTruthy();
    expect(screen.getByText("Focused source domain.")).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Day/ }).getAttribute("aria-checked")).toBe("true");

    fireEvent.click(screen.getByRole("radio", { name: /Focus/ }));

    expect(onValueChange).toHaveBeenCalledWith("focus");
  });

  test("renders derived metric deltas", () => {
    render(<ChartDerivedMetricCard label="Revenue delta" value={120} previousValue={100} />);

    expect(screen.getByText("Revenue delta")).toBeTruthy();
    expect(screen.getByText("120")).toBeTruthy();
    expect(screen.getByText(/\+20/)).toBeTruthy();
    expect(screen.getByText(/\+20.0%/)).toBeTruthy();
  });

  test("renders threshold ranges", () => {
    const index = createChartDensityIndex([
      { id: "a", x: 0.5, y: 1 },
      { id: "b", x: 1.5, y: 6 },
      { id: "c", x: 2.5, y: 8 },
    ]);
    const samples = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 3,
      xDomain: [0, 3],
    }).samples;
    const annotations = getChartThresholdAnnotations(samples, 5);

    render(
      <ChartThresholdMarker
        annotations={annotations}
        formatLabel={(annotation) => `${annotation.startIndex} to ${annotation.endIndex}`}
      />,
    );

    expect(screen.getByText("1 to 2")).toBeTruthy();
    expect(screen.getByText(/2 samples above 5/)).toBeTruthy();
  });

  test("renders anomaly markers and selects an anomaly", () => {
    const onSelect = vi.fn();
    const index = createChartDensityIndex(
      [...Array.from({ length: 20 }, (_, pointIndex) => 10), 1_000].map((y, pointIndex) => ({
        id: `point-${pointIndex}`,
        x: pointIndex + 0.5,
        y,
      })),
    );
    const samples = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 21,
      xDomain: [0, 21],
    }).samples;
    const anomalies = getChartAnomalyAnnotations(samples);

    render(<ChartAnomalyMarkerList anomalies={anomalies} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /Sample 20/ }));

    expect(screen.getByText(/score/)).toBeTruthy();
    expect(onSelect).toHaveBeenCalledWith(anomalies[0]);
  });

  test("renders backend status states and handles warmup", () => {
    const onWarmNow = vi.fn();
    const { rerender } = render(
      <ChartBackendStatus
        onWarmNow={onWarmNow}
        status={{
          activeBackend: "hybrid-js",
          isWarming: false,
          wasmError: null,
          wasmReady: false,
        }}
      />,
    );

    expect(screen.getByText("hybrid-js")).toBeTruthy();
    expect(screen.getByText("scheduled")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Warm WASM now" }));

    expect(onWarmNow).toHaveBeenCalledTimes(1);

    rerender(
      <ChartBackendStatus
        onWarmNow={onWarmNow}
        status={{
          activeBackend: "hybrid-js",
          isWarming: true,
          wasmError: null,
          wasmReady: false,
        }}
      />,
    );

    expect(screen.getByText("warming")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Warm WASM now" }).hasAttribute("disabled")).toBe(
      true,
    );

    rerender(
      <ChartBackendStatus
        status={{
          activeBackend: "wasm-index",
          isWarming: false,
          wasmError: null,
          wasmReady: true,
        }}
      />,
    );

    expect(screen.getByText("wasm-index")).toBeTruthy();
    expect(screen.getByText("ready")).toBeTruthy();
  });

  test("renders backend fallback status and formats errors", () => {
    render(
      <ChartBackendStatus
        formatError={(error) => `Fallback reason: ${String(error)}`}
        status={{
          activeBackend: "hybrid-js",
          isWarming: false,
          wasmError: "load failed",
          wasmReady: false,
        }}
      />,
    );

    expect(screen.getByText("fallback")).toBeTruthy();
    expect(screen.getByText("Fallback reason: load failed")).toBeTruthy();
  });

  test("composes binned chart rows with an optional minimap", () => {
    const onDomainChange = vi.fn();
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 2 },
      { id: "b", x: 5, y: 12 },
      { id: "c", x: 10, y: 4 },
    ]);

    render(
      <BinnedChart
        chartClassName="h-40 w-full"
        config={{ average: { color: "var(--chart-1)", label: "Average" } }}
        domain={[0, 10]}
        fullDomain={[0, 20]}
        index={index}
        onDomainChange={onDomainChange}
        renderDataOptions={{ modes: ["average"] }}
      >
        {({ rows, targetBinCount }) => (
          <LineChart data={rows}>
            <Line dataKey="average" name={`Average ${targetBinCount}`} />
          </LineChart>
        )}
      </BinnedChart>,
    );

    expect(screen.getByRole("img", { name: "Chart domain minimap" })).toBeTruthy();
    expect(screen.getByText("0-10")).toBeTruthy();
  });

  test("renders sparkline samples and clamps SVG points", () => {
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 2 },
      { id: "b", x: 5, y: 12 },
      { id: "c", x: 10, y: 4 },
    ]);
    const series = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 3,
      xDomain: [0, 10],
    });
    const { container } = render(<ChartSampleSparkline samples={series.samples} domain={[2, 8]} />);

    expect(screen.getByRole("img", { name: "Dense chart sparkline" })).toBeTruthy();

    const line = container.querySelector("polyline[stroke='var(--primary)']");
    const points = line?.getAttribute("points") ?? "";

    for (const pair of points.split(" ")) {
      const [x, y] = pair.split(",").map(Number);

      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(8);
      expect(y).toBeLessThanOrEqual(92);
    }
  });

  test("selects and hovers sparkline samples", () => {
    const onSampleHover = vi.fn();
    const onSampleSelect = vi.fn();
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 2 },
      { id: "b", x: 5, y: 12 },
      { id: "c", x: 10, y: 4 },
    ]);
    const series = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 3,
      xDomain: [0, 10],
    });
    const { container } = render(
      <ChartSampleSparkline
        samples={series.samples}
        domain={[0, 10]}
        selectedSampleIndex={series.samples[0]?.index}
        onSampleHover={onSampleHover}
        onSampleSelect={onSampleSelect}
      />,
    );
    const svg = screen.getByRole("img", {
      name: "Dense chart sparkline",
    }) as unknown as SVGSVGElement;
    svg.getBoundingClientRect = () =>
      ({
        bottom: 100,
        height: 100,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    fireEvent.pointerMove(svg, { clientX: 0 });
    fireEvent.click(svg, { clientX: 0 });
    fireEvent.pointerLeave(svg);

    expect(onSampleHover).toHaveBeenCalledWith(series.samples[0]);
    expect(onSampleHover).toHaveBeenLastCalledWith(null);
    expect(onSampleSelect).toHaveBeenCalledWith(series.samples[0]);
    expect(container.querySelector("circle")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Sample 1/ }));

    expect(onSampleSelect).toHaveBeenCalledTimes(2);
  });

  test("renders sparkline empty state for empty samples", () => {
    render(<ChartSampleSparkline samples={[]} domain={[0, 1]} />);

    expect(screen.getByText("No chart samples in this viewport.")).toBeTruthy();
  });

  test("renders a minimap and selects a chart domain by dragging", () => {
    const onDomainChange = vi.fn();
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 2 },
      { id: "b", x: 25, y: 12 },
      { id: "c", x: 50, y: 4 },
      { id: "d", x: 75, y: 8 },
      { id: "e", x: 100, y: 6 },
    ]);
    const series = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 5,
      xDomain: [0, 100],
    });
    const { rerender } = render(
      <ChartDomainMinimap
        domain={[20, 40]}
        fullDomain={[0, 100]}
        samples={series.samples}
        onDomainChange={onDomainChange}
      />,
    );
    const minimap = screen.getByRole("img", { name: "Chart domain minimap" });
    minimap.getBoundingClientRect = () =>
      ({
        bottom: 36,
        height: 36,
        left: 0,
        right: 1000,
        top: 0,
        width: 1000,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    expect(screen.getByText("20-40")).toBeTruthy();
    const minimapPoints = minimap.querySelector("polyline")?.getAttribute("points") ?? "";
    const [firstMinimapPoint] = minimapPoints.split(" ");
    const lastMinimapPoint = minimapPoints.split(" ").at(-1);

    expect(minimap.getAttribute("preserveAspectRatio")).toBe("none");
    expect(firstMinimapPoint?.startsWith("0,")).toBe(true);
    expect(lastMinimapPoint?.startsWith("100,")).toBe(true);

    firePointerEvent(minimap, "pointerdown", 100, 1);
    firePointerEvent(minimap, "pointermove", 600, 1);
    firePointerEvent(minimap, "pointerup", 600, 1);

    expect(onDomainChange).toHaveBeenLastCalledWith([10, 60]);

    rerender(
      <ChartDomainMinimap
        domain={[10, 60]}
        fullDomain={[0, 100]}
        samples={series.samples}
        onDomainChange={onDomainChange}
      />,
    );

    firePointerEvent(minimap, "pointerdown", 300, 2);
    firePointerEvent(minimap, "pointermove", 400, 2);
    firePointerEvent(minimap, "pointerup", 400, 2);

    expect(onDomainChange).toHaveBeenLastCalledWith([20, 70]);
  });

  test("previews minimap drag updates without committing until release", () => {
    const onDomainChange = vi.fn();
    let frameCallback: FrameRequestCallback | null = null;

    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frameCallback = callback;

        return 1;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    render(
      <ChartDomainMinimap
        domain={[20, 40]}
        fullDomain={[0, 100]}
        samples={createMinimapSamples()}
        onDomainChange={onDomainChange}
      />,
    );
    const minimap = screen.getByRole("img", { name: "Chart domain minimap" });

    stubMinimapBounds(minimap);

    firePointerEvent(minimap, "pointerdown", 300, 1);
    firePointerEvent(minimap, "pointermove", 400, 1);
    firePointerEvent(minimap, "pointermove", 500, 1);
    firePointerEvent(minimap, "pointermove", 600, 1);

    expect(onDomainChange).not.toHaveBeenCalled();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    act(() => {
      frameCallback?.(16);
    });

    const selectedRect = minimap.querySelectorAll("rect")[3];

    expect(selectedRect?.getAttribute("x")).toBe("50");
    expect(selectedRect?.getAttribute("width")).toBe("20");
    expect(onDomainChange).not.toHaveBeenCalled();

    firePointerEvent(minimap, "pointerup", 600, 1);

    expect(onDomainChange).toHaveBeenCalledTimes(1);
    expect(onDomainChange).toHaveBeenLastCalledWith([50, 70]);
  });

  test("flushes pending minimap drag updates when dragging stops", () => {
    const onDomainChange = vi.fn();
    const cancelAnimationFrameMock = vi.fn();

    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrameMock);

    render(
      <ChartDomainMinimap
        domain={[20, 40]}
        fullDomain={[0, 100]}
        samples={createMinimapSamples()}
        onDomainChange={onDomainChange}
      />,
    );
    const minimap = screen.getByRole("img", { name: "Chart domain minimap" });

    stubMinimapBounds(minimap);

    firePointerEvent(minimap, "pointerdown", 300, 1);
    firePointerEvent(minimap, "pointermove", 500, 1);
    firePointerEvent(minimap, "pointerup", 500, 1);

    expect(cancelAnimationFrameMock).toHaveBeenCalledWith(1);
    expect(onDomainChange).toHaveBeenCalledTimes(1);
    expect(onDomainChange).toHaveBeenLastCalledWith([40, 60]);

    firePointerEvent(minimap, "pointermove", 700, 1);

    expect(onDomainChange).toHaveBeenCalledTimes(1);
  });

  test("flushes and clears pending minimap drag updates on pointer cancel", () => {
    const onDomainChange = vi.fn();

    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    render(
      <ChartDomainMinimap
        domain={[20, 40]}
        fullDomain={[0, 100]}
        samples={createMinimapSamples()}
        onDomainChange={onDomainChange}
      />,
    );
    const minimap = screen.getByRole("img", { name: "Chart domain minimap" });

    stubMinimapBounds(minimap);

    firePointerEvent(minimap, "pointerdown", 300, 1);
    firePointerEvent(minimap, "pointermove", 500, 1);
    firePointerEvent(minimap, "pointercancel", 500, 1);
    firePointerEvent(minimap, "pointermove", 700, 1);

    expect(onDomainChange).toHaveBeenCalledTimes(1);
    expect(onDomainChange).toHaveBeenLastCalledWith([40, 60]);
  });

  test("measures chart queries", () => {
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 2 },
      { id: "b", x: 1, y: 4 },
    ]);
    const measured = measureChartSeries(index, {
      targetBinCount: 1,
      xDomain: [0, 1],
    });

    expect(measured.series.summary.pointCount).toBe(2);
    expect(measured.queryMs).toBeGreaterThanOrEqual(0);
  });

  test("gets visible sample y bounds", () => {
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: -2 },
      { id: "b", x: 1, y: 8 },
    ]);
    const series = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 2,
      xDomain: [0, 2],
    });

    expect(getChartSampleYBounds(series.samples)).toEqual({
      maxY: 8,
      minY: -2,
    });
    expect(getChartSampleYBounds([])).toEqual({
      maxY: null,
      minY: null,
    });
  });

  test("measures responsive chart bin counts and manual overrides", () => {
    let resizeCallback: ResizeObserverCallback | null = null;

    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback;
        }

        observe = vi.fn();
        disconnect = vi.fn();
      },
    );

    const element = document.createElement("div");
    const { result } = renderHook(() => useChartBinCount());

    act(() => {
      result.current.containerRef(element);
    });
    act(() => {
      resizeCallback?.(
        [
          {
            contentRect: { width: 960 },
          } as ResizeObserverEntry,
        ],
        {} as ResizeObserver,
      );
    });

    expect(result.current.targetBinCount).toBe(120);
    expect(result.current.isAuto).toBe(true);

    act(() => {
      result.current.setManualBinCount(999);
    });

    expect(result.current.targetBinCount).toBe(360);
    expect(result.current.isAuto).toBe(false);

    act(() => {
      result.current.resetAuto();
    });

    expect(result.current.targetBinCount).toBe(120);
    expect(result.current.isAuto).toBe(true);
  });

  test("scrolls chart domains with the mouse wheel", () => {
    const onDomainChange = vi.fn();
    let wheelDefaultPrevented = false;

    function WheelChart({ domain }: { domain: [number, number] }) {
      const wheelDomain = useChartWheelDomain<HTMLDivElement>({
        domain,
        fullDomain: [0, 100],
        onDomainChange,
      });

      return (
        <div
          data-testid="wheel-chart"
          onWheel={(event) => {
            wheelDomain.onWheel(event);
            wheelDefaultPrevented = event.isDefaultPrevented();
          }}
        />
      );
    }

    const { rerender } = render(<WheelChart domain={[20, 40]} />);
    const target = screen.getByTestId("wheel-chart");
    target.getBoundingClientRect = () =>
      ({
        bottom: 100,
        height: 100,
        left: 0,
        right: 1000,
        top: 0,
        width: 1000,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    fireEvent.wheel(target, { deltaY: 100 });

    expect(onDomainChange).toHaveBeenCalledWith([22, 42]);
    expect(wheelDefaultPrevented).toBe(true);

    rerender(<WheelChart domain={[85, 95]} />);
    fireEvent.wheel(target, { deltaY: 1000 });

    expect(onDomainChange).toHaveBeenLastCalledWith([90, 100]);

    onDomainChange.mockClear();
    wheelDefaultPrevented = false;
    rerender(<WheelChart domain={[0, 100]} />);
    fireEvent.wheel(target, { deltaY: 100 });

    expect(onDomainChange).not.toHaveBeenCalled();
    expect(wheelDefaultPrevented).toBe(true);
  });

  test("prevents document scrolling from the native chart wheel listener", () => {
    const onDomainChange = vi.fn();

    function WheelChart({ domain }: { domain: [number, number] }) {
      const wheelDomain = useChartWheelDomain<HTMLDivElement>({
        domain,
        fullDomain: [0, 100],
        onDomainChange,
      });

      return <div data-testid="wheel-chart" ref={wheelDomain.containerRef} />;
    }

    render(<WheelChart domain={[20, 40]} />);
    const target = screen.getByTestId("wheel-chart");
    target.getBoundingClientRect = () =>
      ({
        bottom: 100,
        height: 100,
        left: 0,
        right: 1000,
        top: 0,
        width: 1000,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    const wheelEvent = new Event("wheel", { bubbles: true, cancelable: true });
    Object.defineProperties(wheelEvent, {
      clientX: { value: 0 },
      ctrlKey: { value: false },
      deltaMode: { value: 0 },
      deltaX: { value: 0 },
      deltaY: { value: 100 },
      metaKey: { value: false },
    });

    target.dispatchEvent(wheelEvent);

    expect(onDomainChange).toHaveBeenCalledWith([22, 42]);
    expect(wheelEvent.defaultPrevented).toBe(true);
  });

  test("zooms chart domains around the mouse position with ctrl wheel", () => {
    const onDomainChange = vi.fn();
    let wheelDefaultPrevented = false;

    function WheelChart({ domain }: { domain: [number, number] }) {
      const wheelDomain = useChartWheelDomain<HTMLDivElement>({
        domain,
        fullDomain: [0, 100],
        onDomainChange,
      });

      return (
        <div
          data-testid="wheel-chart"
          onWheel={(event) => {
            wheelDomain.onWheel(event);
            wheelDefaultPrevented = event.isDefaultPrevented();
          }}
        />
      );
    }

    const { rerender } = render(<WheelChart domain={[20, 40]} />);
    const target = screen.getByTestId("wheel-chart");
    target.getBoundingClientRect = () =>
      ({
        bottom: 100,
        height: 100,
        left: 0,
        right: 1000,
        top: 0,
        width: 1000,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    fireEvent.wheel(target, {
      clientX: 500,
      ctrlKey: true,
      deltaY: -100,
    });

    expect(wheelDefaultPrevented).toBe(true);
    expect(onDomainChange.mock.lastCall?.[0][0]).toBeCloseTo(21.8127, 4);
    expect(onDomainChange.mock.lastCall?.[0][1]).toBeCloseTo(38.1873, 4);

    rerender(<WheelChart domain={[20, 40]} />);
    wheelDefaultPrevented = false;
    fireEvent.wheel(target, {
      clientX: 500,
      ctrlKey: true,
      deltaY: 100,
    });

    expect(wheelDefaultPrevented).toBe(true);
    expect(onDomainChange.mock.lastCall?.[0][0]).toBeCloseTo(17.786, 4);
    expect(onDomainChange.mock.lastCall?.[0][1]).toBeCloseTo(42.214, 4);
  });
});

function firePointerEvent(
  element: Element,
  type: "pointercancel" | "pointerdown" | "pointermove" | "pointerup",
  clientX: number,
  pointerId: number,
) {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  });

  Object.defineProperties(event, {
    clientX: {
      value: clientX,
    },
    pointerId: {
      value: pointerId,
    },
  });
  fireEvent(element, event);
}

function createMinimapSamples() {
  const index = createChartDensityIndex([
    { id: "a", x: 0, y: 2 },
    { id: "b", x: 25, y: 12 },
    { id: "c", x: 50, y: 4 },
    { id: "d", x: 75, y: 8 },
    { id: "e", x: 100, y: 6 },
  ]);

  return index.getChartSeries({
    includeEmptyBins: true,
    targetBinCount: 5,
    xDomain: [0, 100],
  }).samples;
}

function stubMinimapBounds(element: Element) {
  element.getBoundingClientRect = () =>
    ({
      bottom: 36,
      height: 36,
      left: 0,
      right: 1000,
      top: 0,
      width: 1000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

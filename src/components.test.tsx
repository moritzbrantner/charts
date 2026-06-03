import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  BinnedChart,
  ChartAxisTransformMenu,
  ChartAnomalyMarkerList,
  ChartBackendStatus,
  ChartBoxPlotSvg,
  ChartCalendarHeatmapSvg,
  ChartCirclePackSvg,
  ChartDerivedMetricCard,
  ChartDomainMinimap,
  ChartFlameGraphSvg,
  ChartFunnelSvg,
  ChartHeatmapGrid,
  ChartIcicleSvg,
  ChartIndentedTreeSvg,
  ChartRangeSelector,
  ChartSampleInteractionOverlay,
  ChartSampleSparkline,
  ChartScatterSvg,
  ChartSeriesLegend,
  ChartSunburstSvg,
  ChartThresholdMarker,
  ChartRadialTreeSvg,
  ChartRidgelineSvg,
  ChartTreeSvg,
  ChartTreemapSvg,
  ChartWaterfallSvg,
  ChartXAxisNavigationMenu,
  ChartValueModeSelector,
  ChartWithLegend,
  ChartYAxisRangeMenu,
  createChartBoxPlotData,
  createChartCalendarHeatmapData,
  createChartCirclePackLayout,
  createChartDensityIndex,
  createChartFlameGraphLayout,
  createChartFunnelData,
  createChartIcicleLayout,
  createChartIndentedTreeLayout,
  createChartRadialTreeLayout,
  createChartRidgelineData,
  createChartSunburstLayout,
  createChartTreeLayout,
  createChartTreemapLayout,
  createChartWaterfallData,
  getChartAxisScaleDefinitions,
  getChartAnomalyAnnotations,
  getChartDataYBounds,
  getRechartsAnimationProps,
  getNearestChartSample,
  getChartThresholdAnnotations,
  getChartValueModeDefinitions,
  getChartSampleYBounds,
  measureChartSeries,
  resolveChartAxisTransformStatus,
  useChartAnimatedDomain,
  useChartBinCount,
  useChartDragDomain,
  useChartSeriesVisibility,
  useChartWheelDomain,
} from "@moritzbrantner/charts";

describe("@moritzbrantner/charts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("defines and validates axis scales", () => {
    expect(getChartAxisScaleDefinitions().map((definition) => definition.id)).toEqual([
      "linear",
      "log",
      "sqrt",
      "symlog",
    ]);
    expect(resolveChartAxisTransformStatus({ dataDomain: [-4, 16], scale: "linear" })).toEqual({
      message: null,
      renderScale: "linear",
      valid: true,
    });
    expect(resolveChartAxisTransformStatus({ dataDomain: [-4, 16], scale: "sqrt" }).valid).toBe(
      true,
    );
    expect(resolveChartAxisTransformStatus({ dataDomain: [-4, 16], scale: "symlog" }).valid).toBe(
      true,
    );
    expect(resolveChartAxisTransformStatus({ dataDomain: [1, 16], scale: "log" })).toEqual({
      message: null,
      renderScale: "log",
      valid: true,
    });
    expect(resolveChartAxisTransformStatus({ dataDomain: [0, 16], scale: "log" })).toEqual({
      message: "Log scale needs a strictly positive data domain.",
      renderScale: "linear",
      valid: false,
    });
  });

  test("resolves recharts animation props", () => {
    expect(getRechartsAnimationProps({ enabled: false })).toEqual({
      animationDuration: 0,
      animationEasing: "ease",
      isAnimationActive: false,
    });
    expect(
      getRechartsAnimationProps({
        durationMs: 320,
        easing: "linear",
        enabled: true,
        mode: "draw",
      }),
    ).toEqual({
      animationDuration: 320,
      animationEasing: "linear",
      isAnimationActive: true,
    });

    vi.stubGlobal("matchMedia", () => ({ matches: true }));

    expect(getRechartsAnimationProps({ enabled: true, mode: "draw" })).toEqual({
      animationDuration: 0,
      animationEasing: "ease",
      isAnimationActive: false,
    });
  });

  test("returns target animated domain immediately when disabled", () => {
    const { result, rerender } = renderHook(
      ({ domain }) => useChartAnimatedDomain({ domain, enabled: false }),
      {
        initialProps: {
          domain: [0, 10] satisfies [number, number],
        },
      },
    );

    expect(result.current).toEqual([0, 10]);

    rerender({ domain: [10, 20] });

    expect(result.current).toEqual([10, 20]);
  });

  test("changes axis transform scale and range", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <LineChart
        width={400}
        height={260}
        data={[
          { average: 20, label: "A" },
          { average: 80, label: "B" },
        ]}
      >
        <YAxis width={60} />
        <Line dataKey="average" dot={false} isAnimationActive={false} />
        <ChartAxisTransformMenu
          axis="y"
          dataDomain={[20, 80]}
          onValueChange={onValueChange}
          value={{ domain: null, scale: "linear" }}
        />
      </LineChart>,
    );

    const trigger = container.querySelector("[data-chart-axis-transform-trigger='y']");

    expect(trigger).toBeTruthy();
    fireChartInteractionEvent(trigger!, "contextmenu", 80, 80);
    fireEvent.change(screen.getByLabelText("Scale"), { target: { value: "log" } });
    fireEvent.change(screen.getByLabelText("Min"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Max"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(onValueChange).toHaveBeenCalledWith({
      domain: [10, 100],
      scale: "log",
    });
  });

  test("falls back invalid log axis transforms to linear", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <LineChart
        width={400}
        height={260}
        data={[
          { average: -20, label: "A" },
          { average: 80, label: "B" },
        ]}
      >
        <YAxis width={60} />
        <Line dataKey="average" dot={false} isAnimationActive={false} />
        <ChartAxisTransformMenu
          axis="y"
          dataDomain={[-20, 80]}
          onValueChange={onValueChange}
          value={{ domain: null, scale: "log" }}
        />
      </LineChart>,
    );

    const trigger = container.querySelector("[data-chart-axis-transform-trigger='y']");

    expect(trigger).toBeTruthy();
    fireChartInteractionEvent(trigger!, "contextmenu", 80, 80);
    expect(screen.getByText("Log scale needs a strictly positive data domain.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Auto" }));

    expect(onValueChange).toHaveBeenCalledWith({
      domain: null,
      scale: "linear",
    });
  });

  test("renders default value modes and selects a mode", () => {
    const onValueChange = vi.fn();

    render(<ChartValueModeSelector value="average" onValueChange={onValueChange} />);

    for (const mode of ["Average", "Count", "Maximum", "Minimum", "Sum", "Median", "P75"]) {
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

  test("initializes chart series visibility with all items visible by default", () => {
    const { result } = renderHook(() =>
      useChartSeriesVisibility({ itemIds: ["average", "rolling"] }),
    );

    expect(result.current.hiddenIds).toEqual([]);
    expect(result.current.visibleIds).toEqual(["average", "rolling"]);
    expect(result.current.isVisible("average")).toBe(true);
  });

  test("initializes chart series visibility with default hidden ids", () => {
    const { result } = renderHook(() =>
      useChartSeriesVisibility({
        defaultHiddenIds: ["rolling"],
        itemIds: ["average", "rolling"],
      }),
    );

    expect(result.current.hiddenIds).toEqual(["rolling"]);
    expect(result.current.visibleIds).toEqual(["average"]);
  });

  test("filters unknown hidden chart series ids", () => {
    const { result } = renderHook(() =>
      useChartSeriesVisibility({
        defaultHiddenIds: ["rolling", "missing"],
        itemIds: ["average", "rolling"],
      }),
    );

    expect(result.current.hiddenIds).toEqual(["rolling"]);
  });

  test("prevents hiding the last visible chart series by default", () => {
    const { result } = renderHook(() =>
      useChartSeriesVisibility({
        defaultHiddenIds: ["rolling"],
        itemIds: ["average", "rolling"],
      }),
    );

    act(() => {
      result.current.toggle("average");
    });

    expect(result.current.hiddenIds).toEqual(["rolling"]);
    expect(result.current.visibleIds).toEqual(["average"]);
  });

  test("allows hiding all chart series when min visible is zero", () => {
    const { result } = renderHook(() =>
      useChartSeriesVisibility({
        itemIds: ["average", "rolling"],
        minVisible: 0,
      }),
    );

    act(() => {
      result.current.toggle("average");
    });
    act(() => {
      result.current.toggle("rolling");
    });

    expect(result.current.hiddenIds).toEqual(["average", "rolling"]);
    expect(result.current.visibleIds).toEqual([]);
  });

  test("reports controlled chart series visibility changes", () => {
    const onHiddenIdsChange = vi.fn();
    const { result } = renderHook(() =>
      useChartSeriesVisibility({
        hiddenIds: ["rolling"],
        itemIds: ["average", "rolling"],
        onHiddenIdsChange,
      }),
    );

    act(() => {
      result.current.toggle("rolling");
    });

    expect(onHiddenIdsChange).toHaveBeenCalledWith([]);
    expect(result.current.hiddenIds).toEqual(["rolling"]);
  });

  test("renders chart series legend items and toggles hidden ids", () => {
    const onHiddenIdsChange = vi.fn();

    render(
      <ChartSeriesLegend
        hiddenIds={["rolling"]}
        items={[
          {
            color: "red",
            description: "Viewport average",
            id: "average",
            label: "Average",
            meta: "120",
          },
          {
            color: "blue",
            id: "rolling",
            label: "Rolling",
          },
        ]}
        onHiddenIdsChange={onHiddenIdsChange}
      />,
    );

    expect(screen.getByRole("group", { name: "Chart series legend" })).toBeTruthy();
    expect(screen.getByText("Viewport average")).toBeTruthy();
    expect(screen.getByText("120")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Average" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(screen.getByRole("checkbox", { name: "Rolling" }).getAttribute("aria-checked")).toBe(
      "false",
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Average" }));

    expect(onHiddenIdsChange).toHaveBeenCalledWith(["rolling"]);

    fireEvent.click(screen.getByRole("checkbox", { name: "Rolling" }));

    expect(onHiddenIdsChange).toHaveBeenCalledWith([]);
  });

  test("does not toggle disabled chart series legend items", () => {
    const onHiddenIdsChange = vi.fn();

    render(
      <ChartSeriesLegend
        items={[
          {
            disabled: true,
            id: "average",
            label: "Average",
          },
          {
            id: "rolling",
            label: "Rolling",
          },
        ]}
        onHiddenIdsChange={onHiddenIdsChange}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Average" }));

    expect(onHiddenIdsChange).not.toHaveBeenCalled();
  });

  test("renders chart content with a side legend", () => {
    const { container, rerender } = render(
      <ChartWithLegend legend={<div>Legend</div>}>
        <div>Chart</div>
      </ChartWithLegend>,
    );

    expect(screen.getByText("Chart")).toBeTruthy();
    expect(screen.getByText("Legend")).toBeTruthy();
    expect(container.firstElementChild?.getAttribute("data-chart-legend-side")).toBe("right");
    expect(container.firstElementChild?.firstElementChild?.textContent).toBe("Chart");

    rerender(
      <ChartWithLegend legend={<div>Legend</div>} legendSide="left">
        <div>Chart</div>
      </ChartWithLegend>,
    );

    expect(container.firstElementChild?.getAttribute("data-chart-legend-side")).toBe("left");
    expect(container.firstElementChild?.firstElementChild?.textContent).toBe("Legend");
  });

  test("renders a draggable floating legend with hide controls", () => {
    const onLegendHide = vi.fn();
    const { container } = render(
      <ChartWithLegend
        legend={<ChartSeriesLegend items={[{ id: "average", label: "Average" }]} />}
        legendMode="floating"
        onLegendHide={onLegendHide}
      >
        <div>Chart</div>
      </ChartWithLegend>,
    );

    const root = container.firstElementChild as HTMLElement;
    const legend = root.querySelector("[data-chart-floating-legend]") as HTMLElement;
    const handle = root.querySelector("[data-chart-floating-legend-handle]") as HTMLElement;

    root.getBoundingClientRect = () =>
      ({
        bottom: 300,
        height: 300,
        left: 0,
        right: 500,
        top: 0,
        width: 500,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    legend.getBoundingClientRect = () =>
      ({
        bottom: 132,
        height: 120,
        left: 12,
        right: 172,
        top: 12,
        width: 160,
        x: 12,
        y: 12,
        toJSON: () => ({}),
      }) as DOMRect;

    expect(screen.getByRole("group", { name: "Chart series legend" })).toBeTruthy();

    firePointerEvent(handle, "pointerdown", 20, 1, { clientY: 20 });
    firePointerEvent(handle, "pointermove", 450, 1, { clientY: 280 });
    firePointerEvent(handle, "pointerup", 450, 1, { clientY: 280 });

    expect(legend.style.left).toBe("332px");
    expect(legend.style.top).toBe("172px");

    expect(screen.getByRole("group", { name: "Chart series legend" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Minimize legend" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Expand legend" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Hide legend" }));
    expect(screen.queryByRole("group", { name: "Chart series legend" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Show legend" })).toBeNull();
    expect(onLegendHide).toHaveBeenCalledTimes(1);
  });

  test("opens a y-axis range menu and applies manual ranges", () => {
    const onValueChange = vi.fn();
    const { container } = renderYAxisRangeMenu({ onValueChange });

    openYAxisRangeMenu(container);

    expect(screen.getByRole("dialog", { name: "Y-axis range menu" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Min"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Max"), { target: { value: "80" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(onValueChange).toHaveBeenCalledWith([10, 80]);
    expect(screen.queryByRole("dialog", { name: "Y-axis range menu" })).toBeNull();
  });

  test("resets a y-axis range menu to auto", () => {
    const onValueChange = vi.fn();
    const { container } = renderYAxisRangeMenu({ onValueChange, value: [10, 80] });

    openYAxisRangeMenu(container);
    fireEvent.click(screen.getByRole("button", { name: "Auto" }));

    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  test("keeps the y-axis range menu open for invalid ranges", () => {
    const onValueChange = vi.fn();
    const { container } = renderYAxisRangeMenu({ onValueChange });

    openYAxisRangeMenu(container);
    fireEvent.change(screen.getByLabelText("Min"), { target: { value: "90" } });
    fireEvent.change(screen.getByLabelText("Max"), { target: { value: "80" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByText("Max must be greater than min.")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Y-axis range menu" })).toBeTruthy();
  });

  test("renders y-axis range menu legend items and toggles hidden ids", () => {
    const onHiddenIdsChange = vi.fn();
    const { container } = renderYAxisRangeMenu({ onHiddenIdsChange });

    openYAxisRangeMenu(container);

    expect(screen.getByRole("group", { name: "Y-axis series legend" })).toBeTruthy();
    expect(screen.getByText("Average")).toBeTruthy();
    expect(screen.getByText("Rolling")).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: "Average" }));

    expect(onHiddenIdsChange).toHaveBeenCalledWith(["average"]);
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
      [...Array.from({ length: 20 }, () => 10), 1_000].map((y, pointIndex) => ({
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

  test("renders heatmap cells and selects a cell", () => {
    const onCellSelect = vi.fn();
    const index = createChartDensityIndex([
      { id: "a", x: 0.5, y: 1 },
      { id: "b", x: 1.5, y: 9 },
    ]);
    const heatmap = index.getHeatmap({
      xBinCount: 2,
      xDomain: [0, 2],
      yBinCount: 2,
      yDomain: [0, 10],
    });

    render(<ChartHeatmapGrid cells={heatmap.cells} onCellSelect={onCellSelect} />);

    expect(screen.getByRole("img", { name: "Chart heatmap" })).toBeTruthy();
    fireEvent.click(document.querySelector("[data-chart-heatmap-cell='0']")!);

    expect(onCellSelect).toHaveBeenCalledWith(heatmap.cells[0]);
  });

  test("renders calendar heatmap days and selects a day", () => {
    const onDatumSelect = vi.fn();
    const data = createChartCalendarHeatmapData(
      [
        { id: "a", x: 0, y: 2 },
        { id: "b", x: 12, y: 6 },
      ],
      {
        dayMs: 24,
        xDomain: [0, 24],
      },
    );

    render(<ChartCalendarHeatmapSvg data={data} onDatumSelect={onDatumSelect} />);

    expect(screen.getByRole("img", { name: "Chart calendar heatmap" })).toBeTruthy();
    expect(document.querySelector("title")?.textContent).toContain("4");
    fireEvent.click(document.querySelector("[data-chart-calendar-day='day-0']")!);

    expect(onDatumSelect).toHaveBeenCalledWith(data.days[0]);
  });

  test("renders ridgeline groups and selects a group", () => {
    const onGroupSelect = vi.fn();
    const data = createChartRidgelineData(
      [
        { properties: { plan: "pro" }, x: 0, y: 1 },
        { properties: { plan: "pro" }, x: 1, y: 2 },
        { properties: { plan: "team" }, x: 2, y: 8 },
      ],
      {
        bucketCount: 4,
        groupBy: { property: "plan" },
      },
    );

    render(<ChartRidgelineSvg data={data} onGroupSelect={onGroupSelect} />);

    expect(screen.getByRole("img", { name: "Chart ridgeline" })).toBeTruthy();
    fireEvent.click(document.querySelector("[data-chart-ridgeline-group='pro']")!);

    expect(onGroupSelect).toHaveBeenCalledWith(data.groups[0]);
  });

  test("renders calendar heatmap and ridgeline empty states", () => {
    render(
      <>
        <ChartCalendarHeatmapSvg data={[]} />
        <ChartRidgelineSvg data={[]} />
      </>,
    );

    expect(screen.getByText("No calendar heatmap data.")).toBeTruthy();
    expect(screen.getByText("No ridgeline data.")).toBeTruthy();
  });

  test("renders box plot marks and selects a datum", () => {
    const onDatumSelect = vi.fn();
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 0.2, y: 10 },
      { id: "c", x: 0.4, y: 20 },
    ]);
    const series = index.getChartSeries({
      includeEmptyBins: true,
      percentiles: ["p25", "p50", "p75"],
      targetBinCount: 1,
      xDomain: [0, 1],
    });
    const data = createChartBoxPlotData(series.samples);

    render(<ChartBoxPlotSvg data={data} onDatumSelect={onDatumSelect} />);

    expect(screen.getByRole("img", { name: "Chart box plot" })).toBeTruthy();
    fireEvent.click(document.querySelector("[data-chart-box-index='0']")!);

    expect(onDatumSelect).toHaveBeenCalledWith(data[0]);
  });

  test("renders new SVG chart families", () => {
    const index = createChartDensityIndex([
      { id: "a", metrics: { revenue: 1 }, x: 0, y: 1 },
      { id: "b", metrics: { revenue: 4 }, x: 1, y: 4 },
    ]);
    const hierarchy = {
      label: "Root",
      children: [
        { label: "A", value: 2 },
        { label: "B", value: 1 },
      ],
    };

    const { container } = render(
      <>
        <ChartScatterSvg series={index.getScatter({ sizeAccessor: { metric: "revenue" } })} />
        <ChartWaterfallSvg
          data={createChartWaterfallData([
            { label: "Start", value: 10 },
            { label: "Loss", value: -2 },
          ])}
        />
        <ChartFunnelSvg
          data={createChartFunnelData([
            { label: "Visitors", value: 10 },
            { label: "Paid", value: 4 },
          ])}
        />
        <ChartTreemapSvg data={createChartTreemapLayout(hierarchy, { height: 100, width: 100 })} />
        <ChartSunburstSvg data={createChartSunburstLayout(hierarchy, { outerRadius: 40 })} />
        <ChartIcicleSvg data={createChartIcicleLayout(hierarchy, { height: 100, width: 100 })} />
        <ChartFlameGraphSvg
          data={createChartFlameGraphLayout(hierarchy, { height: 100, width: 100 })}
        />
        <ChartCirclePackSvg
          data={createChartCirclePackLayout(hierarchy, { height: 100, width: 100 })}
        />
        <ChartTreeSvg data={createChartTreeLayout(hierarchy, { height: 100, width: 100 })} />
        <ChartRadialTreeSvg
          data={createChartRadialTreeLayout(hierarchy, { height: 100, width: 100 })}
          height={100}
          width={100}
        />
        <ChartIndentedTreeSvg data={createChartIndentedTreeLayout(hierarchy, { width: 100 })} />
      </>,
    );

    expect(screen.getByRole("img", { name: "Chart scatter plot" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Chart waterfall" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Chart funnel" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Chart treemap" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Chart sunburst" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Chart icicle" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Chart flame graph" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Chart circle pack" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Chart tree" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Chart radial tree" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Chart indented tree" })).toBeTruthy();
    expect(container.querySelector("svg[aria-label='Chart treemap'] g text")?.textContent).toBe(
      "A",
    );
    expect(container.querySelector("svg[aria-label='Chart icicle'] g text")?.textContent).toBe("A");
    expect(container.querySelector("svg[aria-label='Chart flame graph'] g text")?.textContent).toBe(
      "Root",
    );
    expect(container.querySelector("svg[aria-label='Chart tree'] g text")?.textContent).toBe(
      "Root",
    );

    expect(container.querySelector("[data-chart-sunburst-hover-label]")).toBeNull();
    fireEvent.pointerEnter(container.querySelector("path[aria-label='A: 2']")!);
    expect(container.querySelector("[data-chart-sunburst-hover-label]")).toBeTruthy();
  });

  test("zooms treemap nodes and returns to the parent layer", () => {
    const hierarchy = {
      id: "accounts",
      label: "Accounts",
      children: [
        {
          id: "starter",
          label: "Starter",
          children: [
            { id: "starter-direct", label: "Direct", value: 24 },
            { id: "starter-partner", label: "Partner", value: 18 },
          ],
        },
        { id: "scale", label: "Scale", value: 16 },
      ],
    };
    const data = createChartTreemapLayout(hierarchy, { height: 100, width: 200 });
    const { container } = render(<ChartTreemapSvg data={data} zoomable />);

    expect(
      container.querySelector("[data-chart-treemap-node-id='starter'] text")?.textContent,
    ).toBe("Starter");

    fireEvent.click(container.querySelector("[data-chart-treemap-node-id='starter'] rect")!);

    expect(
      container.querySelector("[data-chart-treemap-node-id='starter-direct'] text")?.textContent,
    ).toBe("Direct");
    expect(
      container.querySelector("[data-chart-treemap-node-id='starter-partner'] text")?.textContent,
    ).toBe("Partner");

    fireEvent.click(screen.getByRole("button", { name: "Back to parent treemap level" }));

    expect(
      container.querySelector("[data-chart-treemap-node-id='starter'] text")?.textContent,
    ).toBe("Starter");
  });

  test("supports controlled treemap focus without focusing leaf clicks", () => {
    const onFocusedNodeChange = vi.fn();
    const onNodeSelect = vi.fn();
    const hierarchy = {
      id: "accounts",
      label: "Accounts",
      children: [
        {
          id: "starter",
          label: "Starter",
          children: [
            { id: "starter-direct", label: "Direct", value: 24 },
            { id: "starter-partner", label: "Partner", value: 18 },
          ],
        },
      ],
    };
    const data = createChartTreemapLayout(hierarchy, { height: 100, width: 200 });
    const { container } = render(
      <ChartTreemapSvg
        data={data}
        focusedNodeId="starter"
        onFocusedNodeChange={onFocusedNodeChange}
        onNodeSelect={onNodeSelect}
        zoomable
      />,
    );

    fireEvent.click(container.querySelector("[data-chart-treemap-node-id='starter-direct'] rect")!);

    expect(onNodeSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "starter-direct" }));
    expect(onFocusedNodeChange).not.toHaveBeenCalled();
  });

  test("reports treemap focus changes", () => {
    const onFocusedNodeChange = vi.fn();
    const hierarchy = {
      id: "accounts",
      label: "Accounts",
      children: [
        {
          id: "starter",
          label: "Starter",
          children: [{ id: "starter-direct", label: "Direct", value: 24 }],
        },
      ],
    };
    const data = createChartTreemapLayout(hierarchy, { height: 100, width: 200 });
    const { container } = render(
      <ChartTreemapSvg data={data} onFocusedNodeChange={onFocusedNodeChange} zoomable />,
    );

    fireEvent.click(container.querySelector("[data-chart-treemap-node-id='starter'] rect")!);

    expect(onFocusedNodeChange).toHaveBeenCalledWith(
      "starter",
      expect.objectContaining({ id: "starter" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Back to parent treemap level" }));

    expect(onFocusedNodeChange).toHaveBeenLastCalledWith(null, null);
  });

  test("opens x-axis navigation menu and changes domains", () => {
    const onDomainChange = vi.fn();
    const { container } = render(
      <LineChart
        width={400}
        height={260}
        data={[
          { x: 0, value: 20 },
          { x: 100, value: 80 },
        ]}
      >
        <XAxis dataKey="x" type="number" domain={[0, 100]} />
        <YAxis width={60} />
        <Line dataKey="value" dot={false} isAnimationActive={false} />
        <ChartXAxisNavigationMenu
          domain={[20, 60]}
          fullDomain={[0, 100]}
          onDomainChange={onDomainChange}
        />
      </LineChart>,
    );
    const trigger = container.querySelector("[data-chart-x-axis-navigation-trigger]");

    expect(trigger).toBeTruthy();
    trigger!.getBoundingClientRect = () =>
      ({
        bottom: 240,
        height: 40,
        left: 0,
        right: 400,
        top: 200,
        width: 400,
        x: 0,
        y: 200,
        toJSON: () => ({}),
      }) as DOMRect;

    fireChartInteractionEvent(trigger!, "contextmenu", 200, 220);
    expect(screen.getByRole("dialog", { name: "X-axis navigation menu" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(onDomainChange).toHaveBeenLastCalledWith([30, 50]);

    fireChartInteractionEvent(trigger!, "contextmenu", 200, 220);
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(onDomainChange).toHaveBeenLastCalledWith([0, 80]);

    fireChartInteractionEvent(trigger!, "contextmenu", 200, 220);
    fireEvent.click(screen.getByRole("button", { name: "Pan left" }));
    expect(onDomainChange).toHaveBeenLastCalledWith([0, 40]);

    fireChartInteractionEvent(trigger!, "contextmenu", 200, 220);
    fireEvent.click(screen.getByRole("button", { name: "Pan right" }));
    expect(onDomainChange).toHaveBeenLastCalledWith([60, 100]);

    fireChartInteractionEvent(trigger!, "contextmenu", 200, 220);
    fireEvent.click(screen.getByRole("button", { name: "Reset range" }));
    expect(onDomainChange).toHaveBeenLastCalledWith([0, 100]);
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
        domain={[5, 15]}
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

  test("finds the nearest selectable chart sample", () => {
    const samples = createChartDensityIndex([
      { id: "a", x: 1, y: 2 },
      { id: "b", x: 5, y: 12 },
      { id: "c", x: 9, y: 4 },
    ]).getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 5,
      xDomain: [0, 10],
    }).samples;

    expect(getNearestChartSample(samples, 4.6)?.firstPoint?.id).toBe("b");
    expect(getNearestChartSample([], 4.6)).toBeNull();
    expect(
      getNearestChartSample(samples, 6.6, {
        isSampleSelectable: (sample) => sample.firstPoint?.id !== "b" && sample.pointCount > 0,
      })?.firstPoint?.id,
    ).toBe("c");
  });

  test("selects, hovers, and context-targets chart samples from a Recharts overlay", () => {
    const onSampleContextMenu = vi.fn();
    const onSampleHover = vi.fn();
    const onSampleSelect = vi.fn();
    const index = createChartDensityIndex([
      { id: "a", x: 1, y: 2 },
      { id: "b", x: 5, y: 12 },
      { id: "c", x: 9, y: 4 },
    ]);
    const samples = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 5,
      xDomain: [0, 10],
    }).samples;
    const selectedSample = samples.find((sample) => sample.firstPoint?.id === "b");
    const { container } = render(
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
        <Line dataKey="value" dot={false} isAnimationActive={false} />
        <ChartSampleInteractionOverlay
          domain={[0, 10]}
          samples={samples}
          selectedSampleIndex={selectedSample?.index}
          onSampleContextMenu={onSampleContextMenu}
          onSampleHover={onSampleHover}
          onSampleSelect={onSampleSelect}
        />
      </LineChart>,
    );
    const overlay = container.querySelector(
      "[data-chart-sample-interaction-overlay]",
    ) as SVGRectElement;

    expect(overlay).toBeTruthy();
    overlay.getBoundingClientRect = () =>
      ({
        bottom: 240,
        height: 220,
        left: 0,
        right: 400,
        top: 20,
        width: 400,
        x: 0,
        y: 20,
        toJSON: () => ({}),
      }) as DOMRect;

    fireChartInteractionEvent(overlay, "pointermove", 200, 100);
    fireChartInteractionEvent(overlay, "click", 200, 100);
    fireChartInteractionEvent(overlay, "contextmenu", 200, 100);
    fireEvent.pointerLeave(overlay);

    expect(onSampleHover).toHaveBeenCalledWith(expect.objectContaining({ sample: selectedSample }));
    expect(onSampleHover).toHaveBeenLastCalledWith(null);
    expect(onSampleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ sample: selectedSample }),
    );
    expect(onSampleContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ sample: selectedSample }),
      expect.any(Object),
    );
    expect(container.querySelector("[data-chart-sample-selected-band]")).toBeTruthy();
    expect(container.querySelector("[data-chart-sample-selected-line]")).toBeTruthy();
  });

  test("does not render the sample interaction overlay without a plot area", () => {
    const { container } = render(
      <svg>
        <ChartSampleInteractionOverlay domain={[0, 10]} samples={[]} />
      </svg>,
    );

    expect(container.querySelector("[data-chart-sample-interaction-overlay]")).toBeNull();
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

    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1),
    );
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

    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1),
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

  test("gets chart data y bounds across selected keys", () => {
    expect(
      getChartDataYBounds(
        [
          { average: 2, ignored: "8", rolling: null },
          { average: -4, ignored: Number.NaN, rolling: 12 },
          { average: undefined, rolling: 6 },
        ],
        ["average", "rolling", "ignored"],
      ),
    ).toEqual({
      maxY: 12,
      minY: -4,
    });
    expect(getChartDataYBounds([{ label: "A" }], ["missing"])).toEqual({
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

  test("pans chart domains with direct drag gestures", () => {
    const onDomainChange = vi.fn();

    stubImmediateAnimationFrame();
    render(
      <DomainDragChart domain={[20, 40]} fullDomain={[0, 100]} onDomainChange={onDomainChange} />,
    );
    const target = screen.getByTestId("domain-drag-chart");

    stubMinimapBounds(target);
    firePointerEvent(target, "pointerdown", 500, 1);
    firePointerEvent(target, "pointermove", 600, 1);

    expect(onDomainChange).toHaveBeenCalledWith([18, 38]);
  });

  test("clamps direct chart drag panning at the full domain", () => {
    const onDomainChange = vi.fn();

    stubImmediateAnimationFrame();
    render(
      <DomainDragChart domain={[85, 95]} fullDomain={[0, 100]} onDomainChange={onDomainChange} />,
    );
    const target = screen.getByTestId("domain-drag-chart");

    stubMinimapBounds(target);
    firePointerEvent(target, "pointerdown", 500, 1);
    firePointerEvent(target, "pointermove", 0, 1);

    expect(onDomainChange).toHaveBeenCalledWith([90, 100]);
  });

  test("ignores direct chart drags below the movement threshold", () => {
    const onDomainChange = vi.fn();

    stubImmediateAnimationFrame();
    render(
      <DomainDragChart domain={[20, 40]} fullDomain={[0, 100]} onDomainChange={onDomainChange} />,
    );
    const target = screen.getByTestId("domain-drag-chart");

    stubMinimapBounds(target);
    firePointerEvent(target, "pointerdown", 500, 1);
    firePointerEvent(target, "pointermove", 503, 1);

    expect(onDomainChange).not.toHaveBeenCalled();
  });

  test("keeps plain chart clicks available for sample interactions", () => {
    const onDomainChange = vi.fn();

    stubImmediateAnimationFrame();
    render(
      <DomainDragChart domain={[20, 40]} fullDomain={[0, 100]} onDomainChange={onDomainChange} />,
    );
    const target = screen.getByTestId("domain-drag-chart");

    stubMinimapBounds(target);
    firePointerEvent(target, "pointerdown", 500, 1);
    firePointerEvent(target, "pointerup", 500, 1);

    expect(onDomainChange).not.toHaveBeenCalled();
  });

  test("resets chart domains on double click", () => {
    const onDomainChange = vi.fn();

    render(
      <DomainDragChart domain={[20, 40]} fullDomain={[0, 100]} onDomainChange={onDomainChange} />,
    );

    fireEvent.doubleClick(screen.getByTestId("domain-drag-chart"));

    expect(onDomainChange).toHaveBeenCalledWith([0, 100]);
  });

  test("selects a chart domain with shift drag and commits on release", () => {
    const onDomainChange = vi.fn();

    render(
      <DomainDragChart domain={[20, 40]} fullDomain={[0, 100]} onDomainChange={onDomainChange} />,
    );
    const target = screen.getByTestId("domain-drag-chart");

    stubMinimapBounds(target);
    firePointerEvent(target, "pointerdown", 250, 1, { shiftKey: true });
    firePointerEvent(target, "pointermove", 750, 1, { shiftKey: true });

    const selection = screen.getByTestId("domain-drag-selection");

    expect(selection.style.left).toBe("250px");
    expect(selection.style.width).toBe("500px");
    expect(onDomainChange).not.toHaveBeenCalled();

    firePointerEvent(target, "pointerup", 750, 1, { shiftKey: true });

    expect(onDomainChange).toHaveBeenCalledWith([25, 35]);
  });

  test("selects a chart domain with alt drag", () => {
    const onDomainChange = vi.fn();

    render(
      <DomainDragChart domain={[20, 40]} fullDomain={[0, 100]} onDomainChange={onDomainChange} />,
    );
    const target = screen.getByTestId("domain-drag-chart");

    stubMinimapBounds(target);
    firePointerEvent(target, "pointerdown", 250, 1, { altKey: true });
    firePointerEvent(target, "pointermove", 750, 1, { altKey: true });
    firePointerEvent(target, "pointerup", 750, 1, { altKey: true });

    expect(onDomainChange).toHaveBeenCalledWith([25, 35]);
  });

  test("disables direct chart drag domain changes", () => {
    const onDomainChange = vi.fn();

    stubImmediateAnimationFrame();
    render(
      <DomainDragChart
        disabled
        domain={[20, 40]}
        fullDomain={[0, 100]}
        onDomainChange={onDomainChange}
      />,
    );
    const target = screen.getByTestId("domain-drag-chart");

    stubMinimapBounds(target);
    firePointerEvent(target, "pointerdown", 500, 1);
    firePointerEvent(target, "pointermove", 600, 1);
    fireEvent.doubleClick(target);

    expect(onDomainChange).not.toHaveBeenCalled();
  });

  test("previews pan drag domains and commits once on release", () => {
    const onDomainChange = vi.fn();
    const onDomainPreviewChange = vi.fn();

    render(
      <DomainDragChart
        domain={[20, 40]}
        fullDomain={[0, 100]}
        onDomainChange={onDomainChange}
        onDomainPreviewChange={onDomainPreviewChange}
        updateMode="preview"
      />,
    );
    const target = screen.getByTestId("domain-drag-chart");

    stubMinimapBounds(target);
    firePointerEvent(target, "pointerdown", 500, 1);
    firePointerEvent(target, "pointermove", 600, 1);
    firePointerEvent(target, "pointermove", 700, 1);

    expect(onDomainChange).not.toHaveBeenCalled();
    expect(onDomainPreviewChange).toHaveBeenCalledWith({
      domain: [16, 36],
      offsetPx: 200,
    });

    firePointerEvent(target, "pointerup", 700, 1);

    expect(onDomainChange).toHaveBeenCalledTimes(1);
    expect(onDomainChange).toHaveBeenCalledWith([16, 36]);
    expect(onDomainPreviewChange).toHaveBeenLastCalledWith(null);
  });

  test("renders a binned chart drag frame and selection overlay", () => {
    const onDomainChange = vi.fn();
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 2 },
      { id: "b", x: 5, y: 12 },
      { id: "c", x: 10, y: 4 },
    ]);
    const { container } = render(
      <BinnedChart
        chartClassName="h-40 w-full"
        config={{ average: { color: "var(--chart-1)", label: "Average" } }}
        domain={[0, 10]}
        fullDomain={[0, 20]}
        index={index}
        onDomainChange={onDomainChange}
        renderDataOptions={{ modes: ["average"] }}
      >
        {({ rows }) => (
          <LineChart data={rows}>
            <Line dataKey="average" dot={false} isAnimationActive={false} />
          </LineChart>
        )}
      </BinnedChart>,
    );
    const frame = container.querySelector("[data-chart-domain-drag-frame]") as HTMLElement;

    expect(frame).toBeTruthy();
    stubMinimapBounds(frame);
    firePointerEvent(frame, "pointerdown", 100, 1, { shiftKey: true });
    firePointerEvent(frame, "pointermove", 600, 1, { shiftKey: true });

    expect(container.querySelector("[data-chart-domain-selection]")).toBeTruthy();
    expect(onDomainChange).not.toHaveBeenCalled();
  });

  test("previews binned chart pan without querying series on every pointer move", () => {
    const onDomainChange = vi.fn();
    const index = createChartDensityIndex(
      Array.from({ length: 20 }, (_, pointIndex) => ({
        id: `point-${pointIndex}`,
        x: pointIndex,
        y: pointIndex % 5,
      })),
    );
    const getChartSeries = vi.spyOn(index, "getChartSeries");
    const { container } = render(
      <BinnedChart
        chartClassName="h-40 w-full"
        config={{ average: { color: "var(--chart-1)", label: "Average" } }}
        domain={[5, 15]}
        fullDomain={[0, 20]}
        index={index}
        onDomainChange={onDomainChange}
        renderDataOptions={{ modes: ["average"] }}
      >
        {({ rows }) => (
          <LineChart data={rows}>
            <Line dataKey="average" dot={false} isAnimationActive={false} />
          </LineChart>
        )}
      </BinnedChart>,
    );
    const callsAfterRender = getChartSeries.mock.calls.length;
    const frame = container.querySelector("[data-chart-domain-drag-frame]") as HTMLElement;

    stubMinimapBounds(frame);
    firePointerEvent(frame, "pointerdown", 500, 1);

    for (let index = 0; index < 60; index += 1) {
      firePointerEvent(frame, "pointermove", 505 + index, 1);
    }

    expect(getChartSeries.mock.calls.length).toBe(callsAfterRender);
    expect(onDomainChange).not.toHaveBeenCalled();

    firePointerEvent(frame, "pointerup", 565, 1);

    expect(onDomainChange).toHaveBeenCalledTimes(1);
  });

  test("keeps binned chart live drag updates available", () => {
    const onDomainChange = vi.fn();
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 2 },
      { id: "b", x: 5, y: 12 },
      { id: "c", x: 10, y: 4 },
    ]);
    const { container } = render(
      <BinnedChart
        chartClassName="h-40 w-full"
        config={{ average: { color: "var(--chart-1)", label: "Average" } }}
        domain={[5, 15]}
        dragOptions={{ updateMode: "live" }}
        fullDomain={[0, 20]}
        index={index}
        onDomainChange={onDomainChange}
        renderDataOptions={{ modes: ["average"] }}
      >
        {({ rows }) => (
          <LineChart data={rows}>
            <Line dataKey="average" dot={false} isAnimationActive={false} />
          </LineChart>
        )}
      </BinnedChart>,
    );
    const frame = container.querySelector("[data-chart-domain-drag-frame]") as HTMLElement;

    stubImmediateAnimationFrame();
    stubMinimapBounds(frame);
    firePointerEvent(frame, "pointerdown", 500, 1);
    firePointerEvent(frame, "pointermove", 600, 1);

    expect(onDomainChange).toHaveBeenCalledWith([4, 14]);
  });

  test("can disable binned chart drag while keeping minimap and wheel navigation", () => {
    const onDomainChange = vi.fn();
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 2 },
      { id: "b", x: 5, y: 12 },
      { id: "c", x: 10, y: 4 },
    ]);
    const { container } = render(
      <BinnedChart
        drag={false}
        chartClassName="h-40 w-full"
        config={{ average: { color: "var(--chart-1)", label: "Average" } }}
        domain={[0, 10]}
        fullDomain={[0, 20]}
        index={index}
        onDomainChange={onDomainChange}
        renderDataOptions={{ modes: ["average"] }}
      >
        {({ rows }) => (
          <LineChart data={rows}>
            <Line dataKey="average" dot={false} isAnimationActive={false} />
          </LineChart>
        )}
      </BinnedChart>,
    );
    const frame = container.querySelector("[data-chart-domain-drag-frame]") as HTMLElement;
    const root = frame.parentElement as HTMLElement;

    expect(screen.getByRole("img", { name: "Chart domain minimap" })).toBeTruthy();
    stubMinimapBounds(frame);
    stubMinimapBounds(root);
    firePointerEvent(frame, "pointerdown", 500, 1);
    firePointerEvent(frame, "pointermove", 600, 1);

    expect(onDomainChange).not.toHaveBeenCalled();

    fireEvent.wheel(root, { deltaX: 100 });

    expect(onDomainChange).toHaveBeenCalledWith([1, 11]);
  });

  test("scrolls chart domains with horizontal mouse wheel gestures", () => {
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

    fireEvent.wheel(target, { deltaX: 100 });

    expect(onDomainChange).toHaveBeenCalledWith([22, 42]);
    expect(wheelDefaultPrevented).toBe(true);

    rerender(<WheelChart domain={[85, 95]} />);
    fireEvent.wheel(target, { deltaX: 1000 });

    expect(onDomainChange).toHaveBeenLastCalledWith([90, 100]);

    onDomainChange.mockClear();
    wheelDefaultPrevented = false;
    rerender(<WheelChart domain={[0, 100]} />);
    fireEvent.wheel(target, { deltaX: 100 });

    expect(onDomainChange).not.toHaveBeenCalled();
    expect(wheelDefaultPrevented).toBe(true);
  });

  test("lets vertical mouse wheel gestures scroll the document", () => {
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

    fireEvent.wheel(target, { deltaY: 100 });

    expect(onDomainChange).not.toHaveBeenCalled();
    expect(wheelDefaultPrevented).toBe(false);
  });

  test("prevents document scrolling from horizontal native chart wheel gestures", () => {
    const onDomainChange = vi.fn();

    function WheelChart({ domain }: { domain: [number, number] }) {
      const { containerRef } = useChartWheelDomain<HTMLDivElement>({
        domain,
        fullDomain: [0, 100],
        onDomainChange,
      });

      return <div data-testid="wheel-chart" ref={containerRef} />;
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
      deltaX: { value: 100 },
      deltaY: { value: 0 },
      metaKey: { value: false },
      shiftKey: { value: false },
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

function DomainDragChart({
  disabled,
  domain,
  fullDomain,
  onDomainChange,
  onDomainPreviewChange,
  updateMode,
}: {
  disabled?: boolean;
  domain: [number, number];
  fullDomain: [number, number];
  onDomainChange: (domain: [number, number]) => void;
  onDomainPreviewChange?: Parameters<typeof useChartDragDomain>[0]["onDomainPreviewChange"];
  updateMode?: Parameters<typeof useChartDragDomain>[0]["updateMode"];
}) {
  const {
    containerRef,
    onDoubleClick,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    selection,
  } = useChartDragDomain<HTMLDivElement>({
    disabled,
    domain,
    fullDomain,
    onDomainChange,
    onDomainPreviewChange,
    updateMode,
  });

  return (
    <div
      data-testid="domain-drag-chart"
      ref={containerRef}
      onDoubleClick={onDoubleClick}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {selection ? (
        <div
          data-testid="domain-drag-selection"
          style={{
            left: `${selection.left}px`,
            width: `${selection.width}px`,
          }}
        />
      ) : null}
    </div>
  );
}

function renderYAxisRangeMenu({
  onHiddenIdsChange,
  onValueChange = vi.fn(),
  value = null,
}: {
  onHiddenIdsChange?: (hiddenIds: string[]) => void;
  onValueChange?: (range: [number, number] | null) => void;
  value?: [number, number] | null;
}) {
  return render(
    <LineChart
      width={400}
      height={260}
      data={[
        { label: "A", average: 20, rolling: 24 },
        { label: "B", average: 80, rolling: 72 },
        { label: "C", average: 40, rolling: 48 },
      ]}
      margin={{ bottom: 20, left: 20, right: 20, top: 20 }}
    >
      <YAxis width={60} />
      <Line dataKey="average" dot={false} isAnimationActive={false} />
      <ChartYAxisRangeMenu
        dataDomain={[20, 80]}
        hiddenIds={[]}
        legendItems={[
          { color: "red", id: "average", label: "Average" },
          { color: "blue", id: "rolling", label: "Rolling" },
        ]}
        onHiddenIdsChange={onHiddenIdsChange}
        onValueChange={onValueChange}
        value={value}
      />
    </LineChart>,
  );
}

function openYAxisRangeMenu(container: HTMLElement) {
  const trigger = container.querySelector("[data-chart-y-axis-range-trigger]");

  expect(trigger).toBeTruthy();
  fireChartInteractionEvent(trigger!, "contextmenu", 80, 80);
}

function firePointerEvent(
  element: Element,
  type: "pointercancel" | "pointerdown" | "pointermove" | "pointerup",
  clientX: number,
  pointerId: number,
  options: {
    altKey?: boolean;
    button?: number;
    clientY?: number;
    shiftKey?: boolean;
  } = {},
) {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  });

  Object.defineProperties(event, {
    clientX: {
      value: clientX,
    },
    clientY: {
      value: options.clientY ?? 0,
    },
    altKey: {
      value: options.altKey ?? false,
    },
    button: {
      value: options.button ?? 0,
    },
    pointerId: {
      value: pointerId,
    },
    shiftKey: {
      value: options.shiftKey ?? false,
    },
  });
  fireEvent(element, event);
}

function fireChartInteractionEvent(
  element: Element,
  type: "click" | "contextmenu" | "pointermove",
  clientX: number,
  clientY: number,
) {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  });

  Object.defineProperties(event, {
    clientX: {
      value: clientX,
    },
    clientY: {
      value: clientY,
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

function stubImmediateAnimationFrame() {
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      callback(16);

      return 1;
    }),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
}

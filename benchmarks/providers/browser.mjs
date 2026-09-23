/* global document, requestAnimationFrame */
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { ChartSampleSparkline, ChartScatterSvg } from "../../dist/react.js";
import "../../dist/styles.css";
import {
  assertPoints,
  describe,
  fixture,
  interactionTarget,
  KINDS,
  phasesForKind,
  PROVIDERS,
  VIEW,
} from "./contract.mjs";

const host = document.getElementById("chart");
let state;
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const close = (actual, expected) => Math.abs(actual - expected) < 0.02;

function recordInteraction(index) {
  if (!state.interaction) return;
  state.interaction.count += 1;
  state.interaction.index = index;
  state.interaction.callbackAt ??= performance.now();
}

function prepare(data) {
  if (state.provider === "charts-svg") {
    return state.kind === "sparkline"
      ? data.points.map((point, index) => ({
          ...point,
          index,
          x0: point.x,
          x1: point.x,
          pointCount: 1,
        }))
      : {
          points: data.points.map((point, index) => ({ ...point, id: String(index), radius: 2.5 })),
          summary: { xDomain: data.xDomain, yDomain: data.yDomain },
        };
  }
  return state.provider === "echarts"
    ? data.points.map(({ x, y }) => [x, y])
    : data.points.map(({ x, y }) => ({ x, y }));
}

function reactView(data, prepared) {
  return state.kind === "sparkline"
    ? createElement(ChartSampleSparkline, { samples: prepared, domain: data.xDomain })
    : createElement(ChartScatterSvg, {
        series: prepared,
        xDomain: data.xDomain,
        yDomain: data.yDomain,
        xAxis: false,
        yAxis: false,
        legend: [],
        onPointSelect: (point) => recordInteraction(Number(point.id)),
        width: state.width,
        height: state.height,
      });
}

function renderSvg(data, prepared) {
  state.renderCalls += 1;
  flushSync(() => state.chart.render(reactView(data, prepared)));
}

function chartJsOptions(data) {
  return {
    animation: false,
    responsive: false,
    devicePixelRatio: VIEW.deviceScaleFactor,
    parsing: false,
    normalized: true,
    events: state.kind === "scatter" ? ["click"] : [],
    interaction: {
      mode: "nearest",
      intersect: false,
      axis: "xy",
    },
    onClick: (_event, elements) => {
      if (state.kind === "scatter" && elements[0]) recordInteraction(elements[0].index);
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      decimation: { enabled: false },
    },
    scales: {
      x: { type: "linear", min: data.xDomain[0], max: data.xDomain[1], display: false },
      y: { type: "linear", min: data.yDomain[0], max: data.yDomain[1], display: false },
    },
    elements: {
      line: { tension: 0, borderWidth: 2 },
      point: { radius: state.kind === "scatter" ? 2.5 : 0 },
    },
  };
}

function echartsOptions(data, prepared) {
  const axis = (domain) => ({
    type: "value",
    min: domain[0],
    max: domain[1],
    axisLabel: { show: false },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
  });
  return {
    animation: false,
    backgroundColor: "transparent",
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: axis(data.xDomain),
    yAxis: axis(data.yDomain),
    series: [
      {
        id: "benchmark-series",
        type: state.kind === "sparkline" ? "line" : "scatter",
        data: prepared,
        animation: false,
        progressive: 0,
        large: false,
        sampling: "none",
        showSymbol: false,
        symbolSize: 5,
        silent: state.kind !== "scatter",
        lineStyle: { color: "#2563eb", width: 2 },
        itemStyle: { color: "#2563eb", opacity: 0.6 },
        ...(state.kind === "sparkline"
          ? { areaStyle: { color: "#2563eb", opacity: 0.16, origin: data.yDomain[0] } }
          : {}),
      },
    ],
  };
}

function render(data, prepared, mount) {
  if (state.provider === "charts-svg") {
    if (mount) state.chart = createRoot(host);
    renderSvg(data, prepared);
  } else if (state.provider === "chartjs") {
    if (mount) {
      const canvas = document.createElement("canvas");
      canvas.width = state.width;
      canvas.height = state.height;
      host.append(canvas);
      state.chart = new globalThis.Chart(canvas, {
        type: state.kind === "sparkline" ? "line" : "scatter",
        data: {
          datasets: [
            {
              data: prepared,
              borderColor: "#2563eb",
              backgroundColor: "rgba(37,99,235,0.16)",
              fill: state.kind === "sparkline" ? "start" : false,
              borderWidth: 2,
            },
          ],
        },
        options: chartJsOptions(data),
      });
    } else {
      state.chart.data.datasets[0].data = prepared;
      for (const axis of ["x", "y"]) {
        state.chart.options.scales[axis].min = data[`${axis}Domain`][0];
        state.chart.options.scales[axis].max = data[`${axis}Domain`][1];
      }
      state.chart.update("none");
    }
  } else {
    if (mount) {
      state.chart = globalThis.echarts.init(host, null, {
        renderer: "canvas",
        width: state.width,
        height: state.height,
        devicePixelRatio: VIEW.deviceScaleFactor,
      });
      if (state.kind === "scatter") {
        state.chart.on("click", (event) => recordInteraction(event.dataIndex));
      }
    }
    state.chart.setOption(echartsOptions(data, prepared), { lazyUpdate: false });
    state.chart.getZr().flush();
  }
}

function selectionTarget(data) {
  const index = interactionTarget(data);
  const point = data.points[index];
  if (state.provider === "charts-svg") {
    const element = host.querySelectorAll("circle")[index];
    if (!element) throw new Error("Missing SVG interaction target");
    const bounds = element.getBoundingClientRect();
    return {
      element,
      index,
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
    };
  }
  if (state.provider === "chartjs") {
    const element = state.chart.getDatasetMeta(0).data[index];
    const canvas = state.chart.canvas;
    const bounds = canvas.getBoundingClientRect();
    if (!element || !Number.isFinite(element.x) || !Number.isFinite(element.y)) {
      throw new Error("Missing Chart.js interaction target");
    }
    return {
      element: canvas,
      index,
      clientX: bounds.left + element.x,
      clientY: bounds.top + element.y,
    };
  }
  const pixel = state.chart.convertToPixel({ seriesIndex: 0 }, [point.x, point.y]);
  const element = host.querySelector("canvas");
  if (
    !element ||
    !Array.isArray(pixel) ||
    !Number.isFinite(pixel[0]) ||
    !Number.isFinite(pixel[1])
  ) {
    throw new Error("Missing ECharts interaction target");
  }
  const bounds = element.getBoundingClientRect();
  return {
    element,
    index,
    clientX: bounds.left + pixel[0],
    clientY: bounds.top + pixel[1],
  };
}

function armSelection(target) {
  let resolveSettled;
  const interaction = {
    apiAt: null,
    callbackAt: null,
    count: 0,
    firstFrameAt: null,
    index: null,
    settledAt: null,
    targetIndex: target.index,
  };
  interaction.settled = new Promise((resolve) => {
    resolveSettled = resolve;
  });
  document.addEventListener(
    "click",
    () => {
      interaction.startedAt = performance.now();
      requestAnimationFrame(() => {
        interaction.firstFrameAt = performance.now();
        requestAnimationFrame(() => {
          interaction.settledAt = performance.now();
          resolveSettled();
        });
      });
    },
    { capture: true, once: true },
  );
  document.addEventListener(
    "click",
    () => {
      interaction.apiAt = performance.now();
    },
    { once: true },
  );
  state.interaction = interaction;
}

function checkSvg(data) {
  const svg = host.querySelector("svg");
  if (!svg) throw new Error("SVG was not mounted");
  const bounds = svg.getBoundingClientRect();
  if (!close(bounds.width, state.width) || !close(bounds.height, state.height)) {
    throw new Error("Incorrect SVG dimensions");
  }
  let rendered;
  if (state.kind === "scatter") {
    const circles = [...svg.querySelectorAll("circle")];
    if (circles.length !== data.points.length) throw new Error("Incorrect rendered circle count");
    rendered = circles
      .map((circle, index) => {
        const point = data.points[index];
        const x =
          28 +
          ((point.x - data.xDomain[0]) / (data.xDomain[1] - data.xDomain[0])) * (state.width - 52);
        const y =
          20 +
          (1 - (point.y - data.yDomain[0]) / (data.yDomain[1] - data.yDomain[0])) *
            (state.height - 48);
        if (
          !close(Number(circle.getAttribute("cx")), x) ||
          !close(Number(circle.getAttribute("cy")), y)
        ) {
          throw new Error(`Stale scatter geometry at ${index}`);
        }
        return `${circle.getAttribute("cx")},${circle.getAttribute("cy")}`;
      })
      .join(" ");
  } else {
    const line = svg.querySelector('polyline[stroke="var(--primary)"]');
    if (!line || line.points.numberOfItems !== data.points.length)
      throw new Error("Incorrect polyline size");
    for (let index = 0; index < data.points.length; index += 1) {
      const point = data.points[index];
      const renderedPoint = line.points.getItem(index);
      const x =
        ((point.x - data.xDomain[0]) / Math.max(1, data.xDomain[1] - data.xDomain[0])) * 100;
      const y =
        92 - ((point.y - data.yDomain[0]) / Math.max(1, data.yDomain[1] - data.yDomain[0])) * 84;
      if (!close(renderedPoint.x, x) || !close(renderedPoint.y, y))
        throw new Error(`Stale sparkline geometry at ${index}`);
    }
    rendered = line.getAttribute("points");
  }
  return rendered;
}

function checkCanvas(data) {
  if (state.provider === "chartjs") {
    assertPoints(state.chart.data.datasets[0].data, data.points);
    const elements = state.chart.getDatasetMeta(0).data;
    if (elements.length !== data.points.length)
      throw new Error("Incorrect Chart.js rendered element count");
    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];
      const point = data.points[index];
      if (
        element.skip ||
        !close(element.x, state.chart.scales.x.getPixelForValue(point.x)) ||
        !close(element.y, state.chart.scales.y.getPixelForValue(point.y))
      ) {
        throw new Error(`Stale Chart.js geometry at ${index}`);
      }
    }
  } else {
    const series = state.chart.getOption().series[0];
    assertPoints(
      series.data.map(([x, y]) => ({ x, y })),
      data.points,
    );
    if (state.kind === "sparkline" && series.areaStyle.origin !== data.yDomain[0]) {
      throw new Error("ECharts fill must use the same lower-domain origin");
    }
  }
  let colored = 0;
  let hash = 2166136261;
  for (const canvas of host.querySelectorAll("canvas")) {
    if (canvas.width !== state.width || canvas.height !== state.height)
      throw new Error("Incorrect canvas dimensions");
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    for (let index = 0; index < pixels.length; index += 4) {
      if (
        pixels[index + 3] &&
        pixels[index + 2] > pixels[index] + 30 &&
        pixels[index + 2] > pixels[index + 1] + 30
      )
        colored += 1;
      hash =
        Math.imul(
          hash ^
            pixels[index] ^
            (pixels[index + 1] << 8) ^
            (pixels[index + 2] << 16) ^
            pixels[index + 3],
          16777619,
        ) >>> 0;
    }
  }
  if (colored < 20) throw new Error("Canvas has no visible data marks");
  return String(hash);
}

globalThis.providerBench = {
  setup(provider, kind, size, seed) {
    if (!PROVIDERS.includes(provider) || !KINDS.includes(kind))
      throw new Error("Unknown provider or scenario");
    const initial = fixture(size, seed);
    const replacement = fixture(size, seed, 1);
    const windowed = describe(replacement.points.slice(Math.floor(size / 4), Math.floor(size / 2)));
    state = {
      provider,
      kind,
      initial,
      replacement,
      windowed,
      phase: 0,
      width: VIEW.width,
      height: VIEW.height,
    };
    host.className = provider === "charts-svg" ? "charts-provider" : "";
    host.style.width = `${state.width}px`;
    host.style.height = `${state.height}px`;
    return [initial.checksum, replacement.checksum, windowed.checksum];
  },
  beginSelect() {
    if ("select" !== phasesForKind(state.kind, state.initial.points.length)[state.phase++]) {
      throw new Error("Unexpected phase order");
    }
    state.renderCalls = 0;
    const target = selectionTarget(state.initial);
    armSelection(target);
    return {
      clientX: target.clientX,
      clientY: target.clientY,
      index: target.index,
    };
  },
  async endSelect() {
    const data = state.initial;
    const interaction = state.interaction;
    if (!interaction) throw new Error("Selection was not armed");
    await interaction.settled;
    if (
      interaction.startedAt === null ||
      interaction.apiAt === null ||
      interaction.firstFrameAt === null ||
      interaction.settledAt === null ||
      interaction.callbackAt === null
    ) {
      throw new Error("Selection timing evidence is incomplete");
    }
    if (interaction.count !== 1 || interaction.index !== interaction.targetIndex) {
      throw new Error("Provider did not report the selected scatter point exactly once");
    }
    if (state.provider === "charts-svg" && state.renderCalls !== 0) {
      throw new Error("Selection triggered unexpected SVG render work");
    }
    const fingerprint = state.provider === "charts-svg" ? checkSvg(data) : checkCanvas(data);
    state.fingerprint = fingerprint;
    state.interaction = null;
    return {
      apiMs: interaction.apiAt - interaction.startedAt,
      firstFrameMs: interaction.firstFrameAt - interaction.startedAt,
      settledMs: interaction.settledAt - interaction.startedAt,
      prepareMs: 0,
      interactionMs: interaction.callbackAt - interaction.startedAt,
      interactionCount: interaction.count,
      interactionIndex: interaction.index,
      checked: true,
      renderCalls: state.renderCalls,
      pointCount: data.points.length,
      checksum: data.checksum,
      domNodes: host.querySelectorAll("*").length,
    };
  },
  async step(phase) {
    if (phase === "select") throw new Error("Selection requires real browser input");
    if (phase !== phasesForKind(state.kind, state.initial.points.length)[state.phase++]) {
      throw new Error("Unexpected phase order");
    }
    state.renderCalls = 0;
    state.interaction = null;
    const data = phase === "mount" ? state.initial : phase === "replace" ? state.replacement : state.windowed;
    const beforePrepare = performance.now();
    const prepared = ["mount", "replace", "window"].includes(phase)
      ? prepare(data)
      : state.prepared;
    const prepareMs = performance.now() - beforePrepare;
    const started = performance.now();
    if (phase === "resize") {
      state.width = VIEW.resized;
      state.height = VIEW.resized;
      host.style.width = `${state.width}px`;
      host.style.height = `${state.height}px`;
      if (state.provider === "charts-svg") {
        // The sparkline's fixed viewBox scales through CSS, without new props.
        // Only the scatter needs new pixel-space geometry for width/height.
        if (state.kind === "scatter") renderSvg(data, prepared);
      } else if (state.provider === "chartjs") state.chart.resize(state.width, state.height);
      else {
        state.chart.resize({ width: state.width, height: state.height });
        state.chart.getZr().flush();
      }
    } else if (phase === "destroy") {
      if (state.provider === "charts-svg") flushSync(() => state.chart.unmount());
      else if (state.provider === "chartjs") state.chart.destroy();
      else state.chart.dispose();
      // Chart.js deliberately leaves ownership of its canvas with the caller.
      if (state.provider === "chartjs") host.replaceChildren();
    } else render(data, prepared, phase === "mount");
    const apiMs = performance.now() - started;
    await frame();
    const firstFrameMs = performance.now() - started;
    await frame();
    const settledMs = performance.now() - started;
    // All assertions, pixel reads, and DOM counts are OUTSIDE measured intervals.
    if (state.provider === "charts-svg") {
      const expectedCalls =
        phase === "destroy" || (phase === "resize" && state.kind === "sparkline") ? 0 : 1;
      if (state.renderCalls !== expectedCalls) throw new Error("Unexpected SVG render work");
    }
    let fingerprint = "destroyed";
    if (phase === "destroy") {
      if (host.childElementCount) throw new Error("Provider did not clean up its DOM");
    } else {
      fingerprint = state.provider === "charts-svg" ? checkSvg(data) : checkCanvas(data);
      if (["replace", "window"].includes(phase) && fingerprint === state.fingerprint) {
        throw new Error("Rendered output did not change");
      }
    }
    state.prepared = prepared;
    state.fingerprint = fingerprint;
    return {
      apiMs,
      firstFrameMs,
      settledMs,
      prepareMs,
      interactionMs: null,
      interactionCount: 0,
      interactionIndex: null,
      checked: true,
      renderCalls: state.renderCalls,
      pointCount: phase === "destroy" ? 0 : data.points.length,
      checksum: data.checksum,
      domNodes: host.querySelectorAll("*").length,
    };
  }};

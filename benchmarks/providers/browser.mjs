/* global document, requestAnimationFrame */
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { ChartSampleSparkline, ChartScatterSvg } from "../../dist/react.js";
import "../../dist/styles.css";
import { assertPoints, describe, fixture, KINDS, PHASES, PROVIDERS, VIEW } from "./contract.mjs";

const host = document.getElementById("chart");
let state;
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const close = (actual, expected) => Math.abs(actual - expected) < 0.02;

function prepare(data) {
  if (state.provider === "charts-svg") {
    return state.kind === "sparkline"
      ? data.points.map((point, index) => ({ ...point, index, x0: point.x, x1: point.x, pointCount: 1 }))
      : { points: data.points.map((point, index) => ({ ...point, id: String(index), radius: 2.5 })),
          summary: { xDomain: data.xDomain, yDomain: data.yDomain } };
  }
  return state.provider === "echarts"
    ? data.points.map(({ x, y }) => [x, y])
    : data.points.map(({ x, y }) => ({ x, y }));
}

function reactView(data, prepared) {
  return state.kind === "sparkline"
    ? createElement(ChartSampleSparkline, { samples: prepared, domain: data.xDomain })
    : createElement(ChartScatterSvg, {
        series: prepared, xDomain: data.xDomain, yDomain: data.yDomain,
        xAxis: false, yAxis: false, legend: [], width: state.width, height: state.height,
      });
}

function chartJsOptions(data) {
  return {
    animation: false, responsive: false, devicePixelRatio: VIEW.deviceScaleFactor,
    parsing: false, normalized: true, events: [],
    plugins: { legend: { display: false }, tooltip: { enabled: false }, decimation: { enabled: false } },
    scales: {
      x: { type: "linear", min: data.xDomain[0], max: data.xDomain[1], display: false },
      y: { type: "linear", min: data.yDomain[0], max: data.yDomain[1], display: false },
    },
    elements: { line: { tension: 0, borderWidth: 2 }, point: { radius: state.kind === "scatter" ? 2.5 : 0 } },
  };
}

function echartsOptions(data, prepared) {
  const axis = (domain) => ({
    type: "value", min: domain[0], max: domain[1],
    axisLabel: { show: false }, axisLine: { show: false },
    axisTick: { show: false }, splitLine: { show: false },
  });
  return {
    animation: false, backgroundColor: "transparent",
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: axis(data.xDomain), yAxis: axis(data.yDomain),
    series: [{
      id: "benchmark-series", type: state.kind === "sparkline" ? "line" : "scatter",
      data: prepared, animation: false, progressive: 0, large: false, sampling: "none",
      showSymbol: false, symbolSize: 5, silent: true,
      lineStyle: { color: "#2563eb", width: 2 },
      itemStyle: { color: "#2563eb", opacity: 0.6 },
      ...(state.kind === "sparkline" ? { areaStyle: { color: "#2563eb", opacity: 0.16 } } : {}),
    }],
  };
}

function render(data, prepared, mount) {
  if (state.provider === "charts-svg") {
    if (mount) state.chart = createRoot(host);
    flushSync(() => state.chart.render(reactView(data, prepared)));
  } else if (state.provider === "chartjs") {
    if (mount) {
      const canvas = document.createElement("canvas");
      canvas.width = state.width;
      canvas.height = state.height;
      host.append(canvas);
      state.chart = new globalThis.Chart(canvas, {
        type: state.kind === "sparkline" ? "line" : "scatter",
        data: { datasets: [{ data: prepared, borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,0.16)",
          fill: state.kind === "sparkline" ? "start" : false, borderWidth: 2 }] },
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
    if (mount) state.chart = globalThis.echarts.init(host, null, {
      renderer: "canvas", width: state.width, height: state.height, devicePixelRatio: VIEW.deviceScaleFactor,
    });
    state.chart.setOption(echartsOptions(data, prepared), { lazyUpdate: false });
    state.chart.getZr().flush();
  }
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
    rendered = circles.map((circle, index) => {
      const point = data.points[index];
      const x = 28 + ((point.x - data.xDomain[0]) / (data.xDomain[1] - data.xDomain[0])) * (state.width - 52);
      const y = 20 + (1 - (point.y - data.yDomain[0]) / (data.yDomain[1] - data.yDomain[0])) * (state.height - 48);
      if (!close(Number(circle.getAttribute("cx")), x) || !close(Number(circle.getAttribute("cy")), y)) {
        throw new Error(`Stale scatter geometry at ${index}`);
      }
      return `${circle.getAttribute("cx")},${circle.getAttribute("cy")}`;
    }).join(" ");
  } else {
    const line = svg.querySelector('polyline[stroke="var(--primary)"]');
    if (!line || line.points.numberOfItems !== data.points.length) throw new Error("Incorrect polyline size");
    for (let index = 0; index < data.points.length; index += 1) {
      const point = data.points[index];
      const renderedPoint = line.points.getItem(index);
      const x = ((point.x - data.xDomain[0]) / Math.max(1, data.xDomain[1] - data.xDomain[0])) * 100;
      const y = 92 - ((point.y - data.yDomain[0]) / Math.max(1, data.yDomain[1] - data.yDomain[0])) * 84;
      if (!close(renderedPoint.x, x) || !close(renderedPoint.y, y)) throw new Error(`Stale sparkline geometry at ${index}`);
    }
    rendered = line.getAttribute("points");
  }
  return rendered;
}

function checkCanvas(data) {
  if (state.provider === "chartjs") {
    assertPoints(state.chart.data.datasets[0].data, data.points);
    const elements = state.chart.getDatasetMeta(0).data;
    if (elements.length !== data.points.length) throw new Error("Incorrect Chart.js rendered element count");
    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];
      const point = data.points[index];
      if (element.skip || !close(element.x, state.chart.scales.x.getPixelForValue(point.x)) ||
          !close(element.y, state.chart.scales.y.getPixelForValue(point.y))) {
        throw new Error(`Stale Chart.js geometry at ${index}`);
      }
    }
  } else {
    assertPoints(state.chart.getOption().series[0].data.map(([x, y]) => ({ x, y })), data.points);
  }
  let colored = 0;
  let hash = 2166136261;
  for (const canvas of host.querySelectorAll("canvas")) {
    if (canvas.width !== state.width || canvas.height !== state.height) throw new Error("Incorrect canvas dimensions");
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] && pixels[index + 2] > pixels[index] + 30 && pixels[index + 2] > pixels[index + 1] + 30) colored += 1;
      hash = Math.imul(hash ^ pixels[index] ^ (pixels[index + 1] << 8) ^ (pixels[index + 2] << 16) ^ pixels[index + 3], 16777619) >>> 0;
    }
  }
  if (colored < 20) throw new Error("Canvas has no visible data marks");
  return String(hash);
}

globalThis.providerBench = {
  setup(provider, kind, size, seed) {
    if (!PROVIDERS.includes(provider) || !KINDS.includes(kind)) throw new Error("Unknown provider or scenario");
    const initial = fixture(size, seed);
    const replacement = fixture(size, seed, 1);
    const windowed = describe(replacement.points.slice(Math.floor(size / 4), Math.floor(size / 2)));
    state = { provider, kind, initial, replacement, windowed, phase: 0, width: VIEW.width, height: VIEW.height };
    host.className = provider === "charts-svg" ? "charts-provider" : "";
    host.style.width = `${state.width}px`;
    host.style.height = `${state.height}px`;
    return [initial.checksum, replacement.checksum, windowed.checksum];
  },
  async step(phase) {
    if (phase !== PHASES[state.phase++]) throw new Error("Unexpected phase order");
    const data = phase === "mount" ? state.initial : phase === "replace" ? state.replacement : state.windowed;
    const beforePrepare = performance.now();
    const prepared = ["mount", "replace", "window"].includes(phase) ? prepare(data) : state.prepared;
    const prepareMs = performance.now() - beforePrepare;
    const started = performance.now();
    if (phase === "resize") {
      state.width = VIEW.resized;
      state.height = VIEW.resized;
      host.style.width = `${state.width}px`;
      host.style.height = `${state.height}px`;
      if (state.provider === "charts-svg") flushSync(() => state.chart.render(reactView(data, prepared)));
      else if (state.provider === "chartjs") state.chart.resize(state.width, state.height);
      else { state.chart.resize({ width: state.width, height: state.height }); state.chart.getZr().flush(); }
    } else if (phase === "destroy") {
      if (state.provider === "charts-svg") flushSync(() => state.chart.unmount());
      else if (state.provider === "chartjs") state.chart.destroy();
      else state.chart.dispose();
      // Chart.js deliberately leaves ownership of its canvas with the caller.
      if (state.provider === "chartjs") host.replaceChildren();
    } else render(data, prepared, phase === "mount");
    const apiMs = performance.now() - started;
    await frame();
    await frame();
    const settledMs = performance.now() - started;
    // All assertions, pixel reads, and DOM counts are OUTSIDE measured intervals.
    let fingerprint = "destroyed";
    if (phase === "destroy") {
      if (host.childElementCount) throw new Error("Provider did not clean up its DOM");
    } else {
      fingerprint = state.provider === "charts-svg" ? checkSvg(data) : checkCanvas(data);
      if (["replace", "window"].includes(phase) && fingerprint === state.fingerprint) throw new Error("Rendered output did not change");
    }
    state.prepared = prepared;
    state.fingerprint = fingerprint;
    return { apiMs, settledMs, prepareMs, checked: true, pointCount: phase === "destroy" ? 0 : data.points.length,
      checksum: data.checksum, domNodes: host.querySelectorAll("*").length };
  },
};

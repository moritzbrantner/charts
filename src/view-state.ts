import type { ChartValueMode } from "./density";

export type ChartViewState = {
  domain?: [number, number];
  hiddenSeries?: string[];
  selectedSampleIndex?: number | null;
  valueMode?: ChartValueMode;
};

export function encodeChartViewState(state: ChartViewState): string {
  const params = new URLSearchParams();

  if (state.domain && isFiniteDomain(state.domain)) {
    params.set("domain", `${state.domain[0]},${state.domain[1]}`);
  }
  if (state.hiddenSeries?.length) {
    params.set("hidden", [...new Set(state.hiddenSeries)].sort().join(","));
  }
  if (state.selectedSampleIndex != null && Number.isInteger(state.selectedSampleIndex)) {
    params.set("sample", String(state.selectedSampleIndex));
  }
  if (state.valueMode) {
    params.set("mode", state.valueMode);
  }

  return params.toString();
}

export function decodeChartViewState(input: string | URLSearchParams): ChartViewState {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  const state: ChartViewState = {};
  const domain = parseDomain(params.get("domain"));
  const hidden = params
    .get("hidden")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const sample = Number(params.get("sample"));
  const mode = params.get("mode");

  if (domain) {
    state.domain = domain;
  }
  if (hidden?.length) {
    state.hiddenSeries = [...new Set(hidden)].sort();
  }
  if (params.has("sample") && Number.isInteger(sample) && sample >= 0) {
    state.selectedSampleIndex = sample;
  }
  if (isChartValueMode(mode)) {
    state.valueMode = mode;
  }

  return state;
}

function parseDomain(value: string | null): [number, number] | null {
  if (!value) {
    return null;
  }
  const parts = value.split(",");
  if (parts.length !== 2) {
    return null;
  }
  const domain: [number, number] = [Number(parts[0]), Number(parts[1])];
  return isFiniteDomain(domain) ? domain : null;
}

function isFiniteDomain(domain: [number, number]) {
  return Number.isFinite(domain[0]) && Number.isFinite(domain[1]) && domain[0] < domain[1];
}

function isChartValueMode(value: string | null): value is ChartValueMode {
  return (
    value === "average" ||
    value === "count" ||
    value === "max" ||
    value === "min" ||
    value === "sum" ||
    value === "p10" ||
    value === "p25" ||
    value === "p50" ||
    value === "p75" ||
    value === "p90" ||
    value === "p95" ||
    value === "p99"
  );
}

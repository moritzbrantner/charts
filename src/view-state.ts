import type { ChartValueMode } from "./density";

export type ChartViewState = {
  domain?: [number, number];
  hiddenSeriesIds?: readonly string[];
  selectedPointId?: string | null;
  valueMode?: ChartValueMode;
};

const DOMAIN_KEY = "chart.domain";
const HIDDEN_SERIES_KEY = "chart.hidden";
const SELECTED_POINT_KEY = "chart.selected";
const VALUE_MODE_KEY = "chart.value";

export function encodeChartViewState(state: ChartViewState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.domain && state.domain.every(Number.isFinite)) {
    params.set(DOMAIN_KEY, `${state.domain[0]},${state.domain[1]}`);
  }

  if (state.hiddenSeriesIds?.length) {
    params.set(HIDDEN_SERIES_KEY, [...new Set(state.hiddenSeriesIds)].sort().join(","));
  }

  if (state.selectedPointId) {
    params.set(SELECTED_POINT_KEY, state.selectedPointId);
  }

  if (state.valueMode) {
    params.set(VALUE_MODE_KEY, state.valueMode);
  }

  return params;
}

export function decodeChartViewState(input: URLSearchParams | string): ChartViewState {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  const domain = readDomain(params.get(DOMAIN_KEY));
  const hiddenSeriesIds = readCsv(params.get(HIDDEN_SERIES_KEY));
  const selectedPointId = params.get(SELECTED_POINT_KEY);
  const valueMode = readValueMode(params.get(VALUE_MODE_KEY));

  return {
    ...(domain ? { domain } : {}),
    ...(hiddenSeriesIds.length ? { hiddenSeriesIds } : {}),
    ...(selectedPointId ? { selectedPointId } : {}),
    ...(valueMode ? { valueMode } : {}),
  };
}

function readDomain(value: string | null): [number, number] | null {
  if (!value) {
    return null;
  }

  const [left, right, ...rest] = value.split(",").map(Number);

  if (rest.length > 0 || !Number.isFinite(left) || !Number.isFinite(right)) {
    return null;
  }

  return [left, right];
}

function readCsv(value: string | null): string[] {
  return value
    ? [
        ...new Set(
          value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ].sort()
    : [];
}

function readValueMode(value: string | null): ChartValueMode | null {
  switch (value) {
    case "average":
    case "count":
    case "max":
    case "min":
    case "p10":
    case "p25":
    case "p50":
    case "p75":
    case "p90":
    case "p95":
    case "p99":
    case "sum":
      return value;
    default:
      return null;
  }
}

import { formatNullableCompactNumber } from "./shared";

import type { ChartValueMode, ChartValueModeDefinition } from "./types";

export const CHART_VALUE_MODE_DEFINITIONS: readonly ChartValueModeDefinition[] = [
  {
    axisLabel: "Average y",
    color: "var(--chart-1)",
    description: "Mean y value across every source point in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "average",
    label: "Average",
    renderer: "line",
  },
  {
    axisLabel: "Point count",
    color: "var(--chart-4)",
    description: "Number of source points represented by each bin.",
    formatValue: formatNullableCompactNumber,
    id: "count",
    label: "Count",
    renderer: "bar",
  },
  {
    axisLabel: "Maximum y",
    color: "var(--chart-2)",
    description: "Highest y value found inside each bin.",
    formatValue: formatNullableCompactNumber,
    id: "max",
    label: "Maximum",
    renderer: "line",
  },
  {
    axisLabel: "Minimum y",
    color: "var(--chart-3)",
    description: "Lowest y value found inside each bin.",
    formatValue: formatNullableCompactNumber,
    id: "min",
    label: "Minimum",
    renderer: "line",
  },
  {
    axisLabel: "Sum y",
    color: "var(--chart-5)",
    description: "Total y value across every source point in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "sum",
    label: "Sum",
    renderer: "line",
  },
  {
    axisLabel: "Median y",
    color: "var(--chart-2)",
    description: "50th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p50",
    label: "Median",
    renderer: "line",
  },
  {
    axisLabel: "75th percentile y",
    color: "var(--chart-3)",
    description: "75th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p75",
    label: "P75",
    renderer: "line",
  },
  {
    axisLabel: "90th percentile y",
    color: "var(--chart-4)",
    description: "90th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p90",
    label: "P90",
    renderer: "line",
  },
  {
    axisLabel: "95th percentile y",
    color: "var(--chart-5)",
    description: "95th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p95",
    label: "P95",
    renderer: "line",
  },
  {
    axisLabel: "99th percentile y",
    color: "var(--chart-1)",
    description: "99th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p99",
    label: "P99",
    renderer: "line",
  },
];

const EXTRA_CHART_VALUE_MODE_DEFINITIONS: readonly ChartValueModeDefinition[] = [
  {
    axisLabel: "10th percentile y",
    color: "var(--chart-3)",
    description: "10th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p10",
    label: "P10",
    renderer: "line",
  },
  {
    axisLabel: "25th percentile y",
    color: "var(--chart-4)",
    description: "25th percentile y value across source points in each bin.",
    formatValue: formatNullableCompactNumber,
    id: "p25",
    label: "P25",
    renderer: "line",
  },
];

export function getChartValueModeDefinition(mode: ChartValueMode): ChartValueModeDefinition {
  const definition = [...CHART_VALUE_MODE_DEFINITIONS, ...EXTRA_CHART_VALUE_MODE_DEFINITIONS].find(
    (item) => item.id === mode,
  );

  if (!definition) {
    throw new Error(`Unknown chart value mode: ${mode}`);
  }

  return definition;
}

export function getChartValueModeDefinitions(
  modes?: readonly ChartValueMode[],
): ChartValueModeDefinition[] {
  if (!modes) {
    return [...CHART_VALUE_MODE_DEFINITIONS];
  }

  return modes.map((mode) => getChartValueModeDefinition(mode));
}

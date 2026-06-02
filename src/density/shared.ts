import type { BinnedSeriesIndexOptions } from "../data-density";
import type {
  BinnedSeriesBackend,
  ChartDensityCacheOptions,
  ChartDensityWarmupScheduler,
  ChartMetricRecord,
  ChartPercentileMode,
} from "./types";

export type StaticChartDensityIndexOptions<TProperties = Record<string, unknown>> =
  BinnedSeriesIndexOptions<TProperties> & {
    backend?: BinnedSeriesBackend;
    cache?: ChartDensityCacheOptions;
    rangeAggregate?: boolean;
  };

export function normalizeChartDomain(domain: [number, number]): [number, number] {
  const left = Number.isFinite(domain[0]) ? domain[0] : 0;
  const right = Number.isFinite(domain[1]) ? domain[1] : left;

  return left <= right ? [left, right] : [right, left];
}

export function normalizeChartMetrics(metrics: ChartMetricRecord | undefined): ChartMetricRecord {
  if (!metrics) {
    return {};
  }

  return Object.fromEntries(Object.entries(metrics).filter((entry) => Number.isFinite(entry[1])));
}

export function createZeroMetricRecord(metricKeys: string[]) {
  return Object.fromEntries(metricKeys.map((metricKey) => [metricKey, 0]));
}

export function createNullPercentileRecord(): Record<ChartPercentileMode, number | null> {
  return {
    p10: null,
    p25: null,
    p50: null,
    p75: null,
    p90: null,
    p95: null,
    p99: null,
  };
}

export function normalizeNumericValue(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.floor(value)));
}

export function formatNullableCompactNumber(value: number | null) {
  if (value === null) {
    return "n/a";
  }

  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
  }).format(value);
}

export function scheduleChartDensityWarmup(
  scheduler: ChartDensityWarmupScheduler | undefined,
  warmup: () => void,
) {
  if (scheduler) {
    scheduler(warmup);
    return;
  }

  const runtime = globalThis as {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => unknown;
    setTimeout?: (callback: () => void, delay: number) => unknown;
  };

  if (typeof runtime.requestIdleCallback === "function") {
    runtime.requestIdleCallback(warmup, { timeout: 1_000 });
    return;
  }

  const timeoutHandle = runtime.setTimeout?.(warmup, 0);
  const maybeNodeTimer = timeoutHandle as { unref?: () => void } | undefined;

  maybeNodeTimer?.unref?.();
}

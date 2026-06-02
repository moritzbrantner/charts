import { isFiniteNumber, isNonEmptyChartSample, isNumber, now } from "./shared";

import type { ChartDensityIndex, ChartDensityQuery, ChartDensitySample } from "../density";
import type { MeasuredChartSeries } from "./types";

export function measureChartSeries<TProperties = Record<string, unknown>>(
  index: ChartDensityIndex<TProperties>,
  query: ChartDensityQuery,
): MeasuredChartSeries<TProperties> {
  const startedAt = now();
  const series = index.getChartSeries(query);

  return {
    queryMs: now() - startedAt,
    series,
  };
}

export function getChartSampleYBounds<TProperties = Record<string, unknown>>(
  samples: Array<ChartDensitySample<TProperties>>,
): {
  maxY: number | null;
  minY: number | null;
} {
  const values = samples.flatMap((sample) => [sample.minY, sample.maxY]).filter(isNumber);

  if (values.length === 0) {
    return {
      maxY: null,
      minY: null,
    };
  }

  return {
    maxY: Math.max(...values),
    minY: Math.min(...values),
  };
}

export function getChartDataYBounds(
  rows: readonly Record<string, unknown>[],
  dataKeys: readonly string[],
): {
  maxY: number | null;
  minY: number | null;
} {
  const values = rows.flatMap((row) =>
    dataKeys.flatMap((dataKey) => {
      const value = row[dataKey];

      return isFiniteNumber(value) ? [value] : [];
    }),
  );

  if (values.length === 0) {
    return {
      maxY: null,
      minY: null,
    };
  }

  return {
    maxY: Math.max(...values),
    minY: Math.min(...values),
  };
}

export function getNearestChartSample<TProperties>(
  samples: readonly ChartDensitySample<TProperties>[],
  x: number,
  options: {
    isSampleSelectable?: (sample: ChartDensitySample<TProperties>) => boolean;
  } = {},
): ChartDensitySample<TProperties> | null {
  const isSampleSelectable = options.isSampleSelectable ?? isNonEmptyChartSample;
  let nearest: ChartDensitySample<TProperties> | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const sample of samples) {
    if (!isSampleSelectable(sample)) {
      continue;
    }

    const distance = Math.abs(sample.x - x);

    if (distance < nearestDistance) {
      nearest = sample;
      nearestDistance = distance;
    }
  }

  return nearest;
}

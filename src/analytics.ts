import type { ChartDensitySample, ChartValueMode } from "./density";

export type ChartSampleValueAccessor<TProperties = Record<string, unknown>> =
  | ChartValueMode
  | { metric: string }
  | ((sample: ChartDensitySample<TProperties>) => number | null);

export type ChartDerivedPoint<TProperties = Record<string, unknown>> = {
  index: number;
  sample: ChartDensitySample<TProperties>;
  value: number | null;
  x: number;
  x0: number;
  x1: number;
};

export type ChartRollingStatistic = "average" | "sum" | "min" | "max";

export type ChartRollingSeriesOptions<TProperties = Record<string, unknown>> = {
  accessor?: ChartSampleValueAccessor<TProperties>;
  minPoints?: number;
  statistic?: ChartRollingStatistic;
  windowSize: number;
};

export type ChartDeltaSeriesOptions<TProperties = Record<string, unknown>> = {
  accessor?: ChartSampleValueAccessor<TProperties>;
  mode?: "absolute" | "percent";
  offset?: number;
};

export type ChartThresholdAnnotation<TProperties = Record<string, unknown>> = {
  direction: "above" | "below";
  endIndex: number;
  endX: number;
  sampleCount: number;
  samples: Array<ChartDensitySample<TProperties>>;
  startIndex: number;
  startX: number;
  threshold: number;
};

export type ChartAnomalyAnnotation<TProperties = Record<string, unknown>> = {
  baseline: number;
  deviation: number;
  index: number;
  sample: ChartDensitySample<TProperties>;
  score: number;
  value: number;
  x: number;
};

export type ChartAnomalyOptions<TProperties = Record<string, unknown>> = {
  accessor?: ChartSampleValueAccessor<TProperties>;
  minSamples?: number;
  sensitivity?: number;
};

export function getChartSampleValue<TProperties>(
  sample: ChartDensitySample<TProperties>,
  accessor?: ChartSampleValueAccessor<TProperties>,
): number | null {
  if (!accessor) {
    return sample.y;
  }

  if (typeof accessor === "function") {
    return normalizeAnalyticsValue(accessor(sample));
  }

  if (typeof accessor === "object") {
    return normalizeAnalyticsValue(sample.metrics[accessor.metric]);
  }

  switch (accessor) {
    case "average":
      return sample.averageY;
    case "count":
      return sample.pointCount > 0 ? sample.pointCount : null;
    case "max":
      return sample.maxY;
    case "min":
      return sample.minY;
    case "sum":
      return sample.pointCount > 0 ? sample.sumY : null;
    case "p10":
      return sample.p10;
    case "p25":
      return sample.p25;
    case "p50":
      return sample.p50;
    case "p75":
      return sample.p75;
    case "p90":
      return sample.p90;
    case "p95":
      return sample.p95;
    case "p99":
      return sample.p99;
  }
}

export function createRollingChartSeries<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  options: ChartRollingSeriesOptions<TProperties>,
): Array<ChartDerivedPoint<TProperties>> {
  const windowSize = Math.max(1, Math.floor(options.windowSize));
  const minPoints = Math.max(1, Math.floor(options.minPoints ?? 1));
  const before = Math.floor((windowSize - 1) / 2);
  const after = windowSize - before - 1;
  const values = samples.map((sample) => getChartSampleValue(sample, options.accessor));
  const statistic = options.statistic ?? "average";

  return samples.map((sample, sampleIndex) => {
    const startIndex = Math.max(0, sampleIndex - before);
    const endIndex = Math.min(samples.length - 1, sampleIndex + after);
    const windowValues = values
      .slice(startIndex, endIndex + 1)
      .filter((value): value is number => value !== null);

    return createDerivedPoint(
      sample,
      windowValues.length >= minPoints ? readRollingStatistic(windowValues, statistic) : null,
    );
  });
}

export function createDeltaChartSeries<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  options: ChartDeltaSeriesOptions<TProperties> = {},
): Array<ChartDerivedPoint<TProperties>> {
  const mode = options.mode ?? "absolute";
  const offset = Math.max(1, Math.floor(options.offset ?? 1));
  const values = samples.map((sample) => getChartSampleValue(sample, options.accessor));

  return samples.map((sample, sampleIndex) => {
    const value = values[sampleIndex] ?? null;
    const previousValue = values[sampleIndex - offset] ?? null;

    if (value === null || previousValue === null) {
      return createDerivedPoint(sample, null);
    }

    if (mode === "percent") {
      return createDerivedPoint(
        sample,
        previousValue === 0 ? null : ((value - previousValue) / Math.abs(previousValue)) * 100,
      );
    }

    return createDerivedPoint(sample, value - previousValue);
  });
}

export function createCumulativeChartSeries<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  accessor?: ChartSampleValueAccessor<TProperties>,
): Array<ChartDerivedPoint<TProperties>> {
  let total = 0;

  return samples.map((sample) => {
    const value = getChartSampleValue(sample, accessor);

    if (value === null) {
      return createDerivedPoint(sample, null);
    }

    total += value;

    return createDerivedPoint(sample, total);
  });
}

export function getChartThresholdAnnotations<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  threshold: number,
  options: {
    accessor?: ChartSampleValueAccessor<TProperties>;
    direction?: "above" | "below";
  } = {},
): Array<ChartThresholdAnnotation<TProperties>> {
  const direction = options.direction ?? "above";
  const annotations: Array<ChartThresholdAnnotation<TProperties>> = [];
  let runSamples: Array<ChartDensitySample<TProperties>> = [];

  for (const sample of samples) {
    const value = getChartSampleValue(sample, options.accessor);
    const matches =
      value !== null && (direction === "above" ? value > threshold : value < threshold);

    if (matches) {
      runSamples.push(sample);
      continue;
    }

    if (runSamples.length > 0) {
      annotations.push(createThresholdAnnotation(runSamples, threshold, direction));
      runSamples = [];
    }
  }

  if (runSamples.length > 0) {
    annotations.push(createThresholdAnnotation(runSamples, threshold, direction));
  }

  return annotations;
}

export function getChartAnomalyAnnotations<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  options: ChartAnomalyOptions<TProperties> = {},
): Array<ChartAnomalyAnnotation<TProperties>> {
  const minSamples = Math.max(1, Math.floor(options.minSamples ?? 8));
  const sensitivity = options.sensitivity ?? 3;
  const valuedSamples = samples
    .map((sample) => ({
      sample,
      value: getChartSampleValue(sample, options.accessor),
    }))
    .filter(
      (item): item is { sample: ChartDensitySample<TProperties>; value: number } =>
        item.value !== null,
    );

  if (valuedSamples.length < minSamples) {
    return [];
  }

  const baseline =
    valuedSamples.reduce((total, item) => total + item.value, 0) / valuedSamples.length;
  const variance =
    valuedSamples.reduce((total, item) => total + Math.pow(item.value - baseline, 2), 0) /
    valuedSamples.length;
  const deviation = Math.sqrt(variance);

  if (deviation === 0) {
    return [];
  }

  return valuedSamples
    .map((item): ChartAnomalyAnnotation<TProperties> | null => {
      const score = Math.abs(item.value - baseline) / deviation;

      if (score < sensitivity) {
        return null;
      }

      return {
        baseline,
        deviation,
        index: item.sample.index,
        sample: item.sample,
        score,
        value: item.value,
        x: item.sample.x,
      };
    })
    .filter((annotation): annotation is ChartAnomalyAnnotation<TProperties> => annotation !== null);
}

function createDerivedPoint<TProperties>(
  sample: ChartDensitySample<TProperties>,
  value: number | null,
): ChartDerivedPoint<TProperties> {
  return {
    index: sample.index,
    sample,
    value,
    x: sample.x,
    x0: sample.x0,
    x1: sample.x1,
  };
}

function createThresholdAnnotation<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  threshold: number,
  direction: "above" | "below",
): ChartThresholdAnnotation<TProperties> {
  const firstSample = samples[0];
  const lastSample = samples[samples.length - 1];

  if (!firstSample || !lastSample) {
    throw new Error("Cannot create a threshold annotation without samples.");
  }

  return {
    direction,
    endIndex: lastSample.index,
    endX: lastSample.x,
    sampleCount: samples.length,
    samples,
    startIndex: firstSample.index,
    startX: firstSample.x,
    threshold,
  };
}

function readRollingStatistic(values: number[], statistic: ChartRollingStatistic): number {
  switch (statistic) {
    case "average":
      return values.reduce((total, value) => total + value, 0) / values.length;
    case "max":
      return Math.max(...values);
    case "min":
      return Math.min(...values);
    case "sum":
      return values.reduce((total, value) => total + value, 0);
  }
}

function normalizeAnalyticsValue(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

import { collectDensityMetricKeys, createDensityViewportSummary } from "../data-density";

import { normalizeGroupKey } from "./layouts";
import {
  clampInteger,
  createZeroMetricRecord,
  isFiniteNumber,
  normalizeChartDomain,
  normalizeChartMetrics,
  normalizeNumericValue,
} from "./shared";

import type { ChartDerivedPoint } from "../analytics";
import type {
  ChartBandBoundary,
  ChartBandRenderDatum,
  ChartBoxPlotDatum,
  ChartCalendarHeatmapData,
  ChartCalendarHeatmapDatum,
  ChartDensityBin,
  ChartDensitySample,
  ChartDensitySeries,
  ChartDensityViewportSummary,
  ChartFunnelDatum,
  ChartFunnelRow,
  ChartGapAnnotation,
  ChartGapBehavior,
  ChartGroupedDensitySeries,
  ChartPointValueAccessor,
  ChartRenderData,
  ChartRenderDataOptions,
  ChartRenderDatum,
  ChartRidgelineBucket,
  ChartRidgelineData,
  ChartRidgelineDatum,
  ChartSeriesPoint,
  ChartValueMode,
  ChartWaterfallDatum,
  ChartWaterfallRow,
  IndexedChartSeriesPoint,
} from "./types";

export function createChartDensitySample<TProperties = Record<string, unknown>>(
  bin: ChartDensityBin<TProperties>,
  valueMode: ChartValueMode = "average",
): ChartDensitySample<TProperties> {
  return {
    averageY: bin.averageY,
    firstPoint: bin.firstPoint,
    index: bin.index,
    lastPoint: bin.lastPoint,
    maxY: bin.maxY,
    metrics: bin.metrics,
    minY: bin.minY,
    p10: null,
    p25: null,
    p50: null,
    p75: null,
    p90: null,
    p95: null,
    p99: null,
    pointCount: bin.pointCount,
    sumY: bin.sumY,
    x: (bin.x0 + bin.x1) / 2,
    x0: bin.x0,
    x1: bin.x1,
    y: getChartDensityValue(bin, valueMode),
  };
}

export function createChartDensityViewportSummary<TProperties = Record<string, unknown>>(
  series: ChartDensitySeries<TProperties>,
): ChartDensityViewportSummary {
  return {
    ...createDensityViewportSummary(
      "chart",
      series.bins.map((bin) => bin.metrics),
      series.summary.pointCount,
    ),
    binCount: series.summary.binCount,
    sampleCount: series.summary.sampleCount,
    valueMode: series.summary.valueMode,
    xDomain: series.summary.xDomain,
  };
}

export function getChartGapAnnotations<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
): ChartGapAnnotation[] {
  const annotations: ChartGapAnnotation[] = [];
  let startSample: ChartDensitySample<TProperties> | null = null;
  let previousSample: ChartDensitySample<TProperties> | null = null;

  for (const sample of samples) {
    if (sample.y === null) {
      startSample ??= sample;
      previousSample = sample;
      continue;
    }

    if (startSample && previousSample) {
      annotations.push(createGapAnnotation(startSample, previousSample));
    }

    startSample = null;
    previousSample = null;
  }

  if (startSample && previousSample) {
    annotations.push(createGapAnnotation(startSample, previousSample));
  }

  return annotations;
}

export function createChartRenderData<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  options: ChartRenderDataOptions<TProperties> = {},
): ChartRenderData<TProperties> {
  const {
    derived,
    gapBehavior = "preserve",
    includeMetrics = false,
    includeSample = false,
    modes,
    xLabel = (sample) => formatChartRenderXLabel(sample.x),
  } = options;
  const includedModes = new Set<ChartValueMode>(modes ?? ["average", "count", "max", "min", "sum"]);
  const includeEmptySamples = gapBehavior === "preserve" || gapBehavior === "zero-fill";
  const zeroFill = gapBehavior === "zero-fill";
  const annotations = gapBehavior === "connect" ? getChartGapAnnotations(samples) : [];
  const rows = samples
    .filter((sample) => includeEmptySamples || sample.y !== null)
    .map((sample) => {
      const row: ChartRenderDatum<TProperties> = {
        average: includedModes.has("average")
          ? normalizeRenderValue(sample.averageY, zeroFill)
          : null,
        count: includedModes.has("count")
          ? normalizeRenderValue(sample.pointCount > 0 ? sample.pointCount : null, zeroFill)
          : null,
        index: sample.index,
        label: xLabel(sample),
        max: includedModes.has("max") ? normalizeRenderValue(sample.maxY, zeroFill) : null,
        min: includedModes.has("min") ? normalizeRenderValue(sample.minY, zeroFill) : null,
        p10: includedModes.has("p10") ? normalizeRenderValue(sample.p10, zeroFill) : null,
        p25: includedModes.has("p25") ? normalizeRenderValue(sample.p25, zeroFill) : null,
        p50: includedModes.has("p50") ? normalizeRenderValue(sample.p50, zeroFill) : null,
        p75: includedModes.has("p75") ? normalizeRenderValue(sample.p75, zeroFill) : null,
        p90: includedModes.has("p90") ? normalizeRenderValue(sample.p90, zeroFill) : null,
        p95: includedModes.has("p95") ? normalizeRenderValue(sample.p95, zeroFill) : null,
        p99: includedModes.has("p99") ? normalizeRenderValue(sample.p99, zeroFill) : null,
        pointCount: sample.pointCount,
        sum: includedModes.has("sum")
          ? normalizeRenderValue(sample.pointCount > 0 ? sample.sumY : null, zeroFill)
          : null,
        value: normalizeRenderValue(sample.y, zeroFill),
        x: sample.x,
        x0: sample.x0,
        x1: sample.x1,
      };

      if (includeMetrics) {
        row.metrics = sample.metrics;
      }

      if (includeSample) {
        row.sample = sample;
      }

      applyDerivedRenderValues(row, sample, derived);

      return row;
    });

  return {
    annotations,
    rows,
  };
}

function formatChartRenderXLabel(value: number) {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
  }).format(value);
}

export function createGroupedChartRenderData<TProperties>(
  grouped: ChartGroupedDensitySeries<TProperties>,
  options: {
    gapBehavior?: ChartGapBehavior;
    keyPrefix?: string;
    percent?: boolean;
    xLabel?: (sample: ChartDensitySample<TProperties>) => string;
  } = {},
): ChartRenderData<TProperties> {
  const firstGroup = grouped.groups[0];

  if (!firstGroup) {
    return {
      annotations: [],
      rows: [],
    };
  }

  const baseData = createChartRenderData(firstGroup.series.samples, {
    gapBehavior: options.gapBehavior,
    xLabel: options.xLabel,
  });
  const keyPrefix = options.keyPrefix ?? "";

  for (const row of baseData.rows) {
    const rawValues = grouped.groups.map((group) => {
      const sample = group.series.samples.find((candidate) => candidate.index === row.index);

      return {
        key: `${keyPrefix}${group.key}`,
        value: sample?.y ?? null,
      };
    });
    const total = rawValues.reduce((sum, item) => sum + (item.value ?? 0), 0);

    row.total = total;

    for (const item of rawValues) {
      row[item.key] =
        options.percent && total > 0 && item.value !== null
          ? (item.value / total) * 100
          : item.value;
    }
  }

  return baseData;
}

export function createChartBandRenderData<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  options: {
    center?: ChartBandBoundary;
    includeSample?: boolean;
    lower?: ChartBandBoundary;
    upper?: ChartBandBoundary;
    xLabel?: (sample: ChartDensitySample<TProperties>) => string;
  } = {},
): {
  rows: Array<ChartBandRenderDatum<TProperties>>;
} {
  const lowerBoundary = options.lower ?? "min";
  const upperBoundary = options.upper ?? "max";
  const centerBoundary = options.center ?? "average";
  const xLabel = options.xLabel ?? ((sample: ChartDensitySample<TProperties>) => String(sample.x));

  return {
    rows: samples.map((sample) => {
      const lowerValue = readChartBandBoundary(sample, lowerBoundary);
      const upperValue = readChartBandBoundary(sample, upperBoundary);
      const normalizedRange = normalizeBandRange(lowerValue, upperValue);
      const row: ChartBandRenderDatum<TProperties> = {
        average: sample.averageY,
        center: readChartBandBoundary(sample, centerBoundary),
        count: sample.pointCount > 0 ? sample.pointCount : null,
        index: sample.index,
        label: xLabel(sample),
        lower: normalizedRange?.[0] ?? lowerValue,
        max: sample.maxY,
        min: sample.minY,
        p10: sample.p10,
        p25: sample.p25,
        p50: sample.p50,
        p75: sample.p75,
        p90: sample.p90,
        p95: sample.p95,
        p99: sample.p99,
        pointCount: sample.pointCount,
        range: normalizedRange,
        sum: sample.pointCount > 0 ? sample.sumY : null,
        upper: normalizedRange?.[1] ?? upperValue,
        value: sample.y,
        x: sample.x,
        x0: sample.x0,
        x1: sample.x1,
      };

      if (options.includeSample) {
        row.sample = sample;
      }

      return row;
    }),
  };
}

export function createChartBoxPlotData<TProperties>(
  samples: Array<ChartDensitySample<TProperties>>,
  options: {
    lowerWhisker?: ChartBandBoundary;
    upperWhisker?: ChartBandBoundary;
    xLabel?: (sample: ChartDensitySample<TProperties>) => string;
  } = {},
): Array<ChartBoxPlotDatum<TProperties>> {
  const lowerWhisker = options.lowerWhisker ?? "min";
  const upperWhisker = options.upperWhisker ?? "max";
  const xLabel = options.xLabel ?? ((sample: ChartDensitySample<TProperties>) => String(sample.x));

  return samples.map((sample) => ({
    index: sample.index,
    label: xLabel(sample),
    lowerWhisker: readChartBandBoundary(sample, lowerWhisker),
    max: sample.maxY,
    median: sample.p50,
    min: sample.minY,
    q1: sample.p25,
    q3: sample.p75,
    sample,
    upperWhisker: readChartBandBoundary(sample, upperWhisker),
    x: sample.x,
    x0: sample.x0,
    x1: sample.x1,
  }));
}

export function createChartWaterfallData(
  data: readonly ChartWaterfallDatum[],
  options: {
    initialValue?: number;
  } = {},
): ChartWaterfallRow[] {
  let runningTotal = options.initialValue ?? 0;

  return data.map((datum, index) => {
    const value = normalizeNumericValue(datum.value) ?? 0;
    const start = runningTotal;
    const end = start + value;

    runningTotal = end;

    return {
      color: datum.color,
      end,
      id: datum.id ?? normalizeGroupKey(datum.label || `step-${index}`),
      index,
      label: datum.label,
      negative: value < 0,
      start,
      value,
    };
  });
}

export function createChartFunnelData(data: readonly ChartFunnelDatum[]): ChartFunnelRow[] {
  const firstValue = normalizeNumericValue(data[0]?.value) ?? 0;

  return data.map((datum, index) => {
    const value = Math.max(0, normalizeNumericValue(datum.value) ?? 0);
    const previousValue =
      index > 0 ? Math.max(0, normalizeNumericValue(data[index - 1]?.value) ?? 0) : null;

    return {
      color: datum.color,
      dropOff: previousValue === null ? null : Math.max(0, previousValue - value),
      id: datum.id ?? normalizeGroupKey(datum.label || `step-${index}`),
      index,
      label: datum.label,
      percentOfFirst: firstValue > 0 ? value / firstValue : 0,
      percentOfPrevious: previousValue && previousValue > 0 ? value / previousValue : null,
      value,
    };
  });
}

export function createChartCalendarHeatmapData<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties> | ChartSeriesPoint<TProperties>>,
  options: {
    dayMs?: number;
    includeEmptyDays?: boolean;
    startOfDay?: (x: number) => number;
    valueAccessor?: ChartPointValueAccessor<TProperties>;
    xDomain?: [number, number];
  } = {},
): ChartCalendarHeatmapData<TProperties> {
  const rawDayMs = options.dayMs;
  const dayMs = Number.isFinite(rawDayMs) && rawDayMs && rawDayMs > 0 ? rawDayMs : 86_400_000;
  const valueAccessor = options.valueAccessor ?? "y";
  const normalizedPoints = normalizeChartSeriesPoints(points);
  const xDomain = options.xDomain ? normalizeChartDomain(options.xDomain) : null;
  const selectedPoints = xDomain
    ? normalizedPoints.filter((point) => point.x >= xDomain[0] && point.x <= xDomain[1])
    : normalizedPoints;
  const startOfDay = options.startOfDay ?? ((x: number) => Math.floor(x / dayMs) * dayMs);
  const pointDayStarts = selectedPoints.map((point) => startOfDay(point.x)).filter(isFiniteNumber);
  const includeEmptyDays = options.includeEmptyDays ?? Boolean(xDomain);
  const firstDayStart =
    xDomain !== null
      ? startOfDay(xDomain[0])
      : pointDayStarts.length > 0
        ? Math.min(...pointDayStarts)
        : 0;
  const lastDayStart =
    xDomain !== null
      ? startOfDay(Math.max(xDomain[0], xDomain[1] - dayMs * 1e-9))
      : pointDayStarts.length > 0
        ? Math.max(...pointDayStarts)
        : firstDayStart;
  const metricKeys = collectDensityMetricKeys(selectedPoints.map((point) => point.metrics));
  const dayLookup = new Map<number, MutableCalendarHeatmapDatum<TProperties>>();

  if (includeEmptyDays) {
    const dayCount = Math.max(0, Math.floor((lastDayStart - firstDayStart) / dayMs) + 1);

    for (let index = 0; index < dayCount; index += 1) {
      const x0 = firstDayStart + index * dayMs;

      dayLookup.set(x0, createCalendarHeatmapDatum(index, x0, dayMs, firstDayStart, metricKeys));
    }
  }

  for (const point of selectedPoints) {
    const dayStart = startOfDay(point.x);

    if (!Number.isFinite(dayStart)) {
      continue;
    }

    let datum = dayLookup.get(dayStart);

    if (!datum) {
      datum = createCalendarHeatmapDatum(
        dayLookup.size,
        dayStart,
        dayMs,
        firstDayStart,
        metricKeys,
      );
      dayLookup.set(dayStart, datum);
    }

    datum.firstPoint ??= point;
    datum.lastPoint = point;
    datum.pointCount += 1;

    const value = getChartPointAccessorValue(point, valueAccessor);

    if (value !== null) {
      datum.valueSum += value;
      datum.valueCount += 1;
      datum.value = datum.valueSum / datum.valueCount;
    }

    for (const metricKey of metricKeys) {
      datum.metrics[metricKey] += point.metrics[metricKey] ?? 0;
    }
  }

  const days = Array.from(dayLookup.values())
    .sort((left, right) => left.x0 - right.x0)
    .map(({ valueCount: _valueCount, valueSum: _valueSum, ...datum }, index) => ({
      ...datum,
      index,
    }));
  const values = days.map((day) => day.value).filter(isFiniteNumber);

  return {
    days,
    summary: {
      dayCount: days.length,
      maxValue: values.length > 0 ? Math.max(...values) : null,
      minValue: values.length > 0 ? Math.min(...values) : null,
      pointCount: days.reduce((total, day) => total + day.pointCount, 0),
      xDomain: xDomain ?? [
        days[0]?.x0 ?? firstDayStart,
        days[days.length - 1]?.x1 ?? firstDayStart,
      ],
    },
  };
}

export function createChartRidgelineData<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties> | ChartSeriesPoint<TProperties>>,
  options: {
    bucketCount: number;
    groupBy:
      | { property: keyof TProperties & string }
      | ((point: IndexedChartSeriesPoint<TProperties>) => string);
    maxGroups?: number;
    valueAccessor?: ChartPointValueAccessor<TProperties>;
    valueDomain?: [number, number];
    xDomain?: [number, number];
  },
): ChartRidgelineData<TProperties> {
  const bucketCount = clampInteger(options.bucketCount, 1, 1_000);
  const valueAccessor = options.valueAccessor ?? "y";
  const xDomain = options.xDomain ? normalizeChartDomain(options.xDomain) : null;
  const selectedPoints = normalizeChartSeriesPoints(points).filter((point) =>
    xDomain ? point.x >= xDomain[0] && point.x <= xDomain[1] : true,
  );
  const valuedPoints = selectedPoints
    .map((point) => ({ point, value: getChartPointAccessorValue(point, valueAccessor) }))
    .filter((item): item is { point: IndexedChartSeriesPoint<TProperties>; value: number } =>
      isFiniteNumber(item.value),
    );
  const valueDomain = normalizeChartDomain(
    options.valueDomain ?? getFiniteValueDomain(valuedPoints.map((item) => item.value)) ?? [0, 0],
  );
  const groups = new Map<
    string,
    {
      key: string;
      label: string;
      points: Array<{ point: IndexedChartSeriesPoint<TProperties>; value: number }>;
    }
  >();

  for (const item of valuedPoints) {
    if (item.value < valueDomain[0] || item.value > valueDomain[1]) {
      continue;
    }

    const rawGroup = getRidgelineGroupValue(item.point, options.groupBy);
    const label =
      rawGroup === null || rawGroup === undefined || rawGroup === "" ? "Unknown" : rawGroup;
    const key = normalizeGroupKey(String(label));
    const group = groups.get(key) ?? {
      key,
      label: String(label),
      points: [],
    };

    group.points.push(item);
    groups.set(key, group);
  }

  const sortedGroups = Array.from(groups.values()).sort(
    (left, right) =>
      right.points.length - left.points.length || left.label.localeCompare(right.label),
  );
  const maxGroups = options.maxGroups ? clampInteger(options.maxGroups, 1, 1_000) : null;
  const grouped =
    maxGroups !== null && sortedGroups.length > maxGroups
      ? [
          ...sortedGroups.slice(0, maxGroups),
          {
            key: "__other",
            label: "Other",
            points: sortedGroups.slice(maxGroups).flatMap((group) => group.points),
          },
        ]
      : sortedGroups;
  const ridgelines = grouped.map((group): ChartRidgelineDatum<TProperties> => {
    const buckets = createRidgelineBuckets(bucketCount, valueDomain);

    for (const item of group.points) {
      const bucket = buckets[getChartBucketIndex(item.value, valueDomain, bucketCount)];

      if (bucket) {
        bucket.pointCount += 1;
      }
    }

    return {
      buckets,
      groupId: group.key,
      groupLabel: group.label,
      maxCount: buckets.reduce((max, bucket) => Math.max(max, bucket.pointCount), 0),
      pointCount: group.points.length,
    };
  });
  const maxCount = ridgelines.reduce((max, group) => Math.max(max, group.maxCount), 0);

  return {
    groups: ridgelines,
    summary: {
      bucketCount,
      groupCount: ridgelines.length,
      maxCount,
      pointCount: ridgelines.reduce((total, group) => total + group.pointCount, 0),
      valueDomain,
      xDomain,
    },
  };
}

function applyDerivedRenderValues<TProperties>(
  row: ChartRenderDatum<TProperties>,
  sample: ChartDensitySample<TProperties>,
  derived:
    | Record<
        string,
        | Array<ChartDerivedPoint<TProperties>>
        | ((sample: ChartDensitySample<TProperties>) => number | null)
      >
    | undefined,
) {
  if (!derived) {
    return;
  }

  for (const [key, source] of Object.entries(derived)) {
    if (typeof source === "function") {
      row[key] = normalizeRenderValue(source(sample), false);
      continue;
    }

    row[key] = source.find((point) => point.index === sample.index)?.value ?? null;
  }
}

export function getChartDensityValue<TProperties>(
  bin: ChartDensityBin<TProperties>,
  valueMode: ChartValueMode,
) {
  if (bin.pointCount === 0) {
    return null;
  }

  switch (valueMode) {
    case "count":
      return bin.pointCount;
    case "max":
      return bin.maxY;
    case "min":
      return bin.minY;
    case "sum":
      return bin.sumY;
    case "average":
      return bin.averageY;
    case "p10":
    case "p25":
    case "p50":
    case "p75":
    case "p90":
    case "p95":
    case "p99":
      return null;
  }
}

function createGapAnnotation<TProperties>(
  startSample: ChartDensitySample<TProperties>,
  endSample: ChartDensitySample<TProperties>,
): ChartGapAnnotation {
  return {
    endIndex: endSample.index,
    endX: endSample.x,
    sampleCount: endSample.index - startSample.index + 1,
    startIndex: startSample.index,
    startX: startSample.x,
  };
}

function normalizeRenderValue(value: number | null, zeroFill: boolean) {
  return value === null && zeroFill ? 0 : value;
}

function readChartBandBoundary<TProperties>(
  sample: ChartDensitySample<TProperties>,
  boundary: ChartBandBoundary,
): number | null {
  if (typeof boundary === "function") {
    return normalizeNumericValue(boundary(sample as ChartDensitySample));
  }

  switch (boundary) {
    case "average":
      return sample.averageY;
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

function normalizeBandRange(
  lowerValue: number | null,
  upperValue: number | null,
): [number, number] | null {
  if (lowerValue === null || upperValue === null) {
    return null;
  }

  return lowerValue <= upperValue ? [lowerValue, upperValue] : [upperValue, lowerValue];
}

type MutableCalendarHeatmapDatum<TProperties> = ChartCalendarHeatmapDatum<TProperties> & {
  valueCount: number;
  valueSum: number;
};

function createCalendarHeatmapDatum<TProperties>(
  index: number,
  x0: number,
  dayMs: number,
  firstDayStart: number,
  metricKeys: string[],
): MutableCalendarHeatmapDatum<TProperties> {
  const day = Math.floor(x0 / dayMs);
  const firstDay = Math.floor(firstDayStart / dayMs);
  const date = new Date(x0);

  return {
    date,
    day,
    dayOfWeek: dayMs === 86_400_000 ? date.getUTCDay() : modulo(day, 7),
    firstPoint: null,
    id: `day-${x0}`,
    index,
    lastPoint: null,
    metrics: createZeroMetricRecord(metricKeys),
    pointCount: 0,
    value: null,
    valueCount: 0,
    valueSum: 0,
    week: Math.floor((day - firstDay) / 7),
    x0,
    x1: x0 + dayMs,
  };
}

function createRidgelineBuckets(
  bucketCount: number,
  valueDomain: [number, number],
): ChartRidgelineBucket[] {
  const span = valueDomain[1] - valueDomain[0];
  const bucketWidth = span === 0 ? 0 : span / bucketCount;

  return Array.from({ length: bucketCount }, (_, index) => {
    const value0 = valueDomain[0] + index * bucketWidth;
    const value1 = index === bucketCount - 1 ? valueDomain[1] : value0 + bucketWidth;
    const value = bucketWidth === 0 ? valueDomain[0] : value0 + bucketWidth / 2;

    return {
      index,
      pointCount: 0,
      value,
      value0,
      value1,
      x: value,
    };
  });
}

function normalizeChartSeriesPoints<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties> | ChartSeriesPoint<TProperties>>,
): Array<IndexedChartSeriesPoint<TProperties>> {
  return points
    .map(
      (point, index): IndexedChartSeriesPoint<TProperties> => ({
        id: String(point.id ?? index),
        label: point.label ?? "",
        metrics: normalizeChartMetrics(point.metrics),
        properties: point.properties ?? ({} as TProperties),
        x: point.x,
        y: point.y,
      }),
    )
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((left, right) => left.x - right.x);
}

function getChartPointAccessorValue<TProperties>(
  point: IndexedChartSeriesPoint<TProperties>,
  accessor: ChartPointValueAccessor<TProperties>,
): number | null {
  if (typeof accessor === "function") {
    return normalizeNumericValue(accessor(point));
  }

  if (typeof accessor === "object") {
    return normalizeNumericValue(point.metrics[accessor.metric]);
  }

  return normalizeNumericValue(point[accessor]);
}

function getRidgelineGroupValue<TProperties>(
  point: IndexedChartSeriesPoint<TProperties>,
  accessor:
    | { property: keyof TProperties & string }
    | ((point: IndexedChartSeriesPoint<TProperties>) => string),
) {
  if (typeof accessor === "function") {
    return accessor(point);
  }

  const properties = point.properties as Record<string, unknown>;
  const value = properties[accessor.property];

  return typeof value === "string" || typeof value === "number" ? value : null;
}

function getFiniteValueDomain(values: number[]): [number, number] | null {
  const finiteValues = values.filter(isFiniteNumber);

  if (finiteValues.length === 0) {
    return null;
  }

  return [Math.min(...finiteValues), Math.max(...finiteValues)];
}

function getChartBucketIndex(value: number, domain: [number, number], bucketCount: number) {
  const span = domain[1] - domain[0];

  if (span === 0) {
    return 0;
  }

  if (value === domain[1]) {
    return bucketCount - 1;
  }

  return Math.min(
    bucketCount - 1,
    Math.max(0, Math.floor(((value - domain[0]) / span) * bucketCount)),
  );
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

import { collectDensityMetricKeys, sumDensityMetrics } from "../data-density";

import { normalizeGroupKey } from "./layouts";
import { getChartDensityValue } from "./render-data";
import {
  clampInteger,
  createNullPercentileRecord,
  createZeroMetricRecord,
  isFiniteNumber,
  normalizeChartDomain,
  normalizeChartMetrics,
  normalizeNumericValue,
} from "./shared";

import type { BinnedSeries, BinnedSeriesIndexOptions, BinnedSeriesQuery } from "../data-density";
import type {
  ChartDensityBin,
  ChartDensityQuery,
  ChartDensitySample,
  ChartDensitySeries,
  ChartGroupedDensityGroup,
  ChartGroupedDensityQuery,
  ChartGroupedDensitySeries,
  ChartHeatmap,
  ChartHeatmapCell,
  ChartHeatmapQuery,
  ChartHistogram,
  ChartHistogramBucket,
  ChartHistogramQuery,
  ChartPercentileMode,
  ChartPointGroupAccessor,
  ChartPointQuery,
  ChartPointSeries,
  ChartPointValueAccessor,
  ChartScatterPoint,
  ChartScatterQuery,
  ChartScatterSeries,
  ChartSeriesPoint,
  ChartValueMode,
  IndexedChartSeriesPoint,
} from "./types";

export type ChartPointStore<TProperties = Record<string, unknown>> = {
  metricKeys: string[];
  pointLookup: Map<string, IndexedChartSeriesPoint<TProperties>>;
  points: Array<IndexedChartSeriesPoint<TProperties>>;
};

export type ChartRangeAggregateStore<TProperties = Record<string, unknown>> =
  ChartPointStore<TProperties> & {
    maxTable: number[][];
    metricPrefixSums: Map<string, number[]>;
    minTable: number[][];
    prefixSumY: number[];
  };

export type MutableChartDensityBin<TProperties = Record<string, unknown>> =
  ChartDensityBin<TProperties> & {
    points: Array<IndexedChartSeriesPoint<TProperties>>;
  };

export const CHART_PERCENTILE_VALUES: Record<ChartPercentileMode, number> = {
  p10: 0.1,
  p25: 0.25,
  p50: 0.5,
  p75: 0.75,
  p90: 0.9,
  p95: 0.95,
  p99: 0.99,
};

export function createChartPointStore<TProperties>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties>,
): ChartPointStore<TProperties> {
  const normalizedPoints = points
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
    .filter((point) => options.filterPoint?.(point) ?? true)
    .sort((left, right) => left.x - right.x);

  return {
    metricKeys: collectDensityMetricKeys(normalizedPoints.map((point) => point.metrics)),
    pointLookup: new Map(normalizedPoints.map((point) => [point.id, point])),
    points: normalizedPoints,
  };
}

export function createChartRangeAggregateStore<TProperties>(
  store: ChartPointStore<TProperties>,
): ChartRangeAggregateStore<TProperties> {
  const prefixSumY = createPrefixSums(store.points.map((point) => point.y));
  const metricPrefixSums = new Map<string, number[]>();

  for (const metricKey of store.metricKeys) {
    metricPrefixSums.set(
      metricKey,
      createPrefixSums(store.points.map((point) => point.metrics[metricKey] ?? 0)),
    );
  }

  return {
    ...store,
    maxTable: createSparseTable(
      store.points.map((point) => point.y),
      Math.max,
    ),
    metricPrefixSums,
    minTable: createSparseTable(
      store.points.map((point) => point.y),
      Math.min,
    ),
    prefixSumY,
  };
}

export function createRangeAggregateBinnedSeries<TProperties>(
  store: ChartRangeAggregateStore<TProperties>,
  query: BinnedSeriesQuery,
): BinnedSeries<TProperties> {
  const xDomain = normalizeChartDomain(query.xDomain);
  const targetBinCount = clampInteger(query.targetBinCount, 1, 100_000);
  const binWidth = getChartBinWidth(xDomain, targetBinCount);
  const bins = Array.from({ length: targetBinCount }, (_, index) =>
    createRangeAggregateBin(store, index, xDomain, targetBinCount, binWidth),
  );
  const visibleBins = query.includeEmptyBins ? bins : bins.filter((bin) => bin.pointCount > 0);

  return {
    bins: visibleBins,
    summary: {
      binCount: visibleBins.length,
      metrics: sumDensityMetrics(
        visibleBins.map((bin) => bin.metrics),
        store.metricKeys,
      ),
      pointCount: visibleBins.reduce((total, bin) => total + bin.pointCount, 0),
      xDomain,
    },
  };
}

export function createRangeAggregateBin<TProperties>(
  store: ChartRangeAggregateStore<TProperties>,
  index: number,
  xDomain: [number, number],
  binCount: number,
  binWidth: number,
): ChartDensityBin<TProperties> {
  const x0 = xDomain[0] + index * binWidth;
  const x1 = index === binCount - 1 ? xDomain[1] : xDomain[0] + (index + 1) * binWidth;
  const startIndex =
    xDomain[1] <= xDomain[0] && index > 0
      ? 0
      : lowerBoundChartPointByX(store.points, xDomain[1] <= xDomain[0] ? xDomain[0] : x0);
  const endIndex =
    xDomain[1] <= xDomain[0]
      ? index === 0
        ? upperBoundChartPointByX(store.points, xDomain[0])
        : 0
      : index === binCount - 1
        ? upperBoundChartPointByX(store.points, x1)
        : lowerBoundChartPointByX(store.points, x1);
  const pointCount = Math.max(0, endIndex - startIndex);
  const metrics = createZeroMetricRecord(store.metricKeys);

  for (const metricKey of store.metricKeys) {
    const prefix = store.metricPrefixSums.get(metricKey);

    metrics[metricKey] = prefix ? prefix[endIndex] - prefix[startIndex] : 0;
  }

  if (pointCount === 0) {
    return {
      averageY: null,
      firstPoint: null,
      index,
      lastPoint: null,
      maxY: null,
      metrics,
      minY: null,
      pointCount: 0,
      sumY: 0,
      x0,
      x1,
    };
  }

  const sumY = store.prefixSumY[endIndex] - store.prefixSumY[startIndex];

  return {
    averageY: sumY / pointCount,
    firstPoint: store.points[startIndex] ?? null,
    index,
    lastPoint: store.points[endIndex - 1] ?? null,
    maxY: querySparseTable(store.maxTable, startIndex, endIndex, Math.max),
    metrics,
    minY: querySparseTable(store.minTable, startIndex, endIndex, Math.min),
    pointCount,
    sumY,
    x0,
    x1,
  };
}

export function shouldUsePointStoreForQuery(query: ChartDensityQuery) {
  return isChartPercentileMode(query.valueMode) || Boolean(query.percentiles?.length);
}

export function createPointStoreChartSeries<TProperties>(
  store: ChartPointStore<TProperties>,
  query: ChartDensityQuery,
  valueMode: ChartValueMode,
): ChartDensitySeries<TProperties> {
  const xDomain = normalizeChartDomain(query.xDomain);
  const targetBinCount = clampInteger(query.targetBinCount, 1, 100_000);
  const requestedPercentiles = resolveRequestedPercentiles(query, valueMode);
  const bins = createPointStoreBins(store, {
    includeEmptyBins: query.includeEmptyBins,
    percentiles: requestedPercentiles,
    targetBinCount,
    xDomain,
  });
  const samples = bins.map((bin) =>
    createPointStoreChartDensitySample(bin, valueMode, requestedPercentiles),
  );

  return {
    bins,
    samples,
    summary: {
      binCount: bins.length,
      metrics: sumDensityMetrics(
        bins.map((bin) => bin.metrics),
        store.metricKeys,
      ),
      pointCount: bins.reduce((total, bin) => total + bin.pointCount, 0),
      sampleCount: samples.length,
      valueMode,
      xDomain,
    },
  };
}

export function createPointStoreChartPoints<TProperties>(
  store: ChartPointStore<TProperties>,
  query: ChartPointQuery = {},
): ChartPointSeries<TProperties> {
  const xDomain = query.xDomain ? normalizeChartDomain(query.xDomain) : getPointStoreXDomain(store);
  const selectedPoints = xDomain ? getPointsInXDomain(store.points, xDomain) : store.points;
  const maxPoints = clampInteger(query.maxPoints ?? 2_000, 1, 1_000_000);
  const sampledPoints = sampleChartPoints(selectedPoints, maxPoints);

  return {
    points: sampledPoints,
    summary: {
      metrics: sumDensityMetrics(
        selectedPoints.map((point) => point.metrics),
        store.metricKeys,
      ),
      pointCount: selectedPoints.length,
      sampledPointCount: sampledPoints.length,
      xDomain,
    },
  };
}

export function createPointStoreScatter<TProperties>(
  store: ChartPointStore<TProperties>,
  query: ChartScatterQuery<TProperties> = {},
): ChartScatterSeries<TProperties> {
  const xDomain = query.xDomain ? normalizeChartDomain(query.xDomain) : getPointStoreXDomain(store);
  const yDomain = query.yDomain ? normalizeChartDomain(query.yDomain) : null;
  const selectedPoints = (
    xDomain ? getPointsInXDomain(store.points, xDomain) : store.points
  ).filter((point) => !yDomain || (point.y >= yDomain[0] && point.y <= yDomain[1]));
  const maxPoints = clampInteger(query.maxPoints ?? 2_000, 1, 1_000_000);
  const sampledPoints = sampleChartPoints(selectedPoints, maxPoints);
  const sizeValues = sampledPoints.map((point) =>
    query.sizeAccessor ? getPointAccessorValue(point, query.sizeAccessor) : point.metrics.count,
  );
  const sizeDomain = getValueDomain(sizeValues.filter(isFiniteNumber));
  const scatterPoints = sampledPoints.map((point, index): ChartScatterPoint<TProperties> => {
    const sizeValue = normalizeNumericValue(sizeValues[index]);

    return {
      id: point.id,
      label: point.label,
      metrics: point.metrics,
      point,
      radius: getScatterRadius(sizeValue, sizeDomain),
      sizeValue,
      x: point.x,
      y: point.y,
    };
  });

  return {
    points: scatterPoints,
    summary: {
      maxSizeValue: sizeDomain?.[1] ?? null,
      metrics: sumDensityMetrics(
        selectedPoints.map((point) => point.metrics),
        store.metricKeys,
      ),
      minSizeValue: sizeDomain?.[0] ?? null,
      pointCount: selectedPoints.length,
      sampledPointCount: scatterPoints.length,
      xDomain,
      yDomain,
    },
  };
}

export function createPointStoreGroupedChartSeries<TProperties>(
  store: ChartPointStore<TProperties>,
  query: ChartGroupedDensityQuery<TProperties>,
): ChartGroupedDensitySeries<TProperties> {
  const xDomain = normalizeChartDomain(query.xDomain);
  const valueMode = query.valueMode ?? "average";
  const includeOther = query.includeOther ?? true;
  const maxGroups = clampInteger(query.maxGroups ?? 8, 1, 100);
  const selectedPoints = getPointsInXDomain(store.points, xDomain);
  const groups = new Map<
    string,
    { key: string; label: string; points: Array<IndexedChartSeriesPoint<TProperties>> }
  >();

  for (const point of selectedPoints) {
    const groupValue = getPointGroupValue(point, query.groupBy);

    if (groupValue === null || groupValue === undefined || groupValue === "") {
      continue;
    }

    const label = String(groupValue);
    const group = groups.get(label) ?? { key: normalizeGroupKey(label), label, points: [] };

    group.points.push(point);
    groups.set(label, group);
  }

  const sortedGroups = Array.from(groups.values()).sort((left, right) =>
    comparePointGroups(left, right, query.sortGroupsBy ?? "count"),
  );
  const selectedGroups = sortedGroups.slice(0, maxGroups);
  const otherGroups = sortedGroups.slice(maxGroups);

  if (includeOther && otherGroups.length > 0) {
    selectedGroups.push({
      key: "__other",
      label: "Other",
      points: otherGroups.flatMap((group) => group.points),
    });
  }

  const requestedPercentiles = resolveRequestedPercentiles(query, valueMode);
  const chartGroups = selectedGroups.map((group): ChartGroupedDensityGroup<TProperties> => {
    const groupStore: ChartPointStore<TProperties> = {
      metricKeys: store.metricKeys,
      pointLookup: store.pointLookup,
      points: group.points,
    };
    const series = createPointStoreChartSeries(
      groupStore,
      {
        ...query,
        includeEmptyBins: true,
        percentiles: requestedPercentiles,
        targetBinCount: query.targetBinCount,
        valueMode,
        xDomain,
      },
      valueMode,
    );

    return {
      key: group.key,
      label: group.label,
      metrics: sumDensityMetrics(
        group.points.map((point) => point.metrics),
        store.metricKeys,
      ),
      pointCount: group.points.length,
      series,
    };
  });

  return {
    groups: chartGroups,
    summary: {
      binCount:
        chartGroups[0]?.series.summary.binCount ?? clampInteger(query.targetBinCount, 1, 100_000),
      groupCount: chartGroups.length,
      metrics: sumDensityMetrics(
        chartGroups.map((group) => group.metrics),
        store.metricKeys,
      ),
      pointCount: chartGroups.reduce((total, group) => total + group.pointCount, 0),
      sampleCount: chartGroups[0]?.series.summary.sampleCount ?? 0,
      valueMode,
      xDomain,
    },
  };
}

export function createPointStoreHistogram<TProperties>(
  store: ChartPointStore<TProperties>,
  query: ChartHistogramQuery<TProperties>,
): ChartHistogram<TProperties> {
  const bucketCount = clampInteger(query.bucketCount, 1, 100_000);
  const xDomain = query.xDomain ? normalizeChartDomain(query.xDomain) : null;
  const selectedPoints = xDomain ? getPointsInXDomain(store.points, xDomain) : store.points;
  const valuedPoints = selectedPoints
    .map((point) => ({ point, value: getPointAccessorValue(point, query.valueAccessor ?? "y") }))
    .filter((item): item is { point: IndexedChartSeriesPoint<TProperties>; value: number } =>
      isFiniteNumber(item.value),
    );
  const valueDomain = query.valueDomain ??
    getValueDomain(valuedPoints.map((item) => item.value)) ?? [0, 0];
  const normalizedValueDomain = normalizeChartDomain(valueDomain);
  const buckets = createHistogramBuckets<TProperties>(
    bucketCount,
    normalizedValueDomain,
    store.metricKeys,
  );

  for (const item of valuedPoints) {
    if (item.value < normalizedValueDomain[0] || item.value > normalizedValueDomain[1]) {
      continue;
    }

    updateHistogramBucket(
      buckets[getBucketIndex(item.value, normalizedValueDomain, bucketCount)],
      item.point,
      item.value,
      store.metricKeys,
    );
  }

  const visibleBuckets =
    query.includeEmptyBuckets === false
      ? buckets.filter((bucket) => bucket.pointCount > 0)
      : buckets;

  return {
    buckets: visibleBuckets,
    summary: {
      bucketCount: visibleBuckets.length,
      metrics: sumDensityMetrics(
        visibleBuckets.map((bucket) => bucket.metrics),
        store.metricKeys,
      ),
      pointCount: visibleBuckets.reduce((total, bucket) => total + bucket.pointCount, 0),
      valueDomain: normalizedValueDomain,
      xDomain,
    },
  };
}

export function createPointStoreHeatmap<TProperties>(
  store: ChartPointStore<TProperties>,
  query: ChartHeatmapQuery<TProperties>,
): ChartHeatmap<TProperties> {
  const xBinCount = clampInteger(query.xBinCount, 1, 100_000);
  const yBinCount = clampInteger(query.yBinCount, 1, 100_000);
  const xDomain = normalizeChartDomain(query.xDomain);
  const selectedPoints = getPointsInXDomain(store.points, xDomain);
  const valuedPoints = selectedPoints
    .map((point) => ({ point, value: getPointAccessorValue(point, query.valueAccessor ?? "y") }))
    .filter((item): item is { point: IndexedChartSeriesPoint<TProperties>; value: number } =>
      isFiniteNumber(item.value),
    );
  const yDomain = normalizeChartDomain(
    query.yDomain ?? getValueDomain(valuedPoints.map((item) => item.value)) ?? [0, 0],
  );
  const cells = createHeatmapCells<TProperties>(
    xBinCount,
    yBinCount,
    xDomain,
    yDomain,
    store.metricKeys,
  );

  for (const item of valuedPoints) {
    if (item.value < yDomain[0] || item.value > yDomain[1]) {
      continue;
    }

    const xIndex = getBucketIndex(item.point.x, xDomain, xBinCount);
    const yIndex = getBucketIndex(item.value, yDomain, yBinCount);
    const cell = cells[yIndex * xBinCount + xIndex];

    if (cell) {
      updateHeatmapCell(cell, item.point, item.value, store.metricKeys);
    }
  }

  const maxCellCount = cells.reduce((max, cell) => Math.max(max, cell.pointCount), 0);

  for (const cell of cells) {
    cell.value = maxCellCount > 0 ? cell.pointCount / maxCellCount : 0;
  }

  const visibleCells =
    query.includeEmptyCells === false ? cells.filter((cell) => cell.pointCount > 0) : cells;

  return {
    cells: visibleCells,
    summary: {
      maxCellCount,
      metrics: sumDensityMetrics(
        visibleCells.map((cell) => cell.metrics),
        store.metricKeys,
      ),
      pointCount: visibleCells.reduce((total, cell) => total + cell.pointCount, 0),
      xBinCount,
      xDomain,
      yBinCount,
      yDomain,
    },
  };
}

export function createPointStoreBins<TProperties>(
  store: ChartPointStore<TProperties>,
  query: {
    includeEmptyBins?: boolean;
    percentiles: readonly ChartPercentileMode[];
    targetBinCount: number;
    xDomain: [number, number];
  },
): Array<MutableChartDensityBin<TProperties>> {
  const binWidth = getChartBinWidth(query.xDomain, query.targetBinCount);
  const bins = Array.from({ length: query.targetBinCount }, (_, index) =>
    createEmptyPointStoreBin<TProperties>(
      index,
      query.xDomain,
      query.targetBinCount,
      binWidth,
      store.metricKeys,
    ),
  );

  for (const point of getPointsInXDomain(store.points, query.xDomain)) {
    const bin = bins[getBucketIndex(point.x, query.xDomain, query.targetBinCount)];

    if (bin) {
      updatePointStoreBin(bin, point, store.metricKeys);
    }
  }

  for (const bin of bins) {
    applyBinPercentiles(bin, query.percentiles);
  }

  return query.includeEmptyBins ? bins : bins.filter((bin) => bin.pointCount > 0);
}

export function createEmptyPointStoreBin<TProperties>(
  index: number,
  xDomain: [number, number],
  binCount: number,
  binWidth: number,
  metricKeys: string[],
): MutableChartDensityBin<TProperties> {
  return {
    averageY: null,
    firstPoint: null,
    index,
    lastPoint: null,
    maxY: null,
    metrics: createZeroMetricRecord(metricKeys),
    minY: null,
    pointCount: 0,
    points: [],
    sumY: 0,
    x0: xDomain[0] + index * binWidth,
    x1: index === binCount - 1 ? xDomain[1] : xDomain[0] + (index + 1) * binWidth,
  };
}

export function updatePointStoreBin<TProperties>(
  bin: MutableChartDensityBin<TProperties>,
  point: IndexedChartSeriesPoint<TProperties>,
  metricKeys: string[],
) {
  bin.firstPoint ??= point;
  bin.lastPoint = point;
  bin.pointCount += 1;
  bin.points.push(point);
  bin.sumY += point.y;
  bin.averageY = bin.sumY / bin.pointCount;
  bin.minY = bin.minY === null ? point.y : Math.min(bin.minY, point.y);
  bin.maxY = bin.maxY === null ? point.y : Math.max(bin.maxY, point.y);

  for (const metricKey of metricKeys) {
    bin.metrics[metricKey] += point.metrics[metricKey] ?? 0;
  }
}

export function applyBinPercentiles<TProperties>(
  bin: MutableChartDensityBin<TProperties>,
  percentiles: readonly ChartPercentileMode[],
) {
  if (bin.pointCount === 0 || percentiles.length === 0) {
    return;
  }

  const values = bin.points.map((point) => point.y).sort((left, right) => left - right);
  const percentileValues = bin as MutableChartDensityBin<TProperties> &
    Record<ChartPercentileMode, number | null>;

  for (const percentile of percentiles) {
    percentileValues[percentile] = getInterpolatedPercentile(
      values,
      CHART_PERCENTILE_VALUES[percentile],
    );
  }
}

export function createPointStoreChartDensitySample<TProperties>(
  bin: ChartDensityBin<TProperties> & Partial<Record<ChartPercentileMode, number | null>>,
  valueMode: ChartValueMode,
  requestedPercentiles: readonly ChartPercentileMode[],
): ChartDensitySample<TProperties> {
  const percentiles = createNullPercentileRecord();

  for (const percentile of requestedPercentiles) {
    percentiles[percentile] = bin[percentile] ?? null;
  }

  return {
    averageY: bin.averageY,
    firstPoint: bin.firstPoint,
    index: bin.index,
    lastPoint: bin.lastPoint,
    maxY: bin.maxY,
    metrics: bin.metrics,
    minY: bin.minY,
    ...percentiles,
    pointCount: bin.pointCount,
    sumY: bin.sumY,
    x: (bin.x0 + bin.x1) / 2,
    x0: bin.x0,
    x1: bin.x1,
    y: getPointStoreChartDensityValue(bin, valueMode),
  };
}

export function getPointStoreChartDensityValue<TProperties>(
  bin: ChartDensityBin<TProperties> & Partial<Record<ChartPercentileMode, number | null>>,
  valueMode: ChartValueMode,
) {
  if (bin.pointCount === 0) {
    return null;
  }

  if (isChartPercentileMode(valueMode)) {
    return bin[valueMode] ?? null;
  }

  return getChartDensityValue(bin, valueMode);
}

export function resolveRequestedPercentiles(
  query: Pick<ChartDensityQuery, "percentiles">,
  valueMode: ChartValueMode,
): ChartPercentileMode[] {
  const percentiles = new Set<ChartPercentileMode>(query.percentiles ?? []);

  if (isChartPercentileMode(valueMode)) {
    percentiles.add(valueMode);
  }

  return Array.from(percentiles);
}

export function isChartPercentileMode(
  mode: ChartValueMode | undefined,
): mode is ChartPercentileMode {
  return typeof mode === "string" && mode in CHART_PERCENTILE_VALUES;
}

export function createHistogramBuckets<TProperties>(
  bucketCount: number,
  valueDomain: [number, number],
  metricKeys: string[],
): Array<ChartHistogramBucket<TProperties> & { sumValue: number }> {
  const bucketWidth = getChartBinWidth(valueDomain, bucketCount);

  return Array.from({ length: bucketCount }, (_, index) => ({
    averageValue: null,
    firstPoint: null,
    index,
    lastPoint: null,
    maxValue: null,
    metrics: createZeroMetricRecord(metricKeys),
    minValue: null,
    pointCount: 0,
    sumValue: 0,
    value: valueDomain[0] + (index + 0.5) * bucketWidth,
    value0: valueDomain[0] + index * bucketWidth,
    value1: index === bucketCount - 1 ? valueDomain[1] : valueDomain[0] + (index + 1) * bucketWidth,
  }));
}

export function updateHistogramBucket<TProperties>(
  bucket: ChartHistogramBucket<TProperties> & { sumValue: number },
  point: IndexedChartSeriesPoint<TProperties>,
  value: number,
  metricKeys: string[],
) {
  bucket.firstPoint ??= point;
  bucket.lastPoint = point;
  bucket.pointCount += 1;
  bucket.sumValue += value;
  bucket.averageValue = bucket.sumValue / bucket.pointCount;
  bucket.minValue = bucket.minValue === null ? value : Math.min(bucket.minValue, value);
  bucket.maxValue = bucket.maxValue === null ? value : Math.max(bucket.maxValue, value);

  for (const metricKey of metricKeys) {
    bucket.metrics[metricKey] += point.metrics[metricKey] ?? 0;
  }
}

export function createHeatmapCells<TProperties>(
  xBinCount: number,
  yBinCount: number,
  xDomain: [number, number],
  yDomain: [number, number],
  metricKeys: string[],
): Array<ChartHeatmapCell<TProperties> & { sumValue: number }> {
  const xBinWidth = getChartBinWidth(xDomain, xBinCount);
  const yBinWidth = getChartBinWidth(yDomain, yBinCount);

  return Array.from({ length: xBinCount * yBinCount }, (_, index) => {
    const xIndex = index % xBinCount;
    const yIndex = Math.floor(index / xBinCount);
    const x0 = xDomain[0] + xIndex * xBinWidth;
    const y0 = yDomain[0] + yIndex * yBinWidth;

    return {
      averageValue: null,
      firstPoint: null,
      index,
      lastPoint: null,
      metrics: createZeroMetricRecord(metricKeys),
      pointCount: 0,
      sumValue: 0,
      value: 0,
      x: x0 + xBinWidth / 2,
      x0,
      x1: xIndex === xBinCount - 1 ? xDomain[1] : x0 + xBinWidth,
      xIndex,
      y: y0 + yBinWidth / 2,
      y0,
      y1: yIndex === yBinCount - 1 ? yDomain[1] : y0 + yBinWidth,
      yIndex,
    };
  });
}

export function updateHeatmapCell<TProperties>(
  cell: ChartHeatmapCell<TProperties> & { sumValue: number },
  point: IndexedChartSeriesPoint<TProperties>,
  value: number,
  metricKeys: string[],
) {
  cell.firstPoint ??= point;
  cell.lastPoint = point;
  cell.pointCount += 1;
  cell.sumValue += value;
  cell.averageValue = cell.sumValue / cell.pointCount;

  for (const metricKey of metricKeys) {
    cell.metrics[metricKey] += point.metrics[metricKey] ?? 0;
  }
}

export function getPointAccessorValue<TProperties>(
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

export function getPointGroupValue<TProperties>(
  point: IndexedChartSeriesPoint<TProperties>,
  accessor: ChartPointGroupAccessor<TProperties>,
) {
  if (typeof accessor === "function") {
    return accessor(point);
  }

  if ("metric" in accessor) {
    return point.metrics[accessor.metric];
  }

  const properties = point.properties as Record<string, unknown>;
  const value = properties[accessor.property];

  return typeof value === "string" || typeof value === "number" ? value : null;
}

export function comparePointGroups<TProperties>(
  left: { label: string; points: Array<IndexedChartSeriesPoint<TProperties>> },
  right: { label: string; points: Array<IndexedChartSeriesPoint<TProperties>> },
  sortBy: "count" | "label" | "sum",
) {
  switch (sortBy) {
    case "label":
      return left.label.localeCompare(right.label);
    case "sum":
      return (
        right.points.reduce((total, point) => total + point.y, 0) -
        left.points.reduce((total, point) => total + point.y, 0)
      );
    case "count":
      return right.points.length - left.points.length || left.label.localeCompare(right.label);
  }
}

export function getPointsInXDomain<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties>>,
  xDomain: [number, number],
) {
  const startIndex = lowerBoundChartPointByX(points, xDomain[0]);
  const endIndex = upperBoundChartPointByX(points, xDomain[1]);

  return points.slice(startIndex, endIndex);
}

export function getPointStoreXDomain<TProperties>(
  store: ChartPointStore<TProperties>,
): [number, number] | null {
  const first = store.points[0];
  const last = store.points[store.points.length - 1];

  return first && last ? [first.x, last.x] : null;
}

export function sampleChartPoints<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties>>,
  maxPoints: number,
) {
  if (points.length <= maxPoints) {
    return points;
  }

  const step = points.length / maxPoints;

  return Array.from({ length: maxPoints }, (_, index) => points[Math.floor(index * step)]).filter(
    (point): point is IndexedChartSeriesPoint<TProperties> => Boolean(point),
  );
}

export function getScatterRadius(sizeValue: number | null, sizeDomain: [number, number] | null) {
  const minRadius = 3;
  const maxRadius = 12;

  if (sizeValue === null || !sizeDomain) {
    return minRadius;
  }

  const span = sizeDomain[1] - sizeDomain[0];

  if (span <= 0) {
    return (minRadius + maxRadius) / 2;
  }

  return minRadius + ((sizeValue - sizeDomain[0]) / span) * (maxRadius - minRadius);
}

export function getValueDomain(values: number[]): [number, number] | null {
  if (values.length === 0) {
    return null;
  }

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  return [min, max];
}

export function lowerBoundChartPointByX<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties>>,
  x: number,
) {
  let low = 0;
  let high = points.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);

    if (points[middle].x < x) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
}

export function upperBoundChartPointByX<TProperties>(
  points: Array<IndexedChartSeriesPoint<TProperties>>,
  x: number,
) {
  let low = 0;
  let high = points.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);

    if (points[middle].x <= x) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
}

export function createPrefixSums(values: number[]) {
  const prefixSums = [0];

  for (const value of values) {
    prefixSums.push(prefixSums[prefixSums.length - 1] + value);
  }

  return prefixSums;
}

export function createSparseTable(
  values: number[],
  reducer: (left: number, right: number) => number,
) {
  if (values.length === 0) {
    return [];
  }

  const table = [values.slice()];

  for (let level = 1; 2 ** level <= values.length; level += 1) {
    const span = 2 ** level;
    const halfSpan = span / 2;
    const previous = table[level - 1];
    const row = Array.from({ length: values.length - span + 1 }, (_, index) =>
      reducer(previous[index], previous[index + halfSpan]),
    );

    table.push(row);
  }

  return table;
}

export function querySparseTable(
  table: number[][],
  startIndex: number,
  endIndex: number,
  reducer: (left: number, right: number) => number,
) {
  const length = endIndex - startIndex;

  if (length <= 0) {
    return null;
  }

  const level = Math.floor(Math.log2(length));
  const span = 2 ** level;
  const row = table[level];

  return reducer(row[startIndex], row[endIndex - span]);
}

export function getBucketIndex(value: number, domain: [number, number], bucketCount: number) {
  const binWidth = getChartBinWidth(domain, bucketCount);

  return Math.min(bucketCount - 1, Math.max(0, Math.floor((value - domain[0]) / binWidth)));
}

export function getChartBinWidth(domain: [number, number], binCount: number) {
  const span = domain[1] - domain[0];

  return span > 0 ? span / binCount : 1;
}

export function getInterpolatedPercentile(values: number[], percentile: number) {
  if (values.length === 0) {
    return null;
  }

  if (values.length === 1) {
    return values[0] ?? null;
  }

  const position = (values.length - 1) * percentile;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lower = values[lowerIndex] ?? null;
  const upper = values[upperIndex] ?? null;

  if (lower === null || upper === null) {
    return null;
  }

  return lower + (upper - lower) * (position - lowerIndex);
}

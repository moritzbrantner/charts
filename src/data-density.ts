export type DataDensityMetricRecord = Record<string, number>;

export type DataDensityMetricSummary = {
  itemCount: number;
  metricKeys: string[];
  metrics: DataDensityMetricRecord;
};

export type DataDensityViewportSummary = DataDensityMetricSummary & {
  kind: "chart" | "graph" | "map" | "table";
};

export type NumericSeriesPoint<TProperties = Record<string, unknown>> = {
  id?: string | number;
  label?: string;
  metrics?: DataDensityMetricRecord;
  properties?: TProperties;
  x: number;
  y: number;
};

export type IndexedNumericSeriesPoint<TProperties = Record<string, unknown>> = Required<
  NumericSeriesPoint<TProperties>
> & {
  id: string;
};

export type NumericSeriesDomain = [min: number, max: number];

export type BinnedSeriesQuery = {
  includeEmptyBins?: boolean;
  targetBinCount: number;
  xDomain: NumericSeriesDomain;
};

export type BinnedSeriesBin<TProperties = Record<string, unknown>> = {
  averageY: number | null;
  firstPoint: IndexedNumericSeriesPoint<TProperties> | null;
  index: number;
  lastPoint: IndexedNumericSeriesPoint<TProperties> | null;
  maxY: number | null;
  metrics: DataDensityMetricRecord;
  minY: number | null;
  pointCount: number;
  sumY: number;
  x0: number;
  x1: number;
};

export type BinnedSeriesSummary = {
  binCount: number;
  metrics: DataDensityMetricRecord;
  pointCount: number;
  xDomain: NumericSeriesDomain;
};

export type BinnedSeries<TProperties = Record<string, unknown>> = {
  bins: Array<BinnedSeriesBin<TProperties>>;
  summary: BinnedSeriesSummary;
};

export type BinnedSeriesIndexOptions<TProperties = Record<string, unknown>> = {
  filterPoint?: (point: IndexedNumericSeriesPoint<TProperties>) => boolean;
};

export type BinnedSeriesIndex<TProperties = Record<string, unknown>> = {
  getBinnedSeries(query: BinnedSeriesQuery): BinnedSeries<TProperties>;
  getPointById(pointId: string): IndexedNumericSeriesPoint<TProperties> | null;
  getSeriesBounds(): {
    maxX: number;
    maxY: number;
    minX: number;
    minY: number;
  } | null;
};

export function normalizeDensityMetrics(
  metrics: DataDensityMetricRecord | undefined,
): DataDensityMetricRecord {
  if (!metrics) {
    return {};
  }

  return Object.fromEntries(Object.entries(metrics).filter((entry) => Number.isFinite(entry[1])));
}

export function collectDensityMetricKeys(
  metricRecords: readonly (DataDensityMetricRecord | undefined)[],
): string[] {
  const metricKeys = new Set<string>();

  for (const metrics of metricRecords) {
    for (const metricKey of Object.keys(metrics ?? {})) {
      metricKeys.add(metricKey);
    }
  }

  return Array.from(metricKeys).sort((left, right) => left.localeCompare(right));
}

export function sumDensityMetrics(
  metricRecords: readonly (DataDensityMetricRecord | undefined)[],
  metricKeys = collectDensityMetricKeys(metricRecords),
): DataDensityMetricRecord {
  const totals = Object.fromEntries(metricKeys.map((metricKey) => [metricKey, 0]));

  for (const metrics of metricRecords) {
    for (const metricKey of metricKeys) {
      totals[metricKey] += readNumericMetric(metrics ?? {}, metricKey);
    }
  }

  return totals;
}

export function createDensityMetricSummary(
  metricRecords: readonly (DataDensityMetricRecord | undefined)[],
  itemCount = metricRecords.length,
): DataDensityMetricSummary {
  const metricKeys = collectDensityMetricKeys(metricRecords);

  return {
    itemCount,
    metricKeys,
    metrics: sumDensityMetrics(metricRecords, metricKeys),
  };
}

export function createDensityViewportSummary(
  kind: DataDensityViewportSummary["kind"],
  metricRecords: readonly (DataDensityMetricRecord | undefined)[],
  itemCount = metricRecords.length,
): DataDensityViewportSummary {
  return {
    kind,
    ...createDensityMetricSummary(metricRecords, itemCount),
  };
}

export function createBinnedSeriesIndex<TProperties = Record<string, unknown>>(
  points: readonly NumericSeriesPoint<TProperties>[],
  options: BinnedSeriesIndexOptions<TProperties> = {},
): BinnedSeriesIndex<TProperties> {
  const normalizedPoints = points
    .map((point, index) => normalizeSeriesPoint(point, index))
    .filter(isFiniteSeriesPoint)
    .filter((point) => options.filterPoint?.(point) ?? true)
    .sort((left, right) => left.x - right.x);
  const pointLookup = new Map(normalizedPoints.map((point) => [point.id, point]));
  const metricKeys = collectDensityMetricKeys(normalizedPoints.map((point) => point.metrics));

  return {
    getBinnedSeries(query) {
      const xDomain = normalizeDomain(query.xDomain);
      const targetBinCount = clampInteger(query.targetBinCount, 1, 100_000);
      const binWidth = getBinWidth(xDomain, targetBinCount);
      const startIndex = lowerBoundByX(normalizedPoints, xDomain[0]);
      const endIndex = upperBoundByX(normalizedPoints, xDomain[1]);
      const bins = createEmptyBins<TProperties>(xDomain, targetBinCount, binWidth, metricKeys);

      for (let pointIndex = startIndex; pointIndex < endIndex; pointIndex += 1) {
        const point = normalizedPoints[pointIndex];
        const binIndex = Math.min(
          targetBinCount - 1,
          Math.max(0, Math.floor((point.x - xDomain[0]) / binWidth)),
        );

        updateSeriesBin(bins[binIndex], point, metricKeys);
      }

      const visibleBins = query.includeEmptyBins ? bins : bins.filter((bin) => bin.pointCount > 0);

      return {
        bins: visibleBins,
        summary: {
          binCount: visibleBins.length,
          metrics: sumDensityMetrics(
            visibleBins.map((bin) => bin.metrics),
            metricKeys,
          ),
          pointCount: visibleBins.reduce((total, bin) => total + bin.pointCount, 0),
          xDomain,
        },
      };
    },

    getPointById(pointId) {
      return pointLookup.get(pointId) ?? null;
    },

    getSeriesBounds() {
      if (normalizedPoints.length === 0) {
        return null;
      }

      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      for (const point of normalizedPoints) {
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }

      return {
        maxX: normalizedPoints[normalizedPoints.length - 1].x,
        maxY,
        minX: normalizedPoints[0].x,
        minY,
      };
    },
  };
}

function normalizeSeriesPoint<TProperties>(
  point: NumericSeriesPoint<TProperties>,
  index: number,
): IndexedNumericSeriesPoint<TProperties> {
  return {
    id: String(point.id ?? index),
    label: point.label ?? "",
    metrics: normalizeDensityMetrics(point.metrics),
    properties: point.properties ?? ({} as TProperties),
    x: point.x,
    y: point.y,
  };
}

function isFiniteSeriesPoint<TProperties>(point: IndexedNumericSeriesPoint<TProperties>): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function createEmptyBins<TProperties>(
  xDomain: NumericSeriesDomain,
  binCount: number,
  binWidth: number,
  metricKeys: string[],
): Array<BinnedSeriesBin<TProperties>> {
  return Array.from({ length: binCount }, (_, index) => ({
    averageY: null,
    firstPoint: null,
    index,
    lastPoint: null,
    maxY: null,
    metrics: Object.fromEntries(metricKeys.map((metricKey) => [metricKey, 0])),
    minY: null,
    pointCount: 0,
    sumY: 0,
    x0: xDomain[0] + index * binWidth,
    x1: index === binCount - 1 ? xDomain[1] : xDomain[0] + (index + 1) * binWidth,
  }));
}

function updateSeriesBin<TProperties>(
  bin: BinnedSeriesBin<TProperties>,
  point: IndexedNumericSeriesPoint<TProperties>,
  metricKeys: string[],
) {
  bin.firstPoint ??= point;
  bin.lastPoint = point;
  bin.pointCount += 1;
  bin.sumY += point.y;
  bin.averageY = bin.sumY / bin.pointCount;
  bin.minY = bin.minY === null ? point.y : Math.min(bin.minY, point.y);
  bin.maxY = bin.maxY === null ? point.y : Math.max(bin.maxY, point.y);

  for (const metricKey of metricKeys) {
    bin.metrics[metricKey] += point.metrics[metricKey] ?? 0;
  }
}

function lowerBoundByX<TProperties>(
  points: Array<IndexedNumericSeriesPoint<TProperties>>,
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

function upperBoundByX<TProperties>(
  points: Array<IndexedNumericSeriesPoint<TProperties>>,
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

function normalizeDomain(domain: NumericSeriesDomain): NumericSeriesDomain {
  const left = Number.isFinite(domain[0]) ? domain[0] : 0;
  const right = Number.isFinite(domain[1]) ? domain[1] : left;

  return left <= right ? [left, right] : [right, left];
}

function getBinWidth(domain: NumericSeriesDomain, binCount: number) {
  const span = domain[1] - domain[0];

  return span > 0 ? span / binCount : 1;
}

function readNumericMetric(metrics: DataDensityMetricRecord, metricKey: string) {
  const value = metrics[metricKey];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(Math.floor(value), min), max);
}

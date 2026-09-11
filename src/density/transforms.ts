import { clampInteger, isFiniteNumber, normalizeChartDomain } from "./shared";

export type ChartBinTransformOptions<TDatum> = {
  binCount: number;
  domain?: [number, number];
  includeEmptyBins?: boolean;
  value: (datum: TDatum, index: number) => number | null | undefined;
};

export type ChartBinTransformBin<TDatum> = {
  count: number;
  index: number;
  items: TDatum[];
  x: number;
  x0: number;
  x1: number;
};

export type ChartBinTransform<TDatum> = {
  bins: Array<ChartBinTransformBin<TDatum>>;
  summary: {
    binCount: number;
    binnedItemCount: number;
    requestedBinCount: number;
    sourceItemCount: number;
    valueDomain: [number, number];
  };
};

export type ChartContourGrid = {
  values: readonly number[];
  xCount: number;
  xDomain?: [number, number];
  yCount: number;
  yDomain?: [number, number];
};

export type ChartContourOptions = {
  thresholds: readonly number[];
};

export type ChartContourPoint = {
  x: number;
  y: number;
};

export type ChartContourLine = {
  closed: boolean;
  points: ChartContourPoint[];
};

export type ChartContour = {
  lines: ChartContourLine[];
  threshold: number;
};

type ChartContourSegment = readonly [ChartContourPoint, ChartContourPoint];

type ValuedDatum<TDatum> = {
  datum: TDatum;
  value: number;
};

function getFiniteValueDomain<TDatum>(valuedData: readonly ValuedDatum<TDatum>[]) {
  if (valuedData.length === 0) {
    return [0, 0] as [number, number];
  }

  let min = valuedData[0].value;
  let max = min;

  for (const item of valuedData.slice(1)) {
    min = Math.min(min, item.value);
    max = Math.max(max, item.value);
  }

  return [min, max] as [number, number];
}

function getBinIndex(value: number, domain: [number, number], binCount: number) {
  const [min, max] = domain;

  if (min === max) {
    return 0;
  }

  const position = (value - min) / (max - min);
  return Math.min(binCount - 1, Math.max(0, Math.floor(position * binCount)));
}

export function createChartBinTransform<TDatum>(
  data: readonly TDatum[],
  options: ChartBinTransformOptions<TDatum>,
): ChartBinTransform<TDatum> {
  const requestedBinCount = clampInteger(options.binCount, 1, 100_000);
  const valuedData = data
    .map((datum, index) => ({ datum, value: options.value(datum, index) }))
    .filter((item): item is ValuedDatum<TDatum> => isFiniteNumber(item.value));
  const valueDomain = normalizeChartDomain(options.domain ?? getFiniteValueDomain(valuedData));
  const [min, max] = valueDomain;
  const binWidth = requestedBinCount > 0 ? (max - min) / requestedBinCount : 0;
  const bins = Array.from(
    { length: requestedBinCount },
    (_, index): ChartBinTransformBin<TDatum> => {
      const x0 = min + binWidth * index;
      const x1 = index === requestedBinCount - 1 ? max : min + binWidth * (index + 1);

      return {
        count: 0,
        index,
        items: [],
        x: x0 + (x1 - x0) / 2,
        x0,
        x1,
      };
    },
  );

  let binnedItemCount = 0;

  for (const item of valuedData) {
    if (item.value < min || item.value > max) {
      continue;
    }

    const bin = bins[getBinIndex(item.value, valueDomain, requestedBinCount)];

    if (!bin) {
      continue;
    }

    bin.items.push(item.datum);
    bin.count += 1;
    binnedItemCount += 1;
  }

  const visibleBins =
    options.includeEmptyBins === false ? bins.filter((bin) => bin.count > 0) : bins;

  return {
    bins: visibleBins,
    summary: {
      binCount: visibleBins.length,
      binnedItemCount,
      requestedBinCount,
      sourceItemCount: data.length,
      valueDomain,
    },
  };
}

function normalizeGridCount(value: number, label: string) {
  const normalized = clampInteger(value, 2, 10_000);

  if (normalized !== value) {
    throw new RangeError(`${label} must be an integer between 2 and 10000`);
  }

  return normalized;
}

function normalizeContourThresholds(thresholds: readonly number[]) {
  return Array.from(new Set(thresholds.filter(isFiniteNumber))).sort((left, right) => left - right);
}

function mapGridCoordinate(index: number, count: number, domain: [number, number]) {
  if (count <= 1) {
    return domain[0];
  }

  return domain[0] + (index / (count - 1)) * (domain[1] - domain[0]);
}

function interpolateContourPoint(
  threshold: number,
  startValue: number,
  endValue: number,
  start: ChartContourPoint,
  end: ChartContourPoint,
): ChartContourPoint {
  const denominator = endValue - startValue;
  const position = denominator === 0 ? 0.5 : (threshold - startValue) / denominator;
  const t = Math.min(1, Math.max(0, position));

  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
}

function getContourPointKey(point: ChartContourPoint) {
  return `${point.x},${point.y}`;
}

function addContourSegment(
  segments: ChartContourSegment[],
  first: ChartContourPoint,
  second: ChartContourPoint,
) {
  if (getContourPointKey(first) === getContourPointKey(second)) {
    return;
  }

  segments.push([first, second]);
}

function createCellSegments(
  threshold: number,
  topLeftValue: number,
  topRightValue: number,
  bottomRightValue: number,
  bottomLeftValue: number,
  topLeft: ChartContourPoint,
  topRight: ChartContourPoint,
  bottomRight: ChartContourPoint,
  bottomLeft: ChartContourPoint,
): ChartContourSegment[] {
  const topLeftHigh = topLeftValue >= threshold;
  const topRightHigh = topRightValue >= threshold;
  const bottomRightHigh = bottomRightValue >= threshold;
  const bottomLeftHigh = bottomLeftValue >= threshold;
  const intersections: Partial<Record<"bottom" | "left" | "right" | "top", ChartContourPoint>> = {};

  if (topLeftHigh !== topRightHigh) {
    intersections.top = interpolateContourPoint(
      threshold,
      topLeftValue,
      topRightValue,
      topLeft,
      topRight,
    );
  }

  if (topRightHigh !== bottomRightHigh) {
    intersections.right = interpolateContourPoint(
      threshold,
      topRightValue,
      bottomRightValue,
      topRight,
      bottomRight,
    );
  }

  if (bottomLeftHigh !== bottomRightHigh) {
    intersections.bottom = interpolateContourPoint(
      threshold,
      bottomLeftValue,
      bottomRightValue,
      bottomLeft,
      bottomRight,
    );
  }

  if (topLeftHigh !== bottomLeftHigh) {
    intersections.left = interpolateContourPoint(
      threshold,
      topLeftValue,
      bottomLeftValue,
      topLeft,
      bottomLeft,
    );
  }

  const entries = [
    intersections.top,
    intersections.right,
    intersections.bottom,
    intersections.left,
  ].filter((point): point is ChartContourPoint => Boolean(point));

  if (entries.length === 2) {
    return [[entries[0], entries[1]]];
  }

  if (entries.length !== 4) {
    return [];
  }

  const top = intersections.top!;
  const right = intersections.right!;
  const bottom = intersections.bottom!;
  const left = intersections.left!;
  const centerHigh =
    (topLeftValue + topRightValue + bottomRightValue + bottomLeftValue) / 4 >= threshold;
  const segments: ChartContourSegment[] = [];

  if (centerHigh === topLeftHigh) {
    addContourSegment(segments, top, right);
    addContourSegment(segments, bottom, left);
  } else {
    addContourSegment(segments, top, left);
    addContourSegment(segments, right, bottom);
  }

  return segments;
}

function stitchContourSegments(segments: readonly ChartContourSegment[]): ChartContourLine[] {
  const adjacency = new Map<string, Array<{ endpoint: 0 | 1; segmentIndex: number }>>();
  const used = new Set<number>();

  segments.forEach((segment, segmentIndex) => {
    segment.forEach((point, endpoint) => {
      const key = getContourPointKey(point);
      const entries = adjacency.get(key) ?? [];
      entries.push({ endpoint: endpoint as 0 | 1, segmentIndex });
      adjacency.set(key, entries);
    });
  });

  const openSeedIndices: number[] = [];
  const remainingSeedIndices: number[] = [];

  segments.forEach((segment, segmentIndex) => {
    const hasOpenEndpoint = segment.some(
      (point) => (adjacency.get(getContourPointKey(point))?.length ?? 0) === 1,
    );
    (hasOpenEndpoint ? openSeedIndices : remainingSeedIndices).push(segmentIndex);
  });

  const lines: ChartContourLine[] = [];

  for (const seedIndex of [...openSeedIndices, ...remainingSeedIndices]) {
    if (used.has(seedIndex)) {
      continue;
    }

    const seed = segments[seedIndex];
    const firstDegree = adjacency.get(getContourPointKey(seed[0]))?.length ?? 0;
    const secondDegree = adjacency.get(getContourPointKey(seed[1]))?.length ?? 0;
    const seedStartEndpoint: 0 | 1 = firstDegree === 1 ? 0 : secondDegree === 1 ? 1 : 0;
    const startPoint = seed[seedStartEndpoint];
    const startKey = getContourPointKey(startPoint);
    const points: ChartContourPoint[] = [startPoint];
    let segmentIndex = seedIndex;
    let entryEndpoint = seedStartEndpoint;
    let closed = false;

    while (!used.has(segmentIndex)) {
      used.add(segmentIndex);
      const segment = segments[segmentIndex];
      const exitEndpoint = entryEndpoint === 0 ? 1 : 0;
      const exitPoint = segment[exitEndpoint];
      const exitKey = getContourPointKey(exitPoint);
      points.push(exitPoint);

      if (exitKey === startKey) {
        closed = true;
        points.pop();
        break;
      }

      const next = (adjacency.get(exitKey) ?? []).find((entry) => !used.has(entry.segmentIndex));

      if (!next) {
        break;
      }

      segmentIndex = next.segmentIndex;
      entryEndpoint = next.endpoint;
    }

    if (points.length >= 2) {
      lines.push({ closed, points });
    }
  }

  return lines;
}

function createContourSegmentsForThreshold(
  grid: ChartContourGrid,
  threshold: number,
  xCount: number,
  yCount: number,
  xDomain: [number, number],
  yDomain: [number, number],
) {
  const segments: ChartContourSegment[] = [];

  for (let yIndex = 0; yIndex < yCount - 1; yIndex += 1) {
    const y0 = mapGridCoordinate(yIndex, yCount, yDomain);
    const y1 = mapGridCoordinate(yIndex + 1, yCount, yDomain);

    for (let xIndex = 0; xIndex < xCount - 1; xIndex += 1) {
      const x0 = mapGridCoordinate(xIndex, xCount, xDomain);
      const x1 = mapGridCoordinate(xIndex + 1, xCount, xDomain);
      const topLeftValue = grid.values[yIndex * xCount + xIndex];
      const topRightValue = grid.values[yIndex * xCount + xIndex + 1];
      const bottomLeftValue = grid.values[(yIndex + 1) * xCount + xIndex];
      const bottomRightValue = grid.values[(yIndex + 1) * xCount + xIndex + 1];

      segments.push(
        ...createCellSegments(
          threshold,
          topLeftValue,
          topRightValue,
          bottomRightValue,
          bottomLeftValue,
          { x: x0, y: y0 },
          { x: x1, y: y0 },
          { x: x1, y: y1 },
          { x: x0, y: y1 },
        ),
      );
    }
  }

  return segments;
}

export function createChartContours(
  grid: ChartContourGrid,
  options: ChartContourOptions,
): ChartContour[] {
  const xCount = normalizeGridCount(grid.xCount, "xCount");
  const yCount = normalizeGridCount(grid.yCount, "yCount");
  const expectedValueCount = xCount * yCount;

  if (grid.values.length !== expectedValueCount) {
    throw new RangeError(`values must contain exactly ${expectedValueCount} entries`);
  }

  if (!grid.values.every(isFiniteNumber)) {
    throw new RangeError("values must contain only finite numbers");
  }

  const xDomain = normalizeChartDomain(grid.xDomain ?? [0, xCount - 1]);
  const yDomain = normalizeChartDomain(grid.yDomain ?? [0, yCount - 1]);

  return normalizeContourThresholds(options.thresholds).map((threshold) => ({
    lines: stitchContourSegments(
      createContourSegmentsForThreshold(grid, threshold, xCount, yCount, xDomain, yDomain),
    ),
    threshold,
  }));
}

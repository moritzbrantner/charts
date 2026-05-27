import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";

export type ChartLabelPlacement =
  | "top"
  | "top-right"
  | "right"
  | "bottom-right"
  | "bottom"
  | "bottom-left"
  | "left"
  | "top-left";

export type ChartLabelRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type ChartLabelObstacle = {
  id?: string;
  kind?: "mark" | "axis" | "custom";
  priority?: number;
  rect: ChartLabelRect;
};

export type ChartLabelAnnotation<TPayload = unknown> = {
  anchor: { x: number; y: number };
  id: string;
  maxWidth?: number;
  offset?: number;
  payload?: TPayload;
  placements?: readonly ChartLabelPlacement[];
  priority?: number;
  text: string;
};

export type ChartLabelLine = {
  text: string;
  width: number;
};

export type ChartLabelLeaderLine = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

export type ChartPlacedLabel<TPayload = unknown> = ChartLabelAnnotation<TPayload> & {
  hidden: boolean;
  leaderLine: ChartLabelLeaderLine | null;
  lines: ChartLabelLine[];
  placement: ChartLabelPlacement | null;
  rect: ChartLabelRect | null;
};

export type ChartLabelLayoutOptions = {
  boundary: ChartLabelRect;
  boundaryPadding?: number;
  collisionPadding?: number;
  font?: string;
  leaderLine?: "auto" | "always" | "never";
  lineHeight?: number;
  maxWidth?: number;
  obstacles?: readonly ChartLabelObstacle[];
  offset?: number;
  padding?: number;
};

type MeasuredLabel = {
  lines: ChartLabelLine[];
  textHeight: number;
  textWidth: number;
};

type PlacedCollisionItem = {
  leaderLine: ChartLabelLeaderLine | null;
  rect: ChartLabelRect;
};

type Candidate = {
  leaderLine: ChartLabelLeaderLine | null;
  placement: ChartLabelPlacement;
  rect: ChartLabelRect;
  score: number;
};

const DEFAULT_FONT = "12px Inter";
const DEFAULT_LINE_HEIGHT = 16;
const DEFAULT_MAX_WIDTH = 140;
const DEFAULT_PADDING = 4;
const DEFAULT_COLLISION_PADDING = 2;
const DEFAULT_BOUNDARY_PADDING = 4;
const DEFAULT_OFFSET = 8;
const DEFAULT_PLACEMENTS: readonly ChartLabelPlacement[] = [
  "top",
  "top-right",
  "right",
  "bottom-right",
  "bottom",
  "bottom-left",
  "left",
  "top-left",
];
const DIRECT_PLACEMENTS = new Set<ChartLabelPlacement>(["top", "right", "bottom", "left"]);
const preparedTextCache = new Map<string, ReturnType<typeof prepareWithSegments>>();
const measuredLabelCache = new Map<string, MeasuredLabel>();

export function layoutChartLabels<TPayload>(
  labels: readonly ChartLabelAnnotation<TPayload>[],
  options: ChartLabelLayoutOptions,
): Array<ChartPlacedLabel<TPayload>> {
  const font = options.font ?? DEFAULT_FONT;
  const lineHeight = options.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const padding = options.padding ?? DEFAULT_PADDING;
  const collisionPadding = options.collisionPadding ?? DEFAULT_COLLISION_PADDING;
  const boundaryPadding = options.boundaryPadding ?? DEFAULT_BOUNDARY_PADDING;
  const offset = options.offset ?? DEFAULT_OFFSET;
  const leaderLineMode = options.leaderLine ?? "auto";
  const obstacles = options.obstacles ?? [];
  const placedByInputIndex = new Map<number, ChartPlacedLabel<TPayload>>();
  const collisionItems: PlacedCollisionItem[] = [];

  const sortedLabels = labels
    .map((label, inputIndex) => ({ inputIndex, label }))
    .sort((left, right) => {
      const priorityDelta = (right.label.priority ?? 0) - (left.label.priority ?? 0);

      return priorityDelta || left.inputIndex - right.inputIndex;
    });

  for (const { inputIndex, label } of sortedLabels) {
    const measured = measureLabel(label.text, {
      font,
      lineHeight,
      maxWidth: label.maxWidth ?? maxWidth,
    });
    const placements = label.placements?.length ? label.placements : DEFAULT_PLACEMENTS;
    const labelOffset = label.offset ?? offset;
    const candidate = chooseLabelCandidate({
      anchor: label.anchor,
      boundary: options.boundary,
      boundaryPadding,
      collisionItems,
      collisionPadding,
      labelHeight: measured.textHeight + padding * 2,
      labelWidth: measured.textWidth + padding * 2,
      leaderLineMode,
      obstacles,
      offset: labelOffset,
      placements,
    });

    if (!candidate) {
      placedByInputIndex.set(inputIndex, {
        ...label,
        hidden: true,
        leaderLine: null,
        lines: measured.lines,
        placement: null,
        rect: null,
      });
      continue;
    }

    collisionItems.push({
      leaderLine: candidate.leaderLine,
      rect: candidate.rect,
    });
    placedByInputIndex.set(inputIndex, {
      ...label,
      hidden: false,
      leaderLine: candidate.leaderLine,
      lines: measured.lines,
      placement: candidate.placement,
      rect: candidate.rect,
    });
  }

  return labels.map((_, inputIndex) => {
    const placed = placedByInputIndex.get(inputIndex);

    if (!placed) {
      throw new Error(`Missing chart label placement for index ${inputIndex}`);
    }

    return placed;
  });
}

export function doChartLabelRectsIntersect(
  left: ChartLabelRect,
  right: ChartLabelRect,
  padding = 0,
): boolean {
  return !(
    left.x + left.width + padding <= right.x ||
    right.x + right.width + padding <= left.x ||
    left.y + left.height + padding <= right.y ||
    right.y + right.height + padding <= left.y
  );
}

function chooseLabelCandidate({
  anchor,
  boundary,
  boundaryPadding,
  collisionItems,
  collisionPadding,
  labelHeight,
  labelWidth,
  leaderLineMode,
  obstacles,
  offset,
  placements,
}: {
  anchor: { x: number; y: number };
  boundary: ChartLabelRect;
  boundaryPadding: number;
  collisionItems: readonly PlacedCollisionItem[];
  collisionPadding: number;
  labelHeight: number;
  labelWidth: number;
  leaderLineMode: "auto" | "always" | "never";
  obstacles: readonly ChartLabelObstacle[];
  offset: number;
  placements: readonly ChartLabelPlacement[];
}): Candidate | null {
  let bestCandidate: Candidate | null = null;

  placements.forEach((placement, placementIndex) => {
    const rect = getCandidateRect(anchor, labelWidth, labelHeight, offset, placement);
    const leaderLine = getCandidateLeaderLine(anchor, rect, placement, offset, leaderLineMode);

    if (!isRectInsideBoundary(rect, boundary, boundaryPadding)) {
      return;
    }

    if (obstacles.some((obstacle) => doChartLabelRectsIntersect(rect, obstacle.rect, collisionPadding))) {
      return;
    }

    if (collisionItems.some((item) => doChartLabelRectsIntersect(rect, item.rect, collisionPadding))) {
      return;
    }

    if (
      leaderLine &&
      (doesLeaderLineHitObstacles(leaderLine, obstacles, collisionPadding) ||
        doesLeaderLineHitPlacedItems(leaderLine, collisionItems, collisionPadding))
    ) {
      return;
    }

    const score =
      getAnchorDistance(anchor, rect) * 10 +
      placementIndex +
      getBoundaryDistancePenalty(rect, boundary, boundaryPadding) * 0.001;
    const candidate = {
      leaderLine,
      placement,
      rect,
      score,
    };

    if (!bestCandidate || candidate.score < bestCandidate.score) {
      bestCandidate = candidate;
    }
  });

  return bestCandidate;
}

function measureLabel(
  text: string,
  {
    font,
    lineHeight,
    maxWidth,
  }: {
    font: string;
    lineHeight: number;
    maxWidth: number;
  },
): MeasuredLabel {
  const cacheKey = `${font}\n${lineHeight}\n${maxWidth}\n${text}`;
  const cached = measuredLabelCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  if (!canUsePretextMeasurement()) {
    const measured = measureLabelWithFallback(text, maxWidth, lineHeight);

    measuredLabelCache.set(cacheKey, measured);

    return measured;
  }

  try {
    const preparedKey = `${font}\n${text}`;
    let prepared = preparedTextCache.get(preparedKey);

    if (!prepared) {
      prepared = prepareWithSegments(text, font);
      preparedTextCache.set(preparedKey, prepared);
    }

    const laidOut = layoutWithLines(prepared, maxWidth, lineHeight);
    const lines = laidOut.lines.map((line) => ({
      text: line.text,
      width: line.width,
    }));
    const measured = {
      lines,
      textHeight: laidOut.height,
      textWidth: Math.max(0, ...lines.map((line) => line.width)),
    };

    measuredLabelCache.set(cacheKey, measured);

    return measured;
  } catch {
    const measured = measureLabelWithFallback(text, maxWidth, lineHeight);

    measuredLabelCache.set(cacheKey, measured);

    return measured;
  }
}

function canUsePretextMeasurement(): boolean {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter === "undefined") {
    return false;
  }

  if (typeof OffscreenCanvas !== "undefined") {
    return true;
  }

  if (typeof navigator !== "undefined" && /\bjsdom\b/i.test(navigator.userAgent)) {
    return false;
  }

  return typeof document !== "undefined";
}

function measureLabelWithFallback(text: string, maxWidth: number, lineHeight: number): MeasuredLabel {
  const averageCharacterWidth = 7;
  const maxCharactersPerLine = Math.max(1, Math.floor(maxWidth / averageCharacterWidth));
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: ChartLabelLine[] = [];

  if (words.length === 0) {
    return {
      lines: [],
      textHeight: 0,
      textWidth: 0,
    };
  }

  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxCharactersPerLine) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push({
        text: currentLine,
        width: Math.min(maxWidth, currentLine.length * averageCharacterWidth),
      });
    }

    if (word.length <= maxCharactersPerLine) {
      currentLine = word;
      continue;
    }

    for (let index = 0; index < word.length; index += maxCharactersPerLine) {
      const chunk = word.slice(index, index + maxCharactersPerLine);

      lines.push({
        text: chunk,
        width: Math.min(maxWidth, chunk.length * averageCharacterWidth),
      });
    }

    currentLine = "";
  }

  if (currentLine) {
    lines.push({
      text: currentLine,
      width: Math.min(maxWidth, currentLine.length * averageCharacterWidth),
    });
  }

  return {
    lines,
    textHeight: lines.length * lineHeight,
    textWidth: Math.max(0, ...lines.map((line) => line.width)),
  };
}

function getCandidateRect(
  anchor: { x: number; y: number },
  width: number,
  height: number,
  offset: number,
  placement: ChartLabelPlacement,
): ChartLabelRect {
  switch (placement) {
    case "top":
      return { height, width, x: anchor.x - width / 2, y: anchor.y - offset - height };
    case "top-right":
      return { height, width, x: anchor.x + offset, y: anchor.y - offset - height };
    case "right":
      return { height, width, x: anchor.x + offset, y: anchor.y - height / 2 };
    case "bottom-right":
      return { height, width, x: anchor.x + offset, y: anchor.y + offset };
    case "bottom":
      return { height, width, x: anchor.x - width / 2, y: anchor.y + offset };
    case "bottom-left":
      return { height, width, x: anchor.x - offset - width, y: anchor.y + offset };
    case "left":
      return { height, width, x: anchor.x - offset - width, y: anchor.y - height / 2 };
    case "top-left":
      return { height, width, x: anchor.x - offset - width, y: anchor.y - offset - height };
  }
}

function getCandidateLeaderLine(
  anchor: { x: number; y: number },
  rect: ChartLabelRect,
  placement: ChartLabelPlacement,
  offset: number,
  mode: "auto" | "always" | "never",
): ChartLabelLeaderLine | null {
  if (mode === "never") {
    return null;
  }

  const endpoint = getNearestPointOnRect(anchor, rect);
  const distance = Math.hypot(endpoint.x - anchor.x, endpoint.y - anchor.y);
  const shouldRender = mode === "always" || !DIRECT_PLACEMENTS.has(placement) || distance > offset;

  if (!shouldRender) {
    return null;
  }

  return {
    x1: anchor.x,
    x2: endpoint.x,
    y1: anchor.y,
    y2: endpoint.y,
  };
}

function getNearestPointOnRect(
  point: { x: number; y: number },
  rect: ChartLabelRect,
): { x: number; y: number } {
  const x = clamp(point.x, rect.x, rect.x + rect.width);
  const y = clamp(point.y, rect.y, rect.y + rect.height);

  if (x === point.x && y === point.y) {
    const distances = [
      { distance: Math.abs(point.x - rect.x), x: rect.x, y: point.y },
      { distance: Math.abs(point.x - (rect.x + rect.width)), x: rect.x + rect.width, y: point.y },
      { distance: Math.abs(point.y - rect.y), x: point.x, y: rect.y },
      {
        distance: Math.abs(point.y - (rect.y + rect.height)),
        x: point.x,
        y: rect.y + rect.height,
      },
    ].sort((left, right) => left.distance - right.distance);

    return {
      x: distances[0]?.x ?? point.x,
      y: distances[0]?.y ?? point.y,
    };
  }

  return { x, y };
}

function isRectInsideBoundary(
  rect: ChartLabelRect,
  boundary: ChartLabelRect,
  padding: number,
): boolean {
  return (
    rect.x >= boundary.x + padding &&
    rect.y >= boundary.y + padding &&
    rect.x + rect.width <= boundary.x + boundary.width - padding &&
    rect.y + rect.height <= boundary.y + boundary.height - padding
  );
}

function doesLeaderLineHitObstacles(
  line: ChartLabelLeaderLine,
  obstacles: readonly ChartLabelObstacle[],
  padding: number,
): boolean {
  return obstacles.some((obstacle) => {
    const expanded = expandRect(obstacle.rect, padding);

    if (isPointInsideRect({ x: line.x1, y: line.y1 }, expanded)) {
      return false;
    }

    return doesLineIntersectRect(line, obstacle.rect, padding);
  });
}

function doesLeaderLineHitPlacedItems(
  line: ChartLabelLeaderLine,
  items: readonly PlacedCollisionItem[],
  padding: number,
): boolean {
  return items.some((item) => {
    if (doesLineIntersectRect(line, item.rect, padding)) {
      return true;
    }

    return item.leaderLine ? doLineSegmentsIntersect(line, item.leaderLine) : false;
  });
}

function doesLineIntersectRect(
  line: ChartLabelLeaderLine,
  rect: ChartLabelRect,
  padding: number,
): boolean {
  const expanded = expandRect(rect, padding);

  if (
    isPointInsideRect({ x: line.x1, y: line.y1 }, expanded) ||
    isPointInsideRect({ x: line.x2, y: line.y2 }, expanded)
  ) {
    return true;
  }

  const top = {
    x1: expanded.x,
    x2: expanded.x + expanded.width,
    y1: expanded.y,
    y2: expanded.y,
  };
  const right = {
    x1: expanded.x + expanded.width,
    x2: expanded.x + expanded.width,
    y1: expanded.y,
    y2: expanded.y + expanded.height,
  };
  const bottom = {
    x1: expanded.x,
    x2: expanded.x + expanded.width,
    y1: expanded.y + expanded.height,
    y2: expanded.y + expanded.height,
  };
  const left = {
    x1: expanded.x,
    x2: expanded.x,
    y1: expanded.y,
    y2: expanded.y + expanded.height,
  };

  return [top, right, bottom, left].some((edge) => doLineSegmentsIntersect(line, edge));
}

function doLineSegmentsIntersect(
  left: ChartLabelLeaderLine,
  right: ChartLabelLeaderLine,
): boolean {
  const directionA = getOrientation(left.x1, left.y1, left.x2, left.y2, right.x1, right.y1);
  const directionB = getOrientation(left.x1, left.y1, left.x2, left.y2, right.x2, right.y2);
  const directionC = getOrientation(right.x1, right.y1, right.x2, right.y2, left.x1, left.y1);
  const directionD = getOrientation(right.x1, right.y1, right.x2, right.y2, left.x2, left.y2);

  if (directionA !== directionB && directionC !== directionD) {
    return true;
  }

  return (
    (directionA === 0 && isPointOnSegment(right.x1, right.y1, left)) ||
    (directionB === 0 && isPointOnSegment(right.x2, right.y2, left)) ||
    (directionC === 0 && isPointOnSegment(left.x1, left.y1, right)) ||
    (directionD === 0 && isPointOnSegment(left.x2, left.y2, right))
  );
}

function getOrientation(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
): -1 | 0 | 1 {
  const value = (y2 - y1) * (x3 - x2) - (x2 - x1) * (y3 - y2);

  if (Math.abs(value) < Number.EPSILON) {
    return 0;
  }

  return value > 0 ? 1 : -1;
}

function isPointOnSegment(x: number, y: number, line: ChartLabelLeaderLine): boolean {
  return (
    x <= Math.max(line.x1, line.x2) &&
    x >= Math.min(line.x1, line.x2) &&
    y <= Math.max(line.y1, line.y2) &&
    y >= Math.min(line.y1, line.y2)
  );
}

function getAnchorDistance(anchor: { x: number; y: number }, rect: ChartLabelRect): number {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  return Math.hypot(anchor.x - centerX, anchor.y - centerY);
}

function getBoundaryDistancePenalty(
  rect: ChartLabelRect,
  boundary: ChartLabelRect,
  padding: number,
): number {
  const left = rect.x - boundary.x - padding;
  const top = rect.y - boundary.y - padding;
  const right = boundary.x + boundary.width - padding - (rect.x + rect.width);
  const bottom = boundary.y + boundary.height - padding - (rect.y + rect.height);

  return 1 / Math.max(1, Math.min(left, top, right, bottom));
}

function expandRect(rect: ChartLabelRect, padding: number): ChartLabelRect {
  return {
    height: rect.height + padding * 2,
    width: rect.width + padding * 2,
    x: rect.x - padding,
    y: rect.y - padding,
  };
}

function isPointInsideRect(point: { x: number; y: number }, rect: ChartLabelRect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

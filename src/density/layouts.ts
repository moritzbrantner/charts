import { normalizeNumericValue } from "./shared";

import type {
  ChartCirclePackNode,
  ChartFlameGraphNode,
  ChartHierarchyNode,
  ChartIcicleNode,
  ChartIndentedTreeNode,
  ChartRadialTreeNode,
  ChartSunburstNode,
  ChartTreeNode,
  ChartTreemapNode,
} from "./types";

function getHierarchyValue<TPayload>(node: ChartHierarchyNode<TPayload>): number {
  const ownValue = normalizeNumericValue(node.value);

  if (ownValue !== null && ownValue > 0) {
    return ownValue;
  }

  return (node.children ?? []).reduce((total, child) => total + getHierarchyValue(child), 0);
}

function getHierarchyDepth<TPayload>(node: ChartHierarchyNode<TPayload>): number {
  const childDepths = (node.children ?? []).map((child) => getHierarchyDepth(child));

  return childDepths.length === 0 ? 0 : 1 + Math.max(...childDepths);
}

function countHierarchyLeaves<TPayload>(node: ChartHierarchyNode<TPayload>): number {
  const children = (node.children ?? []).filter((child) => getHierarchyValue(child) > 0);

  if (children.length === 0) {
    return 1;
  }

  return children.reduce((total, child) => total + countHierarchyLeaves(child), 0);
}

function layoutTreemapNode<TPayload>(
  node: ChartHierarchyNode<TPayload>,
  context: {
    depth: number;
    height: number;
    nodes: Array<ChartTreemapNode<TPayload>>;
    padding: number;
    parentId: string | null;
    value: number;
    width: number;
    x: number;
    y: number;
  },
) {
  const id = node.id ?? createHierarchyNodeId(node.label, context.parentId, context.depth);

  context.nodes.push({
    color: node.color,
    depth: context.depth,
    height: context.height,
    id,
    label: node.label,
    parentId: context.parentId,
    payload: node.payload,
    value: context.value,
    width: context.width,
    x: context.x,
    y: context.y,
  });

  const children = (node.children ?? [])
    .map((child) => ({ node: child, value: getHierarchyValue(child) }))
    .filter((child) => child.value > 0);

  if (children.length === 0 || context.width <= 0 || context.height <= 0) {
    return;
  }

  const inner = {
    height: Math.max(0, context.height - context.padding * 2),
    width: Math.max(0, context.width - context.padding * 2),
    x: context.x + context.padding,
    y: context.y + context.padding,
  };
  const total = children.reduce((sum, child) => sum + child.value, 0);
  let offset = 0;
  const splitHorizontal = inner.width >= inner.height;

  for (const child of children) {
    const ratio = total > 0 ? child.value / total : 0;
    const childRect = splitHorizontal
      ? {
          height: inner.height,
          width: inner.width * ratio,
          x: inner.x + offset,
          y: inner.y,
        }
      : {
          height: inner.height * ratio,
          width: inner.width,
          x: inner.x,
          y: inner.y + offset,
        };

    offset += splitHorizontal ? childRect.width : childRect.height;
    layoutTreemapNode(child.node, {
      ...childRect,
      depth: context.depth + 1,
      nodes: context.nodes,
      padding: context.padding,
      parentId: id,
      value: child.value,
    });
  }
}

function layoutSunburstNode<TPayload>(
  node: ChartHierarchyNode<TPayload>,
  context: {
    depth: number;
    endAngle: number;
    innerRadius: number;
    nodes: Array<ChartSunburstNode<TPayload>>;
    paddingAngle: number;
    parentId: string | null;
    radiusStep: number;
    startAngle: number;
    value: number;
  },
) {
  const id = node.id ?? createHierarchyNodeId(node.label, context.parentId, context.depth);
  const innerRadius = context.innerRadius + context.depth * context.radiusStep;
  const outerRadius = innerRadius + context.radiusStep;

  context.nodes.push({
    color: node.color,
    depth: context.depth,
    endAngle: context.endAngle,
    id,
    innerRadius,
    label: node.label,
    outerRadius,
    parentId: context.parentId,
    payload: node.payload,
    startAngle: context.startAngle,
    value: context.value,
  });

  const children = (node.children ?? [])
    .map((child) => ({ node: child, value: getHierarchyValue(child) }))
    .filter((child) => child.value > 0);
  const total = children.reduce((sum, child) => sum + child.value, 0);
  let cursor = context.startAngle;

  for (const child of children) {
    const span = total > 0 ? ((context.endAngle - context.startAngle) * child.value) / total : 0;
    const startAngle = cursor + context.paddingAngle / 2;
    const endAngle = cursor + span - context.paddingAngle / 2;

    cursor += span;

    if (endAngle <= startAngle) {
      continue;
    }

    layoutSunburstNode(child.node, {
      depth: context.depth + 1,
      endAngle,
      innerRadius: context.innerRadius,
      nodes: context.nodes,
      paddingAngle: context.paddingAngle,
      parentId: id,
      radiusStep: context.radiusStep,
      startAngle,
      value: child.value,
    });
  }
}

function layoutIcicleNode<TPayload>(
  node: ChartHierarchyNode<TPayload>,
  context: {
    depth: number;
    nodes: Array<ChartIcicleNode<TPayload>>;
    padding: number;
    parentId: string | null;
    rowHeight: number;
    value: number;
    width: number;
    x: number;
    y: number;
  },
) {
  const id = node.id ?? createHierarchyNodeId(node.label, context.parentId, context.depth);
  const inset = context.depth === 0 ? 0 : context.padding / 2;

  context.nodes.push({
    color: node.color,
    depth: context.depth,
    height: Math.max(0, context.rowHeight - context.padding),
    id,
    label: node.label,
    parentId: context.parentId,
    payload: node.payload,
    value: context.value,
    width: Math.max(0, context.width - inset * 2),
    x: context.x + inset,
    y: context.y + context.depth * context.rowHeight + context.padding / 2,
  });

  const children = (node.children ?? [])
    .map((child) => ({ node: child, value: getHierarchyValue(child) }))
    .filter((child) => child.value > 0);
  const total = children.reduce((sum, child) => sum + child.value, 0);
  let cursor = context.x;

  for (const child of children) {
    const width = total > 0 ? (context.width * child.value) / total : 0;

    layoutIcicleNode(child.node, {
      depth: context.depth + 1,
      nodes: context.nodes,
      padding: context.padding,
      parentId: id,
      rowHeight: context.rowHeight,
      value: child.value,
      width,
      x: cursor,
      y: context.y,
    });
    cursor += width;
  }
}

function layoutFlameGraphNode<TPayload>(
  node: ChartHierarchyNode<TPayload>,
  context: {
    depth: number;
    maxDepth: number;
    nodes: Array<ChartFlameGraphNode<TPayload>>;
    padding: number;
    parentId: string | null;
    rowHeight: number;
    value: number;
    width: number;
    x: number;
    y: number;
  },
) {
  const id = node.id ?? createHierarchyNodeId(node.label, context.parentId, context.depth);
  const inset = context.depth === 0 ? 0 : context.padding / 2;

  context.nodes.push({
    color: node.color,
    depth: context.depth,
    height: Math.max(0, context.rowHeight - context.padding),
    id,
    label: node.label,
    parentId: context.parentId,
    payload: node.payload,
    value: context.value,
    width: Math.max(0, context.width - inset * 2),
    x: context.x + inset,
    y: context.y + (context.maxDepth - context.depth) * context.rowHeight + context.padding / 2,
  });

  const children = (node.children ?? [])
    .map((child) => ({ node: child, value: getHierarchyValue(child) }))
    .filter((child) => child.value > 0);
  const total = children.reduce((sum, child) => sum + child.value, 0);
  let cursor = context.x;

  for (const child of children) {
    const width = total > 0 ? (context.width * child.value) / total : 0;

    layoutFlameGraphNode(child.node, {
      depth: context.depth + 1,
      maxDepth: context.maxDepth,
      nodes: context.nodes,
      padding: context.padding,
      parentId: id,
      rowHeight: context.rowHeight,
      value: child.value,
      width,
      x: cursor,
      y: context.y,
    });
    cursor += width;
  }
}

function layoutCirclePackNode<TPayload>(
  node: ChartHierarchyNode<TPayload>,
  context: {
    depth: number;
    nodes: Array<ChartCirclePackNode<TPayload>>;
    padding: number;
    parentId: string | null;
    radius: number;
    value: number;
    x: number;
    y: number;
  },
) {
  const id = node.id ?? createHierarchyNodeId(node.label, context.parentId, context.depth);

  context.nodes.push({
    color: node.color,
    depth: context.depth,
    id,
    label: node.label,
    parentId: context.parentId,
    payload: node.payload,
    radius: context.radius,
    value: context.value,
    x: context.x,
    y: context.y,
  });

  const children = (node.children ?? [])
    .map((child) => ({ node: child, value: getHierarchyValue(child) }))
    .filter((child) => child.value > 0);

  if (children.length === 0 || context.radius <= context.padding * 2) {
    return;
  }

  const total = children.reduce((sum, child) => sum + child.value, 0);
  const availableRadius = Math.max(0, context.radius - context.padding * 2);
  const childRadii = children.map((child) =>
    Math.max(3, Math.sqrt(child.value / total) * availableRadius * 0.48),
  );

  if (children.length === 1) {
    const child = children[0];
    const childRadius = childRadii[0];

    layoutCirclePackNode(child.node, {
      depth: context.depth + 1,
      nodes: context.nodes,
      padding: context.padding,
      parentId: id,
      radius: Math.min(childRadius, availableRadius),
      value: child.value,
      x: context.x,
      y: context.y,
    });
    return;
  }

  const angleStep = (Math.PI * 2) / children.length;

  children.forEach((child, childIndex) => {
    const childRadius = Math.min(childRadii[childIndex], availableRadius);
    const orbit = Math.max(0, availableRadius - childRadius);
    const angle = -Math.PI / 2 + childIndex * angleStep;

    layoutCirclePackNode(child.node, {
      depth: context.depth + 1,
      nodes: context.nodes,
      padding: context.padding,
      parentId: id,
      radius: childRadius,
      value: child.value,
      x: context.x + Math.cos(angle) * orbit,
      y: context.y + Math.sin(angle) * orbit,
    });
  });
}

function layoutTreeNode<TPayload>(
  node: ChartHierarchyNode<TPayload>,
  context: {
    depth: number;
    leafCursor: { value: number };
    nodes: Array<ChartTreeNode<TPayload>>;
    parentId: string | null;
    value: number;
    xStep: number;
    yStep: number;
  },
): number {
  const id = node.id ?? createHierarchyNodeId(node.label, context.parentId, context.depth);
  const children = (node.children ?? [])
    .map((child) => ({ node: child, value: getHierarchyValue(child) }))
    .filter((child) => child.value > 0);
  const childXs = children.map((child) =>
    layoutTreeNode(child.node, {
      depth: context.depth + 1,
      leafCursor: context.leafCursor,
      nodes: context.nodes,
      parentId: id,
      value: child.value,
      xStep: context.xStep,
      yStep: context.yStep,
    }),
  );
  const x =
    childXs.length > 0
      ? childXs.reduce((sum, childX) => sum + childX, 0) / childXs.length
      : context.leafCursor.value++ * context.xStep;
  const y = context.depth * context.yStep;

  context.nodes.push({
    color: node.color,
    depth: context.depth,
    id,
    label: node.label,
    parentId: context.parentId,
    payload: node.payload,
    value: context.value,
    x,
    y,
  });

  return x;
}

function layoutRadialTreeNode<TPayload>(
  node: ChartHierarchyNode<TPayload>,
  context: {
    centerX: number;
    centerY: number;
    depth: number;
    leafCursor: { value: number };
    leafCount: number;
    maxDepth: number;
    nodes: Array<ChartRadialTreeNode<TPayload>>;
    parentId: string | null;
    radiusStep: number;
    startAngle: number;
    value: number;
  },
): number {
  const id = node.id ?? createHierarchyNodeId(node.label, context.parentId, context.depth);
  const children = (node.children ?? [])
    .map((child) => ({ node: child, value: getHierarchyValue(child) }))
    .filter((child) => child.value > 0);
  const childAngles = children.map((child) =>
    layoutRadialTreeNode(child.node, {
      centerX: context.centerX,
      centerY: context.centerY,
      depth: context.depth + 1,
      leafCursor: context.leafCursor,
      leafCount: context.leafCount,
      maxDepth: context.maxDepth,
      nodes: context.nodes,
      parentId: id,
      radiusStep: context.radiusStep,
      startAngle: context.startAngle,
      value: child.value,
    }),
  );
  const angle =
    childAngles.length > 0
      ? childAngles.reduce((sum, childAngle) => sum + childAngle, 0) / childAngles.length
      : context.startAngle + (Math.PI * 2 * context.leafCursor.value++) / context.leafCount;
  const radius = context.depth * context.radiusStep;

  context.nodes.push({
    angle,
    color: node.color,
    depth: context.depth,
    id,
    label: node.label,
    parentId: context.parentId,
    payload: node.payload,
    radius,
    value: context.value,
    x: context.centerX + Math.cos(angle) * radius,
    y: context.centerY + Math.sin(angle) * radius,
  });

  return angle;
}

function layoutIndentedTreeNode<TPayload>(
  node: ChartHierarchyNode<TPayload>,
  context: {
    depth: number;
    height: number;
    indent: number;
    nodes: Array<ChartIndentedTreeNode<TPayload>>;
    padding: number;
    parentId: string | null;
    rowCursor: { value: number };
    rowHeight: number;
    value: number;
    width: number;
    x: number;
    y: number;
  },
) {
  const id = node.id ?? createHierarchyNodeId(node.label, context.parentId, context.depth);
  const rowIndex = context.rowCursor.value++;
  const rowY = context.y + rowIndex * context.rowHeight;
  const x = context.x + context.padding + context.depth * context.indent;

  context.nodes.push({
    color: node.color,
    depth: context.depth,
    height: Math.max(0, context.rowHeight - 2),
    id,
    label: node.label,
    parentId: context.parentId,
    payload: node.payload,
    rowIndex,
    value: context.value,
    width: Math.max(0, context.width - (x - context.x) - context.padding),
    x,
    y: rowY + 1,
  });

  for (const child of node.children ?? []) {
    const value = getHierarchyValue(child);

    if (value <= 0) {
      continue;
    }

    layoutIndentedTreeNode(child, {
      ...context,
      depth: context.depth + 1,
      parentId: id,
      value,
    });
  }
}

function createHierarchyNodeId(label: string, parentId: string | null, depth: number) {
  return `${parentId ?? "root"}-${depth}-${normalizeGroupKey(label)}`;
}

export function normalizeGroupKey(label: string) {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "group"
  );
}

export function createChartTreemapLayout<TPayload = unknown>(
  root: ChartHierarchyNode<TPayload>,
  options: {
    height: number;
    padding?: number;
    width: number;
    x?: number;
    y?: number;
  },
): Array<ChartTreemapNode<TPayload>> {
  const padding = Math.max(0, options.padding ?? 2);
  const rootValue = getHierarchyValue(root);
  const nodes: Array<ChartTreemapNode<TPayload>> = [];

  layoutTreemapNode(root, {
    depth: 0,
    height: Math.max(0, options.height),
    nodes,
    padding,
    parentId: null,
    value: rootValue,
    width: Math.max(0, options.width),
    x: options.x ?? 0,
    y: options.y ?? 0,
  });

  return nodes;
}

export function createChartSunburstLayout<TPayload = unknown>(
  root: ChartHierarchyNode<TPayload>,
  options: {
    innerRadius?: number;
    outerRadius: number;
    paddingAngle?: number;
  },
): Array<ChartSunburstNode<TPayload>> {
  const maxDepth = getHierarchyDepth(root);
  const innerRadius = Math.max(0, options.innerRadius ?? 0);
  const outerRadius = Math.max(innerRadius, options.outerRadius);
  const radiusStep = maxDepth > 0 ? (outerRadius - innerRadius) / (maxDepth + 1) : outerRadius;
  const nodes: Array<ChartSunburstNode<TPayload>> = [];

  layoutSunburstNode(root, {
    depth: 0,
    endAngle: Math.PI * 2,
    innerRadius,
    nodes,
    paddingAngle: Math.max(0, options.paddingAngle ?? 0.004),
    parentId: null,
    radiusStep,
    startAngle: 0,
    value: getHierarchyValue(root),
  });

  return nodes;
}

export function createChartIcicleLayout<TPayload = unknown>(
  root: ChartHierarchyNode<TPayload>,
  options: {
    height: number;
    padding?: number;
    width: number;
    x?: number;
    y?: number;
  },
): Array<ChartIcicleNode<TPayload>> {
  const maxDepth = getHierarchyDepth(root);
  const height = Math.max(0, options.height);
  const width = Math.max(0, options.width);
  const rowHeight = maxDepth >= 0 ? height / (maxDepth + 1) : height;
  const nodes: Array<ChartIcicleNode<TPayload>> = [];

  layoutIcicleNode(root, {
    depth: 0,
    nodes,
    padding: Math.max(0, options.padding ?? 2),
    parentId: null,
    rowHeight,
    value: getHierarchyValue(root),
    width,
    x: options.x ?? 0,
    y: options.y ?? 0,
  });

  return nodes;
}

export function createChartFlameGraphLayout<TPayload = unknown>(
  root: ChartHierarchyNode<TPayload>,
  options: {
    height: number;
    padding?: number;
    width: number;
    x?: number;
    y?: number;
  },
): Array<ChartFlameGraphNode<TPayload>> {
  const maxDepth = getHierarchyDepth(root);
  const height = Math.max(0, options.height);
  const width = Math.max(0, options.width);
  const rowHeight = maxDepth >= 0 ? height / (maxDepth + 1) : height;
  const nodes: Array<ChartFlameGraphNode<TPayload>> = [];

  layoutFlameGraphNode(root, {
    depth: 0,
    maxDepth,
    nodes,
    padding: Math.max(0, options.padding ?? 2),
    parentId: null,
    rowHeight,
    value: getHierarchyValue(root),
    width,
    x: options.x ?? 0,
    y: options.y ?? 0,
  });

  return nodes;
}

export function createChartCirclePackLayout<TPayload = unknown>(
  root: ChartHierarchyNode<TPayload>,
  options: {
    height?: number;
    padding?: number;
    radius?: number;
    width?: number;
    x?: number;
    y?: number;
  } = {},
): Array<ChartCirclePackNode<TPayload>> {
  const width = Math.max(0, options.width ?? (options.radius ?? 160) * 2);
  const height = Math.max(0, options.height ?? (options.radius ?? 160) * 2);
  const radius = Math.max(0, options.radius ?? Math.min(width, height) / 2);
  const nodes: Array<ChartCirclePackNode<TPayload>> = [];

  layoutCirclePackNode(root, {
    depth: 0,
    nodes,
    padding: Math.max(0, options.padding ?? 3),
    parentId: null,
    radius,
    value: getHierarchyValue(root),
    x: options.x ?? width / 2,
    y: options.y ?? height / 2,
  });

  return nodes;
}

export function createChartTreeLayout<TPayload = unknown>(
  root: ChartHierarchyNode<TPayload>,
  options: {
    height: number;
    width: number;
    x?: number;
    y?: number;
  },
): Array<ChartTreeNode<TPayload>> {
  const leafCount = Math.max(1, countHierarchyLeaves(root));
  const maxDepth = Math.max(1, getHierarchyDepth(root));
  const width = Math.max(0, options.width);
  const height = Math.max(0, options.height);
  const nodes: Array<ChartTreeNode<TPayload>> = [];
  const xStep = leafCount > 1 ? width / (leafCount - 1) : 0;
  const yStep = height / maxDepth;

  layoutTreeNode(root, {
    depth: 0,
    leafCursor: { value: 0 },
    nodes,
    parentId: null,
    value: getHierarchyValue(root),
    xStep,
    yStep,
  });

  return nodes
    .map((node) => ({
      ...node,
      x: node.x + (options.x ?? 0) + (leafCount === 1 ? width / 2 : 0),
      y: node.y + (options.y ?? 0),
    }))
    .sort((left, right) => left.depth - right.depth);
}

export function createChartRadialTreeLayout<TPayload = unknown>(
  root: ChartHierarchyNode<TPayload>,
  options: {
    height?: number;
    innerRadius?: number;
    outerRadius?: number;
    startAngle?: number;
    width?: number;
    x?: number;
    y?: number;
  } = {},
): Array<ChartRadialTreeNode<TPayload>> {
  const width = Math.max(0, options.width ?? (options.outerRadius ?? 160) * 2);
  const height = Math.max(0, options.height ?? (options.outerRadius ?? 160) * 2);
  const centerX = options.x ?? width / 2;
  const centerY = options.y ?? height / 2;
  const innerRadius = Math.max(0, options.innerRadius ?? 0);
  const outerRadius = Math.max(innerRadius, options.outerRadius ?? Math.min(width, height) / 2);
  const maxDepth = Math.max(1, getHierarchyDepth(root));
  const leafCount = Math.max(1, countHierarchyLeaves(root));
  const nodes: Array<ChartRadialTreeNode<TPayload>> = [];
  const radiusStep = (outerRadius - innerRadius) / maxDepth;

  layoutRadialTreeNode(root, {
    centerX,
    centerY,
    depth: 0,
    leafCount,
    leafCursor: { value: 0 },
    maxDepth,
    nodes,
    parentId: null,
    radiusStep,
    startAngle: options.startAngle ?? -Math.PI / 2,
    value: getHierarchyValue(root),
  });

  return nodes
    .map((node) => {
      const radius = node.depth === 0 ? 0 : innerRadius + node.radius;

      return {
        ...node,
        radius,
        x: centerX + Math.cos(node.angle) * radius,
        y: centerY + Math.sin(node.angle) * radius,
      };
    })
    .sort((left, right) => left.depth - right.depth);
}

export function createChartIndentedTreeLayout<TPayload = unknown>(
  root: ChartHierarchyNode<TPayload>,
  options: {
    indent?: number;
    padding?: number;
    rowHeight?: number;
    width: number;
    x?: number;
    y?: number;
  },
): Array<ChartIndentedTreeNode<TPayload>> {
  const rowHeight = Math.max(12, options.rowHeight ?? 32);
  const nodes: Array<ChartIndentedTreeNode<TPayload>> = [];

  layoutIndentedTreeNode(root, {
    depth: 0,
    height: rowHeight,
    indent: Math.max(8, options.indent ?? 22),
    nodes,
    padding: Math.max(0, options.padding ?? 8),
    parentId: null,
    rowCursor: { value: 0 },
    rowHeight,
    value: getHierarchyValue(root),
    width: Math.max(0, options.width),
    x: options.x ?? 0,
    y: options.y ?? 0,
  });

  return nodes;
}

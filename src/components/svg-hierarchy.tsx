import { Button } from "../internal/ui-primitives";
import { useState } from "react";

import {
  ChartEmptyState,
  describeArc,
  formatCompactNumber,
  getSunburstLabelPoint,
  joinClassNames,
  truncateChartText,
} from "./shared";

import type { ChartTreemapNode } from "../density";
import type {
  ChartCirclePackSvgProps,
  ChartFlameGraphSvgProps,
  ChartIcicleSvgProps,
  ChartIndentedTreeSvgProps,
  ChartRadialTreeSvgProps,
  ChartSunburstSvgProps,
  ChartTreeSvgProps,
  ChartTreemapSvgProps,
} from "./types";
import type { JSX, KeyboardEvent } from "react";

export function ChartTreemapSvg<TPayload = unknown>({
  ariaLabel = "Chart treemap",
  centerLabel,
  className,
  data,
  defaultFocusedNodeId = null,
  focusedNodeId,
  formatValue = formatCompactNumber,
  onFocusedNodeChange,
  onNodeSelect,
  showNodeLabels = true,
  zoomable = false,
}: ChartTreemapSvgProps<TPayload>): JSX.Element {
  const [uncontrolledFocusedNodeId, setUncontrolledFocusedNodeId] = useState<string | null>(
    defaultFocusedNodeId,
  );

  if (data.length === 0) {
    return <ChartEmptyState className={className}>No treemap data.</ChartEmptyState>;
  }

  const width = Math.max(...data.map((node) => node.x + node.width));
  const height = Math.max(...data.map((node) => node.y + node.height));
  const rootNode = data.find((node) => node.depth === 0) ?? null;
  const nodeById = new Map(data.map((node) => [node.id, node]));
  const childrenByParentId = new Map<string | null, Array<ChartTreemapNode<TPayload>>>();

  for (const node of data) {
    const siblings = childrenByParentId.get(node.parentId) ?? [];

    siblings.push(node);
    childrenByParentId.set(node.parentId, siblings);
  }

  const requestedFocusId = focusedNodeId === undefined ? uncontrolledFocusedNodeId : focusedNodeId;
  const focusedNode =
    requestedFocusId !== null && requestedFocusId !== undefined
      ? (nodeById.get(requestedFocusId) ?? null)
      : null;
  const activeFocusNode = focusedNode ?? rootNode;
  const allVisibleNodes = data.filter((node) => node.depth > 0);
  const clickableNodes = zoomable
    ? activeFocusNode === null
      ? data.filter((node) => node.depth === 1)
      : (childrenByParentId.get(activeFocusNode.id) ?? [])
    : allVisibleNodes;
  const clickableNodeIds = new Set(clickableNodes.map((node) => node.id));
  const focusRootId = activeFocusNode?.id ?? null;
  const visibleNodes = zoomable
    ? focusRootId === null
      ? allVisibleNodes
      : data.filter(
          (node) => node.id !== focusRootId && isTreemapDescendantOf(node, focusRootId, nodeById),
        )
    : allVisibleNodes;
  const previewNodes = zoomable
    ? visibleNodes.filter((node) => !clickableNodeIds.has(node.id))
    : [];
  const resolvedCenterLabel = centerLabel ?? null;
  const viewBoxNode = focusedNode ?? { height, width, x: 0, y: 0 };

  const setFocusedNode = (node: ChartTreemapNode<TPayload> | null) => {
    const nextId = node?.id ?? null;

    if (focusedNodeId === undefined) {
      setUncontrolledFocusedNodeId(nextId);
    }

    onFocusedNodeChange?.(nextId, node);
  };

  const stepBack = () => {
    if (focusedNode === null) {
      return;
    }

    const parent = focusedNode.parentId ? (nodeById.get(focusedNode.parentId) ?? null) : null;

    setFocusedNode(parent?.depth === 0 ? null : parent);
  };

  const activateNode = (node: ChartTreemapNode<TPayload>) => {
    onNodeSelect?.(node);

    if (!zoomable || (childrenByParentId.get(node.id) ?? []).length === 0) {
      return;
    }

    setFocusedNode(node);
  };

  const handleNodeKeyDown = (
    event: KeyboardEvent<SVGGElement>,
    node: ChartTreemapNode<TPayload>,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    activateNode(node);
  };

  return (
    <div className={joinClassNames("relative border border-border/60 bg-muted/20 p-3", className)}>
      {zoomable && focusedNode ? (
        <Button
          type="button"
          aria-label="Back to parent treemap level"
          variant="outline"
          size="sm"
          className="absolute left-5 top-5 z-10 bg-background/90"
          onClick={stepBack}
        >
          Back
        </Button>
      ) : null}
      <svg
        viewBox={`${viewBoxNode.x} ${viewBoxNode.y} ${viewBoxNode.width} ${viewBoxNode.height}`}
        role="img"
        aria-label={ariaLabel}
        className="h-72 w-full"
        onClick={() => {
          if (zoomable) {
            stepBack();
          }
        }}
      >
        {previewNodes.map((node, index) => {
          const label = `${node.label}: ${formatValue(node.value)}`;

          return (
            <g
              key={node.id}
              aria-label={label}
              data-chart-treemap-node-id={node.id}
              data-chart-treemap-node-parent-id={node.parentId ?? undefined}
            >
              <title>{label}</title>
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                fill={node.color ?? `var(--chart-${(index % 5) + 1})`}
                fillOpacity={0.32}
                stroke="var(--background)"
                strokeWidth="1"
              />
            </g>
          );
        })}
        {clickableNodes.map((node, index) => {
          const label = `${node.label}: ${formatValue(node.value)}`;
          const isInteractive = onNodeSelect || (zoomable && childrenByParentId.has(node.id));
          const canShowLabel = showNodeLabels && node.width >= 46 && node.height >= 22;
          const visibleLabel = truncateChartText(
            node.label,
            Math.max(3, Math.floor((node.width - 12) / 4)),
          );

          return (
            <g
              key={node.id}
              aria-label={label}
              className={isInteractive ? "cursor-pointer" : undefined}
              data-chart-treemap-node-id={node.id}
              data-chart-treemap-node-parent-id={node.parentId ?? undefined}
              tabIndex={isInteractive ? 0 : undefined}
              onClick={(event) => {
                event.stopPropagation();
                activateNode(node);
              }}
              onKeyDown={isInteractive ? (event) => handleNodeKeyDown(event, node) : undefined}
            >
              <title>{label}</title>
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                fill={node.color ?? `var(--chart-${(index % 5) + 1})`}
                fillOpacity={zoomable ? 0.46 : 0.22 + Math.min(0.5, node.depth * 0.1)}
                stroke="var(--background)"
                strokeWidth="1"
              />
              {canShowLabel ? (
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--foreground)"
                  fontSize="12"
                  fontWeight="700"
                  paintOrder="stroke"
                  stroke="var(--background)"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  pointerEvents="none"
                >
                  {visibleLabel}
                </text>
              ) : null}
            </g>
          );
        })}
        {resolvedCenterLabel ? (
          <text
            x={viewBoxNode.x + viewBoxNode.width / 2}
            y={viewBoxNode.y + viewBoxNode.height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--foreground)"
            fontSize="18"
            fontWeight="700"
            paintOrder="stroke"
            stroke="var(--background)"
            strokeLinejoin="round"
            strokeWidth="6"
            pointerEvents="none"
          >
            {resolvedCenterLabel}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

function isTreemapDescendantOf<TPayload>(
  node: ChartTreemapNode<TPayload>,
  ancestorId: string,
  nodeById: Map<string, ChartTreemapNode<TPayload>>,
) {
  let parentId = node.parentId;

  while (parentId) {
    if (parentId === ancestorId) {
      return true;
    }

    parentId = nodeById.get(parentId)?.parentId ?? null;
  }

  return false;
}

export function ChartSunburstSvg<TPayload = unknown>({
  ariaLabel = "Chart sunburst",
  className,
  data,
  formatValue = formatCompactNumber,
  height = 340,
  onNodeSelect,
  width = 340,
}: ChartSunburstSvgProps<TPayload>): JSX.Element {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  if (data.length === 0) {
    return <ChartEmptyState className={className}>No sunburst data.</ChartEmptyState>;
  }

  const cx = width / 2;
  const cy = height / 2;
  const hoveredNode = hoveredNodeId ? data.find((node) => node.id === hoveredNodeId) : null;
  const fullHoveredLabel = hoveredNode
    ? `${hoveredNode.label}: ${formatValue(hoveredNode.value)}`
    : null;
  const hoveredLabel = fullHoveredLabel
    ? truncateChartText(fullHoveredLabel, Math.max(12, Math.floor(width / 6)))
    : null;
  const hoveredLabelPoint =
    hoveredNode && hoveredLabel
      ? getSunburstLabelPoint(hoveredNode, hoveredLabel, width, height)
      : null;

  return (
    <div className={joinClassNames("border border-border/60 bg-muted/20 p-3", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="h-80 w-full"
      >
        {data
          .filter((node) => node.depth > 0)
          .map((node, index) => {
            const label = `${node.label}: ${formatValue(node.value)}`;

            return (
              <path
                key={node.id}
                d={describeArc(
                  cx,
                  cy,
                  node.innerRadius,
                  node.outerRadius,
                  node.startAngle,
                  node.endAngle,
                )}
                fill={node.color ?? `var(--chart-${(index % 5) + 1})`}
                fillOpacity="0.72"
                stroke="var(--background)"
                strokeWidth="1"
                aria-label={label}
                onClick={() => onNodeSelect?.(node)}
                onFocus={() => setHoveredNodeId(node.id)}
                onBlur={() => setHoveredNodeId(null)}
                onPointerEnter={() => setHoveredNodeId(node.id)}
                onPointerLeave={() => setHoveredNodeId(null)}
              >
                <title>{label}</title>
              </path>
            );
          })}
        {hoveredLabel && hoveredLabelPoint ? (
          <g data-chart-sunburst-hover-label="" pointerEvents="none">
            <rect
              x={hoveredLabelPoint.x}
              y={hoveredLabelPoint.y - 17}
              width={hoveredLabelPoint.width}
              height="24"
              rx="4"
              fill="var(--background)"
              fillOpacity="0.94"
              stroke="var(--border)"
            />
            <text
              x={hoveredLabelPoint.x + 8}
              y={hoveredLabelPoint.y - 1}
              fill="var(--foreground)"
              fontSize="11"
              fontWeight="600"
            >
              {hoveredLabel}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

export function ChartIcicleSvg<TPayload = unknown>({
  ariaLabel = "Chart icicle",
  className,
  data,
  formatValue = formatCompactNumber,
  onNodeSelect,
  showNodeLabels = true,
}: ChartIcicleSvgProps<TPayload>): JSX.Element {
  if (data.length === 0) {
    return <ChartEmptyState className={className}>No icicle data.</ChartEmptyState>;
  }

  const width = Math.max(...data.map((node) => node.x + node.width));
  const height = Math.max(...data.map((node) => node.y + node.height));

  return (
    <div className={joinClassNames("border border-border/60 bg-muted/20 p-3", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="h-72 w-full"
      >
        {data
          .filter((node) => node.depth > 0)
          .map((node, index) => {
            const label = `${node.label}: ${formatValue(node.value)}`;
            const isInteractive = Boolean(onNodeSelect);
            const canShowLabel = showNodeLabels && node.width >= 42 && node.height >= 18;
            const visibleLabel = truncateChartText(
              node.label,
              Math.max(3, Math.floor((node.width - 12) / 7)),
            );

            return (
              <g
                key={node.id}
                aria-label={label}
                className={isInteractive ? "cursor-pointer" : undefined}
                data-chart-icicle-node-id={node.id}
                data-chart-icicle-node-parent-id={node.parentId ?? undefined}
                tabIndex={isInteractive ? 0 : undefined}
                onClick={() => onNodeSelect?.(node)}
                onKeyDown={
                  isInteractive
                    ? (event) => {
                        if (event.key !== "Enter" && event.key !== " ") {
                          return;
                        }

                        event.preventDefault();
                        onNodeSelect?.(node);
                      }
                    : undefined
                }
              >
                <title>{label}</title>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  fill={node.color ?? `var(--chart-${(index % 5) + 1})`}
                  fillOpacity={0.24 + Math.min(0.48, node.depth * 0.1)}
                  stroke="var(--background)"
                  strokeWidth="1"
                />
                {canShowLabel ? (
                  <text
                    x={node.x + 6}
                    y={node.y + node.height / 2}
                    dominantBaseline="middle"
                    fill="var(--foreground)"
                    fontSize="12"
                    fontWeight="700"
                    paintOrder="stroke"
                    pointerEvents="none"
                    stroke="var(--background)"
                    strokeLinejoin="round"
                    strokeWidth="4"
                  >
                    {visibleLabel}
                  </text>
                ) : null}
              </g>
            );
          })}
      </svg>
    </div>
  );
}

export function ChartFlameGraphSvg<TPayload = unknown>({
  ariaLabel = "Chart flame graph",
  className,
  data,
  formatValue = formatCompactNumber,
  onNodeSelect,
  showNodeLabels = true,
}: ChartFlameGraphSvgProps<TPayload>): JSX.Element {
  if (data.length === 0) {
    return <ChartEmptyState className={className}>No flame graph data.</ChartEmptyState>;
  }

  const width = Math.max(...data.map((node) => node.x + node.width));
  const height = Math.max(...data.map((node) => node.y + node.height));

  return (
    <div className={joinClassNames("border border-border/60 bg-muted/20 p-3", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="h-72 w-full"
      >
        {data.map((node, index) => {
          const label = `${node.label}: ${formatValue(node.value)}`;
          const isInteractive = Boolean(onNodeSelect);
          const canShowLabel = showNodeLabels && node.width >= 42 && node.height >= 18;
          const visibleLabel = truncateChartText(
            node.label,
            Math.max(3, Math.floor((node.width - 12) / 7)),
          );

          return (
            <g
              key={node.id}
              aria-label={label}
              className={isInteractive ? "cursor-pointer" : undefined}
              data-chart-flame-graph-node-id={node.id}
              data-chart-flame-graph-node-parent-id={node.parentId ?? undefined}
              tabIndex={isInteractive ? 0 : undefined}
              onClick={() => onNodeSelect?.(node)}
              onKeyDown={
                isInteractive
                  ? (event) => {
                      if (event.key !== "Enter" && event.key !== " ") {
                        return;
                      }

                      event.preventDefault();
                      onNodeSelect?.(node);
                    }
                  : undefined
              }
            >
              <title>{label}</title>
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                fill={node.color ?? `var(--chart-${(index % 5) + 1})`}
                fillOpacity={node.depth === 0 ? 0.18 : 0.26 + Math.min(0.48, node.depth * 0.1)}
                stroke="var(--background)"
                strokeWidth="1"
              />
              {canShowLabel ? (
                <text
                  x={node.x + 6}
                  y={node.y + node.height / 2}
                  dominantBaseline="middle"
                  fill="var(--foreground)"
                  fontSize="12"
                  fontWeight="700"
                  paintOrder="stroke"
                  pointerEvents="none"
                  stroke="var(--background)"
                  strokeLinejoin="round"
                  strokeWidth="4"
                >
                  {visibleLabel}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ChartCirclePackSvg<TPayload = unknown>({
  ariaLabel = "Chart circle pack",
  className,
  data,
  formatValue = formatCompactNumber,
  height,
  onNodeSelect,
  showNodeLabels = true,
  width,
}: ChartCirclePackSvgProps<TPayload>): JSX.Element {
  if (data.length === 0) {
    return <ChartEmptyState className={className}>No circle pack data.</ChartEmptyState>;
  }

  const minX = Math.min(...data.map((node) => node.x - node.radius));
  const minY = Math.min(...data.map((node) => node.y - node.radius));
  const maxX = Math.max(...data.map((node) => node.x + node.radius));
  const maxY = Math.max(...data.map((node) => node.y + node.radius));
  const viewWidth = width ?? maxX - minX;
  const viewHeight = height ?? maxY - minY;

  return (
    <div className={joinClassNames("border border-border/60 bg-muted/20 p-3", className)}>
      <svg
        viewBox={`${minX} ${minY} ${viewWidth} ${viewHeight}`}
        role="img"
        aria-label={ariaLabel}
        className="h-80 w-full"
      >
        {data.map((node, index) => {
          const label = `${node.label}: ${formatValue(node.value)}`;
          const isInteractive = node.depth > 0 && Boolean(onNodeSelect);
          const canShowLabel = showNodeLabels && node.depth > 0 && node.radius >= 18;
          const visibleLabel = truncateChartText(
            node.label,
            Math.max(3, Math.floor((node.radius * 1.65) / 6)),
          );

          return (
            <g
              key={node.id}
              aria-label={label}
              className={isInteractive ? "cursor-pointer" : undefined}
              data-chart-circle-pack-node-id={node.id}
              data-chart-circle-pack-node-parent-id={node.parentId ?? undefined}
              tabIndex={isInteractive ? 0 : undefined}
              onClick={() => {
                if (node.depth > 0) {
                  onNodeSelect?.(node);
                }
              }}
              onKeyDown={
                isInteractive
                  ? (event) => {
                      if (event.key !== "Enter" && event.key !== " ") {
                        return;
                      }

                      event.preventDefault();
                      onNodeSelect?.(node);
                    }
                  : undefined
              }
            >
              <title>{label}</title>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={
                  node.depth === 0
                    ? "transparent"
                    : (node.color ?? `var(--chart-${(index % 5) + 1})`)
                }
                fillOpacity={node.depth === 0 ? 0 : 0.24 + Math.min(0.44, node.depth * 0.1)}
                stroke={node.depth === 0 ? "var(--border)" : "var(--background)"}
                strokeWidth={node.depth === 0 ? 1 : 1.5}
              />
              {canShowLabel ? (
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--foreground)"
                  fontSize="11"
                  fontWeight="700"
                  paintOrder="stroke"
                  pointerEvents="none"
                  stroke="var(--background)"
                  strokeLinejoin="round"
                  strokeWidth="4"
                >
                  {visibleLabel}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ChartRadialTreeSvg<TPayload = unknown>({
  ariaLabel = "Chart radial tree",
  className,
  data,
  formatValue = formatCompactNumber,
  height = 340,
  onNodeSelect,
  showNodeLabels = true,
  width = 340,
}: ChartRadialTreeSvgProps<TPayload>): JSX.Element {
  if (data.length === 0) {
    return <ChartEmptyState className={className}>No radial tree data.</ChartEmptyState>;
  }

  const nodeById = new Map(data.map((node) => [node.id, node]));

  return (
    <div className={joinClassNames("border border-border/60 bg-muted/20 p-3", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="h-80 w-full"
      >
        {data
          .filter((node) => node.parentId !== null)
          .map((node) => {
            const parent = node.parentId ? nodeById.get(node.parentId) : null;

            if (!parent) {
              return null;
            }

            return (
              <line
                key={`${node.id}-link`}
                x1={parent.x}
                y1={parent.y}
                x2={node.x}
                y2={node.y}
                stroke="var(--border)"
                strokeWidth="1.5"
              />
            );
          })}
        {data.map((node, index) => {
          const label = `${node.label}: ${formatValue(node.value)}`;
          const isInteractive = Boolean(onNodeSelect);
          const labelOffset = node.depth === 0 ? 0 : 13;
          const visibleLabel = truncateChartText(node.label, 18);

          return (
            <g
              key={node.id}
              aria-label={label}
              className={isInteractive ? "cursor-pointer" : undefined}
              data-chart-radial-tree-node-id={node.id}
              data-chart-radial-tree-node-parent-id={node.parentId ?? undefined}
              tabIndex={isInteractive ? 0 : undefined}
              onClick={() => onNodeSelect?.(node)}
              onKeyDown={
                isInteractive
                  ? (event) => {
                      if (event.key !== "Enter" && event.key !== " ") {
                        return;
                      }

                      event.preventDefault();
                      onNodeSelect?.(node);
                    }
                  : undefined
              }
            >
              <title>{label}</title>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.depth === 0 ? 7 : 6}
                fill={node.color ?? `var(--chart-${(index % 5) + 1})`}
                fillOpacity={node.depth === 0 ? 0.92 : 0.78}
                stroke="var(--background)"
                strokeWidth="2"
              />
              {showNodeLabels && node.depth > 0 ? (
                <text
                  x={node.x + Math.cos(node.angle) * labelOffset}
                  y={node.y + Math.sin(node.angle) * labelOffset}
                  textAnchor={Math.cos(node.angle) < -0.2 ? "end" : "start"}
                  dominantBaseline="middle"
                  fill="var(--foreground)"
                  fontSize="10.5"
                  fontWeight="600"
                  paintOrder="stroke"
                  pointerEvents="none"
                  stroke="var(--background)"
                  strokeLinejoin="round"
                  strokeWidth="4"
                >
                  {visibleLabel}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ChartIndentedTreeSvg<TPayload = unknown>({
  ariaLabel = "Chart indented tree",
  className,
  data,
  formatValue = formatCompactNumber,
  onNodeSelect,
  showValueBars = true,
}: ChartIndentedTreeSvgProps<TPayload>): JSX.Element {
  if (data.length === 0) {
    return <ChartEmptyState className={className}>No indented tree data.</ChartEmptyState>;
  }

  const width = Math.max(...data.map((node) => node.x + node.width));
  const height = Math.max(...data.map((node) => node.y + node.height + 2));
  const maxValue = Math.max(1, ...data.map((node) => node.value));

  return (
    <div className={joinClassNames("border border-border/60 bg-muted/20 p-3", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="h-80 w-full"
      >
        {data.map((node, index) => {
          const label = `${node.label}: ${formatValue(node.value)}`;
          const isInteractive = Boolean(onNodeSelect);
          const valueBarWidth = Math.max(0, Math.min(120, (node.value / maxValue) * 120));
          const valueBarX = Math.max(node.x + 110, width - 148);
          const labelSpace = Math.max(24, valueBarX - node.x - 22);
          const visibleLabel = truncateChartText(
            node.label,
            Math.max(3, Math.floor(labelSpace / 7)),
          );

          return (
            <g
              key={node.id}
              aria-label={label}
              className={isInteractive ? "cursor-pointer" : undefined}
              data-chart-indented-tree-node-id={node.id}
              data-chart-indented-tree-node-parent-id={node.parentId ?? undefined}
              tabIndex={isInteractive ? 0 : undefined}
              onClick={() => onNodeSelect?.(node)}
              onKeyDown={
                isInteractive
                  ? (event) => {
                      if (event.key !== "Enter" && event.key !== " ") {
                        return;
                      }

                      event.preventDefault();
                      onNodeSelect?.(node);
                    }
                  : undefined
              }
            >
              <title>{label}</title>
              <rect
                x="0"
                y={node.y}
                width={width}
                height={node.height}
                fill={node.rowIndex % 2 === 0 ? "var(--muted)" : "transparent"}
                fillOpacity="0.24"
                onClick={(event) => {
                  event.stopPropagation();
                  onNodeSelect?.(node);
                }}
              />
              <rect
                x={node.x}
                y={node.y + node.height / 2 - 5}
                width="10"
                height="10"
                fill={node.color ?? `var(--chart-${(index % 5) + 1})`}
                fillOpacity="0.76"
                onClick={(event) => {
                  event.stopPropagation();
                  onNodeSelect?.(node);
                }}
              />
              <text
                x={node.x + 16}
                y={node.y + node.height / 2}
                dominantBaseline="middle"
                fill="var(--foreground)"
                fontSize="12"
                fontWeight={node.depth === 0 ? 700 : 500}
                pointerEvents="none"
              >
                {visibleLabel}
              </text>
              {showValueBars ? (
                <>
                  <rect
                    x={valueBarX}
                    y={node.y + node.height / 2 - 4}
                    width="120"
                    height="8"
                    fill="var(--muted)"
                    fillOpacity="0.5"
                  />
                  <rect
                    x={valueBarX}
                    y={node.y + node.height / 2 - 4}
                    width={valueBarWidth}
                    height="8"
                    fill={node.color ?? `var(--chart-${(index % 5) + 1})`}
                    fillOpacity="0.68"
                  />
                </>
              ) : null}
              <text
                x={width - 8}
                y={node.y + node.height / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--muted-foreground)"
                fontSize="11"
                pointerEvents="none"
              >
                {formatValue(node.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ChartTreeSvg<TPayload = unknown>({
  ariaLabel = "Chart tree",
  className,
  data,
  formatValue = formatCompactNumber,
  height = 320,
  onNodeSelect,
  showNodeLabels = true,
  width = 640,
}: ChartTreeSvgProps<TPayload>): JSX.Element {
  if (data.length === 0) {
    return <ChartEmptyState className={className}>No tree data.</ChartEmptyState>;
  }

  const nodeById = new Map(data.map((node) => [node.id, node]));
  const padding = 28;
  const contentWidth = Math.max(1, width - padding * 2);
  const contentHeight = Math.max(1, height - padding * 2);
  const maxX = Math.max(1, ...data.map((node) => node.x));
  const maxY = Math.max(1, ...data.map((node) => node.y));
  const resolveX = (x: number) => padding + (x / maxX) * contentWidth;
  const resolveY = (y: number) => padding + (y / maxY) * contentHeight;

  return (
    <div className={joinClassNames("border border-border/60 bg-muted/20 p-3", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="h-80 w-full"
      >
        {data
          .filter((node) => node.parentId !== null)
          .map((node) => {
            const parent = node.parentId ? nodeById.get(node.parentId) : null;

            if (!parent) {
              return null;
            }

            return (
              <line
                key={`${node.id}-link`}
                x1={resolveX(parent.x)}
                y1={resolveY(parent.y)}
                x2={resolveX(node.x)}
                y2={resolveY(node.y)}
                stroke="var(--border)"
                strokeWidth="1.5"
              />
            );
          })}
        {data.map((node, index) => {
          const label = `${node.label}: ${formatValue(node.value)}`;
          const isInteractive = Boolean(onNodeSelect);
          const x = resolveX(node.x);
          const y = resolveY(node.y);
          const visibleLabel = truncateChartText(node.label, 18);

          return (
            <g
              key={node.id}
              aria-label={label}
              className={isInteractive ? "cursor-pointer" : undefined}
              data-chart-tree-node-id={node.id}
              data-chart-tree-node-parent-id={node.parentId ?? undefined}
              tabIndex={isInteractive ? 0 : undefined}
              onClick={() => onNodeSelect?.(node)}
              onKeyDown={
                isInteractive
                  ? (event) => {
                      if (event.key !== "Enter" && event.key !== " ") {
                        return;
                      }

                      event.preventDefault();
                      onNodeSelect?.(node);
                    }
                  : undefined
              }
            >
              <title>{label}</title>
              <circle
                cx={x}
                cy={y}
                r={node.depth === 0 ? 7 : 6}
                fill={node.color ?? `var(--chart-${(index % 5) + 1})`}
                fillOpacity={node.depth === 0 ? 0.92 : 0.78}
                stroke="var(--background)"
                strokeWidth="2"
              />
              {showNodeLabels ? (
                <text
                  x={x}
                  y={y + 18}
                  textAnchor="middle"
                  fill="var(--foreground)"
                  fontSize="11"
                  fontWeight={node.depth === 0 ? 700 : 500}
                  paintOrder="stroke"
                  pointerEvents="none"
                  stroke="var(--background)"
                  strokeLinejoin="round"
                  strokeWidth="4"
                >
                  {visibleLabel}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

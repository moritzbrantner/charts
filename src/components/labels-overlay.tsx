import { useMemo } from "react";
import { usePlotArea, useXAxisScale, useYAxisScale } from "recharts";

import { layoutChartLabels } from "../labels";

import { isFiniteNumber, renderDefaultChartLabel } from "./shared";

import type { ChartLabelAnnotation, ChartLabelObstacle } from "../labels";
import type { ChartLabelOverlayProps } from "./types";
import type { JSX } from "react";

export function ChartLabelOverlay<TPayload = unknown>({
  boundaryPadding,
  className,
  collisionPadding,
  font,
  labels,
  leaderLine,
  lineHeight = 16,
  maxWidth,
  obstacles = [],
  offset,
  padding = 4,
  pixelObstacles = [],
  renderLabel,
  xAxisId,
  yAxisId,
}: ChartLabelOverlayProps<TPayload>): JSX.Element | null {
  const plotArea = usePlotArea();
  const xScale = useXAxisScale(xAxisId);
  const yScale = useYAxisScale(yAxisId);
  const placedLabels = useMemo(() => {
    if (!plotArea || !xScale || !yScale) {
      return [];
    }

    const pixelLabels = labels
      .map((label): ChartLabelAnnotation<TPayload> | null => {
        const x = xScale(label.x, { position: "middle" });
        const y = yScale(label.y);

        if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
          return null;
        }

        const { x: _x, y: _y, ...annotation } = label;

        return {
          ...annotation,
          anchor: { x, y },
        };
      })
      .filter((label): label is ChartLabelAnnotation<TPayload> => label !== null);
    const dataObstacles = obstacles
      .map((obstacle): ChartLabelObstacle | null => {
        const x = xScale(obstacle.x, { position: "middle" });
        const y = yScale(obstacle.y);

        if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
          return null;
        }

        const radius = obstacle.radius ?? 4;
        const width = obstacle.width ?? radius * 2;
        const height = obstacle.height ?? radius * 2;

        return {
          id: obstacle.id,
          kind: obstacle.kind,
          priority: obstacle.priority,
          rect: {
            height,
            width,
            x: x - width / 2,
            y: y - height / 2,
          },
        };
      })
      .filter((obstacle): obstacle is ChartLabelObstacle => obstacle !== null);

    return layoutChartLabels(pixelLabels, {
      boundary: {
        height: plotArea.height,
        width: plotArea.width,
        x: plotArea.x,
        y: plotArea.y,
      },
      boundaryPadding,
      collisionPadding,
      font,
      leaderLine,
      lineHeight,
      maxWidth,
      obstacles: [...dataObstacles, ...pixelObstacles],
      offset,
      padding,
    });
  }, [
    boundaryPadding,
    collisionPadding,
    font,
    labels,
    leaderLine,
    lineHeight,
    maxWidth,
    obstacles,
    offset,
    padding,
    pixelObstacles,
    plotArea,
    xScale,
    yScale,
  ]);

  if (!plotArea || !xScale || !yScale) {
    return null;
  }

  return (
    <g className={className} pointerEvents="none">
      {placedLabels.map((label) => {
        if (label.hidden || !label.rect) {
          return null;
        }

        return (
          <g key={label.id} data-chart-label-id={label.id}>
            {label.leaderLine ? (
              <line
                x1={label.leaderLine.x1}
                x2={label.leaderLine.x2}
                y1={label.leaderLine.y1}
                y2={label.leaderLine.y2}
                stroke="var(--muted-foreground)"
                strokeOpacity="0.55"
                strokeWidth="1"
              />
            ) : null}
            {renderLabel ? renderLabel(label) : renderDefaultChartLabel(label, padding, lineHeight)}
          </g>
        );
      })}
    </g>
  );
}

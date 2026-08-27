import * as React from "react";

import type { ChartDensitySample } from "../density";

export type ChartDensityTableProps<TProperties = Record<string, unknown>> = Omit<
  React.ComponentProps<"table">,
  "children"
> & {
  caption?: React.ReactNode;
  formatNumber?: (value: number) => React.ReactNode;
  formatX?: (sample: ChartDensitySample<TProperties>) => React.ReactNode;
  samples: Array<ChartDensitySample<TProperties>>;
};

/**
 * Structured-value companion for interactive density charts.
 *
 * Render this table alongside or behind a chart when the visual surface carries
 * information that must also be available as semantic values. Consumers own
 * responsive presentation (for example a tabs/disclosure layout).
 */
export function ChartDensityTable<TProperties = Record<string, unknown>>({
  caption = "Chart values",
  formatNumber = defaultFormatNumber,
  formatX = (sample) => defaultFormatNumber(sample.x),
  samples,
  ...props
}: ChartDensityTableProps<TProperties>) {
  return (
    <table {...props}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">X</th>
          <th scope="col">Count</th>
          <th scope="col">Average</th>
          <th scope="col">Minimum</th>
          <th scope="col">Maximum</th>
          <th scope="col">Sum</th>
        </tr>
      </thead>
      <tbody>
        {samples.map((sample) => (
          <tr key={`${sample.index}:${sample.x0}:${sample.x1}`}>
            <th scope="row">{formatX(sample)}</th>
            <td>{sample.pointCount}</td>
            <td>{formatNullable(sample.averageY, formatNumber)}</td>
            <td>{formatNullable(sample.minY, formatNumber)}</td>
            <td>{formatNullable(sample.maxY, formatNumber)}</td>
            <td>{formatNumber(sample.sumY)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatNullable(value: number | null, formatNumber: (value: number) => React.ReactNode) {
  return value == null ? "—" : formatNumber(value);
}

function defaultFormatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(value);
}

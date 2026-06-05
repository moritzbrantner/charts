import type {
  ChartDensityIndexOptions,
  ChartDensityQuery,
  ChartHeatmapQuery,
  ChartHistogramQuery,
  ChartSeriesPoint,
} from "./types";
import type { BinnedSeriesQuery } from "../data-density";

export type ChartDensityWorkerBuildRequest<TProperties = Record<string, unknown>> = {
  options: Omit<ChartDensityIndexOptions<TProperties>, "backend" | "progressive">;
  points: readonly ChartSeriesPoint<TProperties>[];
  requestId: number;
  type: "build";
};

export type ChartDensityWorkerQueryMethod =
  | "getBackendCapabilities"
  | "getBinnedSeries"
  | "getChartSeries"
  | "getHeatmap"
  | "getHistogram"
  | "getPointById"
  | "getSeriesBounds";

export type ChartDensityWorkerQueryRequest<TProperties = Record<string, unknown>> = {
  method: ChartDensityWorkerQueryMethod;
  pointId?: string;
  query?:
    | BinnedSeriesQuery
    | ChartDensityQuery
    | ChartHeatmapQuery<TProperties>
    | ChartHistogramQuery<TProperties>;
  requestId: number;
  type: "query";
};

export type ChartDensityWorkerRequest<TProperties = Record<string, unknown>> =
  | ChartDensityWorkerBuildRequest<TProperties>
  | ChartDensityWorkerQueryRequest<TProperties>
  | {
      requestId: number;
      type: "dispose";
    };

export type ChartDensityWorkerResponse =
  | {
      requestId: number;
      type: "built";
    }
  | {
      requestId: number;
      result: unknown;
      type: "result";
    }
  | {
      error: {
        message: string;
        name?: string;
      };
      requestId: number;
      type: "error";
    };

export function serializeChartDensityWorkerError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    };
  }

  return {
    message: String(error),
  };
}

export function deserializeChartDensityWorkerError(error: { message: string; name?: string }) {
  const nextError = new Error(error.message);

  nextError.name = error.name ?? "ChartDensityWorkerError";

  return nextError;
}

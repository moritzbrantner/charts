import {
  deserializeChartDensityWorkerError,
  type ChartDensityWorkerQueryMethod,
  type ChartDensityWorkerRequest,
  type ChartDensityWorkerResponse,
} from "./worker-protocol";

import type { BinnedSeriesQuery } from "../data-density";
import type {
  ChartDensityIndexOptions,
  ChartDensityQuery,
  ChartDensityWorkerIndex,
  ChartDensityWorkerOptions,
  ChartHeatmapQuery,
  ChartHistogramQuery,
  ChartSeriesPoint,
} from "./types";

type PendingRequest = {
  reject: (error: unknown) => void;
  resolve: (value: unknown) => void;
};
type ChartDensityWorkerClientRequest<TProperties> =
  ChartDensityWorkerRequest<TProperties> extends infer TRequest
    ? TRequest extends { requestId: number }
      ? Omit<TRequest, "requestId">
      : never
    : never;

export function createChartDensityWorkerIndex<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options: Omit<ChartDensityIndexOptions<TProperties>, "backend" | "progressive"> = {},
  workerOptions: ChartDensityWorkerOptions = {},
): ChartDensityWorkerIndex<TProperties> | null {
  if (!canCreateChartDensityWorker(workerOptions)) {
    return null;
  }

  assertWorkerCompatibleOptions(options);

  const worker = createChartDensityWorker(workerOptions);
  const pending = new Map<number, PendingRequest>();
  let nextRequestId = 0;
  let isTerminated = false;

  const handleMessage = (event: MessageEvent<ChartDensityWorkerResponse>) => {
    const message = event.data;
    const request = pending.get(message.requestId);

    if (!request) {
      return;
    }

    pending.delete(message.requestId);

    if (message.type === "error") {
      request.reject(deserializeChartDensityWorkerError(message.error));
      return;
    }

    request.resolve(message.type === "result" ? message.result : undefined);
  };
  const handleError = (error: ErrorEvent) => {
    rejectPendingRequests(error.error ?? new Error(error.message || "Chart density worker failed"));
  };
  const rejectPendingRequests = (error: unknown) => {
    for (const request of pending.values()) {
      request.reject(error);
    }

    pending.clear();
  };
  const postRequest = <TResult>(request: ChartDensityWorkerClientRequest<TProperties>) => {
    if (isTerminated) {
      return Promise.reject(new Error("Chart density worker has been terminated"));
    }

    const requestId = (nextRequestId += 1);
    const promise = new Promise<TResult>((resolve, reject) => {
      pending.set(requestId, {
        reject,
        resolve: resolve as (value: unknown) => void,
      });
    });

    try {
      worker.postMessage({
        ...request,
        requestId,
      } satisfies ChartDensityWorkerRequest<TProperties>);
    } catch (error) {
      pending.delete(requestId);
      return Promise.reject(normalizeChartDensityWorkerClientError(error));
    }

    return promise;
  };
  const buildPromise = postRequest<void>({
    options,
    points,
    type: "build",
  });
  const readyPromise = buildPromise.then(() => workerIndex);
  const queryWorker = <TResult>(
    method: ChartDensityWorkerQueryMethod,
    query?:
      | BinnedSeriesQuery
      | ChartDensityQuery
      | ChartHeatmapQuery<TProperties>
      | ChartHistogramQuery<TProperties>,
    pointId?: string,
  ) =>
    readyPromise.then(() =>
      postRequest<TResult>({
        method,
        pointId,
        query,
        type: "query",
      }),
    );
  const workerIndex: ChartDensityWorkerIndex<TProperties> = {
    getBackendCapabilities() {
      return queryWorker("getBackendCapabilities");
    },
    getBinnedSeries(query: BinnedSeriesQuery) {
      return queryWorker("getBinnedSeries", query);
    },
    getChartSeries(query: ChartDensityQuery) {
      return queryWorker("getChartSeries", query);
    },
    getHeatmap(query: ChartHeatmapQuery<TProperties>) {
      assertWorkerCompatibleQuery(query);
      return queryWorker("getHeatmap", query);
    },
    getHistogram(query: ChartHistogramQuery<TProperties>) {
      assertWorkerCompatibleQuery(query);
      return queryWorker("getHistogram", query);
    },
    getPointById(pointId: string) {
      return queryWorker("getPointById", undefined, pointId);
    },
    getSeriesBounds() {
      return queryWorker("getSeriesBounds");
    },
    terminate() {
      if (isTerminated) {
        return;
      }

      isTerminated = true;
      rejectPendingRequests(new Error("Chart density worker has been terminated"));
      worker.removeEventListener?.("message", handleMessage);
      worker.removeEventListener?.("error", handleError);
      worker.postMessage({ requestId: (nextRequestId += 1), type: "dispose" });
      worker.terminate();
    },
    whenReady() {
      return readyPromise;
    },
  };

  worker.addEventListener("message", handleMessage);
  worker.addEventListener("error", handleError);

  return workerIndex;
}

function normalizeChartDensityWorkerClientError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

function canCreateChartDensityWorker(workerOptions: ChartDensityWorkerOptions) {
  return Boolean(workerOptions.createWorker) || typeof Worker !== "undefined";
}

function createChartDensityWorker(workerOptions: ChartDensityWorkerOptions) {
  if (workerOptions.createWorker) {
    return workerOptions.createWorker();
  }

  return new Worker(new URL("./worker.js", import.meta.url), {
    name: "chart-density-index",
    type: "module",
  });
}

function assertWorkerCompatibleOptions<TProperties>(
  options: Omit<ChartDensityIndexOptions<TProperties>, "backend" | "progressive">,
) {
  if (typeof options.filterPoint === "function") {
    throw new Error("Chart density workers do not support function-based filterPoint options.");
  }
}

function assertWorkerCompatibleQuery(query: { valueAccessor?: unknown }) {
  if (typeof query.valueAccessor === "function") {
    throw new Error("Chart density workers do not support function-based value accessors.");
  }
}

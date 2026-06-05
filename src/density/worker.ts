import { createChartDensityIndex } from "./backend";
import {
  serializeChartDensityWorkerError,
  type ChartDensityWorkerRequest,
  type ChartDensityWorkerResponse,
} from "./worker-protocol";

import type { ChartDensityIndex } from "./types";

let activeIndex: ChartDensityIndex | null = null;

globalThis.addEventListener("message", (event: MessageEvent<ChartDensityWorkerRequest>) => {
  const message = event.data;

  try {
    switch (message.type) {
      case "build":
        activeIndex = createChartDensityIndex(message.points, {
          ...message.options,
          backend: "wasm-index",
        });
        postWorkerMessage({
          requestId: message.requestId,
          type: "built",
        });
        break;
      case "dispose":
        activeIndex = null;
        break;
      case "query":
        postWorkerMessage({
          requestId: message.requestId,
          result: queryActiveIndex(message),
          type: "result",
        });
        break;
    }
  } catch (error) {
    postWorkerMessage({
      error: serializeChartDensityWorkerError(error),
      requestId: message.requestId,
      type: "error",
    });
  }
});

function queryActiveIndex(message: Extract<ChartDensityWorkerRequest, { type: "query" }>) {
  if (!activeIndex) {
    throw new Error("Chart density worker index is not ready.");
  }

  switch (message.method) {
    case "getBackendCapabilities":
      return activeIndex.getBackendCapabilities?.() ?? null;
    case "getBinnedSeries":
      return activeIndex.getBinnedSeries(
        message.query as Parameters<ChartDensityIndex["getBinnedSeries"]>[0],
      );
    case "getChartSeries":
      return activeIndex.getChartSeries(
        message.query as Parameters<ChartDensityIndex["getChartSeries"]>[0],
      );
    case "getHeatmap":
      return activeIndex.getHeatmap(
        message.query as Parameters<ChartDensityIndex["getHeatmap"]>[0],
      );
    case "getHistogram":
      return activeIndex.getHistogram(
        message.query as Parameters<ChartDensityIndex["getHistogram"]>[0],
      );
    case "getPointById":
      return activeIndex.getPointById(message.pointId ?? "");
    case "getSeriesBounds":
      return activeIndex.getSeriesBounds();
  }
}

function postWorkerMessage(message: ChartDensityWorkerResponse) {
  globalThis.postMessage(message);
}

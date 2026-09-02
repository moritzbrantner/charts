import { afterEach, describe, expect, test, vi } from "vitest";

import { createChartDensityIndex } from "./backend";

import type { ChartDensityWorkerRequest, ChartDensityWorkerResponse } from "./worker-protocol";

describe("chart density worker module", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  test("builds a wasm-index and serves chart, heatmap, and histogram queries", async () => {
    const worker = await importWorkerModule();
    const points = createPoints();
    const query = {
      includeEmptyBins: true,
      targetBinCount: 4,
      valueMode: "average" as const,
      xDomain: [0, 11] as [number, number],
    };
    const heatmapQuery = {
      xBinCount: 4,
      xDomain: [0, 11] as [number, number],
      yBinCount: 3,
    };
    const histogramQuery = {
      bucketCount: 5,
      xDomain: [0, 11] as [number, number],
    };

    await worker.dispatch({
      options: {},
      points,
      requestId: 1,
      type: "build",
    });

    const expected = createChartDensityIndex(points, { backend: "wasm-index" });

    await worker.dispatch({
      method: "getChartSeries",
      query,
      requestId: 2,
      type: "query",
    });
    await worker.dispatch({
      method: "getHeatmap",
      query: heatmapQuery,
      requestId: 3,
      type: "query",
    });
    await worker.dispatch({
      method: "getHistogram",
      query: histogramQuery,
      requestId: 4,
      type: "query",
    });

    expect(worker.responses).toEqual([
      { requestId: 1, type: "built" },
      {
        requestId: 2,
        result: expected.getChartSeries(query),
        type: "result",
      },
      {
        requestId: 3,
        result: expected.getHeatmap(heatmapQuery),
        type: "result",
      },
      {
        requestId: 4,
        result: expected.getHistogram(histogramQuery),
        type: "result",
      },
    ]);
  });

  test("serializes errors for queries before build and disposes without a response", async () => {
    const worker = await importWorkerModule();

    await worker.dispatch({
      method: "getChartSeries",
      query: { targetBinCount: 1, xDomain: [0, 1] },
      requestId: 1,
      type: "query",
    });
    await worker.dispatch({
      requestId: 2,
      type: "dispose",
    });

    expect(worker.responses).toEqual([
      {
        error: {
          message: "Chart density worker index is not ready.",
          name: "Error",
        },
        requestId: 1,
        type: "error",
      },
    ]);
  });
});

async function importWorkerModule() {
  const listeners: Array<
    (event: MessageEvent<ChartDensityWorkerRequest>) => Promise<void> | void
  > = [];
  const responses: ChartDensityWorkerResponse[] = [];

  vi.stubGlobal(
    "addEventListener",
    vi.fn(
      (
        type: string,
        listener: (event: MessageEvent<ChartDensityWorkerRequest>) => Promise<void> | void,
      ) => {
        if (type === "message") {
          listeners.push(listener);
        }
      },
    ),
  );
  vi.stubGlobal(
    "postMessage",
    vi.fn((message: ChartDensityWorkerResponse) => {
      responses.push(message);
    }),
  );

  await import("./worker");

  return {
    async dispatch(message: ChartDensityWorkerRequest) {
      await Promise.all(
        listeners.map((listener) =>
          listener({ data: message } as MessageEvent<ChartDensityWorkerRequest>),
        ),
      );
    },
    responses,
  };
}

function createPoints() {
  return Array.from({ length: 12 }, (_, pointIndex) => ({
    id: `point-${pointIndex}`,
    metrics: { count: 1, revenue: pointIndex % 4 },
    x: pointIndex,
    y: pointIndex % 5,
  }));
}

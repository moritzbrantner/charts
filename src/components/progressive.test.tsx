import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { createChartDensityIndex, useProgressiveChartDensity } from "@moritzbrantner/charts";

import type { ChartDensityWorkerRequest } from "../density/worker-protocol";

describe("useProgressiveChartDensity", () => {
  test("reports the initial hybrid-js status", () => {
    const points = createPoints(12);
    const { result, unmount } = renderHook(() =>
      useProgressiveChartDensity(points, {
        progressive: { warmup: "manual" },
      }),
    );

    expect(result.current.status).toMatchObject({
      activeBackend: "hybrid-js",
      isWarming: false,
      wasmReady: false,
    });
    expect(
      result.current.index.getChartSeries({ targetBinCount: 3, xDomain: [0, 11] }).summary,
    ).toMatchObject({
      pointCount: 12,
      valueMode: "average",
    });

    unmount();
  });

  test("updates status and calls onReady after manual wasm warmup", async () => {
    const onReady = vi.fn();
    const points = createPoints(30);
    const options = {
      progressive: {
        onReady,
        warmup: "manual" as const,
      },
    };
    const { result, unmount } = renderHook(() => useProgressiveChartDensity(points, options));

    await act(async () => {
      await result.current.warmWasmNow();
    });

    expect(result.current.status).toMatchObject({
      activeBackend: "wasm-index",
      isWarming: false,
      wasmError: null,
      wasmReady: true,
    });
    expect(onReady).toHaveBeenCalledTimes(1);

    unmount();
  });

  test("returns a worker index after manual worker warmup", async () => {
    const onWorkerReady = vi.fn();
    const points = createPoints(24);
    const options = {
      progressive: {
        onWorkerReady,
        warmup: "manual" as const,
        worker: {
          createWorker: () => new TestChartDensityWorker() as unknown as Worker,
        },
      },
    };
    const { result, unmount } = renderHook(() => useProgressiveChartDensity(points, options));
    let workerIndex = result.current.workerIndex;

    await act(async () => {
      workerIndex = await result.current.warmWorkerNow();
    });

    expect(workerIndex).not.toBeNull();
    expect(result.current.status).toMatchObject({
      activeBackend: "hybrid-js",
      isWorkerBuilding: false,
      workerReady: true,
      wasmReady: false,
    });
    expect(onWorkerReady).toHaveBeenCalledTimes(1);
    expect(await workerIndex?.getPointById("point-8")).toMatchObject({ y: 1 });

    workerIndex?.terminate();
    unmount();
  });

  test("calls onError when worker warmup fails", async () => {
    const onError = vi.fn();
    const points = createPoints(8);
    const options = {
      progressive: {
        onError,
        warmup: "manual" as const,
        worker: {
          createWorker() {
            throw new Error("worker unavailable");
          },
        },
      },
    };
    const { result, unmount } = renderHook(() => useProgressiveChartDensity(points, options));

    await act(async () => {
      await expect(result.current.warmWorkerNow()).rejects.toThrow("worker unavailable");
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.status.workerError).toBeInstanceOf(Error);

    unmount();
  });
});

function createPoints(length: number) {
  return Array.from({ length }, (_, pointIndex) => ({
    id: `point-${pointIndex}`,
    metrics: { count: 1, revenue: pointIndex % 5 },
    x: pointIndex,
    y: pointIndex % 7,
  }));
}

class TestChartDensityWorker {
  #index: ReturnType<typeof createChartDensityIndex> | null = null;
  #listeners = new Map<string, Set<(event: MessageEvent) => void>>();

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    const listeners = this.#listeners.get(type) ?? new Set<(event: MessageEvent) => void>();

    listeners.add(listener);
    this.#listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    this.#listeners.get(type)?.delete(listener);
  }

  postMessage(message: ChartDensityWorkerRequest) {
    queueMicrotask(() => {
      try {
        if (message.type === "build") {
          this.#index = createChartDensityIndex(message.points, {
            ...message.options,
            backend: "wasm-index",
          });
          this.#emit("message", { requestId: message.requestId, type: "built" });
          return;
        }

        if (message.type === "dispose") {
          this.#index = null;
          return;
        }

        if (!this.#index) {
          throw new Error("Worker index is not ready.");
        }

        this.#emit("message", {
          requestId: message.requestId,
          result: this.#query(message),
          type: "result",
        });
      } catch (error) {
        this.#emit("message", {
          error: {
            message: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : undefined,
          },
          requestId: message.requestId,
          type: "error",
        });
      }
    });
  }

  terminate() {
    this.#listeners.clear();
    this.#index = null;
  }

  #emit(type: string, data: unknown) {
    for (const listener of this.#listeners.get(type) ?? []) {
      listener({ data } as MessageEvent);
    }
  }

  #query(message: Extract<ChartDensityWorkerRequest, { type: "query" }>) {
    switch (message.method) {
      case "getBackendCapabilities":
        return this.#index?.getBackendCapabilities?.();
      case "getBinnedSeries":
        return this.#index?.getBinnedSeries(
          message.query as Parameters<
            ReturnType<typeof createChartDensityIndex>["getBinnedSeries"]
          >[0],
        );
      case "getChartSeries":
        return this.#index?.getChartSeries(
          message.query as Parameters<
            ReturnType<typeof createChartDensityIndex>["getChartSeries"]
          >[0],
        );
      case "getHeatmap":
        return this.#index?.getHeatmap(
          message.query as Parameters<ReturnType<typeof createChartDensityIndex>["getHeatmap"]>[0],
        );
      case "getHistogram":
        return this.#index?.getHistogram(
          message.query as Parameters<
            ReturnType<typeof createChartDensityIndex>["getHistogram"]
          >[0],
        );
      case "getPointById":
        return this.#index?.getPointById(message.pointId ?? "");
      case "getSeriesBounds":
        return this.#index?.getSeriesBounds();
    }
  }
}

import { useCallback, useEffect, useMemo, useState } from "react";

import { createProgressiveChartDensityIndex } from "../density";

import type {
  ChartDensityIndexOptions,
  ChartDensityProgressiveStatus,
  ChartDensityWorkerIndex,
  ChartSeriesPoint,
  ProgressiveChartDensityIndex,
} from "../density";

export function useProgressiveChartDensity<TProperties = Record<string, unknown>>(
  points: readonly ChartSeriesPoint<TProperties>[],
  options?: Omit<ChartDensityIndexOptions<TProperties>, "backend">,
): {
  index: ProgressiveChartDensityIndex<TProperties>;
  status: ChartDensityProgressiveStatus;
  warmWorkerNow: () => Promise<ChartDensityWorkerIndex<TProperties> | null>;
  warmWasmNow: () => Promise<void>;
  workerIndex: ChartDensityWorkerIndex<TProperties> | null;
} {
  const [_statusTick, setStatusTick] = useState(0);
  const index = useMemo(() => {
    const resolvedOptions = options ?? {};
    const progressiveOptions = resolvedOptions.progressive;

    return createProgressiveChartDensityIndex(points, {
      ...resolvedOptions,
      progressive: {
        ...progressiveOptions,
        onError(error) {
          progressiveOptions?.onError?.(error);
          setStatusTick((tick) => tick + 1);
        },
        onReady(nextIndex) {
          progressiveOptions?.onReady?.(nextIndex);
          setStatusTick((tick) => tick + 1);
        },
      },
    });
  }, [options, points]);
  const status = index.getProgressiveStatus();

  useEffect(() => {
    if (status.wasmReady || status.workerReady) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setStatusTick((tick) => tick + 1);

      const nextStatus = index.getProgressiveStatus();

      if (nextStatus.wasmReady || nextStatus.workerReady) {
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [index, status.wasmReady, status.workerReady]);
  const warmWasmNow = useCallback(async () => {
    setStatusTick((tick) => tick + 1);

    try {
      await index.warmWasmIndex();
    } finally {
      setStatusTick((tick) => tick + 1);
    }
  }, [index]);
  const warmWorkerNow = useCallback(async () => {
    setStatusTick((tick) => tick + 1);

    try {
      return await index.warmWorkerIndex();
    } finally {
      setStatusTick((tick) => tick + 1);
    }
  }, [index]);

  return {
    index,
    status,
    warmWorkerNow,
    warmWasmNow,
    workerIndex: index.getWorkerIndex(),
  };
}

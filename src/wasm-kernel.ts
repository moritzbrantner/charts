export type ChartWasmBinIndex = {
  binSeries(minX: number, maxX: number, binCount: number): Float64Array;
};

export type ChartWasmKernelFactory = {
  createIndex(x: Float64Array, y: Float64Array): ChartWasmBinIndex;
};

let kernelFactory: ChartWasmKernelFactory | null = null;

export function registerChartWasmKernel(factory: ChartWasmKernelFactory): void {
  kernelFactory = factory;
}

export function clearChartWasmKernel(): void {
  kernelFactory = null;
}

export function hasChartWasmKernel(): boolean {
  return kernelFactory !== null;
}

export function createChartWasmKernelIndex(
  x: Float64Array,
  y: Float64Array,
): ChartWasmBinIndex | null {
  return kernelFactory?.createIndex(x, y) ?? null;
}

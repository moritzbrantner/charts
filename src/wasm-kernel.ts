type GeneratedChartsWasmModule = {
  default?: (input?: unknown) => Promise<unknown> | unknown;
  aggregate_density_bins: (
    x: Float64Array,
    y: Float64Array,
    domainMin: number,
    domainMax: number,
    binCount: number,
  ) => unknown;
  percentile: (values: Float64Array, quantile: number) => number;
};

export type ChartWasmDensityBin = {
  averageY: number | null;
  index: number;
  maxY: number | null;
  minY: number | null;
  pointCount: number;
  sumY: number;
  x0: number;
  x1: number;
};

export type ChartWasmKernel = {
  aggregateDensityBins(
    x: Float64Array,
    y: Float64Array,
    domain: [number, number],
    binCount: number,
  ): ChartWasmDensityBin[];
  percentile(values: Float64Array, quantile: number): number;
};

let loadedKernel: ChartWasmKernel | null = null;
let loadingKernel: Promise<ChartWasmKernel> | null = null;

export function getLoadedChartWasmKernel() {
  return loadedKernel;
}

export async function loadChartWasmKernel(): Promise<ChartWasmKernel> {
  if (loadedKernel) {
    return loadedKernel;
  }
  if (loadingKernel) {
    return loadingKernel;
  }

  loadingKernel = loadGeneratedModule().then((module) => {
    const kernel: ChartWasmKernel = {
      aggregateDensityBins(x, y, domain, binCount) {
        const bins = module.aggregate_density_bins(x, y, domain[0], domain[1], binCount);
        return normalizeBins(bins);
      },
      percentile(values, quantile) {
        return module.percentile(values, quantile);
      },
    };
    loadedKernel = kernel;
    return kernel;
  });

  try {
    return await loadingKernel;
  } finally {
    loadingKernel = null;
  }
}

async function loadGeneratedModule(): Promise<GeneratedChartsWasmModule> {
  // Vite executes this source module directly after build:wasm, while published bundles copy the
  // same wasm-pack output next to dist/*.js. Keep both layouts explicit so source execution does
  // not probe a known-missing production path and emit a browser 404 before falling back to JS.
  const currentModuleUrl = new URL(import.meta.url);
  const generatedModulePath = currentModuleUrl.pathname.endsWith(".ts")
    ? "./wasm/generated/charts_density_wasm.js"
    : "./wasm/charts_density_wasm.js";
  const moduleUrl = new URL(generatedModulePath, currentModuleUrl).href;
  const module = (await import(/* @vite-ignore */ moduleUrl)) as GeneratedChartsWasmModule;
  await module.default?.();
  return module;
}

function normalizeBins(value: unknown): ChartWasmDensityBin[] {
  if (!Array.isArray(value)) {
    throw new TypeError("charts WASM aggregate_density_bins returned a non-array result");
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new TypeError(`charts WASM bin ${index} is not an object`);
    }
    const bin = entry as Record<string, unknown>;
    return {
      averageY: readNullableNumber(bin.averageY),
      index: readNumber(bin.index, "index"),
      maxY: readNullableNumber(bin.maxY),
      minY: readNullableNumber(bin.minY),
      pointCount: readNumber(bin.pointCount, "pointCount"),
      sumY: readNumber(bin.sumY, "sumY"),
      x0: readNumber(bin.x0, "x0"),
      x1: readNumber(bin.x1, "x1"),
    };
  });
}

function readNumber(value: unknown, key: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`charts WASM bin field ${key} must be a finite number`);
  }
  return value;
}

function readNullableNumber(value: unknown) {
  return value == null ? null : readNumber(value, "numeric aggregate");
}

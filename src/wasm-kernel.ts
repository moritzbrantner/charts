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
  if (isNodeRuntime()) {
    return loadGeneratedModuleInNode();
  }

  // Browser/release builds copy the wasm-pack output beside the compiled module in dist/wasm.
  const moduleUrl = new URL("./wasm/charts_density_wasm.js", import.meta.url).href;
  const module = (await import(/* @vite-ignore */ moduleUrl)) as GeneratedChartsWasmModule;
  await module.default?.();
  return module;
}

async function loadGeneratedModuleInNode(): Promise<GeneratedChartsWasmModule> {
  // Keep Node built-ins behind runtime-only dynamic imports so browser consumers never need
  // polyfills. In source/test runs the generated module lives under src/wasm/generated; in a
  // packed package it is copied to dist/wasm next to this compiled module.
  const fsSpecifier = "node:fs/promises";
  const pathSpecifier = "node:path";
  const urlSpecifier = "node:url";
  const fs = (await import(/* @vite-ignore */ fsSpecifier)) as {
    access(path: string): Promise<void>;
    readFile(path: string): Promise<Uint8Array>;
  };
  const path = (await import(/* @vite-ignore */ pathSpecifier)) as {
    dirname(path: string): string;
    resolve(...paths: string[]): string;
  };
  const url = (await import(/* @vite-ignore */ urlSpecifier)) as {
    fileURLToPath(value: string | URL): string;
    pathToFileURL(value: string): URL;
  };

  const candidates = [
    path.resolve(process.cwd(), "src/wasm/generated/charts_density_wasm.js"),
    path.resolve(process.cwd(), "dist/wasm/charts_density_wasm.js"),
  ];

  if (import.meta.url.startsWith("file:")) {
    const moduleDirectory = path.dirname(url.fileURLToPath(import.meta.url));
    candidates.unshift(
      path.resolve(moduleDirectory, "wasm/charts_density_wasm.js"),
      path.resolve(moduleDirectory, "wasm/generated/charts_density_wasm.js"),
    );
  }

  const modulePath = await findFirstExistingPath(fs, candidates);
  const wasmPath = modulePath.replace(/\.js$/, "_bg.wasm");
  const module = (await import(
    /* @vite-ignore */ url.pathToFileURL(modulePath).href
  )) as GeneratedChartsWasmModule;
  const wasmBytes = await fs.readFile(wasmPath);

  await module.default?.({ module_or_path: wasmBytes });
  return module;
}

async function findFirstExistingPath(
  fs: { access(path: string): Promise<void> },
  candidates: string[],
): Promise<string> {
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next source/package layout.
    }
  }

  throw new Error(
    `Unable to locate the generated charts WASM module. Tried: ${candidates.join(", ")}`,
  );
}

function isNodeRuntime(): boolean {
  return typeof process !== "undefined" && Boolean(process.versions?.node);
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

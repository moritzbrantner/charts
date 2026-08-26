import { CHART_WASM_BASE64 } from "./wasm/generated";
import {
  clearChartWasmKernel,
  hasChartWasmKernel,
  registerChartWasmKernel,
  type ChartWasmBinIndex,
} from "./wasm-kernel";

type RawChartWasmExports = {
  alloc_f64(length: number): number;
  bin_series(
    indexPointer: number,
    minX: number,
    maxX: number,
    binCount: number,
    outputPointer: number,
  ): number;
  create_index(xPointer: number, yPointer: number, length: number): number;
  dealloc_f64(pointer: number, length: number): void;
  free_index(pointer: number): void;
  memory: WebAssembly.Memory;
};

const BIN_STRIDE = 6;
let instance: WebAssembly.Instance | null = null;

export function enableChartWasm(): boolean {
  if (hasChartWasmKernel()) {
    return true;
  }

  if (!CHART_WASM_BASE64 || typeof WebAssembly === "undefined") {
    return false;
  }

  const module = new WebAssembly.Module(decodeBase64(CHART_WASM_BASE64));
  instance = new WebAssembly.Instance(module, {});
  const wasm = readExports(instance);
  const finalizer =
    typeof FinalizationRegistry === "undefined"
      ? null
      : new FinalizationRegistry<number>((pointer) => wasm.free_index(pointer));

  registerChartWasmKernel({
    createIndex(x, y) {
      const pointer = createNativeIndex(wasm, x, y);
      const index: ChartWasmBinIndex = {
        binSeries(minX, maxX, binCount) {
          const outputLength = Math.max(0, Math.floor(binCount)) * BIN_STRIDE;
          const outputPointer = wasm.alloc_f64(outputLength);

          try {
            const written = wasm.bin_series(pointer, minX, maxX, binCount, outputPointer);
            const view = new Float64Array(wasm.memory.buffer, outputPointer, written);

            return Float64Array.from(view);
          } finally {
            wasm.dealloc_f64(outputPointer, outputLength);
          }
        },
      };

      finalizer?.register(index, pointer, index);
      return index;
    },
  });

  return true;
}

export function disableChartWasm(): void {
  clearChartWasmKernel();
  instance = null;
}

export function isChartWasmEnabled(): boolean {
  return hasChartWasmKernel();
}

function createNativeIndex(
  wasm: RawChartWasmExports,
  x: Float64Array,
  y: Float64Array,
): number {
  if (x.length !== y.length) {
    throw new Error("Chart WASM x/y arrays must have equal lengths.");
  }

  const xPointer = wasm.alloc_f64(x.length);
  const yPointer = wasm.alloc_f64(y.length);

  try {
    new Float64Array(wasm.memory.buffer, xPointer, x.length).set(x);
    new Float64Array(wasm.memory.buffer, yPointer, y.length).set(y);

    return wasm.create_index(xPointer, yPointer, x.length);
  } finally {
    wasm.dealloc_f64(xPointer, x.length);
    wasm.dealloc_f64(yPointer, y.length);
  }
}

function readExports(instance: WebAssembly.Instance): RawChartWasmExports {
  const exports = instance.exports as unknown as Partial<RawChartWasmExports>;

  if (
    !(exports.memory instanceof WebAssembly.Memory) ||
    typeof exports.alloc_f64 !== "function" ||
    typeof exports.dealloc_f64 !== "function" ||
    typeof exports.create_index !== "function" ||
    typeof exports.free_index !== "function" ||
    typeof exports.bin_series !== "function"
  ) {
    throw new Error("Chart WASM module does not expose the expected numeric-kernel ABI.");
  }

  return exports as RawChartWasmExports;
}

function decodeBase64(value: string): ArrayBuffer {
  const bufferConstructor = (globalThis as {
    Buffer?: { from(input: string, encoding: "base64"): Uint8Array };
  }).Buffer;
  const bytes = bufferConstructor
    ? Uint8Array.from(bufferConstructor.from(value, "base64"))
    : decodeBrowserBase64(value);

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function decodeBrowserBase64(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

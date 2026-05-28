import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageDir = path.join(rootDir, "src", "wasm", "pkg");
const wasmPath = path.join(packageDir, "charts_density_wasm_bg.wasm");
const embeddedPath = path.join(packageDir, "charts_density_wasm_embedded.js");
const embeddedTypesPath = path.join(packageDir, "charts_density_wasm_embedded.d.ts");
const wasmBase64 = readFileSync(wasmPath).toString("base64");

writeFileSync(
  embeddedPath,
  [
    'import * as imports from "./charts_density_wasm_bg.js";',
    "",
    `const wasmBase64 = "${wasmBase64}";`,
    "let wasmExports = null;",
    "",
    "export const ChartDensityWasmIndex = imports.ChartDensityWasmIndex;",
    "",
    "export function initChartsDensityWasm() {",
    "  if (wasmExports) {",
    "    return wasmExports;",
    "  }",
    "",
    "  const bytes = decodeBase64(wasmBase64);",
    "  const module = new WebAssembly.Module(bytes);",
    '  const instance = new WebAssembly.Instance(module, { "./charts_density_wasm_bg.js": imports });',
    "",
    "  wasmExports = instance.exports;",
    "  imports.__wbg_set_wasm(wasmExports);",
    "  wasmExports.__wbindgen_start?.();",
    "",
    "  return wasmExports;",
    "}",
    "",
    "function decodeBase64(value) {",
    "  if (typeof atob === 'function') {",
    "    const binary = atob(value);",
    "    const bytes = new Uint8Array(binary.length);",
    "",
    "    for (let index = 0; index < binary.length; index += 1) {",
    "      bytes[index] = binary.charCodeAt(index);",
    "    }",
    "",
    "    return bytes;",
    "  }",
    "",
    "  return Uint8Array.from(Buffer.from(value, 'base64'));",
    "}",
    "",
  ].join("\n"),
);

writeFileSync(
  embeddedTypesPath,
  [
    "export class ChartDensityWasmIndex {",
    "  constructor(input: unknown);",
    "  free(): void;",
    "  getBinnedSeries(query: unknown): unknown;",
    "  getChartSeries(query: unknown): unknown;",
    "  getHeatmap(query: unknown): unknown;",
    "  getHistogram(query: unknown): unknown;",
    "}",
    "",
    "export function initChartsDensityWasm(): WebAssembly.Exports;",
    "",
  ].join("\n"),
);

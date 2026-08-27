// Server-safe chart computation and data-model surface.
// Keep this entry point free of React, Recharts, DOM, and browser-only imports.
export * from "./density";
export * from "./analytics";
export * from "./labels";
export * from "./view-state";
export { getLoadedChartWasmKernel, loadChartWasmKernel } from "./wasm-kernel";

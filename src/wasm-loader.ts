import {
  ChartDensityWasmIndex,
  initChartsDensityWasm,
} from "./wasm/pkg/charts_density_wasm_embedded.js";

export type ChartsDensityWasmModule = {
  ChartDensityWasmIndex: typeof ChartDensityWasmIndex;
};

export function getChartsDensityWasmModule(): ChartsDensityWasmModule {
  initChartsDensityWasm();

  return {
    ChartDensityWasmIndex,
  };
}

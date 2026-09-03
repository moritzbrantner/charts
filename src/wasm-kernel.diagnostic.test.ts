import { describe, test } from "vitest";

import { loadChartWasmKernel } from "./wasm-kernel";

describe("charts wasm loader diagnostic", () => {
  test("loads the generated wasm kernel after build:wasm", async () => {
    await loadChartWasmKernel();
  });
});

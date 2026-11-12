import { defineConfig } from "@playwright/test";

import playwrightConfig from "./playwright.config";

export default defineConfig({
  ...playwrightConfig,
  testIgnore: [],
  testMatch: "examples/src/model-based.e2e.spec.ts",
});

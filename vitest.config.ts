import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@moritzbrantner/charts": path.resolve(rootDir, "src/index.ts"),
    },
  },
  test: {
    coverage: {
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      provider: "istanbul",
      reporter: ["text", "lcov"],
      thresholds: {
        branches: 65,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});

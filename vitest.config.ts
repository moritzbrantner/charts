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
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.stories.ts",
        "src/**/*.stories.tsx",
        "src/**/*.storybook.spec.ts",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.visual.spec.ts",
        "src/components/stories/**",
        "src/testing/**",
        "src/wasm/generated/**",
      ],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      provider: "istanbul",
      reporter: ["text", "lcov"],
      thresholds: {
        branches: 70,
        functions: 75,
        lines: 75,
        statements: 75,
      },
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
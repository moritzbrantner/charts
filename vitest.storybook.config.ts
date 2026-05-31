import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const storybookPlugins = await storybookTest({
  configDir: path.join(rootDir, ".storybook"),
  storybookScript: "bunx storybook dev --host 127.0.0.1 --port 6007 --ci",
  storybookUrl: "http://127.0.0.1:6007",
});

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: storybookPlugins,
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright({}),
          },
          name: "storybook",
        },
      },
    ],
  },
});

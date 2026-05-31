import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        area: path.resolve(rootDir, "examples/area.html"),
        bar: path.resolve(rootDir, "examples/bar.html"),
        candle: path.resolve(rootDir, "examples/candle.html"),
        compose: path.resolve(rootDir, "examples/compose.html"),
        combo: path.resolve(rootDir, "examples/combo.html"),
        heatmap: path.resolve(rootDir, "examples/heatmap.html"),
        histogram: path.resolve(rootDir, "examples/histogram.html"),
        index: path.resolve(rootDir, "examples/index.html"),
        line: path.resolve(rootDir, "examples/line.html"),
        stacked: path.resolve(rootDir, "examples/stacked.html"),
      },
    },
  },
  plugins: [tailwindcss()],
  root: path.resolve(rootDir, "examples"),
  resolve: {
    alias: {
      "@moritzbrantner/charts": path.resolve(rootDir, "src/index.ts"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});

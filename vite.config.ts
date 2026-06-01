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
        bubble: path.resolve(rootDir, "examples/bubble.html"),
        candle: path.resolve(rootDir, "examples/candle.html"),
        compose: path.resolve(rootDir, "examples/compose.html"),
        combo: path.resolve(rootDir, "examples/combo.html"),
        funnel: path.resolve(rootDir, "examples/funnel.html"),
        heatmap: path.resolve(rootDir, "examples/heatmap.html"),
        histogram: path.resolve(rootDir, "examples/histogram.html"),
        index: path.resolve(rootDir, "examples/index.html"),
        line: path.resolve(rootDir, "examples/line.html"),
        scatter: path.resolve(rootDir, "examples/scatter.html"),
        stacked: path.resolve(rootDir, "examples/stacked.html"),
        sunburst: path.resolve(rootDir, "examples/sunburst.html"),
        treemap: path.resolve(rootDir, "examples/treemap.html"),
        waterfall: path.resolve(rootDir, "examples/waterfall.html"),
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

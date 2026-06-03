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
        calendarHeatmap: path.resolve(rootDir, "examples/calendar-heatmap.html"),
        candle: path.resolve(rootDir, "examples/candle.html"),
        circlePack: path.resolve(rootDir, "examples/circle-pack.html"),
        compose: path.resolve(rootDir, "examples/compose.html"),
        combo: path.resolve(rootDir, "examples/combo.html"),
        flameGraph: path.resolve(rootDir, "examples/flame-graph.html"),
        funnel: path.resolve(rootDir, "examples/funnel.html"),
        heatmap: path.resolve(rootDir, "examples/heatmap.html"),
        histogram: path.resolve(rootDir, "examples/histogram.html"),
        icicle: path.resolve(rootDir, "examples/icicle.html"),
        indentedTree: path.resolve(rootDir, "examples/indented-tree.html"),
        index: path.resolve(rootDir, "examples/index.html"),
        line: path.resolve(rootDir, "examples/line.html"),
        radialTree: path.resolve(rootDir, "examples/radial-tree.html"),
        ridgeline: path.resolve(rootDir, "examples/ridgeline.html"),
        scatter: path.resolve(rootDir, "examples/scatter.html"),
        stacked: path.resolve(rootDir, "examples/stacked.html"),
        sunburst: path.resolve(rootDir, "examples/sunburst.html"),
        tree: path.resolve(rootDir, "examples/tree.html"),
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

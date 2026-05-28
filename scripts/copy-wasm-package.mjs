import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(rootDir, "src", "wasm", "pkg");
const targetDir = path.join(rootDir, "dist", "wasm", "pkg");
const files = [
  "charts_density_wasm_bg.js",
  "charts_density_wasm_bg.wasm",
  "charts_density_wasm_embedded.d.ts",
  "charts_density_wasm_embedded.js",
];

mkdirSync(targetDir, { recursive: true });

for (const file of files) {
  copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
}

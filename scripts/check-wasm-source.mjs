import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedPath = path.join(rootDir, "src", "wasm", "generated.ts");
const sourcePaths = [
  "crates/charts-density-wasm/.cargo/config.toml",
  "crates/charts-density-wasm/Cargo.lock",
  "crates/charts-density-wasm/Cargo.toml",
  "crates/charts-density-wasm/src/lib.rs",
];
const generated = readFileSync(generatedPath, "utf8");
const recordedHash = generated.match(/^\/\/ source-sha256:([a-f0-9]{64})$/m)?.[1] ?? null;
const currentHash = hashSources();

if (recordedHash !== currentHash) {
  throw new Error(
    "Committed chart WASM is missing or stale. Run `bun run build:wasm`, review the generated module, and commit it.",
  );
}

console.log(`Chart WASM source is in sync (${currentHash.slice(0, 12)}).`);

function hashSources() {
  const hash = createHash("sha256");

  for (const relativePath of sourcePaths) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(readFileSync(path.join(rootDir, relativePath)));
    hash.update("\0");
  }

  return hash.digest("hex");
}

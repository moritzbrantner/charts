import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  exports?: Record<string, { import?: string; types?: string } | string>;
};

describe("package entrypoint boundaries", () => {
  test("publishes explicit server-safe and client entrypoints", () => {
    const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as PackageJson;

    expect(packageJson.exports?.["./core"]).toEqual({
      import: "./dist/core.js",
      types: "./dist/core.d.ts",
    });
    expect(packageJson.exports?.["./react"]).toEqual({
      import: "./dist/react.js",
      types: "./dist/react.d.ts",
    });
  });

  test("keeps the core source free of React and Recharts", () => {
    const core = readFileSync(resolve("src/core.ts"), "utf8");

    expect(core).not.toMatch(/from ["']react["']/);
    expect(core).not.toMatch(/from ["']recharts["']/);
    expect(core).not.toContain("./components");
  });

  test("does not import viz-engine from production source", () => {
    const wasmIndex = readFileSync(resolve("src/wasm-index.ts"), "utf8");
    const core = readFileSync(resolve("src/core.ts"), "utf8");

    expect(wasmIndex).not.toContain("@moritzbrantner/viz-engine");
    expect(core).not.toContain("@moritzbrantner/viz-engine");
  });

  test("does not install viz-engine", () => {
    const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as PackageJson;
    const lockfile = readFileSync(resolve("bun.lock"), "utf8");

    expect(packageJson.dependencies?.["@moritzbrantner/viz-engine"]).toBeUndefined();
    expect(packageJson.devDependencies?.["@moritzbrantner/viz-engine"]).toBeUndefined();
    expect(lockfile).not.toContain("@moritzbrantner/viz-engine");
  });
});

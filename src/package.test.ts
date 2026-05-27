import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

type PackageJson = {
  devDependencies?: Record<string, string>;
  license?: string;
  scripts?: Record<string, string>;
};

type TypeDocConfig = {
  entryPoints?: string[];
  out?: string;
  readme?: string;
};

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("package metadata", () => {
  test("publishes with MIT license metadata", () => {
    const packageJson = readJson<PackageJson>("package.json");
    const license = readText("LICENSE");

    expect(packageJson.license).toBe("MIT");
    expect(license).toContain("MIT License");
    expect(license).toContain("Copyright (c) 2026 Moritz Brantner");
  });

  test("exposes TypeDoc scripts and API documentation config", () => {
    const packageJson = readJson<PackageJson>("package.json");
    const typedoc = readJson<TypeDocConfig>("typedoc.json");

    expect(packageJson.devDependencies?.typedoc).toBeTruthy();
    expect(packageJson.scripts?.docs).toBe("typedoc");
    expect(packageJson.scripts?.["docs:check"]).toBe("typedoc --emit none");
    expect(typedoc.entryPoints).toEqual(["src/index.ts"]);
    expect(typedoc.out).toBe("docs");
    expect(typedoc.readme).toBe("README.md");
  });
});

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function readText(relativePath: string): string {
  return readFileSync(resolve(rootDir, relativePath), "utf8");
}

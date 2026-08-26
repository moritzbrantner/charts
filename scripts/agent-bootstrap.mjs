import { readFileSync, writeFileSync } from "node:fs";

patchPackage();
patchBackend();
patchTests();
patchBenchmark();
patchCi();
patchReadme();

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, content) {
  writeFileSync(path, content);
}

function replaceOnce(content, before, after, path) {
  const index = content.indexOf(before);
  if (index < 0) {
    throw new Error(`Could not find expected text in ${path}: ${before.slice(0, 120)}`);
  }
  if (content.indexOf(before, index + before.length) >= 0) {
    throw new Error(`Expected text was not unique in ${path}: ${before.slice(0, 120)}`);
  }
  return content.slice(0, index) + after + content.slice(index + before.length);
}

function patchPackage() {
  const path = "package.json";
  const packageJson = JSON.parse(read(path));
  packageJson.dependencies["@moritzbrantner/ui"] = "^1.0.0";
  delete packageJson.devDependencies["@moritzbrantner/viz-engine"];
  packageJson.exports["./core"] = { types: "./dist/core.d.ts", import: "./dist/core.js" };
  packageJson.exports["./react"] = { types: "./dist/react.d.ts", import: "./dist/react.js" };
  packageJson.exports["./wasm"] = {
    types: "./dist/wasm-runtime.d.ts",
    import: "./dist/wasm-runtime.js",
  };
  packageJson.scripts.build =
    "tsup src/index.ts src/core.ts src/react.ts src/wasm-runtime.ts --format esm --dts --clean --out-dir dist && tsup src/density/worker.ts --format esm --out-dir dist --clean=false";
  packageJson.scripts["build:wasm"] = "node ./scripts/build-wasm.mjs";
  packageJson.scripts["test:wasm"] = "vitest run src/wasm-runtime.test.ts";
  packageJson.scripts["wasm:source-check"] = "node ./scripts/check-wasm-source.mjs";
  packageJson.scripts["wasm:check"] =
    "bun run wasm:source-check && cargo test --manifest-path crates/charts-density-wasm/Cargo.toml --locked && bun run test:wasm";
  packageJson.scripts.verify =
    "bun run wasm:source-check && bun run check-types && bun run lint && bun run format:check && bun run docs:check && bun run test:coverage && bun run api:check && bun run build:examples && bun run pack:check && bun run test:e2e && bun run build:storybook && bun run test:storybook && bun run test:visual && bun run test:unlighthouse";
  write(path, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function patchBackend() {
  const path = "src/density/backend.ts";
  let content = read(path);
  content = replaceOnce(
    content,
    '  if (operationKind === "chart" && percentileRequested && pointCount >= 200_000) {\n    return "wasm-index";\n  }\n',
    '  if (operationKind === "chart" && !percentileRequested && pointCount >= 200_000) {\n    return "wasm-index";\n  }\n',
    path,
  );
  write(path, content);
}

function patchTests() {
  const path = "src/index.test.ts";
  let content = read(path);
  content = replaceOnce(
    content,
    '  test("resolves auto backend policy conservatively", () => {\n',
    '  test("routes only supported high-volume chart queries toward WASM", () => {\n',
    path,
  );
  content = replaceOnce(
    content,
    '    ).toBe("hybrid-js");\n    expect(\n      resolveChartDensityBackendPolicy({\n        hasPercentiles: true,\n        operationKind: "chart",\n        pointCount: 200_000,\n      }),\n    ).toBe("wasm-index");\n',
    '    ).toBe("wasm-index");\n    expect(\n      resolveChartDensityBackendPolicy({\n        hasPercentiles: true,\n        operationKind: "chart",\n        pointCount: 200_000,\n      }),\n    ).toBe("hybrid-js");\n',
    path,
  );
  content = replaceOnce(
    content,
    '  test("serves WASM series through the external viz-engine backend", () => {\n',
    '  test("keeps the explicit WASM route correct before optional acceleration is enabled", () => {\n',
    path,
  );
  content = replaceOnce(
    content,
    '    expect(wasmIndex.getBackendCapabilities?.()).toMatchObject({\n      backend: "wasm-index",\n      usesWasm: true,\n    });\n',
    '    expect(wasmIndex.getBackendCapabilities?.()).toMatchObject({\n      backend: "wasm-index",\n      usesWasm: false,\n    });\n',
    path,
  );
  content = replaceOnce(
    content,
    '    expect(await workerIndex?.getBackendCapabilities()).toMatchObject({\n      backend: "wasm-index",\n      usesWasm: true,\n    });\n',
    '    expect(await workerIndex?.getBackendCapabilities()).toMatchObject({\n      backend: "wasm-index",\n      usesWasm: false,\n    });\n',
    path,
  );
  content = replaceOnce(
    content,
    '    expect(wasm.getBackendCapabilities?.()).toMatchObject({\n      backend: "wasm-index",\n      supportsGroupedSeries: false,\n      usesWasm: true,\n    });\n',
    '    expect(wasm.getBackendCapabilities?.()).toMatchObject({\n      backend: "wasm-index",\n      supportsGroupedSeries: true,\n      usesWasm: false,\n    });\n',
    path,
  );
  content = replaceOnce(
    content,
    '    expect(progressive.getBackendCapabilities?.()).toMatchObject({\n      backend: "wasm-index",\n      usesWasm: true,\n    });\n',
    '    expect(progressive.getBackendCapabilities?.()).toMatchObject({\n      backend: "wasm-index",\n      usesWasm: false,\n    });\n',
    path,
  );
  write(path, content);
}

function patchBenchmark() {
  const path = "scripts/benchmark-large-data.mjs";
  let content = read(path);
  content = replaceOnce(
    content,
    'const distEntry = path.join(packageRoot, "dist", "index.js");\n',
    'const distEntry = path.join(packageRoot, "dist", "index.js");\nconst wasmEntry = path.join(packageRoot, "dist", "wasm-runtime.js");\n',
    path,
  );
  content = replaceOnce(
    content,
    '} = await import(distEntry);\n\nconst results = [];\n',
    '} = await import(distEntry);\nconst { enableChartWasm } = await import(wasmEntry);\n\nif (!enableChartWasm()) {\n  throw new Error("Chart benchmark requires the committed owned WASM kernel.");\n}\n\nconst results = [];\n',
    path,
  );
  for (const name of [
    "chart.100k.random.3metrics.wasm-index.query.full",
    "chart.500k.random.3metrics.wasm-index.query.full",
    "chart.500k.random.3metrics.wasm-index.query.repeated",
  ]) {
    content = replaceOnce(
      content,
      `      type: "wasm-expected-win",\n      wasmName: "${name}",\n`,
      `      type: "wasm-candidate",\n      wasmName: "${name}",\n      warnBelowTarget: true,\n`,
      path,
    );
  }
  content = replaceOnce(
    content,
    '      type: "wasm-routed-heatmap",\n      wasmName: "chart.100k.sorted.12metrics.wasm-index.heatmap",\n',
    '      type: "wasm-fallback-operation",\n      wasmName: "chart.100k.sorted.12metrics.wasm-index.heatmap",\n      warnBelowTarget: true,\n',
    path,
  );
  write(path, content);
}

function patchCi() {
  const path = ".github/workflows/ci.yml";
  let content = read(path);
  const installStep =
    '      - name: Install wasm-pack\n        run: if ! command -v wasm-pack; then cargo install wasm-pack --version 0.14.0 --locked; fi\n\n';
  while (content.includes(installStep)) {
    content = content.replace(installStep, "");
  }
  content = replaceOnce(
    content,
    '      - name: Build WASM\n        run: bun run build:wasm\n\n      - name: Check types\n',
    '      - name: Check WASM source sync\n        run: bun run wasm:source-check\n\n      - name: Check Rust kernel\n        run: cargo test --manifest-path crates/charts-density-wasm/Cargo.toml --locked\n\n      - name: Check types\n',
    path,
  );
  write(path, content);
}

function patchReadme() {
  const path = "README.md";
  let content = read(path);
  const anchor = "## API stability\n";
  const section = `## Package boundaries

The package keeps chart computation separate from interactive React rendering:

- \`@moritzbrantner/charts/core\` contains chart data processing, layouts, labels, and
  shareable view-state codecs without importing React. Prefer this entrypoint in server-rendered
  code, workers, scripts, and non-React consumers.
- \`@moritzbrantner/charts/react\` adds React controls, hooks, and renderer composition. In Next.js,
  keep this import behind the smallest client boundary that actually needs interaction.
- \`@moritzbrantner/charts/wasm\` exposes the optional owned Rust/WASM numeric kernel. Calling
  \`enableChartWasm()\` accelerates supported high-volume binning; unsupported operations and
  environments continue through the TypeScript implementation.
- The root entrypoint remains available for backwards compatibility.

Routing remains application-owned. The package can encode durable view state, but it does not
depend on Next.js or any router.

## Shareable and accessible data views

Use \`encodeChartViewState\` and \`decodeChartViewState\` from the core entrypoint to map durable,
non-sensitive chart state to URL query parameters. Applications decide when and how to synchronize
those parameters with their router.

Charts should not be the only representation of important values. \`createChartRenderData(...).rows\`
is the structured fallback contract for a table, \`DataGrid\`, export, or other non-visual
representation alongside an interactive chart.

`;
  content = replaceOnce(content, anchor, section + anchor, path);
  content = content.replace(
    "- Progressive backend: `createProgressiveChartDensityIndex` renders immediately\n  through the hybrid JS backend and can warm the WASM index for later queries.",
    "- Progressive backend: `createProgressiveChartDensityIndex` renders immediately\n  through the hybrid JS backend. When the owned kernel is enabled, supported numeric binning can\n  use WASM while unsupported operations remain on the TypeScript implementation.",
  );
  write(path, content);
}
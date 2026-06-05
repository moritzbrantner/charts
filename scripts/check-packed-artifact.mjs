import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = mkdtempSync(path.join(tmpdir(), "charts-pack-check-"));

try {
  const packed = JSON.parse(
    execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", tempDir], {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }),
  );
  const tarball = path.join(tempDir, path.basename(packed[0]?.filename ?? ""));
  const extractDir = path.join(tempDir, "extract");
  const packageDir = path.join(extractDir, "package");

  if (!existsSync(tarball)) {
    throw new Error("npm pack did not produce a tarball.");
  }

  mkdirSync(extractDir);
  execFileSync("tar", ["-xzf", tarball, "-C", extractDir], { stdio: "inherit" });
  assertFile(path.join(packageDir, "package.json"));
  assertFile(path.join(packageDir, "dist", "index.js"));
  assertFile(path.join(packageDir, "dist", "index.d.ts"));
  assertFile(path.join(packageDir, "dist", "worker.js"));

  const packageJson = JSON.parse(readFileSync(path.join(packageDir, "package.json"), "utf8"));

  if (packageJson.exports?.["."]?.import !== "./dist/index.js") {
    throw new Error("Packed package root import export does not point at ./dist/index.js.");
  }

  if (packageJson.exports?.["."]?.types !== "./dist/index.d.ts") {
    throw new Error("Packed package root type export does not point at ./dist/index.d.ts.");
  }

  assertPeerDependency(packageJson, "react", "^19.0.0");
  assertPeerDependency(packageJson, "react-dom", "^19.0.0");
  assertPeerDependency(packageJson, "recharts", "^3.0.0");

  const consumerDir = path.join(tempDir, "consumer");
  const consumerNodeModules = path.join(consumerDir, "node_modules");

  mkdirSync(consumerDir);
  linkInstalledModules(path.join(rootDir, "node_modules"), path.join(packageDir, "node_modules"));
  linkInstalledModules(path.join(rootDir, "node_modules"), consumerNodeModules);
  mkdirSync(path.join(consumerNodeModules, "@moritzbrantner"), { recursive: true });
  symlinkSync(packageDir, path.join(consumerNodeModules, "@moritzbrantner", "charts"), "dir");

  writeFileSync(
    path.join(consumerDir, "package.json"),
    JSON.stringify(
      {
        private: true,
        type: "module",
        dependencies: {
          "@moritzbrantner/charts": "file:../extract/package",
          react: packageJson.peerDependencies.react,
          "react-dom":
            packageJson.peerDependencies.reactDom ?? packageJson.peerDependencies["react-dom"],
          recharts: packageJson.peerDependencies.recharts,
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(consumerDir, "import-check.mjs"),
    [
      'import { CHART_VALUE_MODE_DEFINITIONS, createChartDensityIndex } from "@moritzbrantner/charts";',
      "",
      "const index = createChartDensityIndex([{ id: 'a', x: 0, y: 2 }], { backend: 'hybrid-js' });",
      "const series = index.getChartSeries({ targetBinCount: 1, xDomain: [0, 1] });",
      "const wasmIndex = createChartDensityIndex([{ id: 'b', metrics: { count: 1 }, x: 0, y: 4 }], { backend: 'wasm-index' });",
      "const wasmSeries = wasmIndex.getChartSeries({ targetBinCount: 1, xDomain: [0, 1] });",
      "",
      "if (CHART_VALUE_MODE_DEFINITIONS.length === 0 || series.samples[0]?.y !== 2 || wasmSeries.samples[0]?.y !== 4) {",
      "  throw new Error('Packed package runtime import returned unexpected data.');",
      "}",
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(consumerDir, "type-check.ts"),
    [
      'import { createChartDensityIndex, type ChartSeriesPoint } from "@moritzbrantner/charts";',
      "",
      "const points: ChartSeriesPoint<{ plan: string }>[] = [{ id: 'a', properties: { plan: 'scale' }, x: 0, y: 2 }];",
      "const index = createChartDensityIndex(points, { backend: 'wasm-index' });",
      "const sample = index.getChartSeries({ targetBinCount: 1, xDomain: [0, 1] }).samples[0];",
      "",
      "if (sample?.firstPoint?.properties.plan !== 'scale') {",
      "  throw new Error('Packed package type import returned unexpected data.');",
      "}",
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(consumerDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          module: "NodeNext",
          moduleResolution: "NodeNext",
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
        },
        include: ["type-check.ts"],
      },
      null,
      2,
    ),
  );

  execFileSync(process.execPath, [path.join(consumerDir, "import-check.mjs")], {
    cwd: consumerDir,
    stdio: "inherit",
  });
  execFileSync(
    path.join(rootDir, "node_modules", ".bin", "tsc"),
    ["--noEmit", "-p", "tsconfig.json"],
    {
      cwd: consumerDir,
      stdio: "inherit",
    },
  );

  const browserConsumerDir = path.join(tempDir, "browser-consumer");
  const browserConsumerNodeModules = path.join(browserConsumerDir, "node_modules");

  mkdirSync(path.join(browserConsumerDir, "src"), { recursive: true });
  linkInstalledModules(path.join(rootDir, "node_modules"), browserConsumerNodeModules);
  mkdirSync(path.join(browserConsumerNodeModules, "@moritzbrantner"), { recursive: true });
  symlinkSync(
    packageDir,
    path.join(browserConsumerNodeModules, "@moritzbrantner", "charts"),
    "dir",
  );
  writeFileSync(
    path.join(browserConsumerDir, "package.json"),
    JSON.stringify(
      {
        private: true,
        type: "module",
        dependencies: {
          "@moritzbrantner/charts": "file:../extract/package",
          react: packageJson.peerDependencies.react,
          "react-dom": packageJson.peerDependencies["react-dom"],
          recharts: packageJson.peerDependencies.recharts,
        },
        devDependencies: {
          "@vitejs/plugin-react": "latest",
          typescript: "latest",
          vite: "latest",
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(browserConsumerDir, "index.html"),
    [
      "<!doctype html>",
      '<html lang="en">',
      '  <head><meta charset="UTF-8" /><title>charts consumer</title></head>',
      '  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>',
      "</html>",
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(browserConsumerDir, "src", "main.tsx"),
    [
      'import { StrictMode } from "react";',
      'import { createRoot } from "react-dom/client";',
      'import { Area, AreaChart } from "recharts";',
      'import { createChartDensityIndex, createChartRenderData } from "@moritzbrantner/charts";',
      "",
      "const index = createChartDensityIndex([{ id: 'a', x: 0, y: 2 }], { backend: 'wasm-index' });",
      "const series = index.getChartSeries({ targetBinCount: 1, xDomain: [0, 1] });",
      "const rows = createChartRenderData(series.samples).rows;",
      "",
      "createRoot(document.getElementById('root')!).render(",
      "  <StrictMode>",
      "    <AreaChart width={320} height={200} data={rows}>",
      '      <Area dataKey="value" isAnimationActive={false} />',
      "    </AreaChart>",
      "  </StrictMode>,",
      ");",
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(browserConsumerDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          jsx: "react-jsx",
          module: "ESNext",
          moduleResolution: "Bundler",
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
        },
        include: ["src"],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(browserConsumerDir, "vite.config.ts"),
    [
      'import { defineConfig } from "vite";',
      "",
      "export default defineConfig({",
      "  build: {",
      "    outDir: 'dist',",
      "  },",
      "});",
      "",
    ].join("\n"),
  );
  execFileSync(path.join(rootDir, "node_modules", ".bin", "vite"), ["build"], {
    cwd: browserConsumerDir,
    stdio: "inherit",
  });

  console.log(
    "@moritzbrantner/charts packed artifact import, type, and browser consumer checks passed.",
  );
} finally {
  rmSync(tempDir, { force: true, recursive: true });
}

function assertFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Expected packed file to exist: ${path.relative(rootDir, filePath)}`);
  }
}

function assertPeerDependency(packageJson, name, expectedRange) {
  const actualRange = packageJson.peerDependencies?.[name];

  if (actualRange !== expectedRange) {
    throw new Error(
      `Packed package peer dependency ${name} expected ${expectedRange}, received ${actualRange ?? "missing"}.`,
    );
  }
}

function linkInstalledModules(sourceNodeModules, targetNodeModules) {
  mkdirSync(targetNodeModules, { recursive: true });

  for (const entry of readdirSync(sourceNodeModules, { withFileTypes: true })) {
    if (entry.name === ".bin") {
      continue;
    }

    const sourcePath = path.join(sourceNodeModules, entry.name);
    const targetPath = path.join(targetNodeModules, entry.name);

    if (entry.name.startsWith("@")) {
      mkdirSync(targetPath, { recursive: true });

      for (const scopedEntry of readdirSync(sourcePath, { withFileTypes: true })) {
        const scopedTargetPath = path.join(targetPath, scopedEntry.name);

        if (!existsSync(scopedTargetPath)) {
          symlinkSync(path.join(sourcePath, scopedEntry.name), scopedTargetPath, "dir");
        }
      }

      continue;
    }

    if (!existsSync(targetPath)) {
      symlinkSync(sourcePath, targetPath, entry.isDirectory() ? "dir" : "file");
    }
  }
}

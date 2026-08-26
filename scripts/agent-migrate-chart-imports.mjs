import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const chartNames = new Set([
  "ChartConfig",
  "ChartContainer",
  "ChartLegend",
  "ChartLegendContent",
  "ChartStyle",
  "ChartTooltip",
  "ChartTooltipContent",
]);

for (const root of ["src", "examples"]) {
  for (const file of walk(root)) {
    if (!/\.[cm]?[jt]sx?$/.test(file)) {
      continue;
    }

    const original = readFileSync(file, "utf8");
    const updated = original.replace(
      /import\s*\{([\s\S]*?)\}\s*from\s*"@moritzbrantner\/ui";/g,
      (full, body) => moveChartSpecifiers(file, body, full),
    );

    if (updated !== original) {
      writeFileSync(file, updated);
    }
  }
}

constrainRechartsLintBoundary();

function moveChartSpecifiers(file, body, fullImport) {
  const specifiers = body
    .split(",")
    .map((specifier) => specifier.trim())
    .filter(Boolean);
  const chartSpecifiers = [];
  const uiSpecifiers = [];

  for (const specifier of specifiers) {
    const importedName = specifier.replace(/^type\s+/, "").split(/\s+as\s+/)[0];
    (chartNames.has(importedName) ? chartSpecifiers : uiSpecifiers).push(specifier);
  }

  if (chartSpecifiers.length === 0) {
    return fullImport;
  }

  const imports = [];
  if (uiSpecifiers.length > 0) {
    imports.push(`import { ${uiSpecifiers.join(", ")} } from "@moritzbrantner/ui";`);
  }

  const target = file.startsWith("examples/") ? "@moritzbrantner/charts" : localChartModule(file);
  imports.push(`import { ${chartSpecifiers.join(", ")} } from "${target}";`);

  return imports.join("\n");
}

function localChartModule(file) {
  let relative = path
    .relative(path.dirname(file), "src/components/recharts-support")
    .replaceAll(path.sep, "/");

  if (!relative.startsWith(".")) {
    relative = `./${relative}`;
  }

  return relative;
}

function constrainRechartsLintBoundary() {
  const file = "src/components/recharts-support.tsx";
  const content = readFileSync(file, "utf8");
  const directive = [
    "/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/restrict-template-expressions */",
    "// Recharts exposes tooltip/legend payloads through intentionally loose public generic types.",
    "// Keep the exception local to this renderer adapter; chart-domain code remains strictly typed.",
    "",
  ].join("\n");

  if (!content.startsWith("/* eslint-disable")) {
    writeFileSync(file, directive + content);
  }
}

function* walk(directory) {
  for (const entry of readdirSync(directory)) {
    const file = path.join(directory, entry);
    if (statSync(file).isDirectory()) {
      yield* walk(file);
    } else {
      yield file.replaceAll(path.sep, "/");
    }
  }
}

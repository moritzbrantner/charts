import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const reportPath = path.join(rootDir, "etc", "charts.api.md");
const publicDeclarations = ["index.d.ts", "core.d.ts", "react.d.ts"];

if (!existsSync(distDir)) {
  throw new Error("API report check requires dist declarations. Run `bun run build` first.");
}

for (const declaration of publicDeclarations) {
  if (!existsSync(path.join(distDir, declaration))) {
    throw new Error(`API report check requires dist/${declaration}. Run \`bun run build\` first.`);
  }
}

const declarationFiles = readdirSync(distDir)
  .filter((file) => file.endsWith(".d.ts"))
  .sort();
const generatedDeclarations = declarationFiles.filter((file) => !publicDeclarations.includes(file));
const canonicalNames = new Map([
  ...publicDeclarations.map((file) => [file, file]),
  ...generatedDeclarations.map((file, index) => [file, `shared-${index + 1}.d.ts`]),
]);

function normalizeDeclaration(content) {
  let normalized = content.trimEnd();

  for (const [file, canonicalFile] of canonicalNames) {
    const actualStem = file.slice(0, -".d.ts".length);
    const canonicalStem = canonicalFile.slice(0, -".d.ts".length);
    normalized = normalized.replaceAll(`./${actualStem}`, `./${canonicalStem}`);
  }

  return normalized;
}

function declarationSection(title, file) {
  const content = normalizeDeclaration(readFileSync(path.join(distDir, file), "utf8"));
  return [
    `## ${title}`,
    "",
    `Generated from \`dist/${canonicalNames.get(file)}\`.`,
    "",
    "```ts",
    content,
    "```",
    "",
  ].join("\n");
}

const sections = [
  declarationSection("Compatibility entry point (`.`)", "index.d.ts"),
  declarationSection("Server-safe entry point (`./core`)", "core.d.ts"),
  declarationSection("React entry point (`./react`)", "react.d.ts"),
];

if (generatedDeclarations.length > 0) {
  sections.push(
    ...generatedDeclarations.map((file, index) =>
      declarationSection(`Shared declaration ${index + 1}`, file),
    ),
  );
}

const report = [
  "# API Report: @moritzbrantner/charts",
  "",
  "This file is generated from the complete declaration graph emitted for the public package entry points. Generated chunk names are normalized so implementation-only hashes do not create API-report churn.",
  "",
  ...sections,
].join("\n");

if (!existsSync(reportPath)) {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, report);
  throw new Error(
    `Created ${path.relative(rootDir, reportPath)}. Review and commit it, then rerun api:check.`,
  );
}

const current = readFileSync(reportPath, "utf8");

if (current !== report) {
  const tempPath = path.join(rootDir, "temp", "charts.api.md");

  mkdirSync(path.dirname(tempPath), { recursive: true });
  writeFileSync(tempPath, report);

  const diff = spawnSync("git", ["diff", "--no-index", "--", reportPath, tempPath], {
    cwd: rootDir,
    encoding: "utf8",
  });

  if (diff.stdout) {
    process.stderr.write(diff.stdout);
  }
  if (diff.stderr) {
    process.stderr.write(diff.stderr);
  }

  throw new Error(
    `Public API report is out of date. Compare ${path.relative(rootDir, reportPath)} with ${path.relative(
      rootDir,
      tempPath,
    )}, then update the committed report if the API change is intentional.`,
  );
}

console.log("@moritzbrantner/charts public API report is up to date.");

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));
const dependencies = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.optionalDependencies ?? {}),
};

if (Object.keys(dependencies).length === 0) {
  console.log("No production dependencies to audit.");
  process.exit(0);
}

const auditDir = mkdtempSync(path.join(os.tmpdir(), "charts-production-audit-"));

try {
  writeFileSync(
    path.join(auditDir, "package.json"),
    `${JSON.stringify(
      {
        name: "@moritzbrantner/charts-production-audit",
        private: true,
        version: "0.0.0",
        dependencies,
      },
      null,
      2,
    )}\n`,
  );

  run("npm", [
    "install",
    "--package-lock-only",
    "--ignore-scripts",
    "--omit=dev",
    "--audit=false",
    "--fund=false",
  ]);
  run("npm", ["audit", "--omit=dev", "--audit-level=low"]);
} finally {
  rmSync(auditDir, { force: true, recursive: true });
}

console.log("Production dependency audit passed.");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: auditDir,
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  aggregate,
  assertComplete,
  compare,
  integer,
  KINDS,
  order,
  phasesForKind,
  SCHEMA,
  VIEW,
} from "./contract.mjs";
import { digest, prepareVendors } from "./vendor.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../..");
const args = process.argv.slice(2);

function option(name, fallback) {
  const entries = args.filter((arg) => arg.startsWith(`--${name}=`));
  if (entries.length > 1) throw new Error(`Duplicate option: ${name}`);
  return entries.length ? entries[0].slice(name.length + 3) : fallback;
}

function git(...command) {
  try {
    return execFileSync("git", command, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

async function hashTree(directory, extensions) {
  const hash = createHash("sha256");
  async function visit(relative = "") {
    const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const name = path.join(relative, entry.name);
      if (entry.isDirectory()) await visit(name);
      else if (!extensions || extensions.some((extension) => name.endsWith(extension))) {
        hash.update(name.split(path.sep).join("/"));
        hash.update("\0");
        hash.update(await readFile(path.join(directory, name)));
        hash.update("\0");
      }
    }
  }
  await visit();
  return hash.digest("hex");
}

function markdown(report) {
  let result = "# Chart provider benchmark\n\n";
  result += `Status: **${report.failures.length ? "FAILED / INCOMPLETE" : report.status}**. `;
  result += `${report.config.repeats} measured trials, ${report.config.warmups} discarded warmups.\n\n`;
  result +=
    "Times are milliseconds. API = synchronous work only; first frame = API plus the next animation-frame boundary; settled = API plus two frame boundaries. Mount is the module-warm first-render workload. Interaction = DOM click dispatch start to the provider selection callback. Preparation and checks are separate. Comparisons are advisory, not an automatic CI timing gate.\n\n";
  result +=
    "| Scenario | Points | Provider | Operation | Prepare median | API median / p95 | First frame median / p95 | Settled median / p95 | Interaction median / p95 | n |\n";
  result += "| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |\n";
  for (const row of aggregate(report)) {
    const format = (value) => value.toFixed(3);
    const formatSummary = (summary) =>
      summary ? `${format(summary.median)} / ${format(summary.p95)}` : "—";
    const operation = row.phase === "mount" ? "first-render" : row.phase;
    result += `| ${row.kind} | ${row.size} | ${row.provider} | ${operation} | ${format(row.prepareMs.median)} | ${formatSummary(row.apiMs)} | ${formatSummary(row.firstFrameMs)} | ${formatSummary(row.settledMs)} | ${formatSummary(row.interactionMs)} | ${row.settledMs.count} |\n`;
  }
  if (report.failures.length)
    result += `\n## Failures\n\n\`\`\`json\n${JSON.stringify(report.failures, null, 2)}\n\`\`\`\n`;
  result +=
    "\nRead benchmarks/providers/README.md for feature differences, correctness coverage, and interpretation limits.\n";
  return result;
}

async function deadline(operation, milliseconds = 45_000) {
  let timer;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Browser operation exceeded ${milliseconds} ms`)),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function serve(directory) {
  const mime = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".wasm": "application/wasm",
  };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const filename = path.resolve(directory, `.${pathname === "/" ? "/index.html" : pathname}`);
      const relative = path.relative(directory, filename);
      if (
        relative.startsWith("..") ||
        path.isAbsolute(relative) ||
        !(await stat(filename)).isFile()
      )
        throw new Error("Not found");
      response.writeHead(200, {
        "Content-Type": mime[path.extname(filename)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      });
      createReadStream(filename)
        .on("error", () => response.destroy())
        .pipe(response);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

async function run() {
  const allowed = /^(--smoke|--full|--(?:out|samples|warmups|seed|sizes)=.+)$/;
  if (
    args.some((arg) => !allowed.test(arg)) ||
    (args.includes("--smoke") && args.includes("--full"))
  ) {
    throw new Error(
      "Usage: node benchmarks/providers/run.mjs [--smoke|--full] [--out=PATH] [--samples=N] [--warmups=N] [--sizes=1000,10000] [--seed=N]",
    );
  }
  const smoke = args.includes("--smoke");
  const config = {
    sizes: option(
      "sizes",
      smoke ? "256" : args.includes("--full") ? "1000,10000,100000" : "1000,10000",
    )
      .split(",")
      .map((size) => integer(size, "size", 8)),
    repeats: integer(option("samples", smoke ? 1 : 7), "samples", 1, 100),
    warmups: integer(option("warmups", smoke ? 1 : 2), "warmups", 1, 20),
    seed: integer(option("seed", 20260923), "seed", 0, 4294967295),
  };
  if (new Set(config.sizes).size !== config.sizes.length) throw new Error("Duplicate sizes");
  const output = path.resolve(option("out", path.join(root, "test-results/provider-bench")));
  await mkdir(output, { recursive: true });
  const report = {
    schema: SCHEMA,
    status: "running",
    generatedAt: new Date().toISOString(),
    config,
    samples: [],
    failures: [],
  };
  const checkpoint = async () => {
    await writeFile(path.join(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(path.join(output, "report.md"), markdown(report));
  };
  let browser;
  let server;
  try {
    await stat(path.join(root, "dist/react.js"));
    const vendors = await prepareVendors(path.join(root, "test-results/provider-vendors"));
    const { build } = await import("vite");
    const { chromium } = await import("@playwright/test");
    const built = path.join(root, "test-results/provider-site");
    await build({
      configFile: false,
      root: directory,
      logLevel: "warn",
      resolve: { dedupe: ["react", "react-dom"] },
      define: { "process.env.NODE_ENV": JSON.stringify("production") },
      build: { outDir: built, emptyOutDir: true, minify: true },
    });
    const site = await serve(built);
    server = site.server;
    browser = await chromium.launch({ headless: true });
    report.environment = {
      platform: process.platform,
      architecture: process.arch,
      osRelease: os.release(),
      cpus: os.cpus().map((cpu) => cpu.model),
      node: process.version,
      chromium: browser.version(),
      headless: true,
      view: VIEW,
    };
    report.protocol = {
      version: SCHEMA,
      fixture: "lcg-sorted-xy-v1",
      policy: "raw-points-no-animation-no-explicit-decimation+scatter-select-v2",
      timings: "adapter-prepare+sync-api+first-raf+two-raf+event-callback;checks-outside-v2",
      vendors: Object.fromEntries(
        Object.entries(vendors).map(([id, { script, ...record }]) => {
          void script;
          return [id, record];
        }),
      ),
      lockSha256: digest(await readFile(path.join(root, "bun.lock"))),
      harnessSha256: await hashTree(directory, [".mjs", ".html"]),
    };
    report.source = {
      commit: git("rev-parse", "HEAD"),
      dirty: Boolean(git("status", "--porcelain")),
      distSha256: await hashTree(path.join(root, "dist")),
    };
    await mkdir(path.join(output, "screenshots"), { recursive: true });
    for (const kind of KINDS)
      for (const size of config.sizes) {
        for (let round = 0; round < config.warmups + config.repeats; round += 1) {
          for (const provider of order(round)) {
            const trial = round - config.warmups;
            const context = await browser.newContext({
              viewport: { width: 800, height: 800 },
              deviceScaleFactor: VIEW.deviceScaleFactor,
              reducedMotion: "reduce",
              locale: "en-US",
              timezoneId: "UTC",
            });
            try {
              await context.route("**/*", (route) =>
                new URL(route.request().url()).origin === site.origin
                  ? route.continue()
                  : route.abort(),
              );
              const page = await context.newPage();
              page.setDefaultTimeout(45_000);
              const errors = [];
              page.on("pageerror", (error) => errors.push(error.message));
              await page.goto(site.origin, { waitUntil: "networkidle" });
              if (vendors[provider]) await page.addScriptTag({ path: vendors[provider].script });
              await page.waitForFunction(() => Boolean(globalThis.providerBench));
              await page.evaluate(
                ({ provider, kind, size, seed }) =>
                  globalThis.providerBench.setup(provider, kind, size, seed),
                { provider, kind, size, seed: config.seed },
              );
              for (const phase of phasesForKind(kind, size)) {
                const sample =
                  phase === "select"
                    ? await deadline(
                        (async () => {
                          const target = await page.evaluate(() =>
                            globalThis.providerBench.beginSelect(),
                          );
                          await page.mouse.click(target.clientX, target.clientY);
                          return page.evaluate(() => globalThis.providerBench.endSelect());
                        })(),
                      )
                    : await deadline(
                        page.evaluate((phase) => globalThis.providerBench.step(phase), phase),
                      );
                if (errors.length) throw new Error(errors.join("; "));
                if (trial >= 0)
                  report.samples.push({ kind, size, provider, phase, trial, ...sample });
                if (trial === 0 && ["mount", "window", "resize"].includes(phase)) {
                  const screenshotPath = path.join(
                    output,
                    "screenshots",
                    `${kind}-${size}-${provider}-${phase}.png`,
                  );
                  await page.locator("#chart").screenshot({ path: screenshotPath });
                }
              }
              console.log(
                `${trial < 0 ? "warmup" : `trial ${trial + 1}`} ${kind}/${size}/${provider}: checked`,
              );
            } catch (error) {
              report.failures.push({
                kind,
                size,
                provider,
                trial,
                message: error.stack ?? String(error),
              });
              console.error(`${kind}/${size}/${provider}: ${error.message}`);
            } finally {
              await context.close();
            }
            await checkpoint();
          }
        }
      }
    report.status = "complete";
    assertComplete(report);
  } catch (error) {
    report.status = "failed";
    report.failures.push({ stage: "run", message: error.stack ?? String(error) });
    process.exitCode = 1;
  } finally {
    await browser?.close();
    if (server)
      await new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      });
    await checkpoint();
  }
  console.log(`Evidence: ${path.join(output, "report.md")}`);
}

if (args[0] === "--compare") {
  const [baseline, current] = args.slice(1, 3);
  if (!baseline || !current || args.slice(3).some((arg) => !/^--max-regression=.+$/.test(arg))) {
    throw new Error(
      "Usage: node benchmarks/providers/run.mjs --compare BASELINE.json CURRENT.json [--max-regression=15]",
    );
  }
  const rows = compare(
    JSON.parse(await readFile(baseline, "utf8")),
    JSON.parse(await readFile(current, "utf8")),
    Number(option("max-regression", 15)),
  );
  console.table(rows);
  if (rows.some((row) => row.regression)) process.exitCode = 2;
} else await run();

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = path.join(packageRoot, "dist", "index.js");

if (!existsSync(distEntry)) {
  console.error(
    "@moritzbrantner/charts interaction benchmark requires dist/. Run `bun run build` first.",
  );
  process.exit(1);
}

const { createChartDensityIndex, createChartRenderData, createProgressiveChartDensityIndex } =
  await import(distEntry);

const runFullMatrix = process.env.CHARTS_BENCH_FULL === "1";
const sizes = runFullMatrix
  ? [1_000, 2_500, 5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000]
  : [1_000, 2_500, 5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000];
const patterns = ["sorted", "random", "duplicates"];
const modes = ["average", "count", "min", "max", "sum", "p95"];
const viewportSpans = [0.01, 0.1, 0.25, 1];
const binCounts = [250, 1_000];
const backends = ["hybrid-js", "wasm-index", "progressive"];
const repeatedQueryCount = 80;
const rows = [];
const recommendationInputs = [];
const csvColumns = [
  "size",
  "pattern",
  "mode",
  "viewportSpan",
  "binCount",
  "backend",
  "constructMs",
  "firstQueryMs",
  "repeatedQueryMs",
  "repeatedMedianMs",
  "renderDataMs",
  "progressiveWarmupMs",
  "memoryDeltaMb",
];

process.stdout.write(`${csvColumns.join(",")}\n`);

for (const size of sizes) {
  for (const pattern of patterns) {
    const points = createSeriesPoints(size, pattern);

    for (const backend of backends) {
      const memoryBefore = readMemoryMb();
      let index;
      const constructMs = measure(() => {
        index =
          backend === "progressive"
            ? createProgressiveChartDensityIndex(points, { progressive: { warmup: "manual" } })
            : createChartDensityIndex(points, { backend, cache: { enabled: false } });
      });
      const memoryAfter = readMemoryMb();
      const warmupMs =
        backend === "progressive"
          ? await measureAsync(async () => {
              await index.warmWasmIndex();
            })
          : 0;

      for (const mode of modes) {
        for (const viewportSpan of viewportSpans) {
          for (const binCount of binCounts) {
            const baseQuery = createQuery(size, mode, viewportSpan, binCount, 0);
            let firstSeries;
            const firstQueryMs = measure(() => {
              firstSeries = index.getChartSeries(baseQuery);
              assertChartSeries(firstSeries);
            });
            const renderDataMs = measure(() => {
              const renderData = createChartRenderData(firstSeries.samples, {
                modes: [mode],
              });

              if (renderData.rows.length !== firstSeries.samples.length) {
                throw new Error("render row count did not match samples");
              }
            });
            const panTimings = [];
            const repeatedQueryMs = measure(() => {
              for (let iteration = 0; iteration < repeatedQueryCount; iteration += 1) {
                const query = createQuery(size, mode, viewportSpan, binCount, iteration);
                const startedAt = performance.now();
                const series = index.getChartSeries(query);

                panTimings.push(performance.now() - startedAt);
                assertChartSeries(series);
              }
            });
            const row = {
              backend,
              binCount,
              constructMs,
              firstQueryMs,
              memoryDeltaMb: Math.max(0, memoryAfter - memoryBefore),
              mode,
              pattern,
              progressiveWarmupMs: warmupMs,
              repeatedMedianMs: median(panTimings),
              repeatedQueryCount,
              repeatedQueryMs,
              renderDataMs,
              size,
              viewportSpan,
            };

            rows.push(row);
            writeCsvRow(row);

            if (backend !== "progressive") {
              recommendationInputs.push(row);
            }
          }
        }
      }

      index = null;
      runGarbageCollector();
    }

    runGarbageCollector();
  }
}

const recommendations = createRecommendations(recommendationInputs);
const payload = {
  generatedAt: new Date().toISOString(),
  recommendations,
  rows,
};

if (process.env.CHARTS_BENCH_JSON !== "0") {
  const tempDir = path.join(packageRoot, "temp");

  mkdirSync(tempDir, { recursive: true });
  writeFileSync(
    path.join(tempDir, "benchmark-interactions.json"),
    JSON.stringify(payload, null, 2),
  );
}

function createSeriesPoints(size, pattern) {
  return Array.from({ length: size }, (_, index) => ({
    id: `${pattern}-${index}`,
    metrics: {
      count: 1,
      latency: (index % 97) + Math.sin(index / 13),
      revenue: index % 23,
    },
    properties: {
      group: index % 8,
    },
    x: readPatternX(index, size, pattern),
    y: Math.sin(index / 17) * 50 + (index % 19),
  }));
}

function readPatternX(index, size, pattern) {
  switch (pattern) {
    case "duplicates":
      return Math.floor(index / 5);
    case "random":
      return (index * 48_271) % size;
    case "sorted":
      return index;
    default:
      throw new Error(`Unknown pattern: ${pattern}`);
  }
}

function createQuery(size, mode, viewportSpan, binCount, iteration) {
  const fullSpan = Math.max(1, size - 1);
  const span = Math.max(1, fullSpan * viewportSpan);
  const maxStart = Math.max(0, fullSpan - span);
  const start = viewportSpan >= 1 ? 0 : (iteration * span * 0.07) % maxStart;
  const query = {
    includeEmptyBins: true,
    targetBinCount: binCount,
    valueMode: mode,
    xDomain: [start, start + span],
  };

  if (mode === "p95") {
    query.percentiles = ["p95"];
  }

  return query;
}

function createRecommendations(results) {
  const groups = new Map();

  for (const row of results) {
    const key = JSON.stringify({
      binCount: row.binCount,
      mode: row.mode,
      pattern: row.pattern,
      viewportSpan: row.viewportSpan,
    });
    const group = groups.get(key) ?? [];

    group.push(row);
    groups.set(key, group);
  }

  return Array.from(groups.entries()).map(([key, group]) => {
    const metadata = JSON.parse(key);
    const rowsBySize = new Map();

    for (const row of group) {
      const rows = rowsBySize.get(row.size) ?? {};

      rows[row.backend] = row;
      rowsBySize.set(row.size, rows);
    }

    const crossover = Array.from(rowsBySize.entries())
      .sort((left, right) => left[0] - right[0])
      .find(([, rows]) => {
        if (!rows["hybrid-js"] || !rows["wasm-index"]) {
          return false;
        }

        const hybrid = rows["hybrid-js"];
        const wasm = rows["wasm-index"];
        const repeatedSavings = hybrid.repeatedMedianMs - wasm.repeatedMedianMs;
        const speedup = hybrid.repeatedMedianMs / Math.max(wasm.repeatedMedianMs, 0.001);
        const overhead = Math.max(0, wasm.constructMs - hybrid.constructMs);

        return speedup >= 1.25 && repeatedSavings * 100 >= overhead;
      });

    return {
      ...metadata,
      recommendedBackend: crossover ? "wasm-index" : "hybrid-js",
      wasmCrossoverPoint: crossover?.[0] ?? null,
    };
  });
}

function writeCsvRow(row) {
  process.stdout.write(`${csvColumns.map((column) => formatCsvValue(row[column])).join(",")}\n`);
}

function formatCsvValue(value) {
  return typeof value === "number" ? value.toFixed(4) : JSON.stringify(value);
}

function measure(run) {
  const startedAt = performance.now();

  run();

  return performance.now() - startedAt;
}

async function measureAsync(run) {
  const startedAt = performance.now();

  await run();

  return performance.now() - startedAt;
}

function median(values) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = values.toSorted((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0);
}

function assertChartSeries(series) {
  if (series.samples.length !== series.summary.sampleCount) {
    throw new Error("chart sample count did not match summary");
  }

  if (series.bins.length !== series.summary.binCount) {
    throw new Error("chart bin count did not match summary");
  }

  if (series.summary.metrics.count !== series.summary.pointCount) {
    throw new Error("chart count metric did not match point count");
  }
}

function readMemoryMb() {
  return typeof process.memoryUsage === "function" ? process.memoryUsage().heapUsed / 1_048_576 : 0;
}

function runGarbageCollector() {
  globalThis.Bun?.gc?.(true);
}

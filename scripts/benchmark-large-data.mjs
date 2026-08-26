import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = path.join(packageRoot, "dist", "index.js");
const wasmEntry = path.join(packageRoot, "dist", "wasm-runtime.js");

if (!existsSync(distEntry)) {
  console.error("@moritzbrantner/charts benchmark requires dist/. Run `bun run build` first.");
  process.exit(1);
}

const {
  createChartDensityIndex,
  createChartDensityViewportSummary,
  createProgressiveChartDensityIndex,
} = await import(distEntry);
const { enableChartWasm } = await import(wasmEntry);

if (!enableChartWasm()) {
  throw new Error("Chart benchmark requires the committed owned WASM kernel.");
}

const results = [];
const runFullMatrix = process.env.CHARTS_BENCH_FULL === "1";
const profileBenchmarks = process.env.CHARTS_BENCH_PROFILE === "1";
const seriesSizes = runFullMatrix ? [10_000, 100_000, 500_000] : [10_000, 100_000];
const repeatedQueryCount = runFullMatrix ? 30 : 8;

if (profileBenchmarks) {
  globalThis.__CHARTS_BENCH_PROFILE_RESULTS__ = [];
}

results.push(
  benchmark("chart.wasm.module.load", () => {
    const index = createChartDensityIndex(
      [{ id: "wasm-load", metrics: { count: 1 }, x: 0, y: 1 }],
      {
        backend: "wasm-index",
      },
    );

    assertChartSeries(index.getChartSeries({ targetBinCount: 1, xDomain: [0, 1] }));
  }),
);

for (const size of seriesSizes) {
  for (const scenario of [
    { metricCount: 3, pattern: "sorted" },
    { metricCount: 3, pattern: "reverse" },
    { metricCount: 3, pattern: "random" },
    { metricCount: 3, pattern: "duplicates" },
    { metricCount: 12, pattern: "sorted" },
  ]) {
    const points = createSeriesPoints(size, scenario);

    for (const backend of ["hybrid-js", "wasm-index"]) {
      const baseName = `chart.${formatSize(size)}.${scenario.pattern}.${scenario.metricCount}metrics.${backend}`;
      const beforeConstructMemory = readMemoryMb();
      let index;
      const construct = benchmark(`${baseName}.construct`, () => {
        index = createChartDensityIndex(points, { backend });
      });
      const afterConstructMemory = readMemoryMb();
      const queries = createSeriesQueries(size);

      results.push(construct);
      results.push({
        durationMs: Math.max(0, afterConstructMemory - beforeConstructMemory),
        kind: "memory",
        name: `${baseName}.memory.heapDelta`,
      });
      const fullQuery = benchmark(`${baseName}.query.full`, () => {
        assertChartSeries(index.getChartSeries({ ...queries[0], valueMode: "average" }));
      });
      const repeatedQuery = benchmark(`${baseName}.query.repeated`, () => {
        for (let iteration = 0; iteration < repeatedQueryCount; iteration += 1) {
          const valueMode = readValueMode(iteration);

          assertChartSeries(
            index.getChartSeries({
              ...queries[iteration % queries.length],
              valueMode,
            }),
          );
        }
      });

      results.push(fullQuery);

      if (backend === "wasm-index") {
        results.push({ ...fullQuery, name: `${baseName}.query.full.packed` });
      }

      results.push(repeatedQuery);

      if (backend === "wasm-index") {
        results.push({ ...repeatedQuery, name: `${baseName}.query.repeated.packed` });
      }
      results.push(
        benchmark(`${baseName}.query.percentiles`, () => {
          assertChartSeries(
            index.getChartSeries({
              ...queries[0],
              percentiles: ["p25", "p50", "p75", "p95"],
              valueMode: "p95",
            }),
          );
        }),
      );
      results.push(
        benchmark(`${baseName}.histogram`, () => {
          assertHistogram(
            index.getHistogram({
              bucketCount: 200,
              xDomain: [0, size - 1],
            }),
          );
        }),
      );
      results.push(
        benchmark(`${baseName}.heatmap`, () => {
          assertHeatmap(
            index.getHeatmap({
              xBinCount: 100,
              xDomain: [0, size - 1],
              yBinCount: 50,
            }),
          );
        }),
      );
      results.push(
        benchmark(`${baseName}.summary.repeated`, () => {
          for (let iteration = 0; iteration < repeatedQueryCount; iteration += 1) {
            const series = index.getChartSeries({
              ...queries[2],
              valueMode: readValueMode(iteration),
            });

            assertViewportSummary(createChartDensityViewportSummary(series), series);
          }
        }),
      );
    }
  }
}

for (const size of seriesSizes) {
  const points = createSeriesPoints(size, { metricCount: 3, pattern: "sorted" });
  const baseName = `chart.${formatSize(size)}.sorted.3metrics.progressive`;
  let index;

  results.push(
    benchmark(`${baseName}.construct.hybrid-first`, () => {
      index = createProgressiveChartDensityIndex(points, {
        progressive: {
          warmup: "manual",
        },
      });
    }),
  );
  results.push(
    benchmark(`${baseName}.query.first-render`, () => {
      assertChartSeries(
        index.getChartSeries({
          targetBinCount: 250,
          valueMode: "average",
          xDomain: [0, size - 1],
        }),
      );
    }),
  );
  results.push(
    await benchmarkAsync(`${baseName}.warmup.wasm-index`, async () => {
      await index.warmWasmIndex();
    }),
  );
  results.push(
    benchmark(`${baseName}.query.after-warmup`, () => {
      assertChartSeries(
        index.getChartSeries({
          targetBinCount: 250,
          valueMode: "average",
          xDomain: [0, size - 1],
        }),
      );
    }),
  );
  results.push(
    benchmark(`${baseName}.heatmap.after-warmup`, () => {
      assertHeatmap(
        index.getHeatmap({
          xBinCount: 100,
          xDomain: [0, size - 1],
          yBinCount: 50,
        }),
      );
    }),
  );
  results.push(
    benchmark(`${baseName}.histogram.after-warmup`, () => {
      assertHistogram(
        index.getHistogram({
          bucketCount: 200,
          xDomain: [0, size - 1],
        }),
      );
    }),
  );
}

const maxDurationMs = 3_000;
const failNames = new Set([
  "chart.100k.sorted.3metrics.hybrid-js.construct",
  "chart.100k.sorted.3metrics.hybrid-js.query.full",
  "chart.100k.sorted.3metrics.wasm-index.construct",
  "chart.100k.sorted.3metrics.wasm-index.query.full",
  "chart.100k.sorted.3metrics.progressive.query.first-render",
  "chart.100k.sorted.3metrics.progressive.warmup.wasm-index",
  "chart.100k.sorted.3metrics.progressive.query.after-warmup",
]);
const slowBenchmarks = results.filter(
  (result) =>
    result.kind !== "memory" && failNames.has(result.name) && result.durationMs > maxDurationMs,
);
const comparisons = createBenchmarkComparisons(results);
const wasmRatioFailures = readWasmRatioFailures(comparisons);
const profileResults = readProfileResults();
writeJsonReport({
  comparisons,
  profileResults,
  repeatedQueryCount,
  results,
  runFullMatrix,
  slowBenchmarks,
  wasmRatioFailures,
});

for (const result of results) {
  const suffix = result.kind === "memory" ? "MB heap delta" : "ms";
  console.log(`${result.name}: ${result.durationMs.toFixed(1)}${suffix}`);
}

if (profileBenchmarks) {
  for (const result of profileResults) {
    console.log(`${result.name}: ${result.durationMs.toFixed(3)}ms profile`);
  }
}

if (!runFullMatrix) {
  console.log(
    "chart.full-matrix.skipped: set CHARTS_BENCH_FULL=1 to include 500k-point scenarios and 30-query loops",
  );
}

if (slowBenchmarks.length > 0) {
  console.error(
    `@moritzbrantner/charts stable benchmarks exceeded ${maxDurationMs}ms: ${slowBenchmarks
      .map((result) => result.name)
      .join(", ")}`,
  );
  process.exit(1);
}

if (wasmRatioFailures.length > 0) {
  const message = `@moritzbrantner/charts WASM benchmarks missed speedup targets: ${wasmRatioFailures
    .map(
      (failure) =>
        `${failure.wasmName} (${failure.speedup.toFixed(2)}x, target ${failure.targetSpeedup.toFixed(2)}x)`,
    )
    .join(", ")}`;

  if (process.env.CHARTS_BENCH_ENFORCE_WASM_RATIO === "1") {
    console.error(message);
    process.exit(1);
  }

  console.warn(`${message} (set CHARTS_BENCH_ENFORCE_WASM_RATIO=1 to fail this gate)`);
}

function benchmark(name, run) {
  const startedAt = performance.now();

  run();

  return {
    durationMs: performance.now() - startedAt,
    name,
  };
}

async function benchmarkAsync(name, run) {
  const startedAt = performance.now();

  await run();

  return {
    durationMs: performance.now() - startedAt,
    name,
  };
}

function createSeriesPoints(size, scenario) {
  return Array.from({ length: size }, (_, index) => {
    const x = readScenarioX(index, size, scenario.pattern);

    return {
      id: `${scenario.pattern}-${scenario.metricCount}-${index}`,
      metrics: createMetrics(index, scenario.metricCount),
      properties: {
        group: index % 8,
      },
      x,
      y: Math.sin(index / 20) * 100 + (index % 11),
    };
  });
}

function createMetrics(index, metricCount) {
  return Object.fromEntries(
    Array.from({ length: metricCount }, (_, metricIndex) => [
      metricIndex === 0 ? "count" : `metric${metricIndex}`,
      metricIndex === 0 ? 1 : (index % (metricIndex + 7)) * (metricIndex + 1),
    ]),
  );
}

function readScenarioX(index, size, pattern) {
  switch (pattern) {
    case "duplicates":
      return Math.floor(index / 5);
    case "random":
      return (index * 48_271) % size;
    case "reverse":
      return size - index - 1;
    case "sorted":
      return index;
  }
}

function createSeriesQueries(size) {
  return [
    { targetBinCount: 250, xDomain: [0, size - 1] },
    { targetBinCount: 500, xDomain: [size * 0.25, size * 0.5] },
    {
      includeEmptyBins: true,
      targetBinCount: 1_000,
      xDomain: [size * 0.49, size * 0.51],
    },
  ];
}

function readValueMode(iteration) {
  return ["average", "count", "max", "min", "sum"][iteration % 5];
}

function assertChartSeries(series, context = {}) {
  if (series.samples.length !== series.summary.sampleCount) {
    throw new Error(
      `chart sample count did not match summary: ${formatDiagnosticContext(context, series)}`,
    );
  }

  if (series.bins.length !== series.summary.binCount) {
    throw new Error(
      `chart bin count did not match summary: ${formatDiagnosticContext(context, series)}`,
    );
  }

  if (series.summary.metrics.count !== series.summary.pointCount) {
    throw new Error(
      `chart count metric did not match point count: ${formatDiagnosticContext(context, series)}`,
    );
  }
}

function formatDiagnosticContext(context, series) {
  const nonEmptyBins = series.bins.filter((bin) => bin.pointCount > 0);
  const binPointTotal = series.bins.reduce((total, bin) => total + bin.pointCount, 0);
  const binMetricTotal = series.bins.reduce((total, bin) => total + (bin.metrics.count ?? 0), 0);

  return JSON.stringify({
    ...context,
    binCount: series.summary.binCount,
    binMetricTotal,
    binPointTotal,
    firstBins: series.bins.slice(0, 3).map(readBinDiagnostic),
    lastBins: series.bins.slice(-3).map(readBinDiagnostic),
    metricCount: series.summary.metrics.count,
    nonEmptyBinCount: nonEmptyBins.length,
    pointCount: series.summary.pointCount,
    sampleCount: series.summary.sampleCount,
    valueMode: series.summary.valueMode,
    xDomain: series.summary.xDomain,
  });
}

function readBinDiagnostic(bin) {
  return {
    index: bin.index,
    metricCount: bin.metrics.count ?? null,
    pointCount: bin.pointCount,
    x0: bin.x0,
    x1: bin.x1,
  };
}

function assertHistogram(histogram) {
  if (histogram.buckets.length !== histogram.summary.bucketCount) {
    throw new Error("histogram bucket count did not match summary");
  }
}

function assertHeatmap(heatmap) {
  if (heatmap.summary.maxCellCount < 0) {
    throw new Error("heatmap max cell count was invalid");
  }
}

function assertViewportSummary(summary, series) {
  if (summary.sampleCount !== series.summary.sampleCount) {
    throw new Error("chart viewport sample count did not match series");
  }

  if (summary.itemCount !== series.summary.pointCount) {
    throw new Error("chart viewport item count did not match point count");
  }
}

function createBenchmarkComparisons(benchmarkResults) {
  return [
    createComparison(benchmarkResults, {
      hybridName: "chart.100k.sorted.3metrics.hybrid-js.query.full",
      targetSpeedup: 1,
      type: "known-non-goal",
      wasmName: "chart.100k.sorted.3metrics.wasm-index.query.full",
      warnBelowTarget: true,
    }),
    createComparison(benchmarkResults, {
      hybridName: "chart.100k.sorted.3metrics.hybrid-js.query.repeated",
      targetSpeedup: 1,
      type: "known-non-goal",
      wasmName: "chart.100k.sorted.3metrics.wasm-index.query.repeated",
      warnBelowTarget: true,
    }),
    createComparison(benchmarkResults, {
      hybridName: "chart.100k.random.3metrics.hybrid-js.query.full",
      minimumSpeedup: 1.2,
      targetSpeedup: 1.5,
      type: "wasm-candidate",
      wasmName: "chart.100k.random.3metrics.wasm-index.query.full",
      warnBelowTarget: true,
    }),
    createComparison(benchmarkResults, {
      hybridName: "chart.500k.random.3metrics.hybrid-js.query.full",
      minimumSpeedup: 1.2,
      targetSpeedup: 1.5,
      type: "wasm-candidate",
      wasmName: "chart.500k.random.3metrics.wasm-index.query.full",
      warnBelowTarget: true,
    }),
    createComparison(benchmarkResults, {
      hybridName: "chart.500k.random.3metrics.hybrid-js.query.repeated",
      minimumSpeedup: 1.45,
      targetSpeedup: 1.5,
      type: "wasm-candidate",
      wasmName: "chart.500k.random.3metrics.wasm-index.query.repeated",
      warnBelowTarget: true,
    }),
    createComparison(benchmarkResults, {
      hybridName: "chart.100k.sorted.12metrics.hybrid-js.heatmap",
      targetSpeedup: 0.8,
      type: "wasm-fallback-operation",
      wasmName: "chart.100k.sorted.12metrics.wasm-index.heatmap",
      warnBelowTarget: true,
    }),
  ].filter(Boolean);
}

function createComparison(
  benchmarkResults,
  { hybridName, minimumSpeedup, targetSpeedup, type, wasmName, warnBelowTarget = false },
) {
  const hybrid = benchmarkResults.find((result) => result.name === hybridName);
  const wasm = benchmarkResults.find((result) => result.name === wasmName);

  if (!hybrid || !wasm || hybrid.kind === "memory" || wasm.kind === "memory") {
    return null;
  }

  const speedup = hybrid.durationMs / Math.max(wasm.durationMs, 0.001);
  const regressionFloor = minimumSpeedup ?? targetSpeedup;
  const passed = speedup >= targetSpeedup;
  const aboveRegressionFloor = speedup >= regressionFloor;

  return {
    hybridDurationMs: hybrid.durationMs,
    hybridName,
    minimumSpeedup: regressionFloor,
    speedup,
    status: passed ? "pass" : warnBelowTarget || aboveRegressionFloor ? "warn" : "fail",
    targetSpeedup,
    type,
    wasmDurationMs: wasm.durationMs,
    wasmName,
  };
}

function readWasmRatioFailures(comparisons) {
  return comparisons.filter((comparison) => comparison.status === "fail");
}

function formatSize(size) {
  if (size >= 1_000) {
    return `${Math.round(size / 1_000)}k`;
  }

  return String(size);
}

function readMemoryMb() {
  return typeof process.memoryUsage === "function" ? process.memoryUsage().heapUsed / 1_048_576 : 0;
}

function writeJsonReport({
  comparisons,
  profileResults,
  repeatedQueryCount,
  results: benchmarkResults,
  runFullMatrix,
  slowBenchmarks,
  wasmRatioFailures,
}) {
  const jsonPath = process.env.CHARTS_BENCH_JSON;

  if (!jsonPath) {
    return;
  }

  const resolvedPath = path.resolve(process.cwd(), jsonPath);
  mkdirSync(path.dirname(resolvedPath), { recursive: true });
  writeFileSync(
    resolvedPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        comparisons,
        repeatedQueryCount,
        results: benchmarkResults.map((result) => ({
          durationMs: result.durationMs,
          kind: result.kind,
          name: result.name,
          unit: result.kind === "memory" ? "MB heap delta" : "ms",
        })),
        runFullMatrix,
        slowBenchmarks: slowBenchmarks.map((result) => result.name),
        wasmRatioFailures,
        ...(profileBenchmarks ? { profileResults } : {}),
      },
      null,
      2,
    )}\n`,
  );
}

function readProfileResults() {
  if (!profileBenchmarks) {
    return [];
  }

  return Array.isArray(globalThis.__CHARTS_BENCH_PROFILE_RESULTS__)
    ? globalThis.__CHARTS_BENCH_PROFILE_RESULTS__.map((result) => ({
        durationMs: result.durationMs,
        name: result.name,
        unit: "ms",
      }))
    : [];
}

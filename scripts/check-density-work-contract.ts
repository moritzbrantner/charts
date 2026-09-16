import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createChartDensityIndex } from "../src/density/backend";
import { getChartDensityWorkFacts } from "../src/density/work-facts";

const outputDir = path.resolve(process.cwd(), "test-results");
const points = Array.from({ length: 4_096 }, (_, index) => ({
  id: `point-${index}`,
  metrics: {
    count: 1,
    requests: index % 17,
  },
  properties: {
    group: index % 8,
  },
  x: index,
  y: Math.sin(index / 20) * 100 + (index % 11),
}));
const inputFingerprint = createHash("sha256").update(JSON.stringify(points)).digest("hex");
const failures: string[] = [];
const snapshots: Array<{
  case: string;
  facts: NonNullable<ReturnType<typeof getChartDensityWorkFacts>>;
}> = [];

function readFacts(caseName: string, index: object) {
  const facts = getChartDensityWorkFacts(index);

  if (!facts) {
    throw new Error(`No deterministic work facts were attached for ${caseName}`);
  }

  snapshots.push({ case: caseName, facts });
  return facts;
}

function expectEqual(caseName: string, actual: number, expected: number) {
  if (actual !== expected) {
    failures.push(`${caseName}: expected ${expected}, received ${actual}`);
  }
}

const hybrid = createChartDensityIndex(points, {
  backend: "hybrid-js",
  cache: { enabled: true, maxEntries: 8 },
});
let facts = readFacts("hybrid.construct", hybrid);
expectEqual("hybrid.construct.binnedIndexBuilds", facts.preparation.binnedIndexBuilds, 0);
expectEqual("hybrid.construct.pointStoreBuilds", facts.preparation.pointStoreBuilds, 0);
expectEqual(
  "hybrid.construct.rangeAggregateStoreBuilds",
  facts.preparation.rangeAggregateStoreBuilds,
  0,
);

const binnedQuery = {
  includeEmptyBins: true,
  targetBinCount: 128,
  xDomain: [0, points.length - 1] as [number, number],
};
hybrid.getBinnedSeries(binnedQuery);
facts = readFacts("hybrid.after-binned", hybrid);
expectEqual("hybrid.after-binned.binnedIndexBuilds", facts.preparation.binnedIndexBuilds, 1);
expectEqual("hybrid.after-binned.pointStoreBuilds", facts.preparation.pointStoreBuilds, 0);
expectEqual("hybrid.after-binned.binnedQueries", facts.queries.binnedSeries, 1);
expectEqual("hybrid.after-binned.cacheMisses", facts.cache.misses, 1);

hybrid.getBinnedSeries(binnedQuery);
facts = readFacts("hybrid.after-cached-binned", hybrid);
expectEqual("hybrid.after-cached-binned.binnedQueries", facts.queries.binnedSeries, 1);
expectEqual("hybrid.after-cached-binned.cacheHits", facts.cache.hits, 1);

hybrid.getChartSeries({ ...binnedQuery, valueMode: "average" });
facts = readFacts("hybrid.after-average-series", hybrid);
expectEqual(
  "hybrid.after-average-series.binnedIndexBuilds",
  facts.preparation.binnedIndexBuilds,
  1,
);
expectEqual("hybrid.after-average-series.pointStoreBuilds", facts.preparation.pointStoreBuilds, 0);

hybrid.getHistogram({
  bucketCount: 64,
  xDomain: [0, points.length - 1],
});
facts = readFacts("hybrid.after-histogram", hybrid);
expectEqual("hybrid.after-histogram.pointStoreBuilds", facts.preparation.pointStoreBuilds, 1);
expectEqual("hybrid.after-histogram.histogramQueries", facts.queries.histograms, 1);

hybrid.getHeatmap({
  xBinCount: 32,
  xDomain: [0, points.length - 1],
  yBinCount: 16,
});
facts = readFacts("hybrid.after-heatmap", hybrid);
expectEqual("hybrid.after-heatmap.pointStoreBuilds", facts.preparation.pointStoreBuilds, 1);
expectEqual("hybrid.after-heatmap.heatmapQueries", facts.queries.heatmaps, 1);

const automatic = createChartDensityIndex(points, {
  backend: "auto",
  cache: { enabled: false },
});
facts = readFacts("auto.construct", automatic);
expectEqual("auto.construct.binnedIndexBuilds", facts.preparation.binnedIndexBuilds, 0);
expectEqual("auto.construct.pointStoreBuilds", facts.preparation.pointStoreBuilds, 0);
expectEqual(
  "auto.construct.rangeAggregateStoreBuilds",
  facts.preparation.rangeAggregateStoreBuilds,
  0,
);

automatic.getChartSeries({ ...binnedQuery, valueMode: "average" });
facts = readFacts("auto.after-average-series", automatic);
expectEqual("auto.after-average-series.binnedIndexBuilds", facts.preparation.binnedIndexBuilds, 0);
expectEqual("auto.after-average-series.pointStoreBuilds", facts.preparation.pointStoreBuilds, 1);
expectEqual(
  "auto.after-average-series.rangeAggregateStoreBuilds",
  facts.preparation.rangeAggregateStoreBuilds,
  1,
);

automatic.getHistogram({
  bucketCount: 64,
  xDomain: [0, points.length - 1],
});
automatic.getPointById("point-1");
automatic.getSeriesBounds();
facts = readFacts("auto.after-mixed-precise-queries", automatic);
expectEqual(
  "auto.after-mixed-precise-queries.binnedIndexBuilds",
  facts.preparation.binnedIndexBuilds,
  0,
);
expectEqual(
  "auto.after-mixed-precise-queries.pointStoreBuilds",
  facts.preparation.pointStoreBuilds,
  1,
);
expectEqual(
  "auto.after-mixed-precise-queries.rangeAggregateStoreBuilds",
  facts.preparation.rangeAggregateStoreBuilds,
  1,
);

const evidence = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: {
    arch: process.arch,
    bunVersion: Bun.version,
    nodeVersion: process.version,
    platform: process.platform,
    revision: process.env.GITHUB_SHA ?? null,
  },
  workload: {
    inputFingerprintSha256: inputFingerprint,
    pointCount: points.length,
  },
  contract: {
    constructionPreparesNoUnusedQueryState: true,
    repeatedCachedQueryDoesNotRepeatUnderlyingWork: true,
    autoChartPathDoesNotBuildRedundantBinnedIndex: true,
    preparedPointStoreIsReusedAcrossPreciseQueries: true,
  },
  failures,
  snapshots,
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  path.join(outputDir, "charts-performance-contract.json"),
  `${JSON.stringify(evidence, null, 2)}\n`,
);
writeFileSync(
  path.join(outputDir, "charts-performance-contract.md"),
  [
    "# Charts deterministic performance contract",
    "",
    `- Input points: ${points.length}`,
    `- Input SHA-256: \`${inputFingerprint}\``,
    `- Revision: \`${process.env.GITHUB_SHA ?? "local"}\``,
    `- Result: **${failures.length === 0 ? "pass" : "fail"}**`,
    "",
    "| Case | Binned prep | Point-store prep | Range prep | Cache hits | Cache misses |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...snapshots.map(
      ({ case: caseName, facts: snapshot }) =>
        `| ${caseName} | ${snapshot.preparation.binnedIndexBuilds} | ${snapshot.preparation.pointStoreBuilds} | ${snapshot.preparation.rangeAggregateStoreBuilds} | ${snapshot.cache.hits} | ${snapshot.cache.misses} |`,
    ),
    "",
    ...(failures.length > 0
      ? ["## Failures", "", ...failures.map((failure) => `- ${failure}`)]
      : []),
    "",
  ].join("\n"),
);

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `Charts deterministic performance contract passed (${points.length} points, ${inputFingerprint.slice(0, 12)}…).`,
);

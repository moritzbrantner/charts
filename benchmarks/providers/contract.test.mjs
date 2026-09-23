import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { gzipSync } from "node:zlib";
import {
  aggregate,
  assertComplete,
  assertPoints,
  compare,
  describe,
  fixture,
  integer,
  KINDS,
  order,
  PHASES,
  PROVIDERS,
  quantile,
  SCHEMA,
  summarize,
  VENDORS,
} from "./contract.mjs";
import { digest, member, prepareVendors, verifyArchive } from "./vendor.mjs";

function complete() {
  const report = {
    schema: SCHEMA,
    status: "complete",
    config: { sizes: [16], repeats: 5, warmups: 2, seed: 17 },
    environment: { chromium: "test-browser", cpus: ["test-cpu"] },
    protocol: { fixture: "v1" },
    samples: [],
    failures: [],
  };
  const initial = fixture(16, 17);
  const replacement = fixture(16, 17, 1);
  const windowed = describe(replacement.points.slice(4, 8));
  for (const kind of KINDS)
    for (const provider of PROVIDERS)
      for (const phase of PHASES) {
        const data = phase === "mount" ? initial : phase === "replace" ? replacement : windowed;
        for (let trial = 0; trial < 5; trial += 1)
          report.samples.push({
            kind,
            size: 16,
            provider,
            phase,
            trial,
            apiMs: 4,
            settledMs: 20,
            prepareMs: 2,
            checked: true,
            checksum: data.checksum,
            pointCount: phase === "destroy" ? 0 : data.points.length,
            domNodes: phase === "destroy" ? 0 : 10,
          });
      }
  return report;
}

function tar(name, text, type = "0") {
  const header = Buffer.alloc(512);
  header.write(name, 0);
  header.write(Buffer.byteLength(text).toString(8).padStart(11, "0"), 124);
  header.write(type, 156);
  return gzipSync(
    Buffer.concat([
      header,
      Buffer.from(text),
      Buffer.alloc((512 - (Buffer.byteLength(text) % 512)) % 512),
      Buffer.alloc(1024),
    ]),
  );
}

test("fixtures are deterministic, sorted, finite and change with seed/revision", () => {
  const first = fixture(1000, 7);
  assert.deepEqual(first, fixture(1000, 7));
  assert.notEqual(first.checksum, fixture(1000, 8).checksum);
  assert.notEqual(first.checksum, fixture(1000, 7, 1).checksum);
  assert.equal(first.points.length, 1000);
  assert.deepEqual(first.xDomain, [0, 999]);
  assert.ok(first.yDomain[0] < 0 && first.yDomain[1] > 0);
  assert.ok(first.points.every((point, index) => Number.isFinite(point.y) && point.x === index));
});

test("large fixtures do not use spread-argument min/max", () => {
  assert.equal(fixture(200_000).points.length, 200_000);
});

test("invalid workloads fail rather than become empty fast charts", () => {
  for (const value of [0, -1, NaN, Infinity, 1.5, "", "hello"])
    assert.throws(() => integer(value, "value"));
  assert.throws(() => fixture(3));
  assert.throws(() => describe([]));
  assert.throws(() => describe([{ x: 1, y: NaN }]));
  assert.throws(() =>
    describe([
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]),
  );
});

test("point oracle rejects truncated and stale provider data", () => {
  const points = fixture(16).points;
  assertPoints(structuredClone(points), points);
  assert.throws(() => assertPoints(points.slice(1), points));
  assert.throws(() => assertPoints(fixture(16, 20260923, 1).points, points));
});

test("quantiles preserve input, interpolate medians and reject invalid samples", () => {
  const values = [8, 2, 4, 6];
  assert.equal(quantile(values, 0.5), 5);
  assert.equal(quantile(values, 0.95), 7.699999999999999);
  assert.deepEqual(values, [8, 2, 4, 6]);
  assert.deepEqual(summarize([3]), { count: 1, median: 3, p95: 3, min: 3, max: 3 });
  for (const invalid of [[], [-1], [NaN], [Infinity]]) assert.throws(() => summarize(invalid));
  assert.throws(() => quantile([1], 2));
});

test("provider order rotates deterministically without omissions", () => {
  assert.deepEqual(order(0), PROVIDERS);
  assert.deepEqual(order(3), PROVIDERS);
  for (const index of [0, 1, 2]) assert.deepEqual([...order(index)].sort(), [...PROVIDERS].sort());
  assert.equal(new Set([order(0)[0], order(1)[0], order(2)[0]]).size, 3);
});

test("complete matrix passes and preserves every timing sample", () => {
  const report = complete();
  assertComplete(report);
  const rows = aggregate(report);
  assert.equal(rows.length, KINDS.length * PROVIDERS.length * PHASES.length);
  assert.ok(rows.every((row) => row.apiMs.count === 5 && row.settledMs.median === 20));
});

for (const [name, mutate] of [
  [
    "missing provider",
    (report) => {
      report.samples = report.samples.filter((row) => row.provider !== "echarts");
    },
  ],
  ["duplicate sample", (report) => report.samples.push(report.samples[0])],
  ["missing phase", (report) => report.samples.pop()],
  ["failed warmup", (report) => report.failures.push({ trial: -1 })],
  [
    "unchecked output",
    (report) => {
      report.samples[0].checked = false;
    },
  ],
  [
    "wrong input count",
    (report) => {
      report.samples[0].pointCount -= 1;
    },
  ],
  [
    "stale fixture",
    (report) => {
      report.samples[0].checksum = "wrong";
    },
  ],
  [
    "invalid timing",
    (report) => {
      report.samples[0].apiMs = NaN;
    },
  ],
  [
    "running report",
    (report) => {
      report.status = "running";
    },
  ],
  [
    "SVG work regression",
    (report) => {
      report.samples[0].domNodes = 33;
    },
  ],
  [
    "cleanup leak",
    (report) => {
      report.samples.find((row) => row.phase === "destroy").domNodes = 1;
    },
  ],
])
  test(`rejects ${name}`, () => {
    const report = complete();
    mutate(report);
    assert.throws(() => assertComplete(report));
  });

test("same-runner comparison flags regressions but never silently changes the baseline", () => {
  const baseline = complete();
  const current = structuredClone(baseline);
  for (const row of current.samples) if (row.provider === "charts-svg") row.settledMs *= 1.2;
  const comparison = compare(baseline, current, 15);
  assert.equal(comparison.length, KINDS.length * PHASES.length);
  assert.ok(comparison.every((row) => row.regression));
  assert.equal(baseline.samples[0].settledMs, 20);
});

test("comparisons refuse environment/protocol/config drift and zero denominators", () => {
  const baseline = complete();
  for (const mutate of [
    (report) => {
      report.environment.chromium = "different-browser";
    },
    (report) => {
      report.protocol.fixture = "v2";
    },
    (report) => {
      report.config.warmups = 3;
    },
    (report) => {
      report.samples.forEach((row) => {
        row.settledMs = 0;
      });
    },
  ]) {
    const incompatible = structuredClone(baseline);
    mutate(incompatible);
    assert.throws(() => compare(incompatible, baseline));
  }
  assert.throws(() => compare(baseline, baseline, NaN));
});

test("smoke evidence cannot become a timing ratchet", () => {
  const report = complete();
  report.config.repeats = 1;
  report.samples = report.samples.filter((row) => row.trial === 0);
  assertComplete(report);
  assert.throws(() => compare(report, report), /at least five/);
});

test("vendor reader selects only exact regular members and rejects malformed archives", () => {
  const archive = tar("package/dist/chart.js", "console.log('vendor');");
  assert.equal(member(archive, "package/dist/chart.js").toString(), "console.log('vendor');");
  assert.throws(() => member(archive, "../dist/chart.js"));
  assert.throws(() => member(tar("package/dist/chart.js", "link", "2"), "package/dist/chart.js"));
  assert.throws(() => member(gzipSync(Buffer.alloc(512, 120)), "file"));
  const truncated = Buffer.alloc(512);
  truncated.write("file");
  truncated.write("00000001000", 124);
  assert.throws(() => member(gzipSync(truncated), "file"), /Truncated/);
});

test("npm archive integrity is checked before reading or executing vendor code", () => {
  const archive = tar("package/package.json", "{}");
  const integrity = `sha512-${createHash("sha512").update(archive).digest("base64")}`;
  verifyArchive(archive, integrity);
  assert.throws(() => verifyArchive(Buffer.from("changed"), integrity), /mismatch/);
  assert.throws(() => verifyArchive(archive, "sha1-unsupported"));
});

test("verified vendor cache works offline and corrupt bytes fail closed", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "charts-vendors-"));
  try {
    for (const [id, pin] of Object.entries(VENDORS)) {
      const script = path.join(directory, `${id}-${pin.version}.js`);
      const source = `// fixture ${id}`;
      await writeFile(script, source);
      await writeFile(`${script}.json`, JSON.stringify({ ...pin, sha256: digest(source) }));
    }
    assert.equal(Object.keys(await prepareVendors(directory)).length, 2);
    await writeFile(path.join(directory, `chartjs-${VENDORS.chartjs.version}.js`), "corrupted");
    await assert.rejects(prepareVendors(directory), /Corrupt/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

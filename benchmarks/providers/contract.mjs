export const SCHEMA = 2;
export const PROVIDERS = ["charts-svg", "chartjs", "echarts"];
export const KINDS = ["sparkline", "scatter"];
export const PHASES = ["mount", "select", "replace", "window", "resize", "destroy"];
export const INTERACTION_PHASES = ["select"];
export const INTERACTION_MAX_POINTS = 10_000;
export const VIEW = { width: 600, height: 600, resized: 480, deviceScaleFactor: 1 };

export function phasesForKind(kind, size = INTERACTION_MAX_POINTS) {
  if (!KINDS.includes(kind)) throw new Error(`Unknown benchmark kind: ${kind}`);
  integer(size, "size", 8);
  return kind === "scatter" && size <= INTERACTION_MAX_POINTS
    ? PHASES
    : PHASES.filter((phase) => !INTERACTION_PHASES.includes(phase));
}

export function isInteractionPhase(phase) {
  return INTERACTION_PHASES.includes(phase);
}

export function interactionTarget(data) {
  const size = data.points.length;
  integer(size, "interaction point count", 8, INTERACTION_MAX_POINTS);
  const xSpan = Math.max(Number.EPSILON, data.xDomain[1] - data.xDomain[0]);
  const ySpan = Math.max(Number.EPSILON, data.yDomain[1] - data.yDomain[0]);
  const plotWidth = VIEW.width - 52;
  const plotHeight = VIEW.height - 48;
  const minimumSeparation = 5.5;
  const margin = 6;
  const positions = data.points.map((point) => ({
    x: ((point.x - data.xDomain[0]) / xSpan) * plotWidth,
    y: (1 - (point.y - data.yDomain[0]) / ySpan) * plotHeight,
  }));
  const buckets = new Map();
  for (let index = 0; index < positions.length; index += 1) {
    const point = positions[index];
    const key = `${Math.floor(point.x / minimumSeparation)},${Math.floor(point.y / minimumSeparation)}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(index);
    buckets.set(key, bucket);
  }
  const start = Math.floor((size - 1) * 0.61);
  for (let offset = 0; offset < size; offset += 1) {
    const index = (start + offset) % size;
    const point = positions[index];
    if (
      point.x < margin ||
      point.x > plotWidth - margin ||
      point.y < margin ||
      point.y > plotHeight - margin
    ) {
      continue;
    }
    const cellX = Math.floor(point.x / minimumSeparation);
    const cellY = Math.floor(point.y / minimumSeparation);
    let isolated = true;
    for (let xOffset = -1; xOffset <= 1 && isolated; xOffset += 1) {
      for (let yOffset = -1; yOffset <= 1 && isolated; yOffset += 1) {
        const bucket = buckets.get(`${cellX + xOffset},${cellY + yOffset}`) ?? [];
        for (const neighborIndex of bucket) {
          if (neighborIndex === index) continue;
          const neighbor = positions[neighborIndex];
          const dx = point.x - neighbor.x;
          const dy = point.y - neighbor.y;
          if (dx * dx + dy * dy <= minimumSeparation * minimumSeparation) {
            isolated = false;
            break;
          }
        }
      }
    }
    if (isolated) return index;
  }
  throw new Error("No provider-independent isolated interaction target");
}
export const VENDORS = {
  chartjs: { name: "chart.js", version: "4.5.1", entry: "package/dist/chart.umd.js" },
  echarts: { name: "echarts", version: "6.0.0", entry: "package/dist/echarts.min.js" },
};

export function integer(value, name, minimum = 1, maximum = 1_000_000) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return number;
}

export function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// Integer-derived values avoid platform-dependent transcendental math.
// Fixture generation and checksums are never part of a rendering measurement.
export function fixture(size, seed = 20260923, revision = 0) {
  integer(size, "size", 8);
  const next = random(seed);
  const points = Array.from({ length: size }, (_, index) => ({
    x: index,
    y: ((index * 17 + revision * 31) % 101) - 50 + Math.floor(next() * 16) / 16,
  }));
  return describe(points);
}

export function describe(points) {
  if (points.length === 0) throw new Error("Empty fixtures are not a rendering workload");
  let min = Infinity;
  let max = -Infinity;
  let hash = 2166136261;
  const bytes = new DataView(new ArrayBuffer(8));
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new Error("Fixture coordinates must be finite");
    }
    if (index && point.x <= points[index - 1].x) throw new Error("X must be strictly sorted");
    min = Math.min(min, point.y);
    max = Math.max(max, point.y);
    for (const value of [point.x, point.y]) {
      bytes.setFloat64(0, value, true);
      for (let byte = 0; byte < 8; byte += 1) {
        hash = Math.imul(hash ^ bytes.getUint8(byte), 16777619) >>> 0;
      }
    }
  }
  return {
    points,
    xDomain: [points[0].x, points.at(-1).x],
    yDomain: [min, max],
    checksum: hash.toString(16).padStart(8, "0"),
  };
}

export function assertPoints(actual, expected) {
  if (actual.length !== expected.length) throw new Error("Provider dropped or added points");
  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index].x !== expected[index].x || actual[index].y !== expected[index].y) {
      throw new Error(`Provider data mismatch at point ${index}`);
    }
  }
}

export function quantile(values, fraction) {
  if (!values.length || values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Timings must be a nonempty array of finite nonnegative values");
  }
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) {
    throw new Error("Invalid quantile");
  }
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  return sorted[lower] + (sorted[Math.ceil(position)] - sorted[lower]) * (position - lower);
}

export function summarize(samples) {
  return {
    count: samples.length,
    median: quantile(samples, 0.5),
    p95: quantile(samples, 0.95),
    min: quantile(samples, 0),
    max: quantile(samples, 1),
  };
}

export function order(round) {
  const offset = round % PROVIDERS.length;
  return [...PROVIDERS.slice(offset), ...PROVIDERS.slice(0, offset)];
}

export function key(row) {
  return `${row.kind}/${row.size}/${row.provider}/${row.phase}`;
}

export function aggregate(report) {
  const groups = new Map();
  for (const row of report.samples) {
    const id = key(row);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(row);
  }
  return [...groups.entries()].map(([id, rows]) => {
    const { kind, size, provider, phase } = rows[0];
    return {
      id,
      kind,
      size,
      provider,
      phase,
      apiMs: summarize(rows.map((row) => row.apiMs)),
      firstFrameMs: summarize(rows.map((row) => row.firstFrameMs)),
      settledMs: summarize(rows.map((row) => row.settledMs)),
      prepareMs: summarize(rows.map((row) => row.prepareMs)),
      interactionMs: rows.every((row) => row.interactionMs === null)
        ? null
        : summarize(rows.map((row) => row.interactionMs)),
    };
  });
}

// Fail closed: a faster partial matrix, skipped provider, duplicate trial, or
// missing update must never become a successful comparison.
export function assertComplete(report) {
  if (report.schema !== SCHEMA || report.status !== "complete" || report.failures.length)
    throw new Error("Invalid or failed run");
  integer(report.config.repeats, "repeats", 1, 100);
  const expected = new Map();
  for (const kind of KINDS)
    for (const size of report.config.sizes) {
      integer(size, "size", 8);
      const initial = fixture(size, report.config.seed);
      const replacement = fixture(size, report.config.seed, 1);
      const windowed = describe(
        replacement.points.slice(Math.floor(size / 4), Math.floor(size / 2)),
      );
      for (const provider of PROVIDERS)
        for (const phase of phasesForKind(kind, size)) {
          const data =
            phase === "mount" || phase === "select"
              ? initial
              : phase === "replace"
                ? replacement
                : windowed;
          for (let trial = 0; trial < report.config.repeats; trial += 1) {
            expected.set(`${key({ kind, size, provider, phase })}/${trial}`, {
              pointCount: phase === "destroy" ? 0 : data.points.length,
              checksum: data.checksum,
              interactionIndex: phase === "select" ? interactionTarget(initial) : null,
            });
          }
        }
    }
  if (!expected.size) throw new Error("Empty matrix");
  for (const row of report.samples) {
    const id = `${key(row)}/${row.trial}`;
    const contract = expected.get(id);
    if (!expected.delete(id)) throw new Error(`Unexpected or duplicate sample: ${id}`);
    for (const field of ["apiMs", "firstFrameMs", "settledMs", "prepareMs"])
      quantile([row[field]], 0.5);
    if (row.apiMs > row.firstFrameMs || row.firstFrameMs > row.settledMs) {
      throw new Error(`Invalid timing boundaries: ${id}`);
    }
    if (isInteractionPhase(row.phase)) {
      quantile([row.interactionMs], 0.5);
      if (row.interactionMs > row.apiMs) {
        throw new Error(`Interaction callback escaped synchronous dispatch: ${id}`);
      }
      if (row.interactionCount !== 1 || row.interactionIndex !== contract.interactionIndex) {
        throw new Error(`Wrong interaction callback: ${id}`);
      }
    } else if (
      row.interactionMs !== null ||
      row.interactionCount !== 0 ||
      row.interactionIndex !== null
    ) {
      throw new Error(`Unexpected interaction evidence: ${id}`);
    }
    if (!row.checked) throw new Error(`Unchecked sample: ${id}`);
    if (row.pointCount !== contract.pointCount || row.checksum !== contract.checksum) {
      throw new Error(`Wrong fixture or point count: ${id}`);
    }
    if (row.phase === "destroy" && row.domNodes !== 0) throw new Error(`Leaked DOM: ${id}`);
    if (row.provider === "charts-svg" && row.phase !== "destroy") {
      const budget = row.kind === "sparkline" ? 32 : 2 * row.pointCount + 12;
      if (!Number.isInteger(row.domNodes) || row.domNodes > budget || row.domNodes < 1)
        throw new Error(`SVG DOM work budget exceeded: ${id}`);
    }
  }
  if (expected.size) throw new Error(`Missing ${expected.size} samples`);
}

export function compare(baseline, current, percent = 15) {
  assertComplete(baseline);
  assertComplete(current);
  if (!Number.isFinite(percent) || percent < 0) throw new Error("Invalid regression threshold");
  if (baseline.config.repeats < 5 || current.config.repeats < 5) {
    throw new Error("Comparison requires at least five measured trials (not smoke evidence)");
  }
  for (const field of ["environment", "protocol"]) {
    if (JSON.stringify(baseline[field]) !== JSON.stringify(current[field])) {
      throw new Error(`Incompatible ${field}; remeasure on the same runner and protocol`);
    }
  }
  if (JSON.stringify(baseline.config) !== JSON.stringify(current.config)) {
    throw new Error("Incompatible scenario configuration");
  }
  const before = new Map(aggregate(baseline).map((row) => [row.id, row]));
  return aggregate(current).flatMap((row) => {
    if (row.provider !== "charts-svg") return [];
    const metric =
      row.phase === "select"
        ? "interactionMs"
        : row.phase === "mount"
          ? "firstFrameMs"
          : "settledMs";
    const currentMetric = row[metric]?.median;
    const previousMetric = before.get(row.id)?.[metric]?.median;
    if (!Number.isFinite(currentMetric) || !Number.isFinite(previousMetric) || previousMetric <= 0) {
      throw new Error(`Missing or zero ${metric} baseline: ${row.id}`);
    }
    const changePercent = ((currentMetric - previousMetric) / previousMetric) * 100;
    return [{ id: row.id, metric, changePercent, regression: changePercent > percent }];
  });
}

# Browser comparisons with other chart providers

This suite compares the **built public React/SVG components** with pinned
**Chart.js 4.5.1** and **Apache ECharts 6.0.0** Canvas renderers. It treats
module-warm **first render** and native scatter-point **selection latency** as
first-class workloads alongside updates, viewport replacement, resize, and
cleanup. It complements `bench:large-data`; it does not replace the JS/WASM
kernel, cache, histogram, preparation-policy, or progressive-promotion
benchmarks.

## Run

From the repository root, install the existing dependencies and build the package:

```sh
bun install --frozen-lockfile
bun run build:wasm
bun run build
bunx playwright install chromium
bun run bench:providers:test
bun run bench:providers:smoke
bun run bench:providers
bun run bench:providers:full
```

The runner consumes `dist/` and builds only its production browser fixture. It
never rebuilds WASM. CI consumes the existing verified package artifact instead
of building another copy. Missing `dist/react.js` is a setup failure, not a skip.

The first browser run downloads two exact-version npm tarballs, verifies their
registry SHA-512 integrity and package identity, and extracts only their bundled
UMD scripts. There are no competitor runtime dependencies, package-manager
changes, CDN requests during a measurement, or new dependencies in `/core`.
Verified scripts are cached under `test-results/provider-vendors/`; subsequent
runs can use that cache offline. Keep the cache receipts with retained evidence.
A corrupt cache fails rather than silently downloading different code.

Default runs use 1,000 and 10,000 points; `--full` adds 100,000. Each has two
warmups and seven measured trials. Smoke uses 256 points, one warmup and one
measured trial: it is correctness evidence, **not a performance result**.

```sh
bun run bench:providers --sizes=1000,10000 --samples=21 --warmups=3 --seed=42 --out=test-results/provider-local
```

Options are validated, including duplicate sizes and invalid/empty workloads.
The initial matrix is deliberately limited to capabilities actually implemented
by this package: `ChartSampleSparkline` and `ChartScatterSvg`. It is not a claim
about every chart type, Recharts integration, a future Canvas renderer, or WASM.

## Workloads and timing boundaries

Each provider receives the same seeded, strictly sorted, finite XY values. There
is one filled-line sparkline or scatter series, a 600 by 600 CSS-pixel container,
DPR 1, fixed fixture domains, no legends or tooltips, and no animations or explicit
decimation. Scenarios retain every input point; none gets a hidden density-index
or preaggregation advantage. Native renderer path optimizations remain enabled.

A trial measures the chart's **module-warm first render**. Scatter trials then
dispatch one exact point-selection click through each provider's public/native
event path and require exactly one callback for the intended point. The trial
then replaces values, replaces the visible dataset with the middle-quarter
window, resizes to 480 by 480, and destroys the instance.

The selection measurement isolates provider hit testing and callback dispatch;
it deliberately does not include a consumer state update or re-render after the
callback. Selection runs only through 10,000 points. The harness projects the
fixture through the smallest shared plot area and chooses a point with at least
5.5 CSS pixels of separation from every neighbor. Denser fixtures remain useful
rendering workloads, but their overlapping 5-pixel marks do not have a
provider-independent hit-test answer, so reporting a selection time there would
be misleading. **Window is a shared data replacement, not native gesture/zoom
latency.** There is still no claim of hover throughput, drag/wheel zoom latency,
scrolling FPS, streaming throughput, memory leak freedom, cold bundle startup,
or mobile performance.

Fixture generation and checksums occur outside measurements. Provider-specific
conversion is measured separately. `apiMs` measures synchronous API work.
`firstFrameMs` includes that call and the next animation-frame boundary; for
the mount phase this is the primary **first-render** timing. `settledMs`
includes two animation-frame boundaries and remains a reproducible settling
proxy, **not GPU completion or FPS**. Scatter `interactionMs` measures from DOM
click dispatch to the provider selection callback; selection-target lookup is
performed before the timer starts. ECharts is non-progressive, non-lazy, and
explicitly flushed. React uses its production build and synchronous commits.
Frame-based timings have a refresh-rate floor; small differences and sub-frame
synchronous work need careful interpretation. Do not rank asynchronous
implementations solely by API submission duration.

Provider loading, compilation, browser startup, assertions, pixel reads, DOM
counts, screenshots, and interaction-target lookup are excluded from these
intervals. The first-render result is therefore **module-warm component
startup**, not cold page startup, JavaScript download/parse, or bundle-size cost.
Each provider/trial has a fresh browser context. Runs are sequential and provider
order rotates deterministically. Warmup samples are discarded; warmup failures
still fail the run. Browser contexts isolate state but do not promise identical
JIT/GC state or physical CPU isolation.

This is a comparable semantic workload, not pixel-identical styling. The owned
sparkline retains its gradient, internal margins, caption, and accessibility
markup; the owned scatter retains point titles and two axis baselines. Canvas
providers have different fill and clipping details. Only outer dimensions and
sparkline stroke width are normalized by fixture CSS. Those production costs
are not removed to manufacture a win. Screenshots make the differences visible.

## Correctness and deterministic ratchets

After each timed operation, the suite checks all SVG point coordinates or all
Chart.js model/element coordinates, as well as input counts and values. ECharts
uses its public option data plus painted-output checks; it does **not** claim an
independent per-point ECharts rasterization proof. Canvas checks require visible
blue data marks, not merely an allocated canvas. Scatter selection must invoke
exactly one callback for the deterministic target index, and must not trigger an
extra owned React render. Replacement/window operations must change rendered
output. Resize dimensions and DOM cleanup are checked.

The dependency-free Node tests prove that dropped providers, duplicate/missing
trials, failed warmups, unchecked output, wrong fixture hashes, invalid timings,
and cleanup leaks cannot pass. Owned SVG DOM budgets prevent a constant-size
sparkline from silently becoming a node-per-point tree, and bound scatter nodes
to its intended linear representation. These are hard, deterministic gates.
Screenshots are retained for visual inspection, not compared as cross-provider
pixel-equality assertions.

## Reports and optional timing regression checks

`test-results/provider-bench/report.json` retains raw samples, point counts,
checksums, DOM counts, interaction callback evidence, source commit/dirty status,
built-package digest, provider versions and byte hashes, harness and lockfile
digests, and runner/browser metadata. `report.md` shows preparation, API,
first-frame, settled, and interaction medians/p95. Screenshots cover the first
measured mount, window and resize. A partial or failed run is explicitly marked
and exits nonzero; it cannot become a successful baseline.

Retain an accepted report, make a production-code change, rebuild `dist`, then
run the same command on the same controlled machine:

```sh
bun run bench:providers:compare baseline.json test-results/provider-bench/report.json --max-regression=15
```

Comparison requires complete matrices, at least five measured trials, identical
scenario configuration, provider bytes, harness/lockfile identity and environment
metadata. It uses the metric that matches the phase: first-frame latency for
mount/first-render, event-to-callback latency for scatter selection, and settled
latency for update/window/resize/cleanup. It exits 2 for an owned-renderer
regression beyond the explicitly selected percentage. It never rewrites or
relaxes a baseline. Baseline source and `dist` digests may differ intentionally.
Matching metadata cannot guarantee identical machine load; rerun and inspect raw
samples before accepting or rejecting a speed change. CI does **not** gate on
noisy wall-clock timings by default.

In CI, deterministic harness tests run with the existing quality checks. Browser
comparisons run on main, scheduled/manual runs, or PRs explicitly labeled
`benchmark-providers`. Labeled PRs run only the smoke matrix on the next push or
reopen; adding a label alone does not rerun the other CI jobs. The existing weekly
schedule runs the full matrix. Results and screenshots are uploaded even on a
failed run; fixture/vendor diagnostics are retained only on failure.

## Add a provider or scenario

Extend `PROVIDERS`/`VENDORS`, its browser adapter and output oracle, and the
completeness tests together. Pin an exact package version; never use `latest`.
Keep the same workload semantics or introduce a separately named profile. Do
not turn unsupported operations into zero-millisecond results. Changes to
configuration or harness identity require a newly measured baseline.

Provider API references:

- Chart.js performance: <https://www.chartjs.org/docs/latest/general/performance.html>
- Chart.js updates: <https://www.chartjs.org/docs/latest/developers/updates.html>
- ECharts animations: <https://echarts.apache.org/handbook/en/how-to/animation/transition/>
- ECharts API: <https://echarts.apache.org/en/api.html>

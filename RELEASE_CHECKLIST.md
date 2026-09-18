# Release Checklist

## Every release

- `bun run verify`
- `bun run verify:release`
- `npm publish --dry-run --provenance --access public`
- Changeset present for package-facing changes.
- Public API report updated intentionally when `etc/charts.api.md` changes.
- Changelog entry explains migration steps for breaking changes.

## Performance contracts

`bun run performance:contract` is the deterministic structural gate. It verifies
allowed work rather than elapsed time: unused query capabilities must prepare no
state, repeated cached queries must not repeat underlying work, and prepared
query state must be reused across compatible precise operations. WASM wrappers
must not normalize or pack source data at construction, progressive WASM warmup
must finish kernel loading and dataset preparation before reporting ready, and a
progressive WASM index must reuse the already-existing hybrid fallback rather
than building a private duplicate. CI stores the result as JSON and Markdown
with the workload fingerprint, environment, revision, and work snapshots so
regressions remain comparable.

`bun run bench:large-data` is the separate runtime benchmark. It exercises the
stable 100k-point scenarios below and emits portable JSON evidence in CI. The
listed operations retain the existing 3,000 ms runtime budget, and the CI shell
propagates benchmark failures through the output-capture pipeline. Backend
speedup ratios remain calibration evidence for now; they are not release gates
until first-use preparation and steady-state query phases have enough repeated,
representative evidence for a stable threshold.

- `chart.100k.sorted.3metrics.hybrid-js.construct`
- `chart.100k.sorted.3metrics.hybrid-js.query.full`
- `chart.100k.sorted.3metrics.wasm-index.construct`
- `chart.100k.sorted.3metrics.wasm-index.query.full`
- `chart.100k.sorted.3metrics.progressive.query.first-render`
- `chart.100k.sorted.3metrics.progressive.warmup.wasm-index`
- `chart.100k.sorted.3metrics.progressive.query.after-warmup`

Scheduled and release CI runs may opt into the full benchmark matrix with
`CHARTS_BENCH_FULL=1`.

## `1.0` readiness

Declare `1.0` only after:

- public npm publishing has succeeded through CI
- README install instructions match the npm package
- TypeDoc is published to GitHub Pages
- the public API report is enforced in CI
- packed package runtime, type, and Vite browser consumer checks pass
- Playwright covers desktop and mobile examples
- accessibility scans pass for documented examples
- security, contribution, issue, and pull request templates are present
- changelog updates are generated through Changesets
- at least one non-prerelease public npm release has shipped
- public API names and component props have been reviewed and accepted

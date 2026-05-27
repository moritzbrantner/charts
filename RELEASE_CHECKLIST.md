# Release Checklist

## Every release

- `bun run verify`
- `bun run verify:release`
- `npm publish --dry-run --provenance --access public`
- Changeset present for package-facing changes.
- Public API report updated intentionally when `etc/charts.api.md` changes.
- Changelog entry explains migration steps for breaking changes.

## Performance budget

`bun run bench:large-data` enforces the stable 100k-point scenarios below. Each
listed operation must complete within 3,000 ms:

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

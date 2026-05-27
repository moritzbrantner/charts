# Contributing

Thanks for working on `@moritzbrantner/charts`. This package is a TypeScript
and React 19 chart helper library built with Bun.

## Local setup

```sh
bun install
bun run verify
```

Use Bun `1.3.14`, matching the `packageManager` field in `package.json`.

## Development workflow

Create a branch from `main`, keep changes focused, and open a pull request with
the test evidence that matches the change. Do not commit generated directories
such as `dist/`, `dist-examples/`, `docs/`, `coverage/`, or Playwright reports.

Useful commands:

- `bun run check-types`
- `bun run lint`
- `bun run format:check`
- `bun run test`
- `bun run test:coverage`
- `bun run api:check`
- `bun run build:examples`
- `bun run pack:check`
- `bun run test:e2e`
- `bun run verify`

Run `bun run format` before committing formatting-only fixes.

## Public API changes

The package is still pre-`1.0`. Public APIs may change, but every intentional
API change must include:

- tests for changed behavior
- an API report update from `bun run api:check`
- a changeset describing the release impact
- changelog-ready migration notes for breaking changes

Runtime API redesigns should be kept out of repository-maturity or tooling-only
pull requests.

## Releases

Releases are automated through Changesets and GitHub Actions.

1. Add a changeset with `bun run changeset`.
2. Select the correct semver impact.
3. Merge to `main`.
4. The release workflow opens a version PR or publishes changed packages.

Publishing targets public npm with provenance enabled.

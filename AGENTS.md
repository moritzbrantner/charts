# Repository agent guidance

This repository follows the applicable rules from `moritzbrantner/coding-agent-conventions`.

## Scope

- Keep chart semantics, data models, accessibility data, and renderer contracts owned by this repository.
- Do not add `viz-engine` as a dependency. Rust/WASM is an optional numeric acceleration boundary, not the chart architecture.
- Keep `src/core.ts` free of React imports. React and renderer-facing exports belong under `src/react.ts`.
- Keep router concerns outside the package. Durable view state may be encoded/decoded, but applications own URL synchronization.
- Prefer colocated focused tests for new or changed behavior; do not grow the legacy root-level aggregate test files.
- Reuse `@moritzbrantner/ui` public primitives instead of adding local UI primitives.

## Validation

Start narrow, then widen:

1. Focused Vitest for the changed module.
2. `bun run check-types`, `bun run lint`, and `bun run format:check`.
3. `bun run test`.
4. `bun run build` and `bun run pack:check`.
5. Only when Rust/WASM source changes, run `bun run build:wasm` to refresh the committed kernel, then `bun run wasm:check`; ordinary TypeScript/React work should not pay the WASM rebuild cost.
6. Use `bun run verify` for the broad repository gate.

Publication and version bumps are release work, not ordinary feature development.

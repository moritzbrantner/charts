# Repository agent guidance

This repository follows the shared `coding-agent-conventions` stack.

Apply, in order of specificity:

1. Repository-local rules in this file.
2. TypeScript and React conventions from `coding-agent-conventions`.
3. Interface-design, testing, benchmarking, dependency, and repository conventions.
4. Next.js conventions only when changing a Next.js consumer/example; this package itself is framework-agnostic.

## Repository boundaries

- `src/core.ts` is the server-safe/public computation surface. It must not import React, React DOM, Recharts, browser globals, or client-only modules.
- `src/react.ts` is the explicit interactive React surface.
- Keep the root export for compatibility, but new consumers that need server/client separation should prefer `/core` and `/react`.
- `crates/charts-density-wasm` is an internal acceleration implementation, not a separately published product.
- Do not add `viz-engine` or another visualization meta-layer. Chart semantics stay in this repository.
- Prefer the JavaScript implementation as the correctness baseline. Rust/WASM optimizations must preserve the same observable contract and be justified by the repository benchmark scenarios.

## Work style

- Colocate focused tests with the smallest production scope they cover when touching existing broad tests.
- Add executable evidence for behavior changes.
- Keep durable view state controlled/serializable; routing and URL ownership stay in consuming applications.
- Reuse `@moritzbrantner/ui` primitives for application chrome rather than introducing generic local UI primitives.

---
"@moritzbrantner/charts": patch
---

Remove the unused `viz-engine` development dependency and its lockfile-only transitive packages. Keep the repository-owned WASM build compatible with current Rust output without relying on Binaryen post-processing.

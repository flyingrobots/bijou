# DX-005 — Polish Small Component and Import Ergonomics

Legend: [DX — Developer Experience](/Users/james/git/bijou/docs/legends/DX-developer-experience.md)

## Idea

Sweep up the recurring small API papercuts that make Bijou feel fussier than it needs to.

## Why

None of these issues are individually existential, but together they create friction:

- box titles needing manual padding
- imports for one conceptual feature split across too many packages
- minor public-API rough edges that make common authoring flows feel less polished than the runtime really is

These are good backlog items precisely because users keep encountering them in real app work.

## Captured feedback

From `warp-ttd` TUI development:

- `boxSurface` title padding required manual spaces
- `canvas` / `ShaderFn` / `Surface` / `BijouContext` required three imports across package boundaries for one shader function

## Likely scope

- make boxed-title padding calmer by default or easier to opt into
- review re-export strategy for frequently paired shader/canvas types
- capture any other low-risk public API polish work that falls out while fixing the above

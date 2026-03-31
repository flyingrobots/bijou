# DX-002 — Reconcile Cmd Typing With Cleanup and Effect Patterns

Legend: [DX — Developer Experience](/Users/james/git/bijou/docs/legends/DX-developer-experience.md)

## Idea

Make command typing match the cleanup-function and runtime-effect patterns Bijou actually encourages.

## Why

The current `Cmd<Msg>` typing does not line up cleanly with real usage:

- the pulse timer pattern returns a cleanup function
- the existing type expects `Promise<Msg | undefined | QUIT>`
- consumers end up casting to `any` to express documented patterns

This is both a DX problem and a runtime-model problem, because it blurs the line between commands and effects.

## Captured feedback

From `warp-ttd` TUI development:

- the pulse timer cleanup pattern required `as any`
- the types do not reflect the documented pattern

## Likely scope

- audit current `Cmd` definitions and real runtime usage
- decide whether cleanup handles, effects, and commands need clearer separation
- align public typing with the documented timer/cleanup pattern
- add tests proving the typed API supports cleanup-producing runtime work without casts

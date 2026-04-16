# DX-002 — Reconcile Cmd Typing With Cleanup and Effect Patterns

Legend: [DX — Developer Experience](../legends/DX-developer-experience.md)

## Historical note

This slice is already landed.

It originally lived as a backlog capture and was promoted into
`docs/design/` during METHOD adoption so the active backlog would stop
advertising completed work as upcoming queue. The file is lighter than
newer cycle docs for that reason.

## Why this cycle existed

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

## Outcome

This work landed and is reflected in [CHANGELOG.md](../CHANGELOG.md).

`Cmd<M>` now matches the cleanup-capable runtime patterns Bijou actually
uses, and the runtime retains and disposes cleanup results instead of
forcing those paths through fake message contracts.

## Follow-on

- [DX-003 — Rationalize Table APIs and Public Table Types](../method/graveyard/legacy-backlog/DX-003-rationalize-table-apis-and-public-table-types.md)
- [DX-004 — Smooth Surface and String Composition Seams](../method/graveyard/legacy-backlog/DX-004-smooth-surface-and-string-composition-seams.md)
- [DX-005 — Polish Small Component and Import Ergonomics](../method/graveyard/legacy-backlog/DX-005-polish-small-component-and-import-ergonomics.md)

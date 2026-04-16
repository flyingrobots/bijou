# DX-001 — Type Framed App Messages and Updates End-to-End

Legend: [DX — Developer Experience](../legends/DX-developer-experience.md)

## Historical note

This slice is already landed.

It originally lived as a backlog capture and was promoted into
`docs/design/` during METHOD adoption so the active backlog would stop
advertising completed work as upcoming queue. The file is lighter than
newer cycle docs for that reason.

## Why this cycle existed

Remove the `any` cascade around `createFramedApp()` and framed-page update flows.

## Why

Current framed-app typing forces consumers into casts and lint debt:

- `FramePage` effectively types page `msg` as `any`
- framed update results are difficult to type from the outside
- `FrameModel<Model>` exists, but the consumer-facing API does not make it easy to stay fully typed

The result is that a strongly typed app can lose its message-model precision at the shell seam.

## Captured feedback

From `warp-ttd` TUI development:

- `createFramedApp` page update typed as `(msg: any, model: Model)`
- `framedApp.update()` returns an effectively untyped tuple
- these two seams were the biggest source of lint violations

## Likely scope

- make framed-page message typing generic and public
- make framed update return types explicit and consumable
- remove or reduce the need for external `any` casts at the shell seam
- add tests proving end-to-end typed message unions survive framed app composition

## Outcome

This work landed and is reflected in [CHANGELOG.md](../CHANGELOG.md).

The public framed-shell surface now exports explicit typed message and
update result helpers, and page updates keep custom message unions typed
through the shell seam.

## Follow-on

- [DX-003 — Rationalize Table APIs and Public Table Types](../method/graveyard/legacy-backlog/DX-003-rationalize-table-apis-and-public-table-types.md)
- [DX-004 — Smooth Surface and String Composition Seams](../method/graveyard/legacy-backlog/DX-004-smooth-surface-and-string-composition-seams.md)
- [DX-005 — Polish Small Component and Import Ergonomics](../method/graveyard/legacy-backlog/DX-005-polish-small-component-and-import-ergonomics.md)

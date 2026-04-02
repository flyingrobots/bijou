# DX-001 — Type Framed App Messages and Updates End-to-End

Legend: [DX — Developer Experience](../legends/DX-developer-experience.md)

## Idea

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

---
title: DX-007 — Decompose app-frame.ts Mega-Closure
lane: retro
legend: DX
---

# DX-007 — Decompose app-frame.ts Mega-Closure

## Disposition

Completed on `release/v4.5.0`. The remaining high-value closure debt in
`app-frame.ts` is now materially decomposed: `FrameModel` and
`FramePaneScroll` live in `app-frame-types.ts`, the circular import between
`app-frame.ts` and `app-frame-types.ts` is gone, and the shell-theme/help/
settings/notification helper cluster now lives in the independently
importable `app-frame-overlays.ts` module with direct unit coverage in
`app-frame-overlays.test.ts`. This work reduced `app-frame.ts` from 3,132
lines to 2,348 while preserving the earlier module splits across render,
actions, palette, layers, and utils.

The original "under 800 lines" target was an early umbrella goal from before
those prior extractions landed. Repo truth now lives in the decomposed module
boundaries and testability, not that stale numeric threshold.

## Original Proposal

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Problem

`packages/bijou-tui/src/app-frame.ts` is 2,679 lines with 9
responsibilities, 90+ internal functions, 38 imports, and a
mega-closure that prevents unit testing any individual function.

## Evidence

- **Modularity**: routing, rendering, state, command dispatch,
  settings, notifications, help, overlays, and transitions all live
  in one file
- **Coupling**: circular import with app-frame-types.ts (FrameModel)
- **Testability**: every internal function captures closure state;
  none can be imported or tested independently
- **Growth**: each RE cycle (001-007) added more logic without
  decomposing

## Target

Decompose into focused domain modules:

1. `frame-settings.ts` — settings drawer state, focus, scroll, row
   activation, resolveSettingsLayout
2. `frame-notifications.ts` — notification center state, scroll,
   filter, resolveNotificationCenterLayout
3. `frame-help.ts` — help overlay rendering, scroll computation
4. `frame-shell-commands.ts` — shellCommandHandlers table,
   FrameShellCommand apply logic, drainShellCommandBuffer
5. Move FrameModel to app-frame-types.ts to break circular import

Each module independently importable and unit-testable with deps
injection. Target: app-frame.ts under 800 lines.

## Effort

Large — touches the highest-traffic file in the repo. Must be done
incrementally with tests at each step.

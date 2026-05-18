---
title: DX-033 Remove showcase layout sludge
legend: DX
lane: design
priority: medium
keywords:
  - examples
  - layout
  - scrolling
  - strings
  - debt
---

# DX-033 Remove showcase layout sludge

## Framing

The old component showcase predates DOGFOOD's `ComponentStory` substrate and
the v6 storybook workstation. It remains useful as a compact tri-mode example,
but it should not keep carrying hand-rolled layout and typing debt now that the
primary docs lane has moved elsewhere.

This cycle removes the concrete sludge called out in the v6 bad-code note:
`StartAppOptions` no longer defaults to `any`, the showcase sidebar no longer
does local scroll slicing in the view renderer, and the welcome panel drops its
`width - 4` sizing shortcut. The full registry rewrite is intentionally not in
scope; DOGFOOD and the storybook workstation are now the canonical teaching
surfaces for new work.

## Sponsored Users

- Builders copying examples who should not inherit `any` defaults or bespoke
  list clipping.
- Maintainers keeping the legacy showcase aligned with shared TUI primitives.
- Agents auditing v6 layout work and checking that old examples no longer
  contradict the runtime layout direction.

## Hills

1. A builder reading `startApp()` types sees `unknown` as the default message
   payload instead of silent `any`.
2. A maintainer reading the showcase sidebar sees `browsableListSurface()` own
   the visible row window and scrollbar.
3. A release reviewer can verify the remaining showcase role is secondary to
   DOGFOOD/storybook instead of a second canonical docs product.

## Playback Questions

- Does `StartAppOptions` default to `unknown`?
- Does the showcase sidebar render through the shared browsable-list surface?
- Is manual `items.slice(scrollY, scrollY + visibleCount)` gone from the app
  view renderer?
- Is the welcome panel no longer using the hardcoded `width - 4` shortcut?
- Do docs explain that DOGFOOD/storybook are the primary teaching lane?
- Does the v6 lane point at the closed design cycle?

## Requirements

- Change `StartAppOptions<M = any>` to `StartAppOptions<M = unknown>`.
- Add a type-level regression for that default.
- Replace showcase sidebar local slicing/string assembly with
  `browsableListSurface()`.
- Preserve standalone tier marking in the sidebar.
- Move the backlog note into `docs/design/`.
- Update the v6 lane and DX legend.

## Acceptance Criteria

- `tests/cycles/DX-033/remove-showcase-layout-sludge.test.ts` proves the cycle
  doc carries the modern playback sections.
- The test verifies the `StartAppOptions` default and type-level regression.
- The test verifies showcase sidebar rendering uses `browsableListSurface()`.
- The test verifies the old local slice expression is gone.
- The test verifies the showcase docs point readers to DOGFOOD/storybook for
  primary docs work.

## Implementation Outline

1. Tighten `StartAppOptions` to default its message type to `unknown`.
2. Add the `expectTypeOf` regression in `packages/bijou-node/src/index.test.ts`.
3. Render the showcase sidebar through `browsableListSurface()` with the
   existing tier marker preserved.
4. Update showcase and legend docs to reflect the secondary showcase posture.
5. Move the backlog item into `docs/design/` and update v6 pointers.

## Drift Check

The old registry still contains string-first examples. That is acceptable for
this cycle because the showcase is now a secondary example surface and many
entries intentionally demonstrate string-returning core components.

The key fix is ownership: scroll clipping moves back to the shared list/viewport
primitive, and the primary story/doc tooling now lives in DOGFOOD and
`npm run storybook` / `npm run storybook:index`.

## Playback

- RED: DX-033 existed only as a v6 backlog note, `StartAppOptions` defaulted to
  `any`, and the showcase sidebar locally sliced visible rows.
- GREEN: `StartAppOptions` defaults to `unknown` and has a type-level test.
- The showcase sidebar renders through `browsableListSurface()` with a scrollbar
  instead of local slice/count footer logic.
- The welcome panel sizing no longer subtracts four cells by hand.
- The showcase README documents its legacy/secondary role relative to DOGFOOD
  and the text-first storybook workstation.

## Retrospective

This closes the debt without pretending the legacy showcase should become the
new story platform. The right direction is to keep old examples honest while
new tooling composes around DOGFOOD stories and shared layout primitives.

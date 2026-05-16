---
title: DF-064 Audit keybinding help and shell hints family across real surfaces
legend: DF
lane: design
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - help
---

# DF-064 Audit keybinding help and shell hints family across real surfaces

## Framing

Keybinding help is shell infrastructure, not decorative footer copy. The
family starts with `createKeyMap()` as structured shortcut truth, then lowers
that truth through full grouped references (`helpView()` /
`helpViewSurface()`), compact shell hints (`helpShort()` /
`helpShortSurface()`), and filtered views (`helpFor()` / `helpForSurface()`).

This audit verifies the existing DOGFOOD `help-view` story against real story
rendering, component-family doctrine, and mode-aware lowerings. It does not
redesign keymaps; it turns the current help and hint contract into executable
release proof.

## Sponsored Users

- TUI app authors building keyboard-owned shells that need shortcut discovery
  without turning the command palette into a help page.
- Docs readers checking how compact hints and grouped help survive without
  borders, color, or rich surface chrome.
- Maintainers who need one focused regression tying help story metadata,
  variants, and component-family guidance to real output.

## Hills

1. A builder can inspect DOGFOOD and understand when to show a compact shell
   hint versus a grouped shortcut reference.
2. A reader can switch both help variants through interactive, static, pipe,
   and accessible profiles while preserving shortcut grouping and action
   labels.
3. A maintainer can run one cycle test that proves help and shell-hint story
   metadata and design-system guidance have not drifted away from runtime
   behavior.

## Playback Questions

- Does DOGFOOD expose the family through the `help-view` story?
- Do variants cover both compact shell hints and grouped shortcut reference?
- Do rich/static previews keep structured surface rendering on the Surface
  path?
- Do pipe lowerings keep shortcut summaries and grouped help blocks readable
  without box chrome?
- Do accessible lowerings preserve group names, shortcut keys, action labels,
  and shell scope in reading order?
- Do component-family docs still separate help discovery from command
  execution and status/event messaging?

## Requirements

- Keep the existing `help-view` story identity and
  `keybinding-help-and-shell-hints` coverage family id.
- Render every help story variant in every canonical story profile.
- Treat box drawing as visual-profile chrome only.
- Keep pipe and accessible lowerings shortcut-label-first and
  semantic-preserving.
- Confirm `docs/design-system/component-families.md` still matches the runtime
  story posture.

## Acceptance Criteria

- `tests/cycles/DF-064/keybinding-help-family-audit.test.ts` proves the cycle
  doc carries the modern playback sections.
- The test locates the DOGFOOD `helpView() / helpShortSurface()` story and
  verifies expected variants.
- Every variant renders non-empty output in every documented profile.
- Rich/static output includes structured visual containment; pipe and
  accessible output do not depend on box drawing.
- Pipe and accessible output preserve compact shell hints, grouped help title,
  group names, shortcut keys, and action labels.
- Component-family docs retain `createKeyMap()`, help view, short hint,
  filtered help, shell-scope, pipe, and accessible guidance.

## Implementation Outline

1. Add a DF-064 cycle test that renders the `help-view` DOGFOOD story through
   the shared story protocol.
2. Read-test the keybinding help and shell hints section in
   `docs/design-system/component-families.md`.
3. Move the backlog note into `docs/design/` and update the v6 lane pointer.
4. Record any drift as follow-on backlog debt instead of widening this audit.

## Drift Check

No runtime drift was found in this slice. The existing `help-view` story
already distinguishes compact shell hints from grouped shortcut reference,
renders structured surfaces in interactive/static profiles, and lowers to
plain shortcut summaries plus grouped help text in pipe/accessibility modes.

No follow-on backlog item is needed for this slice.

## Playback

- RED: the release lane had only a backlog note; no DF-064 playback test tied
  keybinding help to every canonical profile.
- GREEN: the new cycle test renders both `shell-hint` and
  `grouped-reference` variants across interactive, static, pipe, and
  accessible profiles.
- Rich/static previews preserve structured visual containment and shortcut
  rhythm.
- Pipe previews preserve shortcut summaries and grouped help blocks without
  box drawing.
- Accessible previews linearize the same shortcut groups and action labels in
  reading order.

## Retrospective

The keybinding help family did not need runtime changes. The useful release
work was proving that shortcut discovery is structured shell truth, so future
blocks can reuse keymaps without rebuilding help text by hand.

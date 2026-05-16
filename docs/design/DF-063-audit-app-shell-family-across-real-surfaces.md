---
title: DF-063 Audit app shell family across real surfaces
legend: DF
lane: design
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - shell
---

# DF-063 Audit app shell family across real surfaces

## Framing

The app shell is the place where page content, global status, command
discovery, overlays, and shell-owned chrome meet. `createFramedApp()` owns the
high-level shell, while `statusBar()` / `statusBarSurface()` and
`commandPalette()` / `commandPaletteSurface()` are the smaller seams that make
shell state visible without pushing unrelated metadata into page content.

This audit verifies the existing DOGFOOD `app-shell` story against real story
rendering, component-family doctrine, and mode-aware lowerings. It does not
redesign the framed runtime; it turns current shell story truth into
executable release proof.

## Sponsored Users

- TUI app authors building multi-page framed applications with global status
  and command discovery.
- Docs readers checking how a rich shell lowers when command palettes, status
  rails, and background interactivity are unavailable.
- Maintainers who need one focused regression tying app-shell story metadata,
  variants, and component-family guidance to real output.

## Hills

1. A builder can inspect DOGFOOD and see the difference between framed page
   chrome and command-discovery overlay behavior.
2. A reader can switch both app-shell variants through interactive, static,
   pipe, and accessible profiles while preserving current page, status, and
   command-discovery facts.
3. A maintainer can run one cycle test that proves shell story metadata and
   design-system guidance have not drifted away from runtime behavior.

## Playback Questions

- Does DOGFOOD expose the family through the `app-shell` story?
- Do variants cover both framed-page status chrome and command-discovery
  overlay behavior?
- Do rich/static previews keep header, footer, page content, and palette
  geometry visible?
- Do pipe lowerings preserve minimal shell context without pretending hidden
  regions are still interactive?
- Do accessible lowerings linearize page, status, and command-discovery facts
  in reading order?
- Do component-family docs still separate shell chrome from page content,
  notification events, and command execution?

## Requirements

- Keep the existing `app-shell` story identity and `app-shell` coverage family
  id.
- Render every app-shell story variant in every canonical story profile.
- Treat box drawing and status-rail fill characters as visual-profile chrome
  only.
- Keep pipe and accessible lowerings shell-context-first and
  semantic-preserving.
- Confirm `docs/design-system/component-families.md` still matches the runtime
  story posture.

## Acceptance Criteria

- `tests/cycles/DF-063/app-shell-family-audit.test.ts` proves the cycle doc
  carries the modern playback sections.
- The test locates the DOGFOOD
  `createFramedApp() / statusBarSurface() / commandPaletteSurface()` story and
  verifies expected variants.
- Every variant renders non-empty output in every documented profile.
- Rich/static output includes structured visual containment; pipe and
  accessible output do not depend on box drawing.
- Pipe and accessible output preserve shell title, current page, status, and
  command palette intent.
- Component-family docs retain framed app, status bar, command palette,
  shell-state, pipe, and accessible guidance.

## Implementation Outline

1. Add a DF-063 cycle test that renders the `app-shell` DOGFOOD story through
   the shared story protocol.
2. Read-test the app shell section in
   `docs/design-system/component-families.md`.
3. Move the backlog note into `docs/design/` and update the v6 lane pointer.
4. Record any drift as follow-on backlog debt instead of widening this audit.

## Drift Check

No runtime drift was found in this slice. The existing `app-shell` story
already distinguishes framed page chrome from command discovery, renders
structured shell surfaces in interactive/static profiles, and lowers to
minimal page/status/palette summaries in pipe/accessibility modes.

No follow-on backlog item is needed for this slice.

## Playback

- RED: the release lane had only a backlog note; no DF-063 playback test tied
  app shell behavior to every canonical profile.
- GREEN: the new cycle test renders both `framed-page` and
  `command-discovery` variants across interactive, static, pipe, and
  accessible profiles.
- Rich/static previews preserve header, footer, page, and command-palette
  geometry.
- Pipe previews preserve current page and shell status without box drawing.
- Accessible previews linearize the same shell facts in reading order.

## Retrospective

The app-shell story did not need runtime changes. The useful release work was
proving that shell chrome is shared application truth, not incidental drawing
inside a page renderer.

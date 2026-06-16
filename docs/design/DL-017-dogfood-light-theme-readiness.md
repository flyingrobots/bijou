---
id: DL-017
title: DOGFOOD Light Theme Readiness
status: active
lane: asap
priority: medium
github_issue: 341
legend: DL
---

# DL-017 - DOGFOOD Light Theme Readiness

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Decision Summary

DOGFOOD's `dogfood:light` shell theme should be safe to demonstrate in a real
terminal without relying on the terminal profile's default background or lucky
contrast. For `v7.2.0`, the bounded repair is:

- framed settings, menu, and modal chrome paints explicit light-theme
  backgrounds
- borders, panel fills, muted copy, selection rows, and action labels remain
  visually distinct in the Bijou light palette
- the theme doctor covers the chrome-safe pairs that failed the release-video
  rehearsal by sight
- deterministic tests prove both token-level contrast and rendered shell
  background ownership

## Sponsored Human

A release-video user needs to switch DOGFOOD into light mode and have the app
look deliberate on camera. Settings and quit chrome should not show dark
terminal patches, washed-out borders, or action labels that are hard to find.

## Sponsored Agent

An agent needs a deterministic witness for light-theme chrome. It should be
able to render the DOGFOOD shell in `dogfood:light`, inspect actual `Surface`
cell metadata, and fail if settings or modal chrome leaves meaningful cells
without a theme-owned background.

## Hill

After this cycle, `dogfood:light` is release-demo-ready for the current V7
surface: the theme paints its shell chrome, passes explicit chrome contrast
diagnostics, and has enough focused proof to keep terminal-default background
leaks from silently returning.

## Problem

Issue #341 came from the `v7.1.0` release-video rehearsal. The light theme
looked unfinished around settings and modal chrome: some border/background
regions appeared to inherit the terminal's unstyled background, and several
low-contrast token pairs made panels, muted text, and selected rows difficult
to read.

The dark DOGFOOD theme mostly hides this class of problem because terminal
profiles are commonly dark. The light theme needs explicit proof because a
terminal-default background leak can look acceptable on one profile and broken
on another.

## Scope

- Add a focused rendered witness for DOGFOOD light-theme settings/menu/modal
  chrome.
- Fix any shell-rendering path that fails to paint theme-owned backgrounds for
  the witness.
- Retune the Bijou light palette only where the current tokens make borders,
  panels, muted text, selection rows, or modal actions unclear.
- Expand DOGFOOD theme safe-pair diagnostics so light-theme chrome tokens are
  checked by `doctorTheme()`.
- Update release-facing docs/changelog so `v7.2.0` records the light-theme
  demo-readiness repair honestly.

## Non-Goals

- Do not solve #343's full first-party dark/light variant coverage.
- Do not redesign Theme Lab or Theme Inspector.
- Do not add a global dark/light hotkey in this cycle.
- Do not redesign DOGFOOD's layout, typography, or theme family model.
- Do not turn `v7.2.0` into a broad design-system feature train.

## User Experience Contract

The light theme may be calmer than the dark theme, but it cannot be ambiguous.
The user should be able to distinguish the app background, panels, borders,
muted text, selected rows, scrollbars, and modal actions without changing their
terminal profile.

Settings, command-palette menu, and modal surfaces must paint their own
backgrounds. Empty frame chrome inside those surfaces should not be transparent
unless the transparency is a deliberate tokenized overlay with a deterministic
fallback.

## Lower Modes

### Static Mode

Static rendered proof should expose actual `Surface` cells and token-derived
foreground/background choices so tests can inspect theme ownership without
parsing screenshots.

### Pipe Mode

Pipe output remains text-first and does not need to encode color proof. The
color-specific proof belongs in rendered `Surface` tests and theme diagnostics.

### Accessible Mode

No new accessibility contract is introduced. Any action labels or status text
made easier to see through color should remain textual, not color-only.

## Localization / Directionality Posture

This cycle does not add new localization or bidirectional-layout behavior. The
theme repair must preserve the selected-locale text path, existing
English-source documentation notices, and current left-to-right DOGFOOD chrome
geometry.

The rendered witnesses should avoid making assertions about translated copy
beyond stable shell titles such as settings, command palette, and quit chrome.
If a future right-to-left shell layout changes modal or drawer geometry, it
should still inherit the same token-owned background contract.

## Agent Inspectability / Explainability Posture

Agents should be able to inspect the repair without screenshots. The important
facts are:

- which concrete DOGFOOD shell theme is active
- which shell surface is open: settings drawer, command-palette menu, or quit
  modal
- whether visible chrome border cells have explicit foreground and background
  metadata
- which safe-pair token declarations cover the chrome colors
- whether `doctorTheme()` reports any low-contrast chrome pairs for DOGFOOD
  dark or light modes

The proof should stay in `Surface` metadata and theme-doctor reports so future
agents can reason about background ownership deterministically.

## Theme Diagnostics

The existing DOGFOOD safe-pair matrix should grow beyond primary text/status
pairs to cover the light chrome pairs that matter for this bug:

- border tokens against primary, secondary, elevated, overlay, and muted
  surfaces
- muted text against the same surfaces used by settings and modal panels
- selection/focus gutter foregrounds and backgrounds
- scroll thumb and scroll track visibility
- modal action/status foregrounds against overlay and elevated surfaces

The diagnostic is intentionally token-level. Rendered tests prove that chrome
uses those tokens; the doctor proves that the token pairs remain readable.

## Linked Invariants

- DOGFOOD light mode should not depend on terminal-profile background color.
- Theme diagnostics should cover app chrome, not just body copy.
- Light-theme repairs must stay compatible with existing dark theme behavior.
- `v7.2.0` remains a narrow stabilization release.

## Implementation Plan

1. Add focused failing tests that render DOGFOOD `dogfood:light` settings
   drawer, command-palette menu, and quit modal chrome and find unpainted cells
   in each chrome rectangle.
2. Add a focused failing diagnostic test for missing DOGFOOD chrome safe pairs.
3. Fix the shell/component path that leaves backgrounds unset, or retune tokens
   if the renderer already paints but the selected color pair is too weak.
4. Expand the DOGFOOD safe-pair matrix to cover chrome-relevant light-theme
   pairs.
5. Run focused rendered tests, theme doctor tests, the DOGFOOD terminal capture
   smoke path, `npm run typecheck:test`, `npm run lint`,
   `npm run docs:inventory`, `git diff --check`, and the relevant broader
   suite before review.

## Tests To Write First

- DOGFOOD light-theme settings drawer, command-palette menu, and quit modal
  renders fail when visible chrome cells inside their overlay rectangles have
  no background metadata.
- `doctorTheme(DOGFOOD_LIGHT_THEME, { contrastPairs:
  DOGFOOD_THEME_SAFE_PAIRS })` fails if chrome pairs are omitted or fall below
  the selected contrast floor.
- Existing dark-theme DOGFOOD shell tests continue to pass.

## Acceptance Criteria

- Deterministic light-theme chrome witnesses exist for settings drawer,
  command-palette menu, and quit modal rendering.
- Any unpainted background path found by the witness is fixed.
- Bijou light theme border, panel, muted text, selection, and modal action
  tokens are readable enough for the DOGFOOD release-video path.
- DOGFOOD theme diagnostics cover the relevant chrome safe pairs.
- The DOGFOOD terminal capture smoke path is run as release-video-path
  evidence.
- `docs/CHANGELOG.md` records the demo-readiness fix.
- Issue #341 is closed by the implementation PR.

## Retrospective

To be completed when the PR lands.

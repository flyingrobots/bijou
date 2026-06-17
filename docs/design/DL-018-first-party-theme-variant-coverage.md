---
id: DL-018
title: First-Party Theme Variant Coverage
status: active
lane: asap
priority: medium
github_issue: 343
legend: DL
---

# DL-018 - First-Party Theme Variant Coverage

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Decision Summary

DOGFOOD now has a real AppShell theme-mode toggle, but the theme list still
mixes one paired shell family with several landing-art shell presets that do
not have light/dark siblings. For `v7.2.0`, the bounded repair is:

- inventory every first-party DOGFOOD shell theme as paired or single-mode
  through deterministic shell-spec coverage
- keep `DOGFOOD / Dark` and `DOGFOOD / Light` as the paired release-demo path
- classify landing-art shell presets as explicit single-mode choices instead of
  implying that they support a dark/light toggle
- make unsupported theme-mode toggles visible through shell feedback
- prove dark-to-light and light-to-dark toggles deterministically

This cycle is about honest mode coverage, not a broad Theme Lab or palette
redesign.

## Sponsored Human

A DOGFOOD user wants to switch between dark and light modes during a demo and
understand why some gallery themes do not toggle. Pressing the inherited
AppShell shortcut should either switch the active paired theme or clearly say
that the selected theme has no alternate mode.

## Sponsored Agent

An agent needs machine-readable evidence for first-party theme coverage. It
should be able to inspect the DOGFOOD shell theme list, classify each choice,
and assert that unsupported mode switches do not silently no-op.

## Hill

After this cycle, DOGFOOD's theme path tells the truth: paired themes have
dark/light behavior, single-mode themes are classified as single-mode in
deterministic shell-spec coverage, and the AppShell mode toggle gives
deterministic feedback in both supported and unsupported paths.

## Problem

Issue #343 came from the `v7.1.0` release-video rehearsal. DOGFOOD exposed
theme and mode concepts, then listed several first-party themes without a
coherent mode story. That made `Ctrl+T` look unreliable: it works for the
mode-aware DOGFOOD family, but single concrete themes cannot toggle and the
user receives no explanation.

The current implementation already has an AppShell-level `Ctrl+T` command for
mode-aware shell theme families. The gap is coverage and honesty around the
full DOGFOOD theme inventory.

## Scope

- Add first-party shell theme coverage that distinguishes paired families from
  single-mode concrete themes.
- Do not touch the DOGFOOD app rendering file for visible Theme Lab inventory
  until its existing raw-string debt is cleaned under the touched-file
  localization policy.
- Keep the DOGFOOD family as the paired first-party dark/light shell path.
- Keep landing-art shell presets single-mode unless a real light/dark pair is
  intentionally designed for a given preset.
- Make `Ctrl+T` on a single-mode theme publish an explicit shell notification
  instead of silently doing nothing.
- Add deterministic AppShell tests for supported dark-to-light and
  light-to-dark switching and for unsupported single-mode feedback.
- Add DOGFOOD tests that prove the shell-spec inventory lists paired and
  single-mode coverage.

## Non-Goals

- Do not redesign Theme Lab or Theme Inspector.
- Do not create speculative light variants for landing-art palettes.
- Do not change the release-title/landing-art rendering palette.
- Do not add a global theme registry outside the existing AppShell shellThemes
  contract.
- Do not move Theme Lab provenance, pointer inspection, or full operator
  surfaces out of the `v9.0.0` horizon.

## User Experience Contract

`Ctrl+T` is inherited by apps that expose mode-aware shell themes. When the
active shell choice belongs to a family with multiple modes, `Ctrl+T` switches
to a sibling mode and posts the existing "Shell theme set to ..." feedback.

When the active shell choice is a concrete single-mode theme, `Ctrl+T` posts a
short settings notification that names the active theme and says it has no
alternate mode. The active theme remains unchanged.

The shell spec and settings surfaces must prove:

- the active default dark and light presets
- a shell inventory where each first-party choice is classified as `paired` or
  `single-mode`
- enough concrete labels that users can tell which entries respond to
  `Ctrl+T`

## Lower Modes

### Static Mode

Static tests should assert the same inventory classification from shell specs
without requiring screenshot or ANSI scraping.

### Pipe Mode

No new pipe contract is introduced. The shell theme inventory is diagnostic
copy, not an exported data format.

### Accessible Mode

Mode support must be textual. The user should not need color, swatches, or
visual grouping alone to understand whether a theme supports the mode toggle.

## Localization / Directionality Posture

New user-facing strings should use the existing DOGFOOD or AppShell i18n ports.
The tests may assert English source copy, but the source strings must be
catalog-discoverable so the localization gates can track them.

Directionality is unchanged. Future visible inventory copy should flow through
the current shell layout after the touched DOGFOOD app file is localization
clean.

## Agent Inspectability / Explainability Posture

Agents should be able to inspect:

- raw DOGFOOD shell theme specs and their mode support
- resolved AppShell theme choices and their `modeId` facts
- shell-spec classification for paired and single-mode choices
- runtime notifications after supported and unsupported `Ctrl+T` paths

The proof should not require screenshots or terminal color sampling.

## Linked Invariants

- Visible controls are a promise: a mode toggle must either work or explain why
  it cannot.
- Docs are the demo: once the DOGFOOD app rendering file is localization-clean,
  Theme Lab should explain the actual first-party theme inventory users can
  select.
- Shell owns shell concerns: mode switching remains AppShell behavior inherited
  by DOGFOOD and other apps through `createFramedApp`.
- Tests are the spec: paired and unsupported paths need deterministic coverage.

## Implementation Plan

1. Add first-party shell theme support coverage for tests.
2. Keep visible Theme Lab inventory out of this cycle until the touched DOGFOOD
   app file is localization-clean.
3. Add AppShell feedback for unsupported mode toggles on single-mode concrete
   themes.
4. Add tests that fail before the implementation:
   - DOGFOOD shell specs list `DOGFOOD` as paired dark/light.
   - DOGFOOD shell specs list landing-art shell presets as single-mode.
   - AppShell toggles paired themes dark -> light -> dark.
   - AppShell `Ctrl+T` on a single-mode theme leaves the id unchanged and posts
     explicit feedback.
5. Update `docs/CHANGELOG.md`, run focused tests, `npm run typecheck:test`,
   `npm run lint`, `npm run docs:inventory`, and `git diff --check`.

## Tests To Write First

- `tests/cycles/DL-018/first-party-theme-variant-coverage.test.ts` for DOGFOOD
  shell inventory.
- `packages/bijou-tui/src/app-frame.test.ts` coverage for supported
  dark-to-light and light-to-dark `Ctrl+T` switching.
- `packages/bijou-tui/src/app-frame.test.ts` coverage for unsupported
  single-mode `Ctrl+T` feedback.

## Acceptance Criteria

- Every DOGFOOD first-party shell theme is classified as paired or single-mode.
- DOGFOOD shell-spec coverage proves the first-party theme inventory with
  mode-support labels.
- `Ctrl+T` toggles the paired DOGFOOD family in both directions.
- `Ctrl+T` on a single-mode theme posts explicit feedback instead of silently
  doing nothing.
- Deterministic coverage proves at least one dark-to-light and one
  light-to-dark switch path.
- `docs/CHANGELOG.md` records the theme variant coverage repair.
- Issue #343 is closed by the implementation PR.

## Retrospective

To be completed when the PR lands.

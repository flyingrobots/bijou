---
id: DL-021
title: Dogfood Theme Token Usage Proof
status: active
lane: asap
priority: high
github_issue: 448
legend: DL
---

# DL-021 - Dogfood Theme Token Usage Proof

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Decision Summary

DL-019 and DL-020 made theme rule provenance real, but DOGFOOD still has to
make that truth visible. The Theme Inspector must not look like an unthemed
debug drawer that merely lists colors. It should prove which active theme
tokens are powering the docs shell and keep its own chrome readable in light
and dark shells.

The runtime truth remains the existing DOGFOOD docs shell:

```text
active docs shell theme
  -> docs visual theme
    -> docs chrome tokens
      -> terminal cells and Theme Inspector usage proof
```

No external design-token integration is added. This is a narrow DOGFOOD usage
pass over the inspector and its immediate theme proof surface.

## Sponsored Human

A DOGFOOD reader comparing dark and light themes wants to see the active theme
affect the app they are looking at, not just a detached list of hex values.

## Sponsored Agent

An agent auditing theme behavior wants deterministic rendered evidence that the
inspector chrome, summary copy, usage rows, palette labels, and scroll chrome
all come from active DOGFOOD theme tokens.

## Hill

The Theme Inspector renders readable themed chrome in DOGFOOD dark and light
shells, shows a live usage proof for DOGFOOD docs surfaces, and keeps the full
palette as reference data rather than implying every reference color is already
visible in the surrounding app.

## Playback Questions

- Does the inspector border, background, title, summary, and close hint use
  active docs theme tokens instead of fallback styling?
- Does light mode preserve readable foreground/background contrast inside the
  inspector summary and usage proof?
- Can the inspector show both the active shell palette and the specific DOGFOOD
  docs tokens currently used by the app?
- Can tests fail if the inspector regresses to unstyled summary copy or loses
  the usage proof?

## Scope

Included:

- theme the Theme Inspector drawer chrome through the active docs visual theme
- add a compact DOGFOOD usage proof section before the reference palette
- style inspector summary and palette chrome with explicit theme tokens
- add focused DOGFOOD preview tests for light-mode readability and usage proof
- update changelog and localization catalogs for new visible copy

Out of scope:

- replacing the theme engine
- adding a design-book dependency
- restyling every DOGFOOD docs pane in this slice
- changing third-party theme presets
- adding element-level provenance for every rendered cell

## Runtime Contract

The usage proof is derived from the same active shell theme id that drives the
docs page. It must not maintain an independent color table. If the active shell
theme changes, the inspector summary, usage proof, reference palette labels,
drawer border, surface, and scrollbar update from that same model state.

## Localization And Directionality Posture

All new visible DOGFOOD copy is catalog-backed and participates in the existing
DOGFOOD i18n completeness, check, and debt gates.

## Tests To Write First

- a light-theme inspector regression that proves the active summary and close
  hint are styled with readable foreground/background cells
- a usage-proof regression that proves the inspector renders live DOGFOOD docs
  token rows instead of only the reference palette

## Closeout Notes

Close this cycle when local DOGFOOD preview tests, DOGFOOD i18n gates, lint,
and relevant Code Dojo checks are green, and the PR summary names the
before/after behavior from the screenshots.

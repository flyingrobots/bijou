---
title: DX-012 — Document Render-Path Naming Convention
lane: graveyard
legend: DX
---

# DX-012 — Document Render-Path Naming Convention

## Disposition

Documented the render-path naming rule explicitly in the `@flyingrobots/bijou` README and GUIDE: the base family name is the public component family, and a `*Surface()` companion means the same family on the composable surface path. The broader doctrine was already present across ADVANCED_GUIDE, migration docs, and design-system material, so this closes the remaining front-door POLA gap the note described.

## Original Proposal

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Idea

Document the implicit naming convention for string-output vs
Surface-output component variants:

- `box(content)` → string (pipe-friendly)
- `boxSurface(content)` → Surface (composable in TUI apps)
- `badge(content)` → Surface only (no string variant)
- `table(data)` → string (mixed-mode, pipe-aware)

The pattern exists but is never stated explicitly. A developer
browsing the API doesn't know why some components have a `-Surface`
variant and others don't, or why `badge()` returns a Surface
directly while `box()` returns a string.

## Why

This came up in the DX audit as a minor POLA concern. The convention
is sound (simpler output-only components are string-first; richer
interactive components are Surface-native), but it reads as
inconsistency when you're scanning exports without context.

A one-paragraph note in the bijou README's component section would
resolve the confusion.

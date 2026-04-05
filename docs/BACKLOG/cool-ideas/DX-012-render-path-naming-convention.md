# DX-012 — Document Render-Path Naming Convention

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

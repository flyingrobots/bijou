---
title: "DX-024 — Surface Diff Viewer"
legend: DX
lane: cool-ideas
---

# DX-024 — Surface Diff Viewer

A first-party debug component that visualizes differences between two surfaces side-by-side or overlaid with changed cells highlighted.

Why:
- render debugging still depends on ad hoc inspection and text dumps
- visual test failures would be easier to understand with a purpose-built diff viewer
- this would be useful in DOGFOOD, MCP docs, and regression tooling

Possible scope:
- show before/after surfaces with per-cell change highlighting
- support overlay mode and side-by-side mode
- summarize changed cell counts, style deltas, and bounds
- provide plain-text and rich render lowerings for test output

The goal is to make surface-level render truth easier to inspect.

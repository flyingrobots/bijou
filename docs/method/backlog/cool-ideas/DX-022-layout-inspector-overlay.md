---
title: "DX-022 — Layout Inspector Overlay"
legend: DX
lane: cool-ideas
---

# DX-022 — Layout Inspector Overlay

A live debug overlay for Bijou layouts that shows pane bounds, clipping, scroll regions, focus ownership, and z-layer ordering on top of the running app.

Why:
- layout and overlay issues are currently hard to inspect in situ
- mouse routing, clipping, and retained pane geometry are now important enough to justify a first-party inspector
- this would turn invisible runtime geometry into something developers can reason about directly

Possible scope:
- toggleable overlay surface in framed or raw runtime apps
- labels for pane ids, rects, clipping regions, and scroll offsets
- optional coloring for focus owner, active pane, and overlay layers
- capture path for screenshots and docs examples

This is meant as a developer tool, not production UI.

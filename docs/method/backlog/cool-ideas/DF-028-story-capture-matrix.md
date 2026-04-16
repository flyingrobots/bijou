---
title: "DF-028 — Story Capture Matrix"
legend: DF
lane: cool-ideas
---

# DF-028 — Story Capture Matrix

A first-party story capture surface that renders one story through all supported lowerings and snapshots the results together.

Why:
- Bijou components increasingly need meaningful interactive, static, pipe, and accessible lowerings
- docs, regressions, and MCP examples would benefit from one canonical multi-mode capture path
- this would directly strengthen the Storybook-style workstation idea

Possible scope:
- given one story, render interactive, static, pipe, and accessible outputs side-by-side
- export captured outputs into docs, tests, MCP payloads, or screenshots
- support baseline updates for regression fixtures
- optionally include story metadata and args with the matrix

The core idea is one source of truth for multi-lowering story output.

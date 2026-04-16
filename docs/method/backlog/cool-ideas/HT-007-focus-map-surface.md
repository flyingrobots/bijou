---
title: "HT-007 — Focus Map Surface"
legend: HT
lane: cool-ideas
---

# HT-007 — Focus Map Surface

A visible surface that renders the current focus graph, tab order, and pane ownership for a running app.

Why:
- focus behavior in complex shells and multi-pane workstations is hard to reason about from runtime output alone
- the humane terminal story is stronger when focus ownership is inspectable and explainable
- this would pair well with layout and input routing inspection tools

Possible scope:
- show current focused node, tab order, pane ownership, and focusable regions
- highlight traps, skipped nodes, or dead focus islands
- render as an overlay or a standalone diagnostic surface
- support plain-text and rich output for tests and docs

This should expose focus truth, not invent a second focus system.

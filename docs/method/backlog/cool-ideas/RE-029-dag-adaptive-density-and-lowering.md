---
title: "RE-029 — DAG Adaptive Density and Lowering"
legend: RE
lane: cool-ideas
---

# RE-029 — DAG Adaptive Density and Lowering

Teach `dag()` to choose between boxed, compact, legend-backed, and non-graph lowerings based on available width and the semantic load of the graph.

Why:
- the same DAG should not need hand-authored variants for wide TUI, narrow panes, chat logs, and accessibility modes
- current work is converging on several good render forms, but they need an explicit ladder instead of ad hoc switches
- DAGs are likely to become a first-class explanatory surface for Echo, `git-warp`, and warp-ttd, so predictable lowering behavior matters

Possible scope:
- clear thresholds for boxed nodes versus compact nodes versus compact+legend
- heuristics for when edge labels can stay in-graph versus must lower to legends or adjacency text
- truthful fallbacks to `table()`, `timeline()`, or annotated adjacency output when the graph stops being readable
- snapshot fixtures proving that lowerings preserve the same semantic story

The point is mode-aware truthfulness, not squeezing every graph into one renderer.

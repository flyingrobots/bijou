---
title: "RE-025 — DAG Path Emphasis"
legend: RE
lane: cool-ideas
---

# RE-025 — DAG Path Emphasis

Richer ways to emphasize a selected or highlighted path in `dag()` without forcing the whole graph to become visually loud.

Why:
- DAGs increasingly want to communicate one "active" route, not just topology
- current `highlightPath` token support colors a path, but the shape language could do more to make that route obvious
- this would help explain flows, selected traces, current execution paths, and important branches in both TUI and docs surfaces

Possible scope:
- stronger edge glyph families for highlighted paths such as heavy or double connectors
- stronger border treatment for nodes that belong to the emphasized path
- optional edge and node background colors in rich TUI mode
- consistent lowering rules so pipe and accessible modes still preserve the fact that one path is special
- bounded heuristics so emphasis improves legibility instead of turning dense graphs into noise

The goal is not decoration. The goal is to make one path read as meaningfully different while keeping the rest of the graph truthful.

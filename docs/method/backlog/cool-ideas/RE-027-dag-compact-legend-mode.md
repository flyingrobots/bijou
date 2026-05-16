---
title: "RE-027 — DAG Compact Legend Mode"
legend: RE
lane: cool-ideas
---

# RE-027 — DAG Compact Legend Mode

Render DAG nodes as short stable IDs in the graph and place the full labels in a legend below.

Why:
- dense graphs quickly become width-bound even when the topology itself is readable
- the boxed renderer is preferable when space allows, but narrow shells and chat-style surfaces need a truthful compact fallback
- this would let the same DAG stay legible in Echo, `git-warp`, and warp-ttd without inventing a different visualization family each time

Possible scope:
- automatic or opt-in ID assignment such as `A..Z`, `AA..AZ`
- legend rows like `A = State: Idle`
- compatibility with boxed rich mode and one-line compact node mode
- stable highlighting so a selected node in the graph also emphasizes the matching legend row
- lowerings for `pipe` and `accessible` that keep full labels instead of the compact IDs

The goal is density without lying about the graph.

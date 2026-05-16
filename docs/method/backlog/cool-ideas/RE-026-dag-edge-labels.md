---
title: "RE-026 — DAG Edge Labels"
legend: RE
lane: cool-ideas
---

# RE-026 — DAG Edge Labels

Add a first-class way to attach labels to DAG edges instead of forcing all meaning into node labels.

Why:
- many flows need to explain what a transition means, not just which node comes next
- Echo, `git-warp`, and warp-ttd style traces will often want verbs, conditions, or payload hints on the edge itself
- current `dag()` edges are only child IDs, so there is nowhere to express transition semantics today

Possible scope:
- edge objects such as `{ to, label }` or a separate `DagEdge[]` model
- label placement on long horizontal runs when there is enough space
- lowering rules for narrow, `pipe`, and `accessible` modes so labels can degrade to legends, annotations, or adjacency lines instead of overlapping geometry
- optional edge-label tokens so labels can differ from both node text and edge lines

The point is to let DAGs explain transitions honestly, not to decorate connectors with prose.

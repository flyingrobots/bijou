---
title: "RE-028 — DAG Edge Semantics and Metadata"
legend: RE
lane: cool-ideas
---

# RE-028 — DAG Edge Semantics and Metadata

Support richer edge meaning such as kind, status, weight, or optionality so DAGs can express more than plain reachability.

Why:
- many real runtime and workflow graphs need to distinguish blocking edges from advisory, async, speculative, or back-edge relationships
- this would make path emphasis and edge labels more principled because style would follow semantics instead of ad hoc decoration
- Echo, `git-warp`, and warp-ttd style traces are likely to need edge kinds such as causal, derived, replayed, or merged

Possible scope:
- edge metadata like `kind`, `status`, `weight`, `optional`, or `backEdge`
- mapping some edge kinds to stronger or alternative edge glyph families
- metadata-aware lowerings for `pipe` and `accessible` outputs
- explicit rules for when metadata changes geometry versus only presentation

The goal is to keep the DAG model semantically useful without turning it into an unbounded custom graph DSL.

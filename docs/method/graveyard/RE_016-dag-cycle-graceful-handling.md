---
title: "RE-016: DAG renderer should handle cycles gracefully"
lane: graveyard
legend: RE
---

# RE-016: DAG renderer should handle cycles gracefully

## Disposition

Rendered DAG graphs now tolerate cycles by stripping cycle-forming back-edges only for the layering pass while preserving the full original edge set in interactive and accessible output. dag() and dagLayout() no longer fail on cyclic graphs or self-loops, and focused regressions cover both paths.

## Original Proposal

## Problem

`dag()` uses Kahn's topological sort (`dag-layout.ts:22`) and throws
`[bijou] dag(): cycle detected in graph` when any cycle exists. This
makes `dag()` unusable for general directed graphs — which are common
in real-world use cases (dependency graphs with circular refs, social
graphs, WARP materialized state, etc.).

## Current behavior

`assignLayers()` line 69:
```ts
if (topoOrder.length !== nodes.length) {
  throw new Error('[bijou] dag(): cycle detected in graph');
}
```

## Proposed behavior

Two possible approaches (not mutually exclusive):

### Option A: Back-edge detection + reversal

During Kahn's sort, identify edges that create cycles (back-edges).
Temporarily reverse them to break cycles, assign layers on the resulting
DAG, then render back-edges with a distinct visual treatment (dashed
line, different arrowhead, annotation like "↺").

### Option B: SCC collapse

Find strongly connected components (Tarjan's or Kosaraju's), collapse
each SCC into a single composite node, render the condensation DAG.
Composite nodes show their member labels.

### Recommendation

Option A is simpler and preserves the full node set. Option B is
more correct topologically but loses individual node identity within
SCCs.

## Context

Discovered while using bijou-mcp `dag()` to visualize a WARP graph.
WARP materialized state is a general directed graph (social: alice →
bob → carol → dave → alice). Had to manually strip back-edges to
render.

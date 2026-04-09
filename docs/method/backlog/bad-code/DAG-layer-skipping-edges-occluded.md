# DAG — Layer-Skipping Edges Silently Occluded By Intermediate Nodes

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Severity

**Correctness bug, not cosmetic.** Downstream projects consume the
DAG renderer to visualize graph-shaped data — notably `git-warp`,
a graph-database project that renders its graphs through bijou. For
those consumers, the DAG renderer must **never hide or drop
information**. A missing edge is a wrong answer, not an ugly one.

## Problem

When a DAG edge skips a layer (source at layer L, destination at layer
L+2 or beyond) and both endpoints end up in the same column, the
vertical edge line is routed straight down through the intermediate
layer — passing through the rows where the intermediate layer's node
box is drawn. The node box has higher render priority than the edge
line, so the edge is visually erased.

The destination arrowhead survives because it lands in the gap row
above the destination box. To a reader, it looks like the edge
originates from the node directly above the destination, not from the
real source.

Multiple edges terminating at the same destination cell also collide:
`arrows` is a `Set<number>` keyed by `encodeArrowPos(row, col)`, so
only one arrowhead is drawn per destination even when the grid has
two or more inbound edges.

## Evidence

Minimal repro (three nodes, edges `A→B`, `A→C`, `B→C`):

```ts
bijou_dag({ nodes: [
  { id: 'A', label: 'A', edges: ['B', 'C'] },
  { id: 'B', label: 'B', edges: ['C'] },
  { id: 'C', label: 'C', edges: [] },
]});
```

Expected: two arrows into C (one from A, one from B).
Actual: one arrow into C. The A→C edge is silently lost.

The loss was discovered while rendering the RE-017 byte-pipeline plan
DAG — `I-9 → II-1` and `III-5 → III-6` (both layer-skipping,
same-column) were invisible in the rendered output.

## Root Cause

- `packages/bijou/src/core/components/dag-edges.ts:148-149` — `markEdge`
  routes a same-column edge as a pure vertical segment from `sRow` to
  `dRow`, passing through intermediate layer rows.
- `packages/bijou/src/core/components/dag-render.ts:383-420` — `cellAt`
  resolves nodes before edges, so any grid cell inside a node box
  returns the box character, occluding the edge line underneath.
- `packages/bijou/src/core/components/dag-edges.ts:162` —
  `g.arrows.add(encodeArrowPos(dRow, dstC))` collides for any two
  edges landing on the same destination row/col, discarding all but
  one arrowhead.

## Fix Options

1. **Detour around intermediate nodes.** When a layer-skipping edge
   would pass through a same-column intermediate node, route it
   through a jog column that's free of nodes at the intermediate layer.
   Biggest change; most visually correct.
2. **Column reassignment for skip edges.** When ordering columns,
   prefer to place layer-skipping edge endpoints in different columns
   so the straight-line route doesn't collide.
3. **Edge priority when no box char.** Keep the node-box priority for
   cells inside boxes, but detect pass-through and mark those cells
   with a "node+edge" flag so the box label area stays readable while
   still hinting that an edge crosses the box (e.g. with a subdued
   glyph at the box border).
4. **Arrowhead multiplicity.** Change `arrows` from `Set<number>` to
   `Map<number, number>` (count per cell) or allow the cell renderer
   to emit a divergent glyph when multiple edges converge.

Option 1 is the most correct. Option 2 is probably the simplest and
resolves the common case. At minimum, option 4 should ship so
convergence isn't silently lost.

## Tests To Add

- Three-node repro above, asserting `renderAccessible` shows `A → B, C`
  and `B → C` (source of truth) and that the rendered output contains
  two arrowheads entering C's row range.
- Four-node diamond (`A → B, A → C, B → D, C → D`) — asserting both
  inbound edges to D are visible.
- A layer-skipping chain (`A → B → C`, plus `A → D` with D at layer 2)
  asserting A→D does not overlap B's column.

## Impact

The pipe and accessible renderers (`renderPipe`, `renderAccessible` in
`dag-render.ts:469-530`) return the correct edge data, so any
programmatic consumer is unaffected. Only the interactive (styled)
renderer loses edges — which is exactly the mode used for all
human-facing output via the bijou MCP tool, the CLI, the bijou-tui
panes, and the `git-warp` graph-database visualizations.

## Invariant To Enforce

> The interactive DAG renderer MUST NOT hide, drop, or silently
> merge edges or arrowheads. Every edge in the input must be
> resolvable in the rendered output.

This should become a repo invariant (`docs/invariants/`) alongside
a regression test that fails if any edge in a representative test
graph is not visually present.

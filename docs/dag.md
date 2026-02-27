# `dag()` — ASCII DAG Renderer for Bijou

## Vision

A pure `(data) → string` component that renders directed acyclic graphs as box-and-arrow ASCII art in the terminal. Auto-layout, edge routing, Unicode box-drawing, theme-aware coloring, graceful degradation.

```typescript
import { dag } from '@flyingrobots/bijou';

dag([
  { id: 'a', label: 'Theme bridge', edges: ['b', 'c'] },
  { id: 'b', label: 'Static renderers', edges: ['d', 'e'] },
  { id: 'c', label: 'TEA app shell', edges: ['d', 'e', 'f', 'g'] },
  { id: 'd', label: 'RoadmapView', edges: ['h'] },
  { id: 'e', label: 'LineageView', edges: ['h'] },
  { id: 'f', label: 'Input system', edges: ['h'] },
  { id: 'g', label: 'graph.watch()', edges: ['h'] },
  { id: 'h', label: 'Cleanup' },
]);
```

Output:

```
╭────────────────────╮
│ Theme bridge       │
╰────────────────────╯
          │
          ├───────────────────────╮
          ▼                       ▼
╭────────────────────╮  ╭────────────────────╮
│ Static renderers   │  │ TEA app shell      │
╰────────────────────╯  ╰────────────────────╯
          │                       │
          ├───────────────────────┤
          │           ┌───────────┼───────────┐
          ▼           ▼           ▼           ▼
╭──────────────╮╭──────────────╮╭──────────────╮╭──────────────╮
│ RoadmapView  ││ LineageView  ││ Input system ││ graph.watch()│
╰──────────────╯╰──────────────╯╰──────────────╯╰──────────────╯
          │           │           │           │
          └───────────┴─────┬─────┴───────────┘
                            ▼
                  ╭────────────────────╮
                  │ Cleanup            │
                  ╰────────────────────╯
```

---

## API Design

### Data Types

```typescript
export interface DagNode {
  id: string;
  label: string;
  edges?: string[];           // IDs of nodes this node points to (children/dependents)
  badge?: string;             // Optional short badge text (e.g., "4h", "DONE", "BLOCKED")
  token?: TokenValue;         // Per-node color override (e.g., green for "ready", red for "blocked")
}

export interface DagOptions {
  nodeToken?: TokenValue;     // Default node border/label color
  edgeToken?: TokenValue;     // Edge/connector color
  highlightPath?: string[];   // Node IDs to highlight (e.g., critical path) — renders with a distinct token
  highlightToken?: TokenValue;// Token for highlighted path
  selectedId?: string;        // Single node drawn with cursor-style highlighting
  selectedToken?: TokenValue; // Override token for selectedId
  nodeWidth?: number;         // Fixed node box width (default: auto from longest label)
  maxWidth?: number;          // Terminal width constraint (default: ctx.runtime.columns)
  direction?: 'down' | 'right'; // Layout direction (default: 'down')
  ctx?: BijouContext;
}

// Accepts DagNode[] (small graphs) or SlicedDagSource (adapter-driven)
export function dag(nodes: DagNode[], options?: DagOptions): string;
export function dag(source: SlicedDagSource, options?: DagOptions): string;
```

### DagSource Adapter (v0.5.0)

Decouple DAG rendering from any specific in-memory representation. A `DagSource` represents a potentially unbounded graph — it has no enumeration method. Use `dagSlice()` to BFS-walk from a focus node and produce a bounded `SlicedDagSource` that the renderer can consume.

```typescript
// Unbounded graph adapter — can wrap a database, API, etc.
export interface DagSource {
  has(id: string): boolean;                   // existence check (not enumeration)
  label(id: string): string;                  // display label
  children(id: string): readonly string[];    // outgoing edges
  parents?(id: string): readonly string[];    // incoming edges (required for ancestor traversal)
  badge?(id: string): string | undefined;     // optional badge text
  token?(id: string): TokenValue | undefined; // optional per-node color
}

// Bounded slice — extends DagSource with enumerable IDs
export interface SlicedDagSource extends DagSource {
  ids(): readonly string[];                   // all node IDs in the slice
  ghost(id: string): boolean;                 // is this a boundary placeholder?
  ghostLabel(id: string): string | undefined; // e.g., "... 3 ancestors"
}
```

**The flow: Source → Slice → Render**

```
DagSource          dagSlice()              dag()
(your graph,  →  (BFS bounded walk,  →  (Sugiyama on the
 unbounded)       ghost boundaries)       bounded result)
```

```typescript
// External graph (never fully loaded)
const graph: DagSource = {
  has: (id) => db.exists(id),
  label: (id) => db.getTitle(id),
  children: (id) => db.getDeps(id),
  parents: (id) => db.getDependents(id),
};

// BFS touches ~20 nodes, not the whole graph
const slice = dagSlice(graph, 'TASK-42', { depth: 2 });
dag(slice, { ctx });

// Composable: slice a slice
const narrower = dagSlice(slice, 'TASK-42', { depth: 1, direction: 'descendants' });
```

**`arraySource()`** wraps `DagNode[]` as a `SlicedDagSource` for backward compatibility:

```typescript
import { arraySource } from '@flyingrobots/bijou';

const src = arraySource(myNodes);  // SlicedDagSource
dag(src, { ctx });                 // equivalent to dag(myNodes, { ctx })
```

### Fragment Rendering

Render a subgraph instead of the full DAG. This is critical for large graphs — show ancestry of a single node, the critical path, or a neighborhood.

```typescript
export interface DagSliceOptions {
  direction?: 'ancestors' | 'descendants' | 'both';  // default: 'both'
  depth?: number;                                      // max hops from focus (default: Infinity)
}

// DagSource in → SlicedDagSource out (composable)
export function dagSlice(source: DagSource, focus: string, opts?: DagSliceOptions): SlicedDagSource;

// DagNode[] in → DagNode[] out (backward compatible)
export function dagSlice(nodes: DagNode[], focus: string, opts?: DagSliceOptions): DagNode[];
```

**Usage:**

```typescript
// Full graph
dag(allNodes);

// Just the ancestors of "Cleanup"
dag(dagSlice(allNodes, 'cleanup', { direction: 'ancestors' }));

// 2-hop neighborhood around "TEA app shell"
dag(dagSlice(allNodes, 'tea-shell', { direction: 'both', depth: 2 }));

// Critical path highlighted on full graph
dag(allNodes, { highlightPath: ['a', 'b', 'd', 'h'], highlightToken: theme.semantic.error });
```

**Boundary indicators:** When `dagSlice` cuts edges at the boundary, truncated nodes appear as ghost nodes:

```
          ╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╮
          ╎ ... 3 ancestors      ╎    ← dashed border = truncated
          ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯
                    │
                    ▼
          ╭────────────────────╮
          │ TEA app shell      │     ← solid border = in fragment
          ╰────────────────────╯
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
  ╭──────────╮╭──────────╮╭──────────╮
  │ View A   ││ View B   ││ Input    │
  ╰──────────╯╰──────────╯╰──────────╯
```

---

## Layout Algorithm: Sugiyama-Lite

A simplified Sugiyama method optimized for terminal rendering of 5-50 node DAGs. Three phases, ~200 lines of TypeScript, zero dependencies.

### Phase 1: Layer Assignment (Topological BFS)

Assign each node to a horizontal layer (row). Uses longest-path method: push nodes as deep as possible so the graph spreads vertically.

```typescript
function assignLayers(nodes: DagNode[]): Map<string, number> {
  // 1. Build adjacency + compute in-degree
  // 2. Topological sort (Kahn's algorithm)
  // 3. For each node in topo order:
  //    layer[node] = max(layer[predecessors]) + 1
  //    (roots get layer 0)
}
```

**Complexity:** O(V + E)

**Why longest-path over network simplex:** For 5-50 nodes the visual difference is minimal. Longest-path is ~20 lines; network simplex is ~500. Save complexity budget for edge routing.

### Phase 2: Column Ordering (Barycenter Heuristic)

Within each layer, order nodes to minimize edge crossings. For each node, compute the average column position of its parents (barycenter), then sort by that value.

```typescript
function orderColumns(layers: string[][], edges: Map<string, string[]>): void {
  // For each layer (top to bottom):
  //   For each node in the layer:
  //     barycenter = average(column indices of parent nodes in previous layer)
  //   Sort layer by barycenter values
  //   (Nodes with no parents keep their original order)

  // Optional: second pass bottom-to-top for better results
}
```

**Complexity:** O(V log V) per layer per pass. One top-down pass is sufficient for most DAGs. A second bottom-up pass improves crossing minimization at negligible cost.

### Phase 3: Rendering (Two-Pass Edge Routing)

The core insight: **accumulate edge directions first, then render characters.** Never write edge characters during edge processing — two edges from the same source share vertical exit segments.

#### Grid Setup

```
ROW_STRIDE = 6 rows per layer:
  Row 0-2: node box (top border, content, bottom border)
  Row 3:   vertical exit from box
  Row 4:   horizontal elbow turn row
  Row 5:   vertical entry / padding

COL_STRIDE = nodeWidth + 4 (gap between node centers)
```

**ROW_STRIDE must be >= 6.** At RS=5, the elbow turn row collides with the arrowhead destination. RS=6 gives exactly one buffer row. RS=7 adds a padding row (cleaner but wastes vertical space).

#### Pass 1: Accumulate Edge Directions

For each edge, mark cells with direction flags (`U`, `D`, `L`, `R`). Multiple edges sharing a cell accumulate their directions into a `Set<Dir>`.

```typescript
type Dir = 'U' | 'D' | 'L' | 'R';
const grid: Set<Dir>[][] = /* 2D array of empty Sets */;

function markEdge(fromCol: number, fromLayer: number, toCol: number, toLayer: number): void {
  const sRow = fromLayer * RS + 3;   // exit below source box
  const dRow = toLayer * RS - 1;     // entry above destination box
  const mid = sRow + 1;              // horizontal turn row

  if (fromCol === toCol) {
    // Straight vertical: mark D/U for each row sRow..dRow-1, then arrowhead at dRow
    for (let r = sRow; r < dRow; r++) markDir(r, fromCol, 'D', 'U');
  } else {
    // Elbow: vertical exit → horizontal turn → vertical entry
    markDir(sRow, fromCol, 'D', 'U');          // exit (may merge with straight edges)

    const [minC, maxC] = fromCol < toCol ? [fromCol, toCol] : [toCol, fromCol];

    // Turn at source column
    markDir(mid, fromCol, fromCol < toCol ? 'R' : 'L', 'U');

    // Horizontal segment
    for (let c = minC + 1; c < maxC; c++) markDir(mid, c, 'L', 'R');

    // Turn at destination column
    markDir(mid, toCol, fromCol < toCol ? 'L' : 'R', 'D');

    // Vertical segment down to destination
    for (let r = mid + 1; r < dRow; r++) markDir(r, toCol, 'D', 'U');
  }
  // Arrowhead at dRow
}
```

**Why this works for junctions:** When a node has both a straight-down edge and a right-elbow edge, the exit cell accumulates `{D, U}` from the straight edge and `{R, U}` from the elbow. The union `{D, R, U}` maps to `├` — the correct junction character. This is emergent behavior, not special-cased.

#### Pass 2: Render Characters

Convert accumulated direction sets to Unicode box-drawing characters:

```typescript
const JUNCTION: Record<string, string> = {
  'D': '│',  'U': '│',  'DU': '│',
  'L': '─',  'R': '─',  'LR': '─',
  'DR': '╭', 'DL': '╮', 'RU': '╰', 'LU': '╯',
  'DRU': '├', 'DLU': '┤', 'DLR': '┬', 'LRU': '┴',
  'DLRU': '┼',
};

function junctionChar(dirs: Set<Dir>): string {
  const key = [...dirs].sort().join('');   // canonical: alphabetical (D < L < R < U)
  return JUNCTION[key] ?? '+';
}
```

#### Pass 3: Node Boxes

Overwrite edge characters with node box content. Each node renders as:

```
╭──────────────────╮
│ label       badge│
╰──────────────────╯
```

#### Pass 4: Arrowheads

Write `▼` (or `v` in ASCII mode) at each edge destination point.

---

## Graceful Degradation

Three rendering paths, following the bijou component pattern:

### Interactive Mode (TTY)

Full Unicode box-drawing, ANSI colors via `ctx.style.styled()`, badges, highlights.

```
╭────────────────────╮
│ Theme bridge    2h │
╰────────────────────╯
          │
          ├───────────────────────╮
          ▼                       ▼
╭────────────────────╮  ╭────────────────────╮
│ Static renderers   │  │ TEA app shell      │
╰────────────────────╯  ╰────────────────────╯
```

### Pipe Mode

Indented adjacency list — machine-parseable, no ANSI, no box drawing:

```
Theme bridge -> Static renderers, TEA app shell
Static renderers -> RoadmapView, LineageView
TEA app shell -> RoadmapView, LineageView, Input system, graph.watch()
RoadmapView -> Cleanup
LineageView -> Cleanup
Input system -> Cleanup
graph.watch() -> Cleanup
```

### Accessible Mode

Structured text with depth labels for screen readers:

```
Graph: 8 nodes, 10 edges

Layer 1:
  Theme bridge (2h) -> Static renderers, TEA app shell

Layer 2:
  Static renderers -> RoadmapView, LineageView
  TEA app shell -> RoadmapView, LineageView, Input system, graph.watch()

Layer 3:
  RoadmapView -> Cleanup
  LineageView -> Cleanup
  Input system -> Cleanup
  graph.watch() -> Cleanup

Layer 4:
  Cleanup (end)
```

### ASCII Fallback

When Unicode is unavailable (`TERM=dumb`, `NO_UNICODE=1`), swap the junction table:

```typescript
const JUNCTION_ASCII: Record<string, string> = {
  'D': '|', 'U': '|', 'DU': '|',
  'L': '-', 'R': '-', 'LR': '-',
  'DR': '+', 'DL': '+', 'RU': '+', 'LU': '+',
  'DRU': '+', 'DLU': '+', 'DLR': '+', 'LRU': '+', 'DLRU': '+',
};
// Arrowhead: 'v' instead of '▼'
// Node boxes: +--+ / |  | instead of ╭──╮ / │  │
```

---

## Width Constraints & Responsive Behavior

### Auto-sizing

```typescript
const nodeWidth = options.nodeWidth ?? Math.max(
  ...nodes.map(n => n.label.length + (n.badge?.length ?? 0) + 4),  // │ label badge │
  16,  // minimum
);
const colStride = nodeWidth + 4;
const maxNodesPerLayer = Math.max(...layers.map(l => l.length));
const totalWidth = maxNodesPerLayer * colStride;
```

### Terminal Overflow

When `totalWidth > maxWidth`:

1. **Shrink node width** — truncate labels with `…`
2. **Reduce gap** — minimum gap of 2 between nodes
3. **If still too wide** — switch to vertical (single-column) layout with indentation instead of side-by-side boxes

### ANSI-Aware Width

All width calculations use **visible length** (strip ANSI escapes before measuring):

```typescript
function visibleLength(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '').length;
}
```

Apply colors only when writing content into the grid — never during layout math.

---

## XYPH Integration: `status --view deps`

With the `DagSource` adapter, XYPH's quest graph is never duplicated — bijou reads directly from the quest store:

```typescript
import { dag, dagSlice, type DagSource } from '@flyingrobots/bijou';

// Wrap the quest store as a DagSource — no DagNode[] copy
const questGraph: DagSource = {
  has: (id) => snapshot.quests.has(id),
  label: (id) => snapshot.quests.get(id)!.title.slice(0, 20),
  children: (id) => snapshot.quests.get(id)!.dependsOn ?? [],
  parents: (id) => snapshot.quests.get(id)!.dependents ?? [],
  badge: (id) => `${snapshot.quests.get(id)!.hours}h`,
  token: (id) => {
    const q = snapshot.quests.get(id)!;
    return q.status === 'DONE' ? theme.semantic.success
         : frontierSet.has(id) ? theme.semantic.primary
         : theme.semantic.muted;
  },
};

// Render a 3-hop neighborhood — never loads the full graph
const slice = dagSlice(questGraph, 'task:BJU-007', { depth: 3, direction: 'ancestors' });
console.log(dag(slice, {
  highlightPath: criticalResult.path,
  highlightToken: theme.semantic.error,
}));
```

### Reactive DAG in TUI

With bijou-tui's TEA runtime + git-warp subscriptions:

```typescript
const app: App<Model, Msg> = {
  init: () => [model, [watchGraph()]],

  update: (msg, model) => {
    if (msg.type === 'graph-changed') {
      return [{ ...model, snapshot: rebuildSnapshot(msg.diff) }, []];
    }
    return [model, []];
  },

  view: (model) => {
    return flex(
      { direction: 'column', width: model.cols, height: model.rows },
      { basis: 2, content: tabs([...]) },
      { flex: 1, content: (w, h) => viewport({
        width: w, height: h,
        content: dag(buildDagNodes(model.snapshot), {
          highlightPath: model.criticalPath,
          maxWidth: w,
        }),
        scrollY: model.scroll.y,
      })},
      { basis: 2, content: statusLine(model) },
    );
  },
};
```

Add a quest in one terminal → the DAG re-renders in the other with the new node slotted and sorted. That's the dream.

---

## Implementation Plan

### Phase 1: Core Layout Engine (~150 LoC)
- `assignLayers()` — topological BFS, longest-path
- `orderColumns()` — barycenter heuristic (1 top-down + 1 bottom-up pass)
- Grid coordinate mapping (`layer × RS`, `column × CS`)

### Phase 2: Edge Router (~100 LoC)
- Direction accumulation (`Set<Dir>` per cell)
- Junction character lookup (15-entry table)
- Elbow routing (vertical exit → horizontal turn → vertical entry)
- Arrowhead placement

### Phase 3: Renderer (~80 LoC)
- Node box rendering (label + badge + border)
- Grid-to-string serialization
- ANSI color application (via `StylePort`)
- Three output mode paths (interactive / pipe / accessible)
- ASCII fallback junction table

### Phase 4: Fragment Support (~50 LoC)
- `dagSlice()` — BFS/DFS from focus node with depth limit
- Ghost node rendering for truncated boundaries (dashed borders)
- Edge count annotation ("... 3 ancestors")

### Phase 5: Width Adaptation (~40 LoC)
- Auto-sizing from label lengths
- Terminal width overflow → label truncation → gap reduction → vertical fallback
- `visibleLength()` for ANSI-safe width math

### Total: ~420 LoC + tests

Tests follow bijou's `createTestContext()` pattern — one test per output mode, edge cases (empty, single node, diamond, wide fan-out, skip edges spanning multiple layers, cycles rejected with error).

---

## Open Questions

1. **Horizontal layout (`direction: 'right'`)** — useful for pipelines. Same algorithm, rotated 90°. Worth including in v1 or defer?
2. **Interactive DAG in bijou-tui** — cursor navigation over nodes, expand/collapse subtrees, click-to-focus. Separate `dagExplorer()` TEA component or extend `dag()` with a stateful wrapper?
3. **Maximum practical size** — at what node count does the ASCII layout become unreadable? Likely ~30 nodes in a standard 120-col terminal. Beyond that, should we auto-switch to a condensed format (e.g., collapsed layers)?
4. **Edge label support** — render edge labels on the horizontal segment? ("depends-on" is implied in XYPH but other users might want labeled edges.)
5. **Grouping / clusters** — render a box around a set of nodes (e.g., all tasks in a campaign)? Adds significant layout complexity.

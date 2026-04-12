# Architecture — @flyingrobots/bijou-tui

## Overview

bijou-tui implements The Elm Architecture (TEA) for terminal UIs. It provides a runtime, animation system, layout engine, and event bus — all built on pure functions and immutable state.

## Event Flow

```
┌─────────────────────────────────────────────────┐
│  IOPort (via bijou-node)                        │
│  ├─ stdin (raw bytes)                           │
│  └─ resize (SIGWINCH)                           │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  EventBus                                       │
│  ├─ parseKey(raw) → KeyMsg                      │
│  ├─ (cols, rows) → ResizeMsg                    │
│  ├─ cmd() → M | Promise<M> → emit(M)           │
│  ├─ cmd() → cleanup → retained for shutdown    │
│  └─ cmd() → QUIT → onQuit handler              │
│                                                 │
│  bus.on(msg => ...)  ◄── single subscription    │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  TEA Runtime                                    │
│  ├─ update(msg, model) → [model, cmds]          │
│  ├─ view(model) → Surface | LayoutNode          │
│  ├─ renderSurfaceFrame(surface diff) → stdout   │
│  └─ cmds → bus.runCmd() → loop                  │
└─────────────────────────────────────────────────┘
```

## TEA Cycle

```
init() → [Model₀, Cmd[]]
              │
              ▼
        ┌─── render ◄──────────────────┐
        │     │                        │
        │     ▼                        │
        │   view(model) → Surface | LayoutNode │
        │     │                        │
        │     ▼                        │
        │   renderSurfaceFrame(io, diff)│
        │                              │
        │   msg arrives (key/resize/M) │
        │     │                        │
        │     ▼                        │
        └── update(msg, model)         │
              │                        │
              ▼                        │
          [Model₁, Cmd[]]  ───────────┘
```

## Module Map

```
src/
├── types.ts         # App, Cmd, KeyMsg, ResizeMsg, QUIT
├── runtime.ts       # run() — TEA event loop
├── eventbus.ts      # EventBus — centralized event emitter
├── keys.ts          # parseKey() — raw bytes → KeyMsg
├── screen.ts        # ANSI sequences, enterScreen, renderSurfaceFrame
├── commands.ts      # quit(), tick(), batch()
├── spring.ts        # Spring physics + tween engine + easings
├── animate.ts       # animate(), sequence() — TEA commands
├── timeline.ts      # GSAP-style timeline orchestrator
├── viewport.ts      # Scrollable content pane + scroll state
├── flex.ts          # Flexbox layout engine
├── layout.ts        # vstack(), hstack()
├── split-pane.ts    # splitPane() + state reducers + layout solver
├── grid.ts          # constraint grid solver + named-area renderer
├── keybindings.ts   # KeyMap, parseKeyCombo, formatKeyCombo
├── help.ts          # helpView, helpShort, helpFor — auto-generated help
├── inputstack.ts    # InputStack — layered input dispatch
├── overlay.ts       # composite(), modal(), toast(), drawer(), tooltip()
├── app-frame.ts     # createFramedApp() — tabs/help/pane focus shell
├── focus-area.ts    # focusArea() — scrollable pane with colored gutter
├── dag-pane.ts      # dagPane() — interactive DAG viewer with node navigation
└── index.ts         # Public API barrel
```

## Animation System

### Spring Physics (`spring.ts`)

Damped harmonic oscillator:

```
F = -stiffness × displacement - damping × velocity
acceleration = F / mass
```

`springStep(state, target, config, dt)` is a pure function — no timers, no side effects. Returns new `SpringState` with `{ value, velocity, done }`.

6 presets control the feel:

| Preset | Stiffness | Damping | Character |
|--------|-----------|---------|-----------|
| `default` | 170 | 26 | Balanced |
| `gentle` | 120 | 14 | Soft, slow |
| `wobbly` | 180 | 12 | Bouncy overshoot |
| `stiff` | 210 | 20 | Quick snap |
| `slow` | 280 | 60 | Heavy, deliberate |
| `molasses` | 280 | 120 | Thick, viscous |

### Tween Engine

`tweenStep(state, config, dtMs)` — duration-based with pluggable easing. 12 built-in easings: linear, quadratic, cubic, quartic (in/out/inOut).

### animate() / sequence()

`animate()` wraps spring/tween simulation into a `Cmd<M>`. The command subscribes to the shared pulse, calls `onFrame` each tick, disposes its pulse handle when complete, and then settles.

`sequence(...cmds)` chains commands — each completes before the next starts.

### Timeline

`timeline()` is a builder that compiles into an immutable `Timeline` object:

1. Tracks have names and spring/tween configs
2. Position parameter controls start time relative to previous track
3. Labels mark named positions for reference
4. Callbacks fire when elapsed time crosses their trigger point
5. Spring durations are estimated by pre-simulation

The Timeline is a **pure state machine** — `step(state, dt)` returns new state. No internal timers. Drive it from your TEA `update` with `tick()` commands.

## Layout System

### flex()

CSS flexbox-inspired layout:

1. **Compute sizes**: Fixed-basis children allocated first, then remaining space distributed to flex children by grow factor
2. **Constraints**: `minSize`/`maxSize` clamping applied after distribution
3. **Render**: Children rendered with allocated dimensions. Render functions `(w, h) => string` receive their space.
4. **Compose**: Row direction → side-by-side columns. Column direction → stacked sections.

### viewport()

Scrollable window into content:

1. Content split into lines
2. Visible slice extracted at `scrollY` offset
3. Lines clipped to width (ANSI-aware — preserves escape sequences)
4. Proportional scrollbar rendered in the gutter

Scroll state is a separate immutable record with helpers: `scrollBy`, `scrollTo`, `pageUp`, `pageDown`, `scrollToTop`, `scrollToBottom`.

### Layout localization pipeline

`LayoutNode` trees have an explicit ownership handoff before paint:

1. `app.view(model)` returns a `Surface` or `LayoutNode`
2. `wrapViewOutputAsLayoutRoot(...)` turns that into a runtime-owned root
3. `localizeLayoutNode(...)` rebases negative or off-origin trees into a local
   non-negative coordinate space
4. the paint middleware blits the localized tree into the target surface

That means paint is not responsible for measuring bounds or discovering root
offsets. Localization already solved that earlier in the pipeline.

Read [docs/strategy/layout-localization-pipeline.md](../../docs/strategy/layout-localization-pipeline.md)
for the full recursion, coordinate-space, and retained-layout story.

## EventBus

The bus is a typed publish/subscribe system:

- **Subscribers**: `Set<(msg) => void>` — all receive every event
- **I/O connection**: `connectIO(io)` wires `rawInput` + `onResize`, returns disposable
- **Command runner**: `runCmd(cmd)` resolves sync/async command results, emits final messages, retains cleanup handles for long-lived effects, or fires the quit handler
- **Lifecycle**: `dispose()` disconnects all sources, disposes retained command cleanups, and clears all handlers

The TEA runtime creates an EventBus internally. Apps can also create their own for custom event sources or testing.

## Input System

Three modules compose into a declarative input handling pipeline:

### keybindings.ts — KeyMap

`createKeyMap<A>()` returns a `KeyMap<A>` that maps key descriptors (`"q"`, `"ctrl+c"`, `"shift+tab"`) to action values. Actions are data (messages), not factories — this keeps TEA's data-driven model intact and avoids stale closures.

```text
Key descriptor string
    │
    ▼
parseKeyCombo("ctrl+c")  →  KeyCombo { key: "c", ctrl: true, ... }
    │
    ▼
Stored as Binding<A> { combo, description, group, action, enabled }
    │
    ▼
handle(KeyMsg)  →  first-match scan  →  A | undefined
```

Key features:
- **Named groups** — `group('Navigation', g => g.bind(...))` for organized help output
- **Runtime enable/disable** — by description string, predicate function, or group name
- **Implements InputHandler** — `KeyMap<A> extends InputHandler<KeyMsg, A>`, plugs directly into InputStack

### help.ts — Help Generator

Three views auto-generated from any `BindingSource` (anything with a `bindings()` method):

- `helpView()` — grouped multi-line with aligned columns
- `helpShort()` — single-line `"q Quit • j Down • k Up"` format
- `helpFor()` — filtered by group prefix

Decoupled from `KeyMap` via the `BindingSource` interface — custom implementations can provide their own binding lists.

### inputstack.ts — InputStack

Stack-based dispatch for layered input handling (e.g., modals over global shortcuts):

```text
KeyMsg ──► InputStack.dispatch()
              │
              ▼
          Layer N (top)     ◄── opaque: swallows unhandled events
              │ not handled
              ▼
          Layer N-1          ◄── passthrough: lets events fall through
              │ not handled
              ▼
          Layer 0 (base)
```

- **Opaque layers** (default) block unhandled events from reaching lower layers — ideal for modals
- **Passthrough layers** let unmatched events continue — ideal for global shortcuts
- `InputHandler<Msg, A>` is the only interface a layer needs to implement
- `KeyMap` satisfies `InputHandler`, so keymaps push directly onto the stack

## Overlay Compositing

The overlay system (`overlay.ts`) provides compositing primitives for rendering content on top of existing views:

### composite()

ANSI-safe overlay painter:

1. Splits background into lines
2. Optionally dims background lines (`\x1b[2m`)
3. Iterates overlays in order (painter's algorithm — last wins)
4. For each overlay line, `spliceLine()` replaces the target columns in the background line
5. `spliceLine()` uses `sliceAnsi()` and `visibleLength()` from viewport.ts to handle ANSI escape sequences correctly, inserting `\x1b[0m` resets at splice boundaries to prevent style bleed

### modal()

Builds a bordered box with optional title (bold), body, and hint (muted) sections, then computes centered `(row, col)` position from screen dimensions. Returns an `Overlay` object ready for `composite()`.

### toast()

Builds a bordered single-line box with a variant icon (`✔` success, `✘` error, `ℹ` info), then computes position from anchor corner (`top-right`, `bottom-right`, `bottom-left`, `top-left`) and margin. Returns an `Overlay` object.

### drawer() / tooltip()

`drawer()` supports side and edge anchors (`left`, `right`, `top`, `bottom`) and can be mounted either screen-wide or inside a region rect (for panel-scoped tools). `tooltip()` positions a small bordered hint box around a target point with directional placement and bounds clamping.

**Key design decision:** No dependency on `box()` from bijou core. The `box()` component degrades in pipe/accessible modes (returns raw content, no borders), but overlays are inherently interactive-mode constructs that always need borders. Border rendering uses the same unicode box-drawing characters directly.

## App Shell (`app-frame.ts`)

`createFramedApp()` is a higher-order shell that composes existing primitives into a batteries-included frame:

- tab/page switching
- pane focus cycling
- per-page/per-pane scroll isolation
- built-in help line + help modal (`?`)
- optional command palette (`ctrl+p` / `:`)
- overlay factory with pane rect introspection for panel-scoped drawers/modals

Internally, pane layout is resolved from `splitPane`/`grid`/`pane` nodes, then each pane is rendered through `focusArea()` with persisted scroll coordinates.

## Focus Area (`focus-area.ts`)

A scrollable pane building block that wraps `viewport()` and prepends a styled gutter character (`▎` U+258E) indicating focus state.

### Composition

```
focusArea(state, options)
    │
    ├── resolveGutter(focused, ctx)  →  styled '▎' character
    │     └── ctx.style.styled(token, '▎')
    │
    └── viewport({ width: state.width - 1, ... })
          └── standard viewport rendering with scrollbar
```

### Width Accounting

- Gutter consumes 1 column (always present in interactive/static modes)
- Viewport gets `width - 1` columns
- Viewport internally handles scrollbar (another 1 column when `showScrollbar=true`)
- Pipe/accessible modes: no gutter, full width to content

### Horizontal Overflow

`overflowX: 'scroll'` enables horizontal scrolling — `createScrollState()` receives a `viewportWidth` to compute `maxX`. When `'hidden'`, horizontal scroll functions are no-ops.

## DAG Pane (`dag-pane.ts`)

Interactive DAG viewer composing `dagLayout()` from bijou core with `focusArea()` for viewport management.

### Composition

```
dagPane(state, options)
    │
    └── focusArea(state.focusArea, options)
          └── viewport with gutter

createDagPaneState / updateSelection
    │
    ├── buildAdjacency(source)         →  parent/child maps
    ├── computeHighlightPath(id, adj)  →  BFS root→selected path
    ├── renderLayout(source, id, path) →  dagLayout() with highlight/selected
    ├── focusAreaSetContent(fa, output) →  update viewport content
    └── scrollToNode(fa, nodePos)      →  ensure selected node visible
```

### Spatial Navigation

Arrow-key navigation uses `DagNodePosition { row, col, width, height }` from `dagLayout()`:

- **selectChild**: Children from adjacency map → pick by closest column center
- **selectParent**: Parents from adjacency map → pick by closest column center
- **selectLeft/Right**: Nodes on same row sorted by column → move to adjacent
- **No selection**: Auto-select first root node

### Re-rendering on Selection

Each selection change triggers a full `dagLayout()` call because `selectedId` and `highlightPath` affect the rendered output. The layout result replaces the focus area content via `focusAreaSetContent()`.

## Graceful Degradation

In non-interactive modes (`pipe`, `static`, `accessible`), `run()` renders the initial `view()` once and returns immediately — no alt screen, no keyboard loop, no event bus.

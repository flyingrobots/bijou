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
│  ├─ cmd() → Promise<M> → emit(M)               │
│  └─ cmd() → QUIT → onQuit handler              │
│                                                 │
│  bus.on(msg => ...)  ◄── single subscription    │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  TEA Runtime                                    │
│  ├─ update(msg, model) → [model, cmds]          │
│  ├─ view(model) → string                        │
│  ├─ renderFrame(string) → stdout                │
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
        │   view(model) → string       │
        │     │                        │
        │     ▼                        │
        │   renderFrame(io, string)    │
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
├── screen.ts        # ANSI sequences, enterScreen, renderFrame
├── commands.ts      # quit(), tick(), batch()
├── spring.ts        # Spring physics + tween engine + easings
├── animate.ts       # animate(), sequence() — TEA commands
├── timeline.ts      # GSAP-style timeline orchestrator
├── viewport.ts      # Scrollable content pane + scroll state
├── flex.ts          # Flexbox layout engine
├── layout.ts        # vstack(), hstack()
├── keybindings.ts   # KeyMap, parseKeyCombo, formatKeyCombo
├── help.ts          # helpView, helpShort, helpFor — auto-generated help
├── inputstack.ts    # InputStack — layered input dispatch
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

`animate()` wraps spring/tween simulation into a `Cmd<M>`. The command runs an internal interval, calls `onFrame` each tick, and resolves when done.

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

## EventBus

The bus is a typed publish/subscribe system:

- **Subscribers**: `Set<(msg) => void>` — all receive every event
- **I/O connection**: `connectIO(io)` wires `rawInput` + `onResize`, returns disposable
- **Command runner**: `runCmd(cmd)` awaits the promise, emits result or fires quit handler
- **Lifecycle**: `dispose()` disconnects all sources, clears all handlers

The TEA runtime creates an EventBus internally. Apps can also create their own for custom event sources or testing.

## Input System

Three modules compose into a declarative input handling pipeline:

### keybindings.ts — KeyMap

`createKeyMap<A>()` returns a `KeyMap<A>` that maps key descriptors (`"q"`, `"ctrl+c"`, `"shift+tab"`) to action values. Actions are data (messages), not factories — this keeps TEA's data-driven model intact and avoids stale closures.

```
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

```
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

## Graceful Degradation

In non-interactive modes (`pipe`, `static`, `accessible`), `run()` renders the initial `view()` once and returns immediately — no alt screen, no keyboard loop, no event bus.

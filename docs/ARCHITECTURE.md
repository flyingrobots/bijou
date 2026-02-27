# Architecture — bijou

## Overview

bijou is a monorepo containing three packages that together provide a complete toolkit for building terminal interfaces in TypeScript. The architecture follows Ports and Adapters (hexagonal) — the core is pure TypeScript with zero dependencies, all platform I/O flows through typed port interfaces, and adapters plug in at the edges.

## Package Dependency Graph

```
┌──────────────────────────────────────────────────────────────┐
│  @flyingrobots/bijou  (zero deps)                            │
│                                                              │
│  Components       Theme Engine       Forms       Detection   │
│  box · table      DTCG · presets     input       TTY · CI    │
│  spinner · tree   gradients          select      pipe · a11y │
│  progress · kbd   styled()           confirm                 │
│  badge · alert    extendTheme()      multiselect             │
│  accordion        tv()               group                   │
│  tabs · stepper                                              │
│  breadcrumb                                                  │
│  paginator                                                   │
│                                                              │
│  ── Ports ─────────────────────────────────────────────────  │
│  RuntimePort       IOPort       StylePort                    │
└──────┬───────────────┬───────────────┬───────────────────────┘
       │               │               │
┌──────▼───────────────▼───────────────▼───────────────────────┐
│  @flyingrobots/bijou-node                                    │
│  nodeRuntime()  ·  nodeIO()  ·  chalkStyle()                 │
│  process.env · stdout/stdin · readline · chalk · fs          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  @flyingrobots/bijou-tui                                     │
│                                                              │
│  Runtime           Animation          Layout                 │
│  TEA (run)         spring physics     flex (flexbox)         │
│  EventBus          tween engine       viewport (scroll)      │
│  parseKey          animate/sequence   vstack/hstack          │
│  screen control    timeline (GSAP)                           │
│                                                              │
│  Input                                                       │
│  createKeyMap      helpView/helpShort  createInputStack       │
│  parseKeyCombo     helpFor            InputHandler           │
│  formatKeyCombo    BindingSource      layered dispatch       │
└──────────────────────────────────────────────────────────────┘
```

`bijou-tui` and `bijou-node` are siblings — neither depends on the other. Both depend on `bijou` core for port interfaces. A typical app imports all three.

## Hexagonal Architecture

### Ports

Three interfaces define the boundary between pure logic and platform I/O:

| Port | Responsibility | Methods |
|------|---------------|---------|
| **RuntimePort** | Environment state (read-only) | `env()`, `stdoutIsTTY`, `stdinIsTTY`, `columns`, `rows` |
| **IOPort** | All I/O operations | `write()`, `question()`, `rawInput()`, `onResize()`, `setInterval()`, `readFile()`, `readDir()`, `joinPath()` |
| **StylePort** | Color and text formatting | `styled()`, `rgb()`, `hex()`, `bold()` |

### Adapters

| Adapter | Package | What it wraps |
|---------|---------|---------------|
| `nodeRuntime()` | bijou-node | `process.env`, `process.stdout` |
| `nodeIO()` | bijou-node | `process.stdout/stdin`, `readline`, `fs` |
| `chalkStyle()` | bijou-node | chalk RGB/hex/modifiers |
| `mockRuntime()` | bijou (test) | Configurable stub |
| `mockIO()` | bijou (test) | Captured writes, canned answers |
| `plainStyle()` | bijou (test) | Identity (no ANSI) |

### BijouContext

Bundles ports + resolved state into a single object passed through the system:

```typescript
interface BijouContext {
  readonly theme: ResolvedTheme;
  readonly mode: OutputMode;  // 'interactive' | 'static' | 'pipe' | 'accessible'
  readonly runtime: RuntimePort;
  readonly io: IOPort;
  readonly style: StylePort;
}
```

## Feature Catalog

### Core (`@flyingrobots/bijou`)

| Category | Features |
|----------|----------|
| **Layout** | `box()`, `headerBox()`, `separator()` |
| **Elements** | `badge()`, `alert()`, `kbd()`, `skeleton()` |
| **Data** | `table()`, `tree()`, `accordion()`, `timeline()`, `dag()`, `dagSlice()`, `dagLayout()` + `DagSource` adapter |
| **Navigation** | `tabs()`, `breadcrumb()`, `stepper()`, `paginator()` |
| **Animation** | `spinner()`, `progressBar()`, `gradientText()` |
| **Forms** | `input()`, `select()`, `multiselect()`, `confirm()`, `group()` |
| **Theme engine** | DTCG interop, 3 presets (`cyan-magenta`, `nord`, `catppuccin`), `extendTheme()`, `styled()`, `tv()` |
| **Detection** | Output mode auto-detection (TTY, CI, pipe, accessible) |
| **Test adapters** | `createTestContext()`, `mockRuntime()`, `mockIO()`, `plainStyle()` |

### Node adapter (`@flyingrobots/bijou-node`)

| Feature | Description |
|---------|-------------|
| `nodeRuntime()` | `process.env`, TTY detection, terminal dimensions |
| `nodeIO()` | stdout/stdin, readline, raw input, resize events, file I/O |
| `chalkStyle()` | RGB/hex color via chalk, respects `NO_COLOR` |
| `initDefaultContext()` | One-line setup with auto-detection |

### TUI runtime (`@flyingrobots/bijou-tui`)

| Category | Features |
|----------|----------|
| **TEA runtime** | `run()` — The Elm Architecture event loop with `App<M>` type |
| **Commands** | `quit()`, `tick()`, `batch()` |
| **Key parsing** | `parseKey()` — raw stdin bytes to `KeyMsg` |
| **Screen** | `enterScreen()`, `exitScreen()`, `clearAndHome()`, `renderFrame()`, ANSI constants |
| **Event bus** | `createEventBus()` — typed pub/sub, I/O connection, command runner |
| **Spring physics** | Damped harmonic oscillator, 6 presets, `springStep()` pure function |
| **Tween engine** | Duration-based animation, 12 easing functions, `tweenStep()` pure function |
| **animate/sequence** | GSAP-style TEA commands wrapping spring/tween into `Cmd<M>` with per-frame emission |
| **Timeline** | Multi-track orchestration with position syntax, labels, callbacks |
| **Flexbox** | `flex()` — row/column direction, grow/basis/min/max, horizontal/vertical alignment, render functions |
| **Viewport** | `viewport()` — scrollable pane with proportional scrollbar, ANSI-aware clipping |
| **Keybinding manager** | `createKeyMap()` — declarative binding, modifier combos, named groups, enable/disable |
| **Help generator** | `helpView()`, `helpShort()`, `helpFor()` — auto-generated from bindings |
| **Input stack** | `createInputStack()` — layered dispatch with opaque/passthrough modes |
| **Layout** | `vstack()`, `hstack()` |

## Data Flow

### Static components (bijou core)

```
Data + Options → Component Function → String
                      │
                      ├─ resolves BijouContext
                      ├─ branches on ctx.mode for degradation
                      └─ uses ctx.style for colors
```

### TEA apps (bijou-tui)

```
IOPort (stdin, resize)
    │
    ▼
EventBus ──── parseKey() ──── KeyMsg
    │                          │
    │                          ▼
    │                    InputStack (optional)
    │                     │  dispatch top-down
    │                     │  opaque vs passthrough
    │                     ▼
    │                    KeyMap (optional)
    │                     │  match combo → action
    │                     ▼
    └──────────────── update(msg, model)
                          │
                          ▼
                    [Model, Cmd[]]
                      │       │
                      │       └─ bus.runCmd() → emit messages → loop
                      ▼
                    view(model) → string → renderFrame() → stdout
```

### Input system (keybindings + input stack)

```
KeyMsg ─── InputStack.dispatch() ──► top layer
               │                        │
               │          ┌─────────────┤
               │          │ handled?    │ not handled
               │          ▼             ▼
               │       return action    passthrough? ─── yes ──► next layer
               │                            │
               │                           no
               │                            │
               │                        swallowed
               │                       (return undefined)
               │
               └── Each layer is an InputHandler
                   (KeyMap satisfies InputHandler)
```

## Design Principles

1. **Pure functions over objects** — springs, tweens, timelines, viewport, scroll state are all `(state, input) → state`. No internal timers or side effects.
2. **Data over factories** — keybinding actions are values (messages), not factory functions. This prevents stale closures and keeps TEA's data-driven model intact.
3. **Ports over imports** — no `process`, `chalk`, `readline`, or `fs` imports in core. Platform I/O only through port interfaces.
4. **Graceful degradation** — every component adapts to the detected output mode. Interactive → static → pipe → accessible, automatically.
5. **Composition over inheritance** — `KeyMap` satisfies `InputHandler`, `BindingSource`. Stack layers compose handlers. Timeline composes tracks. Flex composes children.

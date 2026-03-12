# Architecture — Bijou

## Overview

Bijou is a five-package monorepo for building terminal interfaces in TypeScript.

The important design decision in `3.0.0` is the product split:

- `@flyingrobots/bijou` is the pure, degradation-first terminal toolkit.
- `@flyingrobots/bijou-tui` is the high-fidelity interactive runtime.
- `@flyingrobots/bijou-node` is the Node adapter layer plus Node-specific runtime utilities.
- `@flyingrobots/bijou-tui-app` is the batteries-included framed shell.
- `create-bijou-tui-app` scaffolds new apps using that stack.

The repo still follows Ports and Adapters (hexagonal) at the core. The V3 work did not replace that architecture; it tightened the runtime/rendering story around it.

## Package Graph

```text
create-bijou-tui-app
        │
        │ scaffolds apps that use
        ▼
@flyingrobots/bijou
├── @flyingrobots/bijou-tui
│   └── @flyingrobots/bijou-node
└── @flyingrobots/bijou-tui-app
    └── depends on @flyingrobots/bijou-tui
```

Key facts:

- `@flyingrobots/bijou` has zero runtime dependencies.
- `@flyingrobots/bijou-tui` depends on the core package.
- `@flyingrobots/bijou-node` now depends on `@flyingrobots/bijou-tui` because it owns the worker runtime and native recorder APIs in addition to the port adapters.
- `@flyingrobots/bijou-tui-app` depends on both the core and runtime packages.

## Package Responsibilities

### `@flyingrobots/bijou`

This is the stable, pure foundation:

- components, prompts, layout helpers, and themes
- output-mode detection and graceful degradation
- the `RuntimePort`, `IOPort`, and `StylePort` interfaces
- test adapters and deterministic test contexts
- the `Surface` and `LayoutNode` primitives used by the V3 runtime

This package intentionally supports both string-oriented and surface-oriented APIs. `3.0.0` does not require every component to be surface-native.

### `@flyingrobots/bijou-tui`

This is the V3 runtime layer:

- TEA `App`/`Cmd` loop
- input, resize, mouse, and animation pulse handling
- layout and overlay primitives
- motion, transition shaders, and render pipeline middleware
- framed shell composition helpers and sub-app lifecycle helpers

The public runtime contract is now `ViewOutput`:

```ts
type ViewOutput = string | Surface | LayoutNode;
```

Strings remain supported as a legacy compatibility path. Surfaces and layout trees are the preferred V3-native render values.

### `@flyingrobots/bijou-node`

This package owns the Node boundary:

- `nodeRuntime()`, `nodeIO()`, and `chalkStyle()`
- `createNodeContext()` / `initDefaultContext()`
- worker runtime helpers: `runInWorker()` and `startWorkerApp()`
- native demo recorder helpers such as `recordDemoGif()`

### `@flyingrobots/bijou-tui-app`

This package provides the opinionated framed shell:

- tab/header/footer chrome
- help and command-palette plumbing
- drawer and modal flows
- a ready-to-run TUI app skeleton

The shell now accepts `ViewOutput` at pane boundaries, not just strings.

### `create-bijou-tui-app`

This is the scaffolder:

- generates a runnable TypeScript app
- uses only public package APIs
- targets the framed-shell V3 path by default

## Hexagonal Core

Three ports define the pure/platform boundary:

| Port | Responsibility | Representative methods |
|------|----------------|------------------------|
| `RuntimePort` | environment and terminal facts | `env()`, `stdoutIsTTY`, `stdinIsTTY`, `columns`, `rows` |
| `IOPort` | input/output and timers | `write()`, `question()`, `rawInput()`, `onResize()`, `setInterval()`, `readFile()` |
| `StylePort` | text styling | `styled()`, `rgb()`, `hex()`, `bold()` |

Adapters live outside the core:

| Adapter | Package | Wraps |
|---------|---------|-------|
| `nodeRuntime()` | `@flyingrobots/bijou-node` | `process.env`, `process.stdout` |
| `nodeIO()` | `@flyingrobots/bijou-node` | stdin/stdout, readline, fs |
| `chalkStyle()` | `@flyingrobots/bijou-node` | Chalk |
| `mockRuntime()` | `@flyingrobots/bijou/adapters/test` | deterministic runtime stub |
| `mockIO()` | `@flyingrobots/bijou/adapters/test` | captured writes, canned answers |
| `plainStyle()` | `@flyingrobots/bijou/adapters/test` | no-op styling |

## Rendering Model

### Core Toolkit Path

For CLI-first flows, the model is still straightforward:

```text
data + options
  -> core component
  -> output-mode-aware rendering
  -> string or surface result
  -> stdout / tests / pipe / accessibility flow
```

That path is intentionally simple and degradation-first.

### V3 Runtime Path

The interactive runtime uses a stricter pipeline:

```text
stdin / resize / mouse / pulse
  -> event bus
  -> update(msg, model)
  -> [model, cmds]
  -> view(model): ViewOutput
  -> normalize ViewOutput
  -> Surface
  -> render pipeline middleware
  -> diff renderer
  -> terminal output
```

Important release-truth points for `3.0.0`:

- `App.view` accepts `string | Surface | LayoutNode`.
- framed pane renderers accept the same `ViewOutput` contract.
- the flagship runtime and app-shell path is surface/layout-native at the frame boundary.
- legacy strings are preserved for compatibility, but are no longer the only real render path.

## BCSS And Styling Scope

`run(app, { css })` installs BCSS resolution into the runtime context.

Guaranteed in `3.0.0`:

- `Type`, `.class`, and `#id` selectors
- `var(token.path)` lookups
- terminal width/height media queries
- documented text-style support on V3 surface primitives and frame shell regions

Not guaranteed in `3.0.0`:

- a global CSS cascade over arbitrary layout nodes
- blanket styling of every component in the repo

That scope is deliberate and reflected in the public docs.

## Sub-Apps And Composition

Nested TEA composition is supported through:

- `mount()` for rendering child views
- `initSubApp()` for child initialization
- `updateSubApp()` for child update + command mapping
- `mapCmds()` for explicit command translation

`mount()` alone is not the whole lifecycle story.

## Output Modes

The core toolkit and Node adapter continue to auto-detect output modes:

| Mode | Trigger | Behavior |
|------|---------|----------|
| `interactive` | TTY stdout | full color, motion, input loop |
| `static` | CI with TTY stdout | single-frame render, no interactive loop |
| `pipe` | non-TTY stdout, `NO_COLOR`, or `TERM=dumb` | plain-text-safe output |
| `accessible` | `BIJOU_ACCESSIBLE=1` | linearized, screen-reader-friendly output |

That degradation-first behavior is still part of Bijou's identity in `3.0.0`.

## Test And Release Gates

The repo's release-ready gates for `3.0.0` are:

- `npm run build`
- `npm run lint`
- `npm test`
- `npm run typecheck:test`
- `npm run smoke:examples:all`
- `npm pack --dry-run --workspaces`

The examples suite is part of the release contract now, not a side project.

## Design Principles

1. Ports over platform imports.
2. Graceful degradation first for the core toolkit.
3. Honest public contracts for the runtime and shell.
4. Pure state transitions for animation, layout, and TEA updates.
5. Compatibility boundaries are explicit when V3 surface output meets legacy string APIs.

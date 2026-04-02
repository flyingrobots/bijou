# Architecture — Bijou

This document is the structural reference for the current repository shape.

If you want the current execution order, read [PLAN.md](./PLAN.md).
If you want the public front door, read [../README.md](../README.md).

## Overview

Bijou is a nine-package monorepo for terminal software in TypeScript.

The repo now has three connected lanes:

- a degradation-first core toolkit for prompts, components, surfaces, and output-mode-aware rendering
- a surface-first interactive runtime and framed shell stack for full-screen TUI apps
- a localization runtime and tooling lane that supports catalogs, direction, exchange workflows, and shell/docs localization

The architectural posture after `v4.0.0` is:

- keep the core toolkit honest about degradation and string/surface seams
- keep the fullscreen runtime honest about its `Surface | LayoutNode` boundary
- use DOGFOOD as the proving surface for shell, design-language, and runtime behavior
- keep the current execution center of gravity on the runtime-engine seams described in [PLAN.md](./PLAN.md)

## Package Graph

```text
create-bijou-tui-app
        │
        │ scaffolds apps that use
        ▼
@flyingrobots/bijou       @flyingrobots/bijou-i18n
        │                         │
        │ peer / runtime base     └── @flyingrobots/bijou-i18n-tools
        ▼                                  ├── @flyingrobots/bijou-i18n-tools-node
@flyingrobots/bijou-tui                     └── @flyingrobots/bijou-i18n-tools-xlsx
        │
        ├── @flyingrobots/bijou-node
        └── @flyingrobots/bijou-tui-app
```

Key facts:

- `@flyingrobots/bijou` remains the pure foundation.
- `@flyingrobots/bijou-tui` depends on `@flyingrobots/bijou-i18n` and peers on `@flyingrobots/bijou`.
- `@flyingrobots/bijou-node` depends on `@flyingrobots/bijou-tui` and peers on `@flyingrobots/bijou`.
- `@flyingrobots/bijou-tui-app` depends on both the core and runtime packages.
- the localization tooling lane is now real workspace surface area, not only roadmap intent.

## Package Responsibilities

### `@flyingrobots/bijou`

The stable, pure foundation:

- prompts, components, output helpers, and themes
- output-mode detection and graceful lowering
- `Surface` primitives and composition helpers
- ports such as `RuntimePort`, `IOPort`, and `StylePort`
- deterministic test adapters and context helpers

This package is intentionally mixed-mode. Some APIs are string-first, some are surface-first, and that is still the correct product shape.

### `@flyingrobots/bijou-tui`

The interactive runtime:

- TEA `App` / `Cmd` loop
- fullscreen rendering, diffing, resize, mouse, and pulse handling
- layout trees and surface composition
- overlays, shell primitives, transitions, and runtime-engine seams
- framed shell support and sub-app lifecycle helpers

The public render boundary is:

```ts
type ViewOutput = Surface | LayoutNode;
```

The runtime should not pretend that raw strings are still a fullscreen render contract.

### `@flyingrobots/bijou-node`

The Node boundary:

- `nodeRuntime()`, `nodeIO()`, and `chalkStyle()`
- `createNodeContext()` / `initDefaultContext()`
- worker runtime helpers
- recorder helpers and native surface-to-GIF capture

This package owns integration with the host process, filesystem, timers, and terminal behavior.

### `@flyingrobots/bijou-tui-app`

The opinionated shell layer:

- framed app structure
- header/footer/help/search/settings/notification shell surfaces
- common overlay and pane-management flows
- a strong default product shell for TUI applications

This package is where shell quality becomes visible fastest, which is why DOGFOOD keeps using it as the first proving surface.

### `create-bijou-tui-app`

The scaffolder:

- generates a runnable TUI app
- targets the current public shell/runtime path
- should stay aligned with the actual release-ready stack rather than internal repo folklore

### `@flyingrobots/bijou-i18n`

The in-memory localization runtime:

- catalogs and locale selection
- direction (`ltr` / `rtl`) resolution
- runtime-safe lookup seams

This keeps shell and docs localization out of hidden string tables and ad hoc app-local structures.

### `@flyingrobots/bijou-i18n-tools`

Localization workflow tooling:

- catalog authoring and compilation support
- stale-detection and exchange workflow seams
- the non-runtime layer for working with localization assets

### `@flyingrobots/bijou-i18n-tools-node`

Node-side localization helpers:

- filesystem and local exchange workflows for the tooling lane

### `@flyingrobots/bijou-i18n-tools-xlsx`

Spreadsheet exchange adapters:

- XLSX import/export helpers for localization workflows

## Core Architectural Posture

Bijou still follows a ports-and-adapters core.

Three ports remain the important purity boundary:

| Port | Responsibility | Representative methods |
|------|----------------|------------------------|
| `RuntimePort` | environment and terminal facts | `env()`, `stdoutIsTTY`, `stdinIsTTY`, `columns`, `rows` |
| `IOPort` | output, input, timers, files | `write()`, `question()`, `rawInput()`, `onResize()`, `setInterval()`, `readFile()` |
| `StylePort` | styling and color decisions | `styled()`, `rgb()`, `hex()`, `bold()` |

Adapters continue to live outside the core:

| Adapter | Package | Wraps |
|---------|---------|-------|
| `nodeRuntime()` | `@flyingrobots/bijou-node` | process and terminal facts |
| `nodeIO()` | `@flyingrobots/bijou-node` | stdin/stdout, timers, filesystem |
| `chalkStyle()` | `@flyingrobots/bijou-node` | Chalk |
| `mockRuntime()` | `@flyingrobots/bijou` test adapters | deterministic runtime stub |
| `mockIO()` | `@flyingrobots/bijou` test adapters | captured writes, canned answers |
| `plainStyle()` | `@flyingrobots/bijou` test adapters | no-op styling |

The i18n packages add another explicit runtime/tooling seam instead of burying locale behavior inside app-specific strings.

## Rendering And Runtime Model

### Core Toolkit Path

For CLI-first flows, the model is still deliberately simple:

```text
data + options
  -> core component
  -> output-mode-aware rendering
  -> string or surface result
  -> stdout / tests / pipe / accessibility flow
```

That degradation-first path is still core to Bijou's identity.

### Interactive Runtime Path

The fullscreen runtime is stricter:

```text
stdin / resize / mouse / pulse
  -> event bus
  -> update(msg, model)
  -> [model, cmds]
  -> view(model): Surface | LayoutNode
  -> normalize layout/view output
  -> surface
  -> diff renderer
  -> terminal output
```

The current post-`v4.0.0` architectural work is making the engine seams beneath that loop more explicit:

- retained layouts
- layout-driven input routing
- separate command and effect buffering
- explicit component interaction contracts
- shell migration onto those seams

See [PLAN.md](./PLAN.md) and the [RE legend](./legends/RE-runtime-engine.md) for sequencing.

## DOGFOOD As Architecture Pressure

DOGFOOD is not just docs. It is where the architecture gets pressured in public.

It currently proves:

- the framed shell under real app behavior
- the design-system field guide in a living TUI
- search, settings, help, quit, and layout behavior in one product surface
- localization and graceful-lowering concerns in the same runtime stack

That is why DOGFOOD now matters architecturally, not just editorially.

## Output Modes

The repo still treats graceful lowering as a first-class rule:

| Mode | Trigger | Behavior |
|------|---------|----------|
| `interactive` | TTY stdout | full runtime, color, input, motion, shell chrome |
| `static` | CI with TTY stdout | single-frame render, no interaction loop |
| `pipe` | non-TTY stdout, `NO_COLOR`, or `TERM=dumb` | plain-text-safe output |
| `accessible` | `BIJOU_ACCESSIBLE=1` | linearized, screen-reader-friendly output |

The core toolkit and the runtime do not treat those modes as afterthoughts.

## Examples, DOGFOOD, And Release Truth

The repo still has canonical example coverage, but the direction has shifted:

- DOGFOOD is the primary living-docs and proving surface
- a smaller set of canonical examples still carries runtime, migration, and reference value
- the repo is moving toward DOGFOOD-centered smoke coverage instead of relying forever on example sprawl

See:

- [DOGFOOD docs surface](../examples/docs/README.md)
- [Curated Example Map](./EXAMPLES.md)
- [WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`](./BACKLOG/WF-003-replace-smoke-examples-with-smoke-dogfood.md)

## What This File Is Not

This is not the planning source of truth.

Use:

- [Documentation Map](./README.md) for the docs entrypoint
- [PLAN.md](./PLAN.md) for current execution order
- [ROADMAP.md](./ROADMAP.md) only as the broader legacy/reference surface

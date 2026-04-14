# ARCHITECTURE

Bijou is an industrial-grade TypeScript engine organized around a strict Hexagonal (Ports and Adapters) architecture.

## Core Boundary

The `@flyingrobots/bijou` core is pure TypeScript with zero runtime dependencies. All platform-specific concerns are isolated behind three primary ports:

| Port | Responsibility | Representative Methods |
| :--- | :--- | :--- |
| **`RuntimePort`** | Environment and terminal facts | `env()`, `columns`, `rows`, `stdoutIsTTY` |
| **`IOPort`** | Input, output, timers, and files | `write()`, `rawInput()`, `setInterval()`, `readFile()` |
| **`StylePort`** | Color and styling decisions | `styled()`, `rgb()`, `hex()`, `bold()` |

Adapters (e.g., `nodeRuntime`, `nodeIO`, `chalkStyle`) live in `@flyingrobots/bijou-node` or test-specific modules.

## Package Stack

### 1. `@flyingrobots/bijou` (The Foundation)
- Zero-dependency primitives: `Surface`, `LayoutNode`, and `BijouContext`.
- Core component families and interactive prompts.
- Output-mode detection and graceful lowering.

### 2. `@flyingrobots/bijou-tui` (The Engine)
- The Elm Architecture (TEA) runtime: `App`, `Cmd`, and `Msg`.
- High-fidelity rendering pipeline: layout, diffing, and ANSI emission.
- Declarative motion (springs/tweens) and transition shaders.
- Standardized shell chrome and overlay composition.

### 3. `@flyingrobots/bijou-node` (The Host)
- Official Node.js implementations of all core ports.
- Worker-thread runtime for offloading heavy TEA logic.
- Native surface recording for documentation and debugging.

### 4. `@flyingrobots/bijou-i18n` (The Voice)
- In-memory localization runtime.
- Bidirectional support (LTR/RTL) and catalog management.

## Rendering Pipeline

### Static Path (CLI/Pipes)
`data -> core component -> mode-aware render -> string/surface result -> stdout`

### Interactive Path (TUI)
`input -> TEA update -> view() -> Surface | LayoutNode -> localize root -> paint -> Diff -> terminal`

For the `LayoutNode` branch specifically, the runtime rebases the tree into a
local non-negative root before paint. The detailed ownership model is captured
in [docs/strategy/layout-localization-pipeline.md](./docs/strategy/layout-localization-pipeline.md).
The user-facing layout and overflow rules that sit on top of that pipeline are
captured in [docs/strategy/layout-and-viewport-rules.md](./docs/strategy/layout-and-viewport-rules.md).

## Buffered Protocols

When Bijou buffers commands, events, or cross-boundary actions, those buffers
should carry plain facts rather than executable behavior. The execution owner
stays outside the buffer, which keeps queued state inspectable, replayable, and
testable.

Use [The Buffer Holds Facts](./docs/invariants/buffer-holds-facts.md) as the
canonical invariant for that rule.

## Interaction Profiles

Bijou adapts its rendering behavior based on the detected output mode:
- **`interactive`**: Full TEA loop, motion, and shell chrome.
- **`static`**: Single-frame render (e.g., CI logs).
- **`pipe`**: Plain-text fallback; no colors or complex layout.
- **`accessible`**: Linearized output for screen-readers.

---
**DOGFOOD** serves as the architectural pressure point, where all packages are verified in a unified, professional application surface.

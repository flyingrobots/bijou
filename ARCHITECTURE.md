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

### 1. `@flyingrobots/bijou` (The Substrate)
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
`input -> TEA update -> view() -> Surface | LayoutNode -> Diff -> terminal`

## Interaction Profiles

Bijou adapts its rendering behavior based on the detected output mode:
- **`interactive`**: Full TEA loop, motion, and shell chrome.
- **`static`**: Single-frame render (e.g., CI logs).
- **`pipe`**: Plain-text fallback; no colors or complex layout.
- **`accessible`**: Linearized output for screen-readers.

---
**DOGFOOD** serves as the architectural pressure point, where all packages are verified in a unified, professional application surface.

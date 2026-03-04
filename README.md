# 💎 Bijou

## Turbo TUI engine for TypeScript.

**Resilient by design. Physics-powered. Built for scale.**

Stop building brittle CLIs that break in CI or look like garbage on a server. Bijou is a multi-package TUI engine for building everything from simple interactive scripts to complex, high-fidelity terminal applications.

[![npm](https://img.shields.io/npm/v/@flyingrobots/bijou)](https://www.npmjs.com/package/@flyingrobots/bijou)
[![License](https://img.shields.io/github/license/flyingrobots/bijou)](./LICENSE)

![bijou](https://github.com/user-attachments/assets/8117f6ad-41e0-470f-aeb6-6722ec44fa2c)

---

## What's New in v1.1.0

Two new bijou-tui building blocks for composing multi-pane interactive applications:

- **`focusArea()`** — scrollable pane with a colored left gutter bar indicating focus state, horizontal overflow support, and graceful degradation
- **`dagPane()`** — interactive DAG viewer with arrow-key node navigation, auto-highlight-path from root to selected node, and auto-scroll-to-selection

Plus 8 bug fixes hardening dimension clamping, scrollbar-aware bounds, keybinding resolution, and type safety.

See the [full changelog](./docs/CHANGELOG.md) for the complete technical breakdown.

---

## 🚀 Try it in 10 Seconds

Experience the full physics-powered TUI engine immediately:

```bash
git clone https://github.com/flyingrobots/bijou && cd bijou && npm install && npx tsx demo-tui.ts
```

---

## 🦾 Resilience as a Superpower

The core of Bijou is its **Graceful Degradation** engine. It detects your environment and automatically adapts the UI logic—ensuring your tool works as perfectly in a GitHub Action as it does in a local TrueColor terminal.

| Mode | Trigger | Behavior |
| :--- | :--- | :--- |
| **Interactive** | Local TTY | Full 24-bit RGB, Unicode borders, 60fps physics animations. |
| **Static** | `CI=true` | Single-frame rendering, animations disabled, spinners removed. |
| **Pipe** | Piped `stdout` | Strips all ANSI codes, switches to ASCII fallbacks for UNIX pipes. |
| **Accessible** | `BIJOU_A11Y=1` | Simplified prompt text and linear flow optimized for screen readers. |

---

## 🛠️ One Engine, Two Runtimes

Bijou is split into two layers so you only pay for what you need:

### 1. The Resilient Core (`@flyingrobots/bijou`)
A zero-dependency library of 20+ "pure-render" components and interactive prompts.
*   **Hexagonal Architecture:** Decoupled from Node.js. Test your UI logic in pure TS with zero mocks.
*   **First-class Design Tokens:** (DTCG-compatible) Use your web brand's JSON to drive your terminal's theme.
*   **Built-in Resilience:** Native support for CI, pipes, and screen readers.

### 2. The High-Performance TUI (`@flyingrobots/bijou-tui`)
An interactive runtime inspired by **The Elm Architecture (TEA)** and **GSAP**.
*   **Physics-Based Motion:** Damped harmonic oscillators (Springs) for 60fps-smooth interfaces.
*   **Flexbox Layout:** A real `flex()` engine with auto-reflow that actually understands terminal resizing.
*   **Animation Timelines:** Orchestrate complex sequences with GSAP-style position syntax (`+=`, `-=`).

---

## 📊 Feature Comparison: Bijou vs. Ink

While **Ink** is the standard for React-based TUIs, Bijou is built for developers who need an industrial-grade engine without the overhead of a DOM-like reconciler.

| Feature | **Bijou** | **Ink** |
| :--- | :--- | :--- |
| **Architecture** | **Hexagonal (Ports & Adapters)** | Monolithic (Node-only) |
| **Logic** | Pure TypeScript (Zero-deps) | React / Yoga-layout |
| **State** | **The Elm Architecture (TEA)** | Hooks / Component State |
| **Resilience** | **Native Graceful Degradation** | Manual / Environment-sensitive |
| **Animation** | **Physics-Based Springs** | Simple Tweens / Ad-hoc |
| **Testability** | **Mock-free (via Port Adapters)** | Requires Terminal Emulation |
| **Performance**| **Physics-driven 60fps+** | Reconciler-bound |

---

## 🧱 Component Matrix

Bijou is a growing ecosystem. Transparency is our baseline—here is the current state of the engine:

### UI Elements (`@flyingrobots/bijou`)

| Component | Status | Description |
| :--- | :--- | :--- |
| `box` / `headerBox` | ✅ Stable | The layout foundation with Unicode/ASCII borders. |
| `table` | ✅ Stable | Auto-spacing, header-driven data grids. |
| `tree` / `accordion` | ✅ Stable | Nested and collapsible data structures. |
| `tabs` / `breadcrumb` | ✅ Stable | Wayfinding and navigation primitives. |
| `stepper` / `paginator` | ✅ Stable | Multi-step flow and list navigation. |
| `badge` / `alert` / `kbd` | ✅ Stable | Semantic status and keyboard indicators. |
| `enumeratedList` | ✅ Stable | Ordered/unordered lists with 6 bullet styles. |
| `hyperlink` | ✅ Stable | OSC 8 clickable links with graceful fallback. |
| `log` | ✅ Stable | Leveled styled output (debug through fatal). |
| `progress` / `spinner` | ✅ Stable | Visual feedback for long-running tasks. |
| `timeline` | ✅ Stable | Vertical event visualization. |
| `dag` / `dagSlice` | ✅ Stable | Directed acyclic graph with auto-layout, edge routing, subgraph slicing, and `DagSource` adapter for external graphs. |
| `skeleton` | ✅ Stable | Loading placeholders for data-heavy views. |
| `textarea` | ✅ Stable | Multi-line, scrollable text entry. |
| `filter` | ✅ Stable | Fuzzy type-to-filter list component. |

### Interactive Forms (`@flyingrobots/bijou`)

| Component | Status | Description |
| :--- | :--- | :--- |
| `input` / `select` | ✅ Stable | Standard prompts with auto-degradation for CI. |
| `multiselect` | ✅ Stable | Checkbox-style multiple selection. |
| `confirm` | ✅ Stable | Simple Y/N boolean prompts. |
| `group` | ✅ Stable | Sequential form chaining. |
| `wizard` | ✅ Stable | Multi-step form orchestration with conditional skip logic. |

### TUI Patterns (`@flyingrobots/bijou-tui`)

| Pattern | Status | Description |
| :--- | :--- | :--- |
| `flex` / `vstack` / `hstack` / `place` | ✅ Stable | Responsive Flexbox layout engine with 2D alignment. |
| `statusBar` | ✅ Stable | Segmented header/footer bar with fill characters. |
| `viewport` | ✅ Stable | Scrollable content pane with proportional scrollbars. |
| `animate` / `timeline` | ✅ Stable | Physics-based springs and GSAP-style timelines. |
| `KeyMap` / `InputStack` | ✅ Stable | Layered, declarative input dispatch for modal UIs. |
| `composite` / `modal` / `toast` / `drawer` | ✅ Stable | ANSI-safe overlay compositing, dialogs, notifications, side panels. |
| `navigableTable` | ✅ Stable | Keyboard-navigable data table with focus, scrolling, and vim keybindings. |
| `browsableList` | ✅ Stable | Scrollable list with focus tracking, descriptions, and page navigation. |
| `filePicker` | ✅ Stable | Directory browser with IOPort integration and extension filtering. |
| `commandPalette` | ✅ Stable | Filterable action list with search and keyboard navigation. |
| `tooltip` | ✅ Stable | Positioned overlay with directional placement and screen clamping. |
| `focusArea` | ✅ Stable | Scrollable pane with colored focus gutter and horizontal overflow. |
| `dagPane` | ✅ Stable | Interactive DAG viewer with arrow-key navigation and auto-highlight path. |

---

## Quick Start

### 1. Interactive Prompts (Core)
Beautiful prompts that automatically degrade to numbered lists in CI environments.

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { input, select, group } from '@flyingrobots/bijou';

initDefaultContext();

const setup = await group({
  project: () => input({ title: 'Project Name', required: true }),
  type:    () => select({ 
    title: 'Template', 
    options: [{ label: 'TypeScript', value: 'ts' }, { label: 'Go', value: 'go' }] 
  }),
});
```

### 2. Full-Scale TUI (Runtime)
Unidirectional state management with physics-based animations. (See [demo-tui.ts](./demo-tui.ts))

```typescript
import { run, quit, type App, type KeyMsg } from '@flyingrobots/bijou-tui';

type Model = { count: number };

const app: App<Model, never> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => {
    if (msg.type === 'key') {
      if (msg.key === 'q') return [model, [quit()]];
      if (msg.key === '+') return [{ count: model.count + 1 }, []];
    }
    return [model, []];
  },
  view: (model) => `Count: ${model.count}\nPress + to increment, q to quit`
};

run(app);
```

---

## 📦 Packages

*   [`@flyingrobots/bijou`](./packages/bijou) — Zero-dependency core & components.
*   [`@flyingrobots/bijou-node`](./packages/bijou-node) — Node.js platform adapter (Chalk, Readline).
*   [`@flyingrobots/bijou-tui`](./packages/bijou-tui) — Interactive TEA runtime & physics.

---

Licensed under [MIT](./LICENSE). Built with 💎 by [Flying Robots](https://flyingrobots.dev).

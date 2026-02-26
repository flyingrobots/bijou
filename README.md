# 💎 Bijou

### Professional TUI engine for TypeScript.
**Resilient by design. Physics-powered. Built for scale.**

Stop building brittle CLIs that break in CI or look like garbage on a server. Bijou is a multi-package TUI engine for building everything from simple interactive scripts to complex, high-fidelity terminal applications.

[![npm](https://img.shields.io/npm/v/@flyingrobots/bijou)](https://www.npmjs.com/package/@flyingrobots/bijou)
[![License](https://img.shields.io/github/license/flyingrobots/bijou)](./LICENSE)

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
A zero-dependency library of 20+ static components and interactive prompts.
*   **Hexagonal Architecture:** Decoupled from Node.js. Test your UI logic in pure TS with zero mocks.
*   **First-class Design Tokens:** (DTCG-compatible) Use your web brand's JSON to drive your terminal's theme.
*   **Components:** `box`, `table`, `tree`, `accordion`, `timeline`, `input`, `select`, `confirm`, `tabs`, `stepper`.

### 2. The High-Performance TUI (`@flyingrobots/bijou-tui`)
An interactive runtime inspired by **The Elm Architecture (TEA)** and **GSAP**.
*   **Physics-Based Motion:** Damped harmonic oscillators (Springs) for 60fps-smooth interfaces.
*   **Flexbox Layout:** A real `flex()` engine with auto-reflow that understands terminal resizing.
*   **Animation Timelines:** Orchestrate complex sequences with GSAP-style position syntax (`+=`, `-=`).

---

## 📊 Feature Comparison

| Feature | **Bijou** | **Ink** | **Blessed** | **Clack** |
| :--- | :--- | :--- | :--- | :--- |
| **Architecture** | **Hexagonal (Ports)** | Monolithic | Monolithic | Procedural |
| **Resilience** | **Native (4-mode)** | Manual / Limited | None | Manual |
| **Animation** | **Physics Springs** | Ad-hoc Tweens | None | CSS-like |
| **Layout** | **Flexbox + Reflow** | Yoga (Flexbox) | Fixed Widgets | Rows only |
| **Testing** | **Mock-free Adapters** | Terminal Spawning | Difficult | I/O Mocks |

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
import { run, quit, type App } from '@flyingrobots/bijou-tui';

const app: App<Model> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => {
    if (msg.key === 'q') return [model, [quit()]];
    if (msg.key === '+') return [{ count: model.count + 1 }, []];
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

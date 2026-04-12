# Guide — Bijou

This is the developer-level operator guide for Bijou. Use it for orientation, the productive-fast path, and to understand how the monorepo packages orchestrate the terminal surface.

For deep-track doctrine, render pipeline internals, and repository-wide engineering standards, use [ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md).

## Choose Your Lane

### 1. Build a CLI or Script
Use the core toolkit for prompts, structured output, and environment detection.
- **Read**: [`@flyingrobots/bijou` Guide](./packages/bijou/GUIDE.md)
- **Host**: [`@flyingrobots/bijou-node` Guide](./packages/bijou-node/GUIDE.md)

### 2. Build an Interactive TUI
Use the TEA runtime for full-screen applications with layout, motion, and overlays.
- **Read**: [`@flyingrobots/bijou-tui` Guide](./packages/bijou-tui/GUIDE.md)
- **Host**: [`@flyingrobots/bijou-node` Guide](./packages/bijou-node/GUIDE.md)

### 3. Learn the Monorepo
Understand the project's identity, work doctrine, and architectural boundaries.
- **Read**: [`docs/README.md`](./docs/README.md) (The Documentation Map)
- **Read**: [`docs/VISION.md`](./docs/VISION.md) (Core Tenets)
- **Read**: [`docs/METHOD.md`](./docs/METHOD.md) (Work Doctrine)

### 4. Proving Ground
See Bijou in action by running the documentation app.
- **Run**: `npm run dogfood`
- **Read**: [`docs/DOGFOOD.md`](./docs/DOGFOOD.md)

## Big Picture: Package Orchestration

Bijou is a tiered engine. You choose your depth based on the task:

1. **`@flyingrobots/bijou` (Foundation)**: Pure TypeScript. No I/O. Logic for boxes, tables, trees, and prompts. This layer produces `Surface` or `LayoutNode` objects.
2. **`@flyingrobots/bijou-tui` (Engine)**: The TEA loop. It orchestrates those surfaces, manages focus, drives animations, and calculates the minimal ANSI delta to update the screen.
3. **`@flyingrobots/bijou-node` (Host)**: The physical bridge. It provides the terminal dimensions, handles `stdin` events, and emits the final ANSI bytes to `stdout`.

## Orientation Checklist

- [ ] **I am building a standalone tool**: Start with `packages/bijou/GUIDE.md`.
- [ ] **I am building a full-screen dashboard**: Start with `packages/bijou-tui/GUIDE.md`.
- [ ] **I need to localize my app**: Start with `packages/bijou-i18n/README.md`.
- [ ] **I am debugging the render loop**: Start with `ADVANCED_GUIDE.md`.
- [ ] **I am contributing to the repository**: Start with `docs/METHOD.md` and `docs/BEARING.md`.

## Rule of Thumb

If you need a comprehensive inventory, use [docs/README.md](./docs/README.md).

If you need to know "what's true right now," use [docs/BEARING.md](./docs/BEARING.md).

If you are just starting, use the [README.md](./README.md) and the package guides linked above.

---
**The goal is to move the terminal from a collection of widgets to a professional application bedrock.**

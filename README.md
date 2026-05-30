# Bijou

Bijou is a TypeScript toolkit for building serious terminal software. It treats the terminal as a real two-dimensional character grid of cells, each cell carrying a glyph, color, and style, so you can reason about layout, diffing, and accessibility as first-class concerns instead of post-processing escape strings.

[![npm version](https://img.shields.io/npm/v/@flyingrobots/bijou)](https://www.npmjs.com/package/@flyingrobots/bijou)
[![License](https://img.shields.io/github/license/flyingrobots/bijou)](./LICENSE)

![Bijou demo](https://github.com/user-attachments/assets/8117f6ad-41e0-470f-aeb6-6722ec44fa2c)

## Prerequisites

- Node.js 18, 20, or 22 LTS
- Node.js 22 is recommended for local development
- npm 8+ (or your preferred npm-compatible package manager)

The project is tested against Node.js 18, 20, and 22 in CI. The repository uses a strict Node floor and this check is enforced before install.

The repo's primary human-facing guide is [DOGFOOD](./docs/DOGFOOD.md).
The `examples/` tree is for runnable examples and is intentionally maintained as secondary/internal reference material.

## Start Here

The fastest path is to get to the first visible output in under a minute.

1. Clone and install once:

   ```bash
   git clone https://github.com/flyingrobots/bijou.git
   cd bijou
   npm install
   ```

2. Run the hello example (instant terminal output):

   ```bash
   npm run hello
   ```

3. Run the counter example (slightly richer interactive surface):

   ```bash
   npm run counter
   ```

4. Run DOGFOOD, Bijou's live documentation and proving surface:

   ```bash
   npm run dogfood
   ```

   This launches a full-screen interactive TUI application. Press `q` or `Ctrl-C` to exit.

## What You Can Build

Bijou is split into packages to make intent clear.

| Need | Start with |
| :--- | :--- |
| Prompts, boxes, plain CLI output | [`@flyingrobots/bijou`](./packages/bijou/) |
| A hosted Node TUI app | [`@flyingrobots/bijou-node`](./packages/bijou-node/) and [`@flyingrobots/bijou-tui`](./packages/bijou-tui/) |
| A framed application shell | [`@flyingrobots/bijou-tui-app`](./packages/bijou-tui-app/) or `create-bijou-tui-app` |
| Runtime localization | [`@flyingrobots/bijou-i18n`](./packages/bijou-i18n/) |
| CSV/TSV/JSON localization workflow tools | [`@flyingrobots/bijou-i18n-tools`](./packages/bijou-i18n-tools/) |
| Story and component preview work | `npm run storybook` |
| Performance and long-running stability checks | `npm run bench` and `npm run soak` |
| MCP integration | [`@flyingrobots/bijou-mcp`](./packages/bijou-mcp/) |

## Quick Start: Tiny Interactive App

This is the minimal app shape: initialize state, update on messages, render from model.

```ts
import { stringToSurface } from '@flyingrobots/bijou';
import { startApp } from '@flyingrobots/bijou-node';
import { isKeyMsg, quit, type App } from '@flyingrobots/bijou-tui';

interface Model {
  readonly text: string;
}

const app: App<Model, never> = {
  init: () => [{ text: 'Hello, Bijou!' }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg) && msg.key === 'q') {
      return [model, [quit()]];
    }
    return [model, []];
  },

  view: (model) =>
    stringToSurface(`${model.text}\n\nPress q to exit.`, Math.max(24, model.text.length), 3),
};

await startApp(app);
```

The important rule is simple: input creates messages, update computes state + commands, and view is pure.

## Scaffolder: Fastest Path to Your App

If you want a complete starter project instead of editing the repo examples directly, use the scaffolder:

```bash
npm create bijou-tui-app@latest my-app
cd my-app
npm install
npm run dev
```

The generated project wires a modern host context and includes a working baseline app.

## Dogfood Orientation and Controls

DOGFOOD is the canonical proof surface for real architecture behavior, covering:

- component explorer navigation and nested layout states,
- Blocks section and binding demos,
- locale switching in the settings pane,
- shell status handling,
- interactive smoke surfaces,
- and performance instrumentation.

You should see:

- component explorer navigation model
- component pages for Blocks and block previews
- a settings drawer opened with `F2`
- a performance HUD toggled with the backtick key `` ` ``

Useful keys in DOGFOOD:

| Key | Action |
| :--- | :--- |
| `F2` | Open or close settings drawer. |
| `` ` `` | Toggle performance HUD. |
| `Tab` | Move focus through panes. |
| `j`, `k`, arrow keys | Navigate in lists and docs. |
| `q` | Quit. |

If you need to reset after a bad input sequence, use `Ctrl-C` to hard-exit.

## Package Map

| Package | Role |
| :--- | :--- |
| [`@flyingrobots/bijou`](./packages/bijou/) | Core toolkit: prompts, surfaces, components, themes, blocks, ports, and pure contracts. |
| [`@flyingrobots/bijou-tui`](./packages/bijou-tui/) | Interactive runtime: TEA loop, input, layout, motion, overlays, and shell support. |
| [`@flyingrobots/bijou-node`](./packages/bijou-node/) | Node.js adapters for IO, terminal hosting, styling, and worker helpers. |
| [`@flyingrobots/bijou-tui-app`](./packages/bijou-tui-app/) | Batteries-included framed shell and higher-level app composition. |
| [`create-bijou-tui-app`](./packages/create-bijou-tui-app/) | Project scaffolder for hosted Bijou TUI apps. |
| [`@flyingrobots/bijou-mcp`](./packages/bijou-mcp/) | MCP server package for exposing Bijou-backed tools and structured output. |
| [`@flyingrobots/bijou-i18n`](./packages/bijou-i18n/) | Localization runtime, fallback handling, and locale port. |
| [`@flyingrobots/bijou-i18n-tools`](./packages/bijou-i18n-tools/) | Provider-neutral localization workflow tools for source tables, catalogs, and pseudo-localization. |
| [`@flyingrobots/bijou-i18n-tools-node`](./packages/bijou-i18n-tools-node/) | Node-hosted localization file and bundle loaders. |
| [`@flyingrobots/bijou-i18n-tools-xlsx`](./packages/bijou-i18n-tools-xlsx/) | Spreadsheet adapters for localization workflows. |

## Choosing Your Path

Bijou exposes three API tiers that match common project needs.

| Tier | Entry Point | Package | Use When |
| :--- | :--- | :--- | :--- |
| 1 | `startApp(app)` | `@flyingrobots/bijou-node` | Simple CLI output, prompts, scripted interactive flow, or tiny apps that do not need custom pipeline wiring. |
| 2 | `run(app, { ctx })` | `@flyingrobots/bijou-tui` | Custom pipeline stages, advanced host initialization, locale port wiring, mouse input, or custom startup state handling. |
| 3 | `createFramedApp(config)` | `@flyingrobots/bijou-tui-app` | Full framed shell with header, status line, navigation model, and settings drawer. |

Tier 1 is the easiest path to first output. The counter example uses tier 1. The DOGFOOD application uses tier 2 because it initializes context and locale before starting the core loop.

Most production apps eventually move to tier 2 or tier 3.

## Documentation Map

| Document | Use it for |
| :--- | :--- |
| [`GUIDE.md`](./GUIDE.md) | Orientation, fast paths, and monorepo workflow. |
| [`ADVANCED_GUIDE.md`](./ADVANCED_GUIDE.md) | Deeper runtime, rendering, shader, and proving workflows. |
| [`docs/guides/render-pipeline.md`](./docs/guides/render-pipeline.md) | Render pipeline internals and middleware extension patterns. |
| [`docs/DOGFOOD.md`](./docs/DOGFOOD.md) | DOGFOOD command surface, keyboard orientation, and command coverage notes. |
| [`DOGFOOD`](./docs/DOGFOOD.md) | Human-facing walkthrough and interactive proof surface. |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Ports, adapters, package stack, and structural rules. |
| [`docs/VISION.md`](./docs/VISION.md) | Project identity and long-term product intent. |
| [`docs/BEARING.md`](./docs/BEARING.md) | Current execution direction and active tensions. |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md) | Broad strategic direction and active themes. |
| [`docs/design-system/README.md`](./docs/design-system/README.md) | Design language, components, and UI foundations. |
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) | Historical truth of merged behavior. |

## Running Tests

Before running tests, build first:

```bash
npm run build
npm test
```

The full suite includes:

- unit tests
- DOGFOOD coverage gate
- interactive example smoke checks
- canary smoke tests
- PTY smoke tests

For long-running verification runs:

- `npm run soak`
- `npm run bench`

To skip PTY tests in non-TTY environments, set:

```bash
BIJOU_SKIP_PTY_TESTS=1
```

The suite will print an explicit warning and continue without PTY checks.

## Localization And i18n

Localization is split into runtime and tooling packages.

- [`@flyingrobots/bijou-i18n`](./packages/bijou-i18n/) resolves catalog lookup, fallback behavior, and missing-string policy.
- [`@flyingrobots/bijou-i18n-tools`](./packages/bijou-i18n-tools/) handles source tables, hashing, diffing, pseudo-localization, and validation.

DOGFOOD localization source lives in:

```text
examples/docs/i18n/source/dogfood-strings.csv
```

Useful scripts:

```bash
npm run dogfood:i18n:build
npm run dogfood:i18n:check
npm run dogfood:i18n:coverage
```

Runtime uses English as fallback and overlays the selected locale. Development mode keeps missing translations visible instead of silently hiding them.

## Blocks

Blocks are higher-level reusable building blocks introduced in v5. They are reusable layout and behavior contracts for terminal components with explicit data bindings. Instead of hand-assembling raw `LayoutNode` trees for every screen, blocks provide a small vocabulary of typed, testable authoring units.

The binding model is unidirectional:

1) providers create immutable snapshots
2) snapshots are rendered through binding-aware components
3) components emit intent via commands
4) app update functions own state changes

This model lets blocks reuse layout and behavior across apps while preserving deterministic render semantics.

## Storybook and Preview Workflow

Run focused previews without entering the full DOGFOOD structure:

```bash
npm run storybook
npm run storybook:index
```

`storybook:index` is especially useful for deterministic fixture capture and API review.

## What's New in v5.0.0

Bijou `v5.0.0` made the hosted shell, Node host bootstrapping, localization runtime, and release-proof DOGFOOD surface more coherent as a product line.

- `createFramedApp()`, `runFramedApp(...)`, and `startApp(app)` now share a cleaner hosted runtime path.
- `@flyingrobots/bijou-node` supports easier theme selection through hosted app options.
- DOGFOOD is the preferred docs and proof surface for release smoke, Blocks previews, i18n workflow checks, and interactive examples.
- The i18n packages now separate runtime lookup from CSV/TSV/JSON catalog workflow tools.

Read the short-form [changelog](./docs/CHANGELOG.md), the long-form
[What's New guide](./docs/releases/5.0.0/whats-new.md), and the
[migration guide](./docs/releases/5.0.0/migration-guide.md).

## Tests, Soak, and Performance

Useful command set while working:

```bash
npm run lint
npm run typecheck:test
npm test
npm run docs:inventory
npm run verify:interactive-examples
npm run smoke:dogfood
npm run smoke:dogfood:landing
npm run smoke:dogfood:docs
npm run soak
npm run bench
```

`npm run bench` runs core rendering and diff benchmarks for short-cycle comparisons. `npm run soak` keeps the runtime under longer, stress-oriented load.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for workflow and PR expectations.

- For backlog-first contributions, start with `docs/method/backlog/inbox/`.
- If you want beginner-friendly tickets, start from [`GOOD_FIRST_ISSUES.md`](./GOOD_FIRST_ISSUES.md).

## Future Direction

Bijou is moving from architecture-heavy foundations into more visible product proof. The next areas of investment are:

- more complete first-party Blocks and rendered block previews
- richer DOGFOOD coverage for Blocks, localization, Storybook, and examples
- stronger localization workflows, including broader catalog coverage and better translator ergonomics
- replay and scenario pipelines for deterministic debugging
- lower-allocation rendering and more soak/performance gates
- richer MCP and machine-readable interactivity
- more mature data visualization components
- ecosystem adapters for additional hosts and workflows

The durable goal is straightforward: build terminal apps that stay inspectable,
mode-aware, localized, testable, and fast without sacrificing product quality.

---

Built with terminal ambition by [FLYING ROBOTS](https://github.com/flyingrobots).

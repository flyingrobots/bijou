# Bijou

Build terminal software with taste.

Bijou is a TypeScript toolkit for **serious terminal interfaces**: rich local TUIs, resilient CLIs, CI-safe output, and accessible runs that do not collapse into ANSI soup the moment they leave your laptop.

It can be a prompt toolkit.  
It can be a dashboard runtime.  
It can be a framed app shell.  
It can be a rendering engine with surfaces, layout trees, diffing, motion, workers, and deterministic demo capture.

[![npm version](https://img.shields.io/npm/v/@flyingrobots/bijou)](https://www.npmjs.com/package/@flyingrobots/bijou)
[![License](https://img.shields.io/github/license/flyingrobots/bijou)](./LICENSE)

![Bijou demo](https://github.com/user-attachments/assets/8117f6ad-41e0-470f-aeb6-6722ec44fa2c)

## Why Bijou Hits Different

Most terminal UI libraries make you pick one story:

- a nice-looking local TTY experience that breaks down in CI or pipes
- a pile of string helpers with no real app/runtime model
- a full-screen renderer that forgets the terminal is still a terminal

Bijou is built around a different bet:

- **The core toolkit degrades gracefully by design.** The same codebase can stay useful across local TTYs, CI logs, piped output, and accessibility-oriented runs.
- **The V3 runtime is real.** Surfaces, layout trees, diff rendering, motion, workers, and a programmable pipeline are not marketing nouns here. They ship.
- **The package split is honest.** `@flyingrobots/bijou` is the degradation-first toolkit. `@flyingrobots/bijou-tui` is the high-fidelity runtime. `@flyingrobots/bijou-tui-app` is the shell. `@flyingrobots/bijou-node` is the Node boundary.
- **Tests are treated as product surface.** The repo ships example smoke suites, scaffolding canaries, runtime regressions, worker tests, and deterministic recorder coverage.

## Tour De Features

### 1. A Degradation-First Core Toolkit

At the center is [`@flyingrobots/bijou`](./packages/bijou/): a pure TypeScript package with zero runtime dependencies and a very practical component set.

You get:

- forms: `input`, `select`, `multiselect`, `confirm`, `textarea`, `filter`, `wizard`, `group`
- structural UI: `box`, `headerBox`, `separator`, `tabs`, `breadcrumb`, `stepper`, `paginator`
- surface-first companions: `boxSurface`, `headerBoxSurface`, `separatorSurface`, `alertSurface`, `tableSurface`
- data views: `table`, `tree`, `accordion`, `timeline`, `dag`, `dagSlice`, `dagStats`
- output helpers: `badge`, `alert`, `kbd`, `log`, `progressBar`, `hyperlink`, `markdown`
- themes and tokens: built-in presets plus custom token graphs and DTCG-friendly theme loading

This is not just a string-template library. It understands output modes and makes mode-aware choices automatically.

### 2. A Real V3 Rendering Engine

[`@flyingrobots/bijou-tui`](./packages/bijou-tui/) is where the V3 story gets sharp.

It gives you:

- a TEA-style runtime with `init`, `update`, `view`, and command flow
- `ViewOutput` as the public render contract: `string | Surface | LayoutNode`
- buffered `Surface` rendering instead of blind full-frame repainting
- diff-based terminal output
- layout primitives like `flex`, `vstack`, `hstack`, `grid`, and `viewport`
- overlays, drawers, modals, command palettes, and input stacking
- motion with springs, tweens, and keyed reconciliation
- a programmable render pipeline

This is the part of Bijou that feels like building an app, not decorating a string.

The practical payoff in the current release line is simple: you do not need to cross back through `surfaceToString(...)` for common layout chrome anymore. Core helpers like `boxSurface()`, `headerBoxSurface()`, `separatorSurface()`, `alertSurface()`, and `tableSurface()` are now available when you want to stay on the V3-native path.

### 3. A Batteries-Included Shell

[`@flyingrobots/bijou-tui-app`](./packages/bijou-tui-app/) is the opinionated app shell:

- framed chrome
- tabs
- footer/help/status areas
- drawer and modal flows
- command palette integration
- a production-shaped default app skeleton

If you want to ship something dashboard-like fast, this is the shortest path.

### 4. CSS-Like Styling For Terminal UIs

V3 ships BCSS support through `run(app, { css })`.

What that means in practice:

- type, class, and id selectors
- token lookups via `var(token.path)`
- terminal width/height media queries
- documented styling on supported V3 surface primitives and framed shell regions

It is intentionally scoped in `3.0.0`, but it is real and useful now, not a stubbed promise.

### 5. Motion, Workers, And Native Demo Recording

Bijou leans into things most terminal UI stacks never quite finish:

- **motion** for keyed layout transitions and animated UI state changes
- **worker runtime support** via `runInWorker()` / `startWorkerApp()`
- **native demo recording** based on captured `Surface[]`, not PTY video hacks

That last one matters more than it sounds. If your renderer is deterministic enough to record from render state directly, it is usually deterministic enough to test seriously too.

### 6. A Test Story You Can Actually Trust

Bijou’s release gates include more than unit tests:

- runtime and worker regressions
- example smoke coverage
- interactive PTY-driven smoke flows
- scaffolding canaries that generate and run downstream apps from local tarballs
- package dry-runs
- recorder tests

This repo is opinionated about one thing: if the examples, scaffolded apps, and packaged artifacts are part of the story, they should be part of the test surface.

## Package Map

| Package | What it is for |
| --- | --- |
| [`@flyingrobots/bijou`](./packages/bijou/) | Core toolkit: components, forms, themes, output modes, surfaces, test adapters |
| [`@flyingrobots/bijou-node`](./packages/bijou-node/) | Node runtime, IO, style adapters, worker runtime, recorder utilities |
| [`@flyingrobots/bijou-tui`](./packages/bijou-tui/) | High-fidelity TUI runtime, layout, motion, pipeline, interaction |
| [`@flyingrobots/bijou-tui-app`](./packages/bijou-tui-app/) | Framed shell and batteries-included app patterns |
| [`create-bijou-tui-app`](./packages/create-bijou-tui-app/) | `npm create` scaffolder for a runnable Bijou app |

All packages are versioned in lock-step.

## Design System

Bijou now ships a design-system documentation track in addition to API docs.

Start here:

- [Design System Overview](./docs/design-system/README.md)
- [Foundations](./docs/design-system/foundations.md)
- [Patterns](./docs/design-system/patterns.md)
- [Component Families](./docs/design-system/component-families.md)
- [Data Visualization Policy](./docs/design-system/data-visualization.md)

If you want the blunt version: these docs answer not just "what exports exist?" but "what is this component for, when should I use it, when should I avoid it, and what is the TUI-versus-core boundary?"

## Quick Start

### Install The Core Toolkit

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

### Install The Full Runtime Stack

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node @flyingrobots/bijou-tui
```

### Scaffold A New App

```bash
npm create bijou-tui-app@latest my-app
```

## Quick Start: Core CLI Flow

```ts
import { group, headerBox, input, select } from '@flyingrobots/bijou';
import { initDefaultContext } from '@flyingrobots/bijou-node';

initDefaultContext();

const answers = await group({
  project: () => input({ title: 'Project name', required: true }),
  template: () =>
    select({
      title: 'Template',
      options: [
        { label: 'TypeScript', value: 'ts' },
        { label: 'Go', value: 'go' },
      ],
    }),
});

console.log(
  headerBox('Scaffold', {
    detail: `${answers.project} (${answers.template})`,
  }),
);
```

## Quick Start: Interactive Runtime

```ts
import { type App, quit, run } from '@flyingrobots/bijou-tui';
import { initDefaultContext } from '@flyingrobots/bijou-node';

initDefaultContext();

type Model = { count: number };

const app: App<Model> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => {
    if (msg.type === 'key') {
      if (msg.key === 'q') return [model, [quit()]];
      if (msg.key === '+' || msg.key === 'k') return [{ count: model.count + 1 }, []];
      if (msg.key === '-' || msg.key === 'j') return [{ count: model.count - 1 }, []];
    }
    return [model, []];
  },
  view: (model) => `Count: ${model.count}\n\n+/- or j/k to change, q to quit`,
};

await run(app);
```

## Quick Start: Surface-First Core Composition

```ts
import { badge, boxSurface, separatorSurface, tableSurface } from '@flyingrobots/bijou';
import { hstackV3, vstackV3 } from '@flyingrobots/bijou-tui';
import { initDefaultContext } from '@flyingrobots/bijou-node';

const ctx = initDefaultContext();

const stats = tableSurface({
  columns: [{ header: 'Service' }, { header: 'Status' }],
  rows: [['api', badge('LIVE', { variant: 'success', ctx })]],
  ctx,
});

const card = boxSurface(
  vstackV3(
    separatorSurface({ label: 'Deploy Status', width: stats.width, ctx }),
    stats,
  ),
  { title: 'Runtime', padding: { top: 1, bottom: 1, left: 2, right: 2 }, ctx },
);
```

## Output Modes, Automatically

Bijou is designed to do the right thing without making you micromanage output strategy.

| Mode | Trigger | What Bijou does |
| --- | --- | --- |
| `interactive` | TTY stdout | Full color, full runtime, input loop, motion, rich rendering |
| `static` | CI with TTY stdout | Single-frame render, no interactive animation loop |
| `pipe` | Non-TTY stdout, `NO_COLOR`, or `TERM=dumb` | Plain-text-safe output |
| `accessible` | `BIJOU_ACCESSIBLE=1` | Linearized, screen-reader-friendly flow |

This is not an afterthought. It is the core product idea.

## The Feature Tour In Repo Form

Clone the repo and run the canonical entrypoints:

```bash
git clone https://github.com/flyingrobots/bijou
cd bijou
npm install

# Core toolkit tour
npx tsx demo.ts

# Full V3 app-shell tour
npx tsx demo-tui.ts
```

Then walk the flagship V3 examples:

- [`examples/v3-demo`](./examples/v3-demo/) — the smallest honest V3 starter
- [`examples/v3-css`](./examples/v3-css/) — BCSS selectors, token vars, and media queries
- [`examples/v3-motion`](./examples/v3-motion/) — keyed motion, springs, and tweens
- [`examples/v3-subapp`](./examples/v3-subapp/) — nested TEA composition
- [`examples/v3-worker`](./examples/v3-worker/) — worker runtime plus message channel
- [`examples/v3-pipeline`](./examples/v3-pipeline/) — programmable pipeline extension

For the full example index, see [`examples/README.md`](./examples/README.md) and [`docs/EXAMPLES.md`](./docs/EXAMPLES.md).

## What Shipped In v3.0.0

`3.0.0` was not a cosmetic version bump. It locked in a more truthful product shape:

- `@flyingrobots/bijou` stays the pure, degradation-first toolkit
- `@flyingrobots/bijou-tui` is the high-fidelity runtime
- `@flyingrobots/bijou-tui-app` is the shell layer
- `@flyingrobots/bijou-node` owns the Node boundary, worker runtime, and recorder helpers
- `App.view` and framed panes now honestly support `string | Surface | LayoutNode`
- the flagship runtime path is surface/layout-native at the frame boundary
- BCSS, motion, Fractal TEA helpers, worker runtime, and native demo recording all ship as real documented features

If you are upgrading an existing app, read the migration guide first:

- [`docs/MIGRATING_TO_V3.md`](./docs/MIGRATING_TO_V3.md)

And for the full release notes:

- [`docs/CHANGELOG.md`](./docs/CHANGELOG.md)

## Local Development

```bash
npm run build
npm run build:watch
npm run lint
npm test
npm run typecheck:test
npm run smoke:examples:all
npm run smoke:canaries
npm run clean
```

### What `smoke:canaries` Actually Does

It is not just another example runner.

It:

- packs the current workspace packages
- generates a stock `create-bijou-tui-app` project from local artifacts
- installs it from local tarballs
- builds it
- PTY-smokes real tab/drawer/resize/quit flows
- also validates an internal non-interactive core canary app

That gives the repo a downstream contract check, not just an internal unit check.

## Documentation Map

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — package graph, ports, runtime model
- [`docs/MIGRATING_TO_V3.md`](./docs/MIGRATING_TO_V3.md) — upgrade guide for existing apps
- [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) — release notes
- [`docs/EXAMPLES.md`](./docs/EXAMPLES.md) — curated example map
- [`packages/bijou/GUIDE.md`](./packages/bijou/GUIDE.md) — core package guide
- [`packages/bijou-node/GUIDE.md`](./packages/bijou-node/GUIDE.md) — Node adapter guide
- [`packages/bijou-tui/GUIDE.md`](./packages/bijou-tui/GUIDE.md) — runtime guide

## License

MIT ([`LICENSE`](./LICENSE))

---

<p align="center">
Built with terminal ambition by <a href="https://github.com/flyingrobots">FLYING ROBOTS</a>
</p>

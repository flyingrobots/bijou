# Bijou v4.0.0

**Bijou** is a TypeScript toolkit for building delightful terminal software.

The public stack has two main UI/runtime layers, plus Node and localization support packages:

- [`@flyingrobots/bijou`](./packages/bijou/) for prompts, output helpers, themes, and mode-aware components
- [`@flyingrobots/bijou-tui`](./packages/bijou-tui/) for surface-based interactive apps, layout, motion, overlays, and framed shells

The philosophy is practical over ornamental: local TTY apps should feel great, while the same codebase gracefully degrades in CI, pipes, and accessibility-focused environments.

[![npm version](https://img.shields.io/npm/v/@flyingrobots/bijou)](https://www.npmjs.com/package/@flyingrobots/bijou)
[![License](https://img.shields.io/github/license/flyingrobots/bijou)](./LICENSE)

![Bijou demo](https://github.com/user-attachments/assets/8117f6ad-41e0-470f-aeb6-6722ec44fa2c)

## What’s New in v4.0.0

v4.0.0 marks the pure-surface release for the interactive runtime.

Key changes:

- the `@flyingrobots/bijou-tui` runtime public view contract is `Surface | LayoutNode`
- framed shells, overlays, transitions, viewport helpers, and most higher-value layout/runtime paths now stay on the surface path instead of relying on implicit string fallback
- the core toolkit still supports string-first CLI and prompt flows where that is the right abstraction
- the repo includes deterministic tests, example smoke coverage, scaffold canaries, and release-readiness checks

In short: the runtime is surface-first, but the toolkit is not string-free. This is a more honest and focused evolution than claiming “everything is now a surface.”

## Package Map

| Package | Role |
| --- | --- |
| [`@flyingrobots/bijou`](./packages/bijou/) | Core toolkit: prompts, components, themes, output modes, surfaces, ports |
| [`@flyingrobots/bijou-tui`](./packages/bijou-tui/) | Interactive runtime: TEA loop, layout, overlays, motion, diffed rendering |
| [`@flyingrobots/bijou-node`](./packages/bijou-node/) | Node adapters: runtime, IO, style ports, recorder and worker helpers |
| [`@flyingrobots/bijou-tui-app`](./packages/bijou-tui-app/) | Opinionated app shell with tabs, drawers, help, and status areas |
| [`create-bijou-tui-app`](./packages/create-bijou-tui-app/) | Scaffolder for a runnable Bijou TUI app |
| [`@flyingrobots/bijou-i18n`](./packages/bijou-i18n/) | In-memory localization runtime: catalogs, direction, and runtime-safe lookups |
| [`@flyingrobots/bijou-i18n-tools`](./packages/bijou-i18n-tools/) | Localization workflow tooling: authoring, stale detection, exchange, compilation |
| [`@flyingrobots/bijou-i18n-tools-node`](./packages/bijou-i18n-tools-node/) | Node filesystem helpers for localization exchange workflows |
| [`@flyingrobots/bijou-i18n-tools-xlsx`](./packages/bijou-i18n-tools-xlsx/) | XLSX workbook adapters for localization exchange workflows |

All published packages are versioned in lock-step.

## What Bijou Is Good At

- building prompt-driven CLIs that still lower cleanly in pipes and CI
- building full-screen terminal apps with a real update/view/runtime model
- keeping tests close to user-visible behavior through surfaces, smoke suites, and scaffolding canaries
- giving you a documented design-system track instead of leaving component choice entirely to improvisation

## DOGFOOD

DOGFOOD is the canonical Bijou docs surface and proving app.

It is not just an example. It is where the repo now proves:

- the framed shell and interactive runtime in a real full-screen product surface
- the component-family field guide and design-language track in one living docs app
- shell concerns like search, settings, help, quit, and layout behavior under real usage

Run it locally:

```bash
npm run dogfood
```

## Quick Start

### Core CLI Flow

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

### Interactive Runtime

```ts
import { type App, quit, run, vstackSurface } from '@flyingrobots/bijou-tui';
import { badge, boxSurface } from '@flyingrobots/bijou';
import { initDefaultContext } from '@flyingrobots/bijou-node';

const ctx = initDefaultContext();

type Model = { count: number };

const app: App<Model> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => {
    if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
    if (msg.type === 'key' && msg.key === 'k') return [{ count: model.count + 1 }, []];
    if (msg.type === 'key' && msg.key === 'j') return [{ count: model.count - 1 }, []];
    return [model, []];
  },
  view: (model) =>
    boxSurface(
      vstackSurface(
        `Current count: ${model.count}`,
        badge(model.count > 10 ? 'HIGH' : 'LOW', { variant: 'info', ctx }),
      ),
      { title: 'Counter', padding: 1, ctx },
    ),
};

await run(app);
```

### Scaffold A New App

```bash
npm create bijou-tui-app@latest my-app
```

## Output Modes

Bijou is designed to adapt to the environment instead of assuming every run is a full local TTY.

| Mode | Typical trigger | What happens |
| --- | --- | --- |
| `interactive` | Local TTY | Full runtime, input loop, color, motion, shell chrome |
| `static` | CI with TTY stdout | Single-frame render, no interactive loop |
| `pipe` | Non-TTY stdout, `NO_COLOR`, or `TERM=dumb` | Plain-text-safe output |
| `accessible` | `BIJOU_ACCESSIBLE=1` | Linearized, screen-reader-friendly output |

Example:

```ts
import { alert } from '@flyingrobots/bijou';
import { initDefaultContext } from '@flyingrobots/bijou-node';

const ctx = initDefaultContext();

console.log(
  alert('Connection refused on port 5432.', {
    variant: 'error',
    ctx,
  }),
);
```

That same call lowers differently depending on the interaction profile:

```text
interactive / static
┌─────────────────────────────────────┐
│ ✗ Connection refused on port 5432. │
└─────────────────────────────────────┘

pipe
[ERROR] Connection refused on port 5432.

accessible
Error: Connection refused on port 5432.
```

## Design System

Bijou ships a design-system documentation track in addition to API docs, and DOGFOOD is the primary living surface for that work.

Start here:

- [Design System Overview](./docs/design-system/README.md)
- [Foundations](./docs/design-system/foundations.md)
- [Patterns](./docs/design-system/patterns.md)
- [Component Families](./docs/design-system/component-families.md)
- [Data Visualization Policy](./docs/design-system/data-visualization.md)

Those docs are meant to answer:

- what a component is for
- when to use it
- when not to use it
- how it lowers across interaction profiles
- what the nearest related family is

## Documentation Map

- [Docs Index](./docs/README.md)
- [Current Plan](./docs/PLAN.md)
- [DOGFOOD Docs Surface](./examples/docs/README.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Migration Guide](./docs/MIGRATING_TO_V4.md)
- [Changelog](./docs/CHANGELOG.md)
- [Examples Index](./examples/README.md)
- [Curated Example Map](./docs/EXAMPLES.md)
- [Roadmap](./docs/ROADMAP.md)

## Roadmap

These are directions we are actively interested in, but they are not being presented as shipped `4.0.0` features:

- browser and Wasm adapters
- a Bijou-native docs TUI
- a story/studio workflow for isolated component and pattern work
- replay artifacts, richer scenario tooling, and time-travel debugging
- deeper BCSS/devtools work beyond the currently shipped scoped runtime styling

See [docs/PLAN.md](./docs/PLAN.md) for the current execution order and [docs/ROADMAP.md](./docs/ROADMAP.md) for the broader legacy/reference backlog.

## License

Apache-2.0 ([LICENSE](./LICENSE))

---

<p align="center">
Built with terminal ambition by <a href="https://github.com/flyingrobots">FLYING ROBOTS</a>
</p>

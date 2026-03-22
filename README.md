# Bijou v4.0.0

Bijou is a TypeScript toolkit for terminal software.

It has two main layers:

- [`@flyingrobots/bijou`](./packages/bijou/) for prompts, output helpers, themes, and mode-aware components
- [`@flyingrobots/bijou-tui`](./packages/bijou-tui/) for surface-based interactive apps, layout, motion, overlays, and framed shells

The goal is practical rather than ornamental: local TTY apps should feel good, and the same codebase should still behave honestly in CI, pipes, and accessibility-oriented runs.

[![npm version](https://img.shields.io/npm/v/@flyingrobots/bijou)](https://www.npmjs.com/package/@flyingrobots/bijou)
[![License](https://img.shields.io/github/license/flyingrobots/bijou)](./LICENSE)

![Bijou demo](https://github.com/user-attachments/assets/8117f6ad-41e0-470f-aeb6-6722ec44fa2c)

## What Ships In v4.0.0

`4.0.0` is the pure-surface release line for the interactive runtime.

What that means today:

- the `@flyingrobots/bijou-tui` runtime public view contract is `Surface | LayoutNode`
- framed shells, overlays, transitions, viewport helpers, and most higher-value layout/runtime paths now stay on the surface path instead of relying on implicit string fallback
- the core toolkit still supports string-first CLI and prompt flows where that is the right abstraction
- the repo includes deterministic tests, example smoke coverage, scaffold canaries, and release-readiness checks

That is a narrower and more truthful claim than “everything is a surface now.” The runtime is surface-first; the whole toolkit is not string-free.

## Package Map

| Package | Role |
| --- | --- |
| [`@flyingrobots/bijou`](./packages/bijou/) | Core toolkit: prompts, components, themes, output modes, surfaces, ports |
| [`@flyingrobots/bijou-tui`](./packages/bijou-tui/) | Interactive runtime: TEA loop, layout, overlays, motion, diffed rendering |
| [`@flyingrobots/bijou-node`](./packages/bijou-node/) | Node adapters: runtime, IO, style ports, recorder and worker helpers |
| [`@flyingrobots/bijou-tui-app`](./packages/bijou-tui-app/) | Opinionated app shell with tabs, drawers, help, and status areas |
| [`create-bijou-tui-app`](./packages/create-bijou-tui-app/) | Scaffolder for a runnable Bijou TUI app |

All published packages are versioned in lock-step.

## What Bijou Is Good At

- building prompt-driven CLIs that still lower cleanly in pipes and CI
- building full-screen terminal apps with a real update/view/runtime model
- keeping tests close to user-visible behavior through surfaces, smoke suites, and scaffolding canaries
- giving you a documented design-system track instead of leaving component choice entirely to improvisation

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

Bijou ships a design-system documentation track in addition to API docs.

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

See [docs/ROADMAP.md](./docs/ROADMAP.md) for the tracked backlog.

## License

Apache-2.0 ([LICENSE](./LICENSE))

---

<p align="center">
Built with terminal ambition by <a href="https://github.com/flyingrobots">FLYING ROBOTS</a>
</p>

# Bijou

Bijou is a TypeScript toolkit for building serious terminal software: prompts,
CLI flows, full-screen TUI apps, documentation workstations, mode-aware
components, localization pipelines, and machine-readable rendering output.

It treats the terminal as a real character grid instead of a low-resolution
browser. That means layout, input, lowering, localization, and performance are
first-class parts of the system rather than afterthoughts.

[![npm version](https://img.shields.io/npm/v/@flyingrobots/bijou)](https://www.npmjs.com/package/@flyingrobots/bijou)
[![License](https://img.shields.io/github/license/flyingrobots/bijou)](./LICENSE)

![Bijou demo](https://github.com/user-attachments/assets/8117f6ad-41e0-470f-aeb6-6722ec44fa2c)

## Start Here

The fastest way to understand Bijou is to run the docs app that Bijou builds
with itself:

```bash
git clone https://github.com/flyingrobots/bijou.git
cd bijou
npm install
npm run dogfood
```

`npm run dogfood` launches DOGFOOD, the canonical documentation app and proving
surface. It shows the component explorer, Blocks pages, localization settings,
mode-lowering examples, and the current product direction in one TUI.

Useful keys in DOGFOOD:

| Key | Action |
| :--- | :--- |
| `F2` | Open settings, including language selection. |
| `` ` `` | Toggle the performance HUD. |
| `Tab` | Move to the next pane. |
| `j` / `k` or arrow keys | Browse and scroll. |
| `q` | Quit. |

If you want a smaller starter app instead of the monorepo docs surface:

```bash
npm create bijou-tui-app@latest my-app
cd my-app
npm install
npm run dev
```

## What's New in v5.0.0

Bijou `v5.0.0` made the hosted shell, Node host bootstrapping, localization
runtime, and release-proof DOGFOOD surface more coherent as a product line.

- `createFramedApp()`, `runFramedApp(...)`, and `startApp(app)` now share a
  cleaner hosted runtime path.
- `@flyingrobots/bijou-node` supports easier theme selection through hosted app
  options.
- DOGFOOD is the preferred docs and proof surface for release smoke, Blocks
  previews, i18n workflow checks, and interactive examples.
- The i18n packages now separate runtime lookup from CSV/TSV/JSON catalog
  workflow tools.

Read the short-form [changelog](./docs/CHANGELOG.md), the long-form
[What's New guide](./docs/releases/5.0.0/whats-new.md), and the
[migration guide](./docs/releases/5.0.0/migration-guide.md).

## What You Can Build

Bijou can be used at several levels.

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

This is the shape of a small Bijou TUI: initialize state, update state from
messages, and render a surface from the current model.

```ts
import { stringToSurface } from '@flyingrobots/bijou';
import { startApp } from '@flyingrobots/bijou-node';
import { isKeyMsg, quit, type App } from '@flyingrobots/bijou-tui';

interface Model {
  readonly count: number;
}

const app: App<Model> = {
  init: () => [{ count: 0 }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg) && msg.key === 'q') {
      return [model, [quit()]];
    }
    if (isKeyMsg(msg) && msg.key === '+') {
      return [{ count: model.count + 1 }, []];
    }
    if (isKeyMsg(msg) && msg.key === '-') {
      return [{ count: model.count - 1 }, []];
    }

    return [model, []];
  },

  view: (model) =>
    stringToSurface(
      `Counter: ${model.count}\nPress + or - to change\nPress q to quit`,
      32,
      3,
    ),
};

await startApp(app);
```

The important rule is simple: views render state; they do not own business
change. Input becomes intent, update functions change state, and rendering stays
deterministic.

## DOGFOOD: The Real Tour

DOGFOOD stands for _Documentation Of Good Foundational Onboarding and
Discovery_. It is not a toy example. It is the repository's live documentation
application and the place where new ideas have to prove they work in an actual
Bijou surface.

Run it with:

```bash
npm run dogfood
```

Use DOGFOOD to inspect:

- the component explorer
- the Blocks documentation and block previews
- localization settings and missing-translation behavior
- responsive framed layout behavior
- mode lowering across interactive, static, pipe, and accessible outputs
- the performance HUD
- release and architecture guidance

Start with [DOGFOOD](./docs/DOGFOOD.md). The `examples/` tree is
secondary/internal reference material, not the main public docs path.

Read more in [`docs/DOGFOOD.md`](./docs/DOGFOOD.md).

## Storybook And Preview Workflows

Bijou has a Storybook-style workstation for exercising components and docs
surfaces outside the main DOGFOOD navigation.

```bash
npm run storybook
```

For a deterministic text-first index and capture matrix:

```bash
npm run storybook:index
```

The Storybook tools are useful when you want focused component or surface work
without navigating the full docs app.

## Localization And i18n

Bijou localization is split into runtime and workflow packages.

- [`@flyingrobots/bijou-i18n`](./packages/bijou-i18n/) resolves localized
  messages and structured resources at runtime.
- [`@flyingrobots/bijou-i18n-tools`](./packages/bijou-i18n-tools/) handles
  string tables, CSV/TSV parsing, workbook exchange shapes, JSON bundles,
  stale checks, pseudo-localization, and runtime catalog generation.
- [`@flyingrobots/bijou-i18n-tools-node`](./packages/bijou-i18n-tools-node/)
  provides Node-backed file loading helpers.
- [`@flyingrobots/bijou-i18n-tools-xlsx`](./packages/bijou-i18n-tools-xlsx/)
  provides spreadsheet import/export adapters.

DOGFOOD uses a committed CSV source string table:

```text
examples/docs/i18n/source/dogfood-strings.csv
```

Generate runtime JSON catalogs from that table:

```bash
npm run dogfood:i18n:build
npm run dogfood:i18n:check
```

Inspect current DOGFOOD localization debt:

```bash
npm run dogfood:i18n:debt
npm run dogfood:i18n:coverage
```

Export translator-friendly files:

```bash
npm run dogfood:i18n:export -- --locale fr --format csv
npm run dogfood:i18n:export -- --locale fr --format tsv --out /tmp/dogfood-fr
npm run dogfood:i18n:export -- --format json --bundle /tmp/dogfood-catalog.json
```

Runtime catalog loading follows one rule: load English as the fallback catalog,
then load only the selected locale's generated JSON catalogs. Non-English
catalog files should not copy English fallback strings. In development,
missing selected-locale strings render loudly so untranslated UI cannot hide.

### i18n Best Practices

- Keep authoring data in source string tables or catalog files, not scattered
  across rendering code.
- Keep runtime payloads JSON-shaped: plain strings, numbers, booleans, null,
  arrays, and plain objects.
- Do not put `Date`, class instances, functions, symbols, bigint values,
  accessors, cycles, or sparse arrays into localized resources.
- Resolve localization through a port at app and view boundaries. Rendering code
  should ask for localized objects, not read files, parse CSV, or inspect
  process locale state.
- Load fallback catalogs explicitly instead of duplicating fallback strings into
  every translated locale.
- Treat missing strings as visible development debt. Do not make screenshots
  look complete by hiding missing translations.

## Blocks

Blocks are Bijou's higher-level authoring contract for reusable, inspectable UI
surfaces. A block can declare metadata, slots, variants, data requirements,
command intents, stories, schema posture, and mode-lowering behavior.

Current DOGFOOD pages include:

- What are Blocks
- How to Make Your Own Blocks
- Pre-made Blocks
- Block Preview
- How Blocks Lower

The first standard blocks and fixture blocks are visible in DOGFOOD. This area
is still growing: the architecture is ahead of the finished visual catalog, and
future work is focused on making more blocks feel like real product surfaces
instead of just contract examples.

## Tests, Soak, And Performance

Use these commands while working in the repository:

```bash
npm run lint
npm run typecheck:test
npm test
npm run docs:inventory
npm run verify:interactive-examples
```

For DOGFOOD smoke checks:

```bash
npm run smoke:dogfood
npm run smoke:dogfood:landing
npm run smoke:dogfood:docs
```

For longer-running and performance work:

```bash
npm run soak
npm run bench
npm run bench -- --scenario=paint-gradient-rgb
npm run bench:ci:gradient
```

`npm run soak` exercises longer runtime stability scenarios. `npm run bench`
drives the benchmark harness under [`bench/`](./bench/), including focused
rendering and diff scenarios.

## Package Map

| Package | Role |
| :--- | :--- |
| [`@flyingrobots/bijou`](./packages/bijou/) | Core toolkit: prompts, surfaces, components, themes, blocks, ports, and pure contracts. |
| [`@flyingrobots/bijou-tui`](./packages/bijou-tui/) | Interactive runtime: TEA loop, input, layout, motion, overlays, and framed app shell support. |
| [`@flyingrobots/bijou-node`](./packages/bijou-node/) | Node.js adapters for IO, terminal hosting, styling, and worker helpers. |
| [`@flyingrobots/bijou-tui-app`](./packages/bijou-tui-app/) | Batteries-included framed shell and higher-level app composition. |
| [`create-bijou-tui-app`](./packages/create-bijou-tui-app/) | Project scaffolder for hosted Bijou TUI apps. |
| [`@flyingrobots/bijou-mcp`](./packages/bijou-mcp/) | MCP server package for exposing Bijou-backed tools and structured render output. |
| [`@flyingrobots/bijou-i18n`](./packages/bijou-i18n/) | Localization runtime, fallback handling, missing-string reporting, and localization port. |
| [`@flyingrobots/bijou-i18n-tools`](./packages/bijou-i18n-tools/) | Provider-neutral localization workflow tools for string tables, catalogs, bundles, and pseudo-localization. |
| [`@flyingrobots/bijou-i18n-tools-node`](./packages/bijou-i18n-tools-node/) | Node-hosted localization file and bundle loader helpers. |
| [`@flyingrobots/bijou-i18n-tools-xlsx`](./packages/bijou-i18n-tools-xlsx/) | Spreadsheet import/export adapters for localization workflows. |

## Documentation Map

| Document | Use it for |
| :--- | :--- |
| [`GUIDE.md`](./GUIDE.md) | Orientation, fast paths, and monorepo workflow. |
| [`ADVANCED_GUIDE.md`](./ADVANCED_GUIDE.md) | Deeper runtime, rendering, shader, and motion topics. |
| [`docs/DOGFOOD.md`](./docs/DOGFOOD.md) | The docs app, DOGFOOD proof points, i18n workflow, and Storybook commands. |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Ports, adapters, package stack, and structural rules. |
| [`docs/VISION.md`](./docs/VISION.md) | Project identity and long-term product intent. |
| [`docs/BEARING.md`](./docs/BEARING.md) | Current execution gravity and active tensions. |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md) | Broad strategic horizon. |
| [`docs/design-system/README.md`](./docs/design-system/README.md) | Design language, components, and UI foundations. |
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) | Historical truth of merged behavior. |

## Future Direction

Bijou is moving from architecture-heavy foundations into more visible product
proof. The next areas of investment are:

- more complete first-party Blocks and rendered block previews
- richer DOGFOOD coverage for Blocks, localization, Storybook, and examples
- stronger localization workflows, including broader catalog coverage and
  better translator ergonomics
- replay and scenario pipelines for deterministic debugging
- lower-allocation rendering and more soak/performance gates
- richer MCP and machine-readable interactivity
- more mature data visualization components
- ecosystem adapters for additional hosts and workflows

The durable goal is straightforward: build terminal apps that stay inspectable,
mode-aware, localized, testable, and fast without sacrificing product quality.

---

Built with terminal ambition by [FLYING ROBOTS](https://github.com/flyingrobots).

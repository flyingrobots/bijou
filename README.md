# Bijou

TypeScript toolkit for building terminal interfaces that remain usable across local TTYs, CI logs, piped output, and accessibility-focused runs.

[![npm version](https://img.shields.io/npm/v/@flyingrobots/bijou)](https://www.npmjs.com/package/@flyingrobots/bijou)
[![License](https://img.shields.io/github/license/flyingrobots/bijou)](./LICENSE)

![Bijou demo](https://github.com/user-attachments/assets/8117f6ad-41e0-470f-aeb6-6722ec44fa2c)

## Why Bijou

- **Graceful degradation built in**: one codebase adapts automatically to TTY, CI, pipe, and accessible modes.
- **Zero-dependency core**: `@flyingrobots/bijou` is pure TypeScript and platform-agnostic (Ports and Adapters).
- **High-fidelity runtime**: `@flyingrobots/bijou-tui` adds TEA architecture, flex layout, keymaps, overlays, and physics-based animation.
- **Testable without terminal mocking**: use the test adapter to assert rendered strings directly.

## Packages

| Package | Purpose | Link |
| :--- | :--- | :--- |
| `@flyingrobots/bijou` | Core components, forms, themes, and environment detection | [`packages/bijou`](./packages/bijou/) |
| `@flyingrobots/bijou-node` | Node.js adapter for runtime, IO, and styling ports | [`packages/bijou-node`](./packages/bijou-node/) |
| `@flyingrobots/bijou-tui` | Interactive TEA runtime with layout, event bus, and animation | [`packages/bijou-tui`](./packages/bijou-tui/) |
| `@flyingrobots/bijou-tui-app` | Batteries-included framed app skeleton with tab/header/footer chrome | [`packages/bijou-tui-app`](./packages/bijou-tui-app/) |
| `create-bijou-tui-app` | `npm create` scaffolder for generating a runnable Bijou TUI app project | [`packages/create-bijou-tui-app`](./packages/create-bijou-tui-app/) |

All packages are versioned in lock-step.

## Features Breakdown

### Core (`@flyingrobots/bijou`)

- **UI primitives**: `box`, `headerBox`, `table`, `tree`, `accordion`, `tabs`, `breadcrumb`, `stepper`, `paginator`, `timeline`, `dag`, `dagSlice`, `dagStats`.
- **Forms**: `input`, `select`, `multiselect`, `confirm`, `group`, `wizard`, `textarea`, `filter`.
- **Text and output helpers**: `badge`, `alert`, `kbd`, `log`, `hyperlink`, `enumeratedList`, `progressBar`, `spinnerFrame`, `gradientText`, `markdown`.
- **Theming**: DTCG-friendly token support with built-in presets (`nord`, `catppuccin`, `cyan-magenta`, `teal-orange-pink`) and custom theme loading via `BIJOU_THEME`.

### Runtime (`@flyingrobots/bijou-tui`)

- **TEA loop**: `run`, `App`, command-driven update/view flow.
- **Layout**: `flex`, `vstack`, `hstack`, `viewport`, focus-aware panes.
- **Input and interaction**: keymaps, layered input stack, command palette, file picker, browsable list, navigable table.
- **Motion**: spring and tween animation, timeline sequencing, composable transition shaders (wipe, dissolve, grid, fade, melt, matrix, scramble + custom).

### Node Adapter (`@flyingrobots/bijou-node`)

- **Runtime port**: TTY/env/dimension detection.
- **I/O port**: stdin/stdout wiring, keyboard and resize integration.
- **Style port**: Chalk-backed color and style rendering.

## Install

Core components + Node runtime adapter:

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

Full interactive runtime (includes TEA engine):

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node @flyingrobots/bijou-tui
```

Framed app skeleton package:

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node @flyingrobots/bijou-tui @flyingrobots/bijou-tui-app
```

Scaffold a new runnable app project:

```bash
npm create bijou-tui-app@latest my-app
```

## Quick Start (Core Components)

```ts
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { group, input, select, headerBox } from '@flyingrobots/bijou';

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

## Quick Start (Interactive TUI Runtime)

```ts
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run, quit, type App } from '@flyingrobots/bijou-tui';

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

## Output Modes (Automatic)

| Mode | Trigger | Behavior |
| :--- | :--- | :--- |
| `interactive` | TTY stdout | Full color, unicode, animations, interactive input |
| `static` | `CI` is set (and stdout is TTY) | Single-frame rendering, no animation loop |
| `pipe` | Non-TTY stdout, `NO_COLOR`, or `TERM=dumb` | Plain-text-safe output without ANSI styling |
| `accessible` | `BIJOU_ACCESSIBLE=1` | Screen-reader-friendly linear prompts |

## Try This Repository

```bash
git clone https://github.com/flyingrobots/bijou
cd bijou
npm install

# Component showcase
npx tsx demo.ts

# Canonical app-shell showcase
npx tsx demo-tui.ts

# Run any individual example
npx tsx examples/<name>/main.ts
```

Explore the curated examples in [`examples/`](./examples/) for canonical app-shell demos and advanced component showcases.

Flagship V3 examples:

- [`examples/v3-demo`](./examples/v3-demo/) — minimal surface-first starter app
- [`examples/v3-css`](./examples/v3-css/) — BCSS selectors, token vars, and media queries
- [`examples/v3-motion`](./examples/v3-motion/) — keyed motion with springs and tweens
- [`examples/v3-subapp`](./examples/v3-subapp/) — Fractal TEA lifecycle helpers
- [`examples/v3-worker`](./examples/v3-worker/) — worker runtime plus data channel
- [`examples/v3-pipeline`](./examples/v3-pipeline/) — programmable render-pipeline extension

Test local `create-bijou-tui-app` scaffolder changes from the monorepo:

```bash
TMP="$(mktemp -d /tmp/bijou-scaffold-XXXXXX)"
TARGET="$TMP/my-app"
npx tsx packages/create-bijou-tui-app/src/cli.ts "$TARGET" --no-install
cd "$TARGET"
npm install
npm run dev
```

For full scaffolder usage, flags, and test flow, see
[`packages/create-bijou-tui-app/README.md`](./packages/create-bijou-tui-app/README.md).

## Local Development

```bash
npm run build        # TypeScript project references build
npm run build:watch  # Incremental watch mode
npm test             # Vitest suite
npm run typecheck:test
npm run smoke:examples:all
npm run smoke:canaries
npm run lint         # Typecheck each workspace package
npm run clean        # Remove build outputs
```

`npm run smoke:canaries` packs the current workspace packages, generates a stock `create-bijou-tui-app` app from the local CLI, installs both that TUI app and an internal core/static fixture from local tarballs, then smoke-runs both downstream canaries.

Node.js version: `>=18`.

## Documentation Map

- Project architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- Changelog: [`docs/CHANGELOG.md`](./docs/CHANGELOG.md)
- Migration guide: [`docs/MIGRATING_TO_V3.md`](./docs/MIGRATING_TO_V3.md)
- Example catalog: [`docs/EXAMPLES.md`](./docs/EXAMPLES.md)
- Package guides:
  - [`packages/bijou/GUIDE.md`](./packages/bijou/GUIDE.md)
  - [`packages/bijou-node/GUIDE.md`](./packages/bijou-node/GUIDE.md)
  - [`packages/bijou-tui/GUIDE.md`](./packages/bijou-tui/GUIDE.md)

## What's New in v3.0.0

- **Truthful package split** — `@flyingrobots/bijou` stays the degradation-first terminal toolkit, `@flyingrobots/bijou-tui` is the high-fidelity runtime, `@flyingrobots/bijou-tui-app` is the shell, and `@flyingrobots/bijou-node` owns Node adapters plus worker/recording utilities.
- **Honest V3 view contract** — `App.view` and framed panes now work with `ViewOutput` (`string | Surface | LayoutNode`). Legacy strings still work, but they are explicitly the compatibility path rather than the whole story.
- **Surface-native flagship path** — the runtime, scripted driver, framed shell boundary, and canonical V3 demos now run through the V3 surface/layout pipeline instead of relying on lossy full-frame ANSI round-tripping.
- **BCSS, motion, and Fractal TEA** — `run(app, { css })`, keyed motion, and `initSubApp()` / `updateSubApp()` / `mount()` / `mapCmds()` are now the documented V3 composition story. BCSS is intentionally scoped to supported V3 surface primitives and frame shell regions.
- **Worker runtime and native demo recorder** — `runInWorker()` / `startWorkerApp()` and the internal Surface-to-GIF recorder ship as part of the Node package, alongside canonical V3 demos and smoke coverage.

If you are upgrading an existing app, start with the dedicated migration guide:
[`docs/MIGRATING_TO_V3.md`](./docs/MIGRATING_TO_V3.md)

See the full release notes in [`docs/CHANGELOG.md`](./docs/CHANGELOG.md).

## License

MIT ([`LICENSE`](./LICENSE))

---

<p align="center">
Built with 💎 by <a href="https://github.com/flyingrobots">FLYING ROBOTS</a>
</p>

```rust
.-:::::':::   .-:.     ::-.::::::.    :::.  .,-:::::/
;;;'''' ;;;    ';;.   ;;;;';;;`;;;;,  `;;;,;;-'````'
[[[,,== [[[      '[[,[[['  [[[  [[[[[. '[[[[[   [[[[[[/
`$$$"`` $$'        c$$"    $$$  $$$ "Y$c$$"$$c.    "$$
 888   o88oo,.__ ,8P"`     888  888    Y88 `Y8bo,,,o88o
 "MM,  """"YUMMMmM"        MMM  MMM     YM   `'YMUP"YMM
:::::::..       ...     :::::::.      ...   :::::::::::: .::::::.
;;;;``;;;;   .;;;;;;;.   ;;;'';;'  .;;;;;;;.;;;;;;;;'''';;;`    `
 [[[,/[[['  ,[[     \[[, [[[__[[\.,[[     \[[,   [[     '[==/[[[[,
 $$$$$$c    $$$,     $$$ $$""""Y$$$$$,     $$$   $$       '''    $
 888b "88bo,"888,_ _,88P_88o,,od8P"888,_ _,88P   88,     88b    dP
 MMMM   "W"   "YMMMMMP" ""YUMMMP"   "YMMMMMP"    MMM      "YMmMY"
```

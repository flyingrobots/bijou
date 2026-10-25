# Build your first Bijou app

Start with [the README quick start](../../README.md#try-bijou), or follow the [Job Monitor tutorial](https://github.com/flyingrobots/bijou-job-monitor) for a complete application and its teaching book. This guide covers the small app contract, package choices, and DOGFOOD controls.

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

The imports stay split because each package owns a different boundary:

- `@flyingrobots/bijou` creates pure renderable values such as `Surface`.
- `@flyingrobots/bijou-node` owns the Node host setup and terminal adapters.
- `@flyingrobots/bijou-tui` owns the interactive app loop, messages, commands,
  and key handling.

## Core Concepts In Stages

You do not need the whole architecture to build the first app.

| Stage | Concept | Why it appears |
| :--- | :--- | :--- |
| 1 | `Surface` | A terminal-sized cell grid, not a string with escape codes. |
| 2 | `App<Model, Msg>` | The tiny app contract: initialize, update, and render. |
| 3 | `Msg` | Input and async results become typed messages. |
| 4 | `Cmd<Msg>` | Runtime effects, timers, async work, and quit requests return messages later. |
| 5 | `LayoutNode` / framed shell | Larger apps describe panes, headers, overlays, and navigation before painting cells. |

The counter example stops at stages 1-4. The framed app tutorial adds stage 5.
DOGFOOD uses all of them because it is Bijou's documentation product.

## Intermediate: Framed App

After the counter, use the compact framed-shell demo before reading DOGFOOD:

```bash
npm run app-frame
```

The tutorial explains the same app in smaller steps:

- [Framed app tutorial](../guides/framed-app-tutorial.md)
- [Compact app-frame example](../../examples/app-frame/README.md)

Use this path when you want header/status chrome, tabs, panes, overlays, or a
command palette without reverse-engineering the full DOGFOOD app.

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
| [`@flyingrobots/bijou`](../../packages/bijou/) | Core toolkit: prompts, surfaces, components, themes, blocks, ports, and pure contracts. |
| [`@flyingrobots/bijou-tui`](../../packages/bijou-tui/) | Interactive runtime: TEA loop, input, layout, motion, overlays, and shell support. |
| [`@flyingrobots/bijou-node`](../../packages/bijou-node/) | Node.js adapters for IO, terminal hosting, styling, and worker helpers. |
| [`@flyingrobots/bijou-tui-app`](../../packages/bijou-tui-app/) | Batteries-included framed shell and higher-level app composition. |
| [`create-bijou-tui-app`](../../packages/create-bijou-tui-app/) | Project scaffolder for hosted Bijou TUI apps. |
| [`@flyingrobots/bijou-mcp`](../../packages/bijou-mcp/) | MCP server package for exposing Bijou-backed tools and structured output. |
| [`@flyingrobots/bijou-i18n`](../../packages/bijou-i18n/) | Localization runtime, fallback handling, and locale port. |
| [`@flyingrobots/bijou-i18n-tools`](../../packages/bijou-i18n-tools/) | Provider-neutral localization workflow tools for source tables, catalogs, and pseudo-localization. |
| [`@flyingrobots/bijou-i18n-tools-node`](../../packages/bijou-i18n-tools-node/) | Node-hosted localization file and bundle loaders. |
| [`@flyingrobots/bijou-i18n-tools-xlsx`](../../packages/bijou-i18n-tools-xlsx/) | Spreadsheet adapters for localization workflows. |

## Choosing Your Path

Bijou exposes three API tiers that match common project needs.

| Tier | Entry Point | Package | Use When |
| :--- | :--- | :--- | :--- |
| 1 | `startApp(app)` | `@flyingrobots/bijou-node` | Simple CLI output, prompts, scripted interactive flow, or tiny apps that do not need custom pipeline wiring. |
| 2 | `run(app, { ctx })` | `@flyingrobots/bijou-tui` | Custom pipeline stages, advanced host initialization, locale port wiring, mouse input, or custom startup state handling. |
| 3 | `createFramedApp(config)` | `@flyingrobots/bijou-tui` | Framed shell with panes, overlays and navigation; `@flyingrobots/bijou-tui-app` supplies the opinionated starter. |

Tier 1 is the easiest path to first output. The counter example uses tier 1. The DOGFOOD application uses tier 2 because it initializes context and locale before starting the core loop.

Most production apps eventually move to tier 2 or tier 3.

## Blocks

Blocks are higher-level reusable building blocks introduced in v5. They are reusable layout and behavior contracts for terminal components with explicit data bindings. Instead of hand-assembling raw `LayoutNode` trees for every screen, blocks provide a small vocabulary of typed, testable authoring units.

The binding model is unidirectional:

1) providers create immutable snapshots
2) snapshots are rendered through binding-aware components
3) components emit intent via commands
4) app update functions own state changes

This model lets blocks reuse layout and behavior across apps while preserving deterministic render semantics.

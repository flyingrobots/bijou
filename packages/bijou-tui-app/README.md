# `@flyingrobots/bijou-tui-app`

Batteries-included TUI app skeleton built on `createFramedApp()`.

## What's New in v3.0.0

- **ViewOutput-aware shell panes** — framed panes can now return legacy strings, `Surface`, or `LayoutNode`, which makes the shell compatible with V3-native panes instead of forcing everything through string rendering.
- **Truthful shell role** — this package is the opinionated shell layer in the Bijou stack, not the whole runtime. Use it when you want tabs, footer/help chrome, overlays, and a ready-to-run app frame.
- **Canonical release starter** — the scaffolder and V3 examples now treat this package as the default way to stand up a polished full-screen Bijou app.

It ships a ready-to-run shell with sane defaults:
- full-screen framed app shell
- top tab bar (`|` separators, active/inactive tab backgrounds)
- animated physics drawer on the first tab (`o` toggles)
- page switching via `[` and `]`
- quit confirmation modal on `q` and `ctrl+c`
- two-line footer: status line above controls line
- full-width `\` separator row above the footer
- default two tabs:
  - tab 1: empty pane + drawer
  - tab 2: horizontal split (1/3 + 2/3)

## Quick Scaffold

```sh
npm create bijou-tui-app@latest my-app
```

## Install

```sh
npm install @flyingrobots/bijou @flyingrobots/bijou-node @flyingrobots/bijou-tui @flyingrobots/bijou-tui-app
```

## Usage

```ts
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run } from '@flyingrobots/bijou-tui';
import { createTuiAppSkeleton } from '@flyingrobots/bijou-tui-app';

const ctx = initDefaultContext();

await run(
  createTuiAppSkeleton({
    ctx,
    title: 'FlyingRobots Console',
    statusMessage: ({ activeTabTitle }) => `${activeTabTitle} ready`,
  }),
);
```

## API

- `createTuiAppSkeleton(options)`
  - `ctx` (required): `BijouContext`
  - `tabs` (optional): custom `{ id, title }[]`; defaults to `Home` + `Split`
  - `defaultTabId`: initial active tab
  - `title`: header title
  - `keyLegend`: footer controls-line legend
  - `statusMessage`: footer status-line content (string or function by active tab)
  - `themeTokens`: override header/tab/footer/separator/drawer/modal tokens
  - `globalKeys`: additional key bindings merged with defaults

### Built-in defaults

- Frame keys: `[` / `]` tab switch, `tab` pane next, `shift+tab` pane prev, `ctrl+p` command palette, `?` help
- Skeleton keys: `o` drawer toggle, `q`/`ctrl+c` quit confirm, `y`/`enter` confirm quit, `n`/`escape` cancel quit

For upgrading an existing shell-based app, see [`../../docs/MIGRATING_TO_V3.md`](../../docs/MIGRATING_TO_V3.md).

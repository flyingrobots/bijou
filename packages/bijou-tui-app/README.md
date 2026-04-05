# `@flyingrobots/bijou-tui-app`

Batteries-included TUI app skeleton built on `createFramedApp()`.

## Package Role

- **Pure shell contract** — framed panes now stay on the surface/layout path. Shell panes render `Surface` or `LayoutNode`, not string views.
- **Truthful shell role** — this package is the opinionated shell layer in the Bijou stack, not the whole runtime. Use it when you want tabs, footer/help chrome, overlays, and a ready-to-run app frame.
- **Canonical release starter** — the scaffolder and current runtime references treat this package as the default way to stand up a polished full-screen Bijou app.

It ships a ready-to-run shell with sane defaults:
- full-screen framed app shell
- top tab bar (`|` separators, active/inactive tab backgrounds)
- animated supplemental drawer on the first tab (`o` toggles)
- page switching via `[` and `]`
- quit confirmation modal on `q` and `ctrl+c`
- two-line footer: status line above controls line
- full-width `\` separator row above the footer
- default two tabs:
  - tab 1: primary pane + supplemental drawer
  - tab 2: horizontal split for compare/inspect flows

## When To Use It

Use `@flyingrobots/bijou-tui-app` when:
- your app has peer destinations that belong in tabs
- you want standardized shell chrome, help, status, and command discovery
- side work should live in a drawer instead of stealing the whole screen
- destructive exit or review flows should be handled by a modal

Avoid it when:
- you are building a one-shot CLI or prompt flow
- the UI is basically one document and does not need shell chrome
- you want a fully custom shell instead of adopting Bijou's opinionated starter

## Design-System Role

The starter is intentionally opinionated:
- tabs are for peer destinations
- the drawer is for supplemental side work, filters, inspection, and context
- the quit modal is for blocking confirmation
- the footer rows are shell chrome, not page content
- the split page demonstrates comparison and secondary-context layout, not generic filler

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
  { mouse: true },
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

For upgrading an existing shell-based app, see [`../../docs/MIGRATING_TO_V4.md`](../../docs/MIGRATING_TO_V4.md).

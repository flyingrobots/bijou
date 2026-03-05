# `@flyingrobots/bijou-tui-app`

Batteries-included TUI app skeleton built on `createFramedApp()`.

It ships a ready-to-run shell with:
- top tab bar (`|` separators, active/inactive tab backgrounds)
- header row
- footer gutter for key legend + app status
- full-width `\` separator row above the footer
- empty framed body per tab so you can drop in real layouts later

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
    tabs: [
      { id: 'home', title: 'Home' },
      { id: 'settings', title: 'Settings' },
      { id: 'logs', title: 'Logs' },
    ],
    keyLegend: '[ ] tabs | tab panes | ctrl+p commands | ? help | q quit',
    statusMessage: ({ activeTabTitle }) => `${activeTabTitle} ready`,
  }),
);
```

## API

- `createTuiAppSkeleton(options)`
  - `tabs` (required): at least one `{ id, title }`
  - `ctx` (required): `BijouContext`
  - `defaultTabId`: initial active tab
  - `title`: header title
  - `keyLegend`: footer left side legend
  - `statusMessage`: footer right side status (string or function by active tab)
  - `themeTokens`: override header/tab/footer/separator tokens
  - `globalKeys`: additional key bindings merged with defaults (`q`, `ctrl+c` quit)

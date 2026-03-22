# `navigableTableSurface()`

Keyboard-owned table inspection with focus and scrolling

![demo](demo.gif)

## Run

```sh
npx tsx examples/navigable-table/main.ts
```

## Use this when

- the user should actively traverse rows or cells
- keyboard focus and scrolling are part of the interaction model

## Choose something else when

- choose core `table()` or `tableSurface()` for passive comparison
- choose `browsableList()` when the content is one-dimensional and description-led

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { separator } from '@flyingrobots/bijou';
import {
  run, quit, isKeyMsg, type App,
  createNavigableTableState, navigableTableSurface,
  navTableFocusNext, navTableFocusPrev,
  navTablePageDown, navTablePageUp,
  navTableKeyMap, helpShortSurface, vstackSurface,
} from '@flyingrobots/bijou-tui';
import { contentSurface, spacer } from '../_shared/example-surfaces.ts';

initDefaultContext();

const columns = [
  { header: 'Name', width: 20 },
  { header: 'Language', width: 14 },
  { header: 'Stars', width: 10 },
  { header: 'License', width: 12 },
];

const rows = [
  ['express',  'JavaScript', '65.8k', 'MIT'],
  ['fastify',  'JavaScript', '33.1k', 'MIT'],
  ['next',     'TypeScript', '129k',  'MIT'],
  ['vite',     'TypeScript', '71.2k', 'MIT'],
  ['esbuild',  'Go',         '38.7k', 'MIT'],
  ['vitest',   'TypeScript', '13.8k', 'MIT'],
  ['zod',      'TypeScript', '35.2k', 'MIT'],
  ['drizzle',  'TypeScript', '26.1k', 'Apache-2.0'],
  ['hono',     'TypeScript', '22.4k', 'MIT'],
  ['bun',      'Zig',        '75.3k', 'MIT'],
  ['deno',     'Rust',       '101k',  'MIT'],
  ['prisma',   'TypeScript', '41.2k', 'Apache-2.0'],
];

type Msg =
  | { type: 'focus-next' }
  | { type: 'focus-prev' }
  | { type: 'page-down' }
  | { type: 'page-up' }
  | { type: 'quit' };

const keys = navTableKeyMap<Msg>({
  focusNext: { type: 'focus-next' },
  focusPrev: { type: 'focus-prev' },
  pageDown:  { type: 'page-down' },
  pageUp:    { type: 'page-up' },
  quit:      { type: 'quit' },
});

interface Model {
  table: ReturnType<typeof createNavigableTableState>;
}

const app: App<Model, Msg> = {
  init: () => [{
    table: createNavigableTableState({ columns, rows, height: 8 }),
  }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      const action = keys.handle(msg);
      if (!action) return [model, []];
      switch (action.type) {
        case 'quit':       return [model, [quit()]];
        case 'focus-next': return [{ table: navTableFocusNext(model.table) }, []];
        case 'focus-prev': return [{ table: navTableFocusPrev(model.table) }, []];
        case 'page-down':  return [{ table: navTablePageDown(model.table) }, []];
        case 'page-up':    return [{ table: navTablePageUp(model.table) }, []];
      }
    }
    return [model, []];
  },

  view: (model) => vstackSurface(
    spacer(62, 1),
    contentSurface(separator({ label: 'navigable table', width: 62 })),
    navigableTableSurface(model.table),
    spacer(62, 1),
    helpShortSurface(keys, { width: 62 }),
    spacer(62, 1),
  ),
};

run(app);
```

[← Examples](../README.md)

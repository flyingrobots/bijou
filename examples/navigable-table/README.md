# `navigableTable()`

Keyboard-navigable data table with scrolling

![demo](demo.gif)

## Run

```sh
npx tsx examples/navigable-table/main.ts
```

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { separator } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg,
  createNavigableTableState, navigableTable,
  navTableFocusNext, navTableFocusPrev,
  navTablePageDown, navTablePageUp,
  navTableKeyMap, helpShort, vstack,
} from '@flyingrobots/bijou-tui';

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
    if ('type' in msg && msg.type === 'key') {
      const action = keys.handle(msg as KeyMsg);
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

  view: (model) => vstack(
    '', navigableTable(model.table), '', `  ${helpShort(keys)}`, '',
  ),
};

run(app);
```

[← Examples](../README.md)

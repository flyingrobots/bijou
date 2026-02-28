# `browsableList()`

Navigable list with descriptions and scroll viewport

![demo](demo.gif)

## Run

```sh
npx tsx examples/browsable-list/main.ts
```

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { separator } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg,
  createBrowsableListState, browsableList,
  listFocusNext, listFocusPrev, listPageDown, listPageUp,
  browsableListKeyMap, helpShort, vstack,
  type BrowsableListItem,
} from '@flyingrobots/bijou-tui';

initDefaultContext();

const items: BrowsableListItem[] = [
  { label: 'box()', value: 'box', description: 'Bordered containers' },
  { label: 'table()', value: 'table', description: 'Auto-spacing data grids' },
  { label: 'dag()', value: 'dag', description: 'Directed acyclic graph' },
  // ... more items
];

type Msg =
  | { type: 'next' } | { type: 'prev' }
  | { type: 'page-down' } | { type: 'page-up' }
  | { type: 'select' } | { type: 'quit' };

const keys = browsableListKeyMap<Msg>({
  focusNext: { type: 'next' },
  focusPrev: { type: 'prev' },
  pageDown: { type: 'page-down' },
  pageUp: { type: 'page-up' },
  select: { type: 'select' },
  quit: { type: 'quit' },
});

interface Model { list: ReturnType<typeof createBrowsableListState> }

const app: App<Model, Msg> = {
  init: () => [{ list: createBrowsableListState({ items, height: 8 }) }, []],

  update: (msg, model) => {
    if ('type' in msg && msg.type === 'key') {
      const action = keys.handle(msg as KeyMsg);
      if (!action) return [model, []];
      switch (action.type) {
        case 'quit': return [model, [quit()]];
        case 'select': return [model, [quit()]];
        case 'next': return [{ list: listFocusNext(model.list) }, []];
        case 'prev': return [{ list: listFocusPrev(model.list) }, []];
        case 'page-down': return [{ list: listPageDown(model.list) }, []];
        case 'page-up': return [{ list: listPageUp(model.list) }, []];
      }
    }
    return [model, []];
  },

  view: (model) => vstack(
    '', separator({ label: 'browsable list' }), '',
    browsableList(model.list), '',
    `  ${helpShort(keys)}`, '',
  ),
};

run(app);
```

[← Examples](../README.md)

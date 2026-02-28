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
  run, quit, isKeyMsg, type App,
  createBrowsableListState, browsableList,
  listFocusNext, listFocusPrev, listPageDown, listPageUp,
  browsableListKeyMap, helpShort, vstack,
  type BrowsableListItem,
} from '@flyingrobots/bijou-tui';

initDefaultContext();

const items: BrowsableListItem[] = [
  { label: 'box()', value: 'box', description: 'Bordered containers with Unicode/ASCII fallback' },
  { label: 'table()', value: 'table', description: 'Auto-spacing data grids' },
  { label: 'dag()', value: 'dag', description: 'Directed acyclic graph with auto-layout' },
  { label: 'wizard()', value: 'wizard', description: 'Multi-step form orchestrator' },
  { label: 'spinner()', value: 'spinner', description: 'Animated loading indicator' },
  { label: 'progressBar()', value: 'progress', description: 'Visual progress feedback' },
  { label: 'select()', value: 'select', description: 'Single-select menu prompt' },
  { label: 'accordion()', value: 'accordion', description: 'Expandable content sections' },
  { label: 'timeline()', value: 'timeline', description: 'Vertical event visualization' },
  { label: 'tree()', value: 'tree', description: 'Hierarchical tree views' },
  { label: 'tabs()', value: 'tabs', description: 'Tab bar navigation' },
  { label: 'badge()', value: 'badge', description: 'Inline status indicators' },
];

type Msg =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'page-down' }
  | { type: 'page-up' }
  | { type: 'select' }
  | { type: 'quit' };

const keys = browsableListKeyMap<Msg>({
  focusNext: { type: 'next' },
  focusPrev: { type: 'prev' },
  pageDown: { type: 'page-down' },
  pageUp: { type: 'page-up' },
  select: { type: 'select' },
  quit: { type: 'quit' },
});

interface Model {
  list: ReturnType<typeof createBrowsableListState>;
}

const app: App<Model, Msg> = {
  init: () => [{ list: createBrowsableListState({ items, height: 8 }) }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      const action = keys.handle(msg);
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

  view: (model) => {
    const header = separator({ label: 'browsable list' });
    const body = browsableList(model.list);
    const help = `  ${helpShort(keys)}`;
    return vstack('', header, '', body, '', help, '');
  },
};

run(app);
```

[← Examples](../README.md)

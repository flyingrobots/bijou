# `commandPaletteSurface()`

Filterable action list with a fixed search row and viewport-backed results

## Run

```sh
npx tsx examples/command-palette/main.ts
```

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { separator } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg,
  createCommandPaletteState, commandPaletteSurface,
  cpFilter, cpFocusNext, cpFocusPrev, cpPageDown, cpPageUp,
  commandPaletteKeyMap, helpShortSurface, vstackSurface,
  type CommandPaletteItem,
} from '@flyingrobots/bijou-tui';
import { contentSurface, spacer } from '../_shared/example-surfaces.ts';

const ctx = initDefaultContext();

const items: CommandPaletteItem[] = [
  { id: 'box', label: 'box()', description: 'Bordered containers', category: 'Display' },
  { id: 'table', label: 'table()', description: 'Auto-spacing data grids', category: 'Display' },
  { id: 'spinner', label: 'spinner()', description: 'Loading indicator', category: 'Feedback' },
];

type Msg =
  | KeyMsg
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'page-down' }
  | { type: 'page-up' }
  | { type: 'select' }
  | { type: 'close' };

const keys = commandPaletteKeyMap<Msg>({
  focusNext: { type: 'next' },
  focusPrev: { type: 'prev' },
  pageDown: { type: 'page-down' },
  pageUp: { type: 'page-up' },
  select: { type: 'select' },
  close: { type: 'close' },
});

interface Model {
  cp: ReturnType<typeof createCommandPaletteState>;
}

const app: App<Model, Msg> = {
  init: () => [{ cp: createCommandPaletteState(items, 8) }, []],

  update: (msg, model) => {
    if (msg.type === 'key') {
      const action = keys.handle(msg);
      if (action) {
        switch (action.type) {
          case 'close': return [model, [quit()]];
          case 'select': return [model, [quit()]];
          case 'next': return [{ ...model, cp: cpFocusNext(model.cp) }, []];
          case 'prev': return [{ ...model, cp: cpFocusPrev(model.cp) }, []];
          case 'page-down': return [{ ...model, cp: cpPageDown(model.cp) }, []];
          case 'page-up': return [{ ...model, cp: cpPageUp(model.cp) }, []];
        }
      }

      if (msg.key.length === 1 && !msg.ctrl && !msg.alt) {
        return [{ ...model, cp: cpFilter(model.cp, model.cp.query + msg.key) }, []];
      }

      if (msg.key === 'backspace') {
        return [{ ...model, cp: cpFilter(model.cp, model.cp.query.slice(0, -1)) }, []];
      }
    }

    return [model, []];
  },

  view: (model) => {
    const width = Math.min(60, Math.max(24, ctx.runtime.columns));
    const header = contentSurface(separator({ label: 'command palette', width, ctx }));
    const body = commandPaletteSurface(model.cp, { width, ctx });
    const help = helpShortSurface(keys, { width });

    return vstackSurface(
      spacer(width, 1),
      header,
      spacer(width, 1),
      body,
      spacer(width, 1),
      help,
    );
  },
};

run(app);
```

[← Examples](../README.md)

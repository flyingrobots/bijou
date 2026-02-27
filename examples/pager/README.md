# `pager()`

Scrollable text viewer with status line

![demo](demo.gif)

## Run

```sh
npx tsx examples/pager/main.ts
```

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { separator } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg,
  createPagerState, pager, pagerScrollBy, pagerPageDown, pagerPageUp,
  pagerScrollToTop, pagerScrollToBottom, pagerKeyMap, helpShort, vstack,
} from '@flyingrobots/bijou-tui';

initDefaultContext();

const CONTENT = Array.from({ length: 80 }, (_, i) => `  Line ${i + 1}`).join('\n');

type Msg =
  | { type: 'scroll'; dy: number }
  | { type: 'page-up' }
  | { type: 'page-down' }
  | { type: 'top' }
  | { type: 'bottom' }
  | { type: 'quit' };

const keys = pagerKeyMap<Msg>({
  scrollUp: { type: 'scroll', dy: -1 },
  scrollDown: { type: 'scroll', dy: 1 },
  pageUp: { type: 'page-up' },
  pageDown: { type: 'page-down' },
  top: { type: 'top' },
  bottom: { type: 'bottom' },
  quit: { type: 'quit' },
});

interface Model {
  pager: ReturnType<typeof createPagerState>;
}

const app: App<Model, Msg> = {
  init: () => [{
    pager: createPagerState({ content: CONTENT, width: 80, height: 20 }),
  }, []],

  update: (msg, model) => {
    if ('type' in msg && msg.type === 'key') {
      const action = keys.handle(msg as KeyMsg);
      if (!action) return [model, []];
      switch (action.type) {
        case 'quit': return [model, [quit()]];
        case 'scroll': return [{ pager: pagerScrollBy(model.pager, action.dy) }, []];
        case 'page-up': return [{ pager: pagerPageUp(model.pager) }, []];
        case 'page-down': return [{ pager: pagerPageDown(model.pager) }, []];
        case 'top': return [{ pager: pagerScrollToTop(model.pager) }, []];
        case 'bottom': return [{ pager: pagerScrollToBottom(model.pager) }, []];
      }
    }
    return [model, []];
  },

  view: (model) => vstack(pager(model.pager), `  ${helpShort(keys)}`),
};

run(app);
```

[← Examples](../README.md)

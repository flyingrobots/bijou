# `focusArea()`

Scrollable pane with colored focus gutter and horizontal overflow

![demo](demo.gif)

## Run

```sh
npx tsx examples/focus-area/main.ts
```

## Code

```typescript
import { initDefaultContext, getDefaultContext } from '@flyingrobots/bijou-node';
import { separator } from '@flyingrobots/bijou';
import {
  run, quit, isKeyMsg, isResizeMsg, type App,
  createFocusAreaState, focusArea,
  focusAreaScrollBy, focusAreaPageDown, focusAreaPageUp,
  focusAreaScrollToTop, focusAreaScrollToBottom,
  focusAreaScrollByX,
  focusAreaKeyMap, helpShort, vstack,
} from '@flyingrobots/bijou-tui';

initDefaultContext();
const ctx = getDefaultContext();

// Generate some content to scroll through
const CONTENT = Array.from({ length: 60 }, (_, i) => {
  if (i === 0) return 'Welcome to the focus area demo!';
  if (i % 10 === 0) return `── Section ${i / 10} ${'─'.repeat(60)}`;
  return `Line ${String(i).padStart(2, ' ')}: ${('Lorem ipsum dolor sit amet, consectetur adipiscing elit. ').repeat(Math.ceil(Math.random() * 2))}`;
}).join('\n');

type Msg =
  | { type: 'scroll'; dy: number }
  | { type: 'scroll-left' }
  | { type: 'scroll-right' }
  | { type: 'page-up' }
  | { type: 'page-down' }
  | { type: 'top' }
  | { type: 'bottom' }
  | { type: 'quit' };

const keys = focusAreaKeyMap<Msg>({
  scrollUp: { type: 'scroll', dy: -1 },
  scrollDown: { type: 'scroll', dy: 1 },
  pageUp: { type: 'page-up' },
  pageDown: { type: 'page-down' },
  top: { type: 'top' },
  bottom: { type: 'bottom' },
  scrollLeft: { type: 'scroll-left' },
  scrollRight: { type: 'scroll-right' },
});

interface Model {
  fa: ReturnType<typeof createFocusAreaState>;
  focused: boolean;
  cols: number;
  rows: number;
}

const app: App<Model, Msg> = {
  init: () => {
    const cols = process.stdout.columns ?? 80;
    const rows = process.stdout.rows ?? 24;
    return [{
      fa: createFocusAreaState({
        content: CONTENT,
        width: Math.max(1, cols),
        height: Math.max(1, rows - 3),
        overflowX: 'scroll',
      }),
      focused: true,
      cols,
      rows,
    }, []];
  },

  update: (msg, model) => {
    if (isResizeMsg(msg)) {
      return [{
        ...model,
        fa: createFocusAreaState({
          content: CONTENT,
          width: Math.max(1, msg.columns),
          height: Math.max(1, msg.rows - 3),
          overflowX: 'scroll',
        }),
        cols: msg.columns,
        rows: msg.rows,
      }, []];
    }

    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.key === 'c' && msg.ctrl)) return [model, [quit()]];
      if (msg.key === 'tab') return [{ ...model, focused: !model.focused }, []];

      const action = keys.handle(msg);
      if (!action) return [model, []];

      switch (action.type) {
        case 'scroll': return [{ ...model, fa: focusAreaScrollBy(model.fa, action.dy) }, []];
        case 'page-up': return [{ ...model, fa: focusAreaPageUp(model.fa) }, []];
        case 'page-down': return [{ ...model, fa: focusAreaPageDown(model.fa) }, []];
        case 'top': return [{ ...model, fa: focusAreaScrollToTop(model.fa) }, []];
        case 'bottom': return [{ ...model, fa: focusAreaScrollToBottom(model.fa) }, []];
        case 'scroll-left': return [{ ...model, fa: focusAreaScrollByX(model.fa, -3) }, []];
        case 'scroll-right': return [{ ...model, fa: focusAreaScrollByX(model.fa, 3) }, []];
      }
    }

    return [model, []];
  },

  view: (model) => {
    const header = separator({ label: 'focus area', width: model.cols, ctx });
    const focusLabel = model.focused ? 'focused' : 'unfocused';
    const body = focusArea(model.fa, { focused: model.focused, ctx });
    const help = `  ${helpShort(keys)}  Tab: toggle focus (${focusLabel})  q: quit`;
    return vstack(header, body, help);
  },
};

run(app);
```

[← Examples](../README.md)

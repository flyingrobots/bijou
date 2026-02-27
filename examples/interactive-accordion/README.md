# `interactiveAccordion()`

Keyboard-navigable accordion with expand/collapse

![demo](demo.gif)

## Run

```sh
npx tsx examples/interactive-accordion/main.ts
```

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { separator } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg,
  createAccordionState, interactiveAccordion,
  focusNext, focusPrev, toggleFocused,
  accordionKeyMap, helpShort, vstack,
} from '@flyingrobots/bijou-tui';

initDefaultContext();

const SECTIONS = [
  { title: 'Section A', content: 'Content for A', expanded: true },
  { title: 'Section B', content: 'Content for B', expanded: false },
  { title: 'Section C', content: 'Content for C', expanded: false },
];

type Msg = { type: 'next' } | { type: 'prev' } | { type: 'toggle' } | { type: 'quit' };

const keys = accordionKeyMap<Msg>({
  focusNext: { type: 'next' },
  focusPrev: { type: 'prev' },
  toggle: { type: 'toggle' },
  quit: { type: 'quit' },
});

interface Model { accordion: ReturnType<typeof createAccordionState> }

const app: App<Model, Msg> = {
  init: () => [{ accordion: createAccordionState(SECTIONS) }, []],

  update: (msg, model) => {
    if ('type' in msg && msg.type === 'key') {
      const action = keys.handle(msg as KeyMsg);
      if (!action) return [model, []];
      switch (action.type) {
        case 'quit': return [model, [quit()]];
        case 'next': return [{ accordion: focusNext(model.accordion) }, []];
        case 'prev': return [{ accordion: focusPrev(model.accordion) }, []];
        case 'toggle': return [{ accordion: toggleFocused(model.accordion) }, []];
      }
    }
    return [model, []];
  },

  view: (model) => vstack(
    '', interactiveAccordion(model.accordion), '', `  ${helpShort(keys)}`, '',
  ),
};

run(app);
```

[← Examples](../README.md)

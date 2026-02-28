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
import { kbd, separator } from '@flyingrobots/bijou';
import {
  run, quit, isKeyMsg, type App,
  createAccordionState, interactiveAccordion,
  focusNext, focusPrev, toggleFocused, expandAll, collapseAll,
  accordionKeyMap, helpShort, vstack,
} from '@flyingrobots/bijou-tui';

initDefaultContext();

const SECTIONS = [
  {
    title: 'What is bijou?',
    content: 'A physics-powered TUI engine for TypeScript.\nZero dependencies. Hexagonal architecture.',
    expanded: true,
  },
  {
    title: 'Components',
    content: 'box, table, tree, accordion, tabs, badge, alert,\nseparator, skeleton, kbd, breadcrumb, stepper,\ntimeline, paginator, progress, spinner, dag.',
    expanded: false,
  },
  {
    title: 'TUI Runtime',
    content: 'TEA architecture (Model → Update → View).\nSpring animations, flexbox layout, viewport,\nkeybindings, input stack, event bus.',
    expanded: false,
  },
  {
    title: 'Theme Engine',
    content: 'DTCG interop with built-in presets:\ncyan-magenta, nord, catppuccin.\nCustom themes via BIJOU_THEME env var.',
    expanded: false,
  },
  {
    title: 'Getting Started',
    content: 'npm install @flyingrobots/bijou @flyingrobots/bijou-node\nimport { initDefaultContext } from "@flyingrobots/bijou-node";\ninitDefaultContext();',
    expanded: false,
  },
];

type Msg =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'toggle' }
  | { type: 'expand-all' }
  | { type: 'collapse-all' }
  | { type: 'quit' };

const keys = accordionKeyMap<Msg>({
  focusNext: { type: 'next' },
  focusPrev: { type: 'prev' },
  toggle: { type: 'toggle' },
  quit: { type: 'quit' },
});

// Add extra bindings for expand/collapse all
keys
  .bind('e', 'Expand all', { type: 'expand-all' })
  .bind('c', 'Collapse all', { type: 'collapse-all' });

interface Model {
  accordion: ReturnType<typeof createAccordionState>;
}

const app: App<Model, Msg> = {
  init: () => [{ accordion: createAccordionState(SECTIONS) }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      const action = keys.handle(msg);
      if (!action) return [model, []];

      switch (action.type) {
        case 'quit': return [model, [quit()]];
        case 'next': return [{ accordion: focusNext(model.accordion) }, []];
        case 'prev': return [{ accordion: focusPrev(model.accordion) }, []];
        case 'toggle': return [{ accordion: toggleFocused(model.accordion) }, []];
        case 'expand-all': return [{ accordion: expandAll(model.accordion) }, []];
        case 'collapse-all': return [{ accordion: collapseAll(model.accordion) }, []];
      }
    }

    return [model, []];
  },

  view: (model) => {
    const header = separator({ label: 'interactive accordion' });
    const body = interactiveAccordion(model.accordion);
    const help = `  ${helpShort(keys)}`;
    return vstack('', header, '', body, '', help, '');
  },
};

run(app);
```

[← Examples](../README.md)

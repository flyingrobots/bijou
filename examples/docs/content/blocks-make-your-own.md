# How to Make Your Own Blocks

Blocks are authored as public contracts first. A block should be discoverable
before it renders, and a package should be able to publish block metadata
without relying on import-time registration.

## Authoring Loop

1. Define the block metadata.
2. Declare slots, variants, modes, examples, and semantic facts.
3. Add data contracts only when the block needs provider-backed inputs.
4. Declare command intents for user actions.
5. Add a schema adapter when unknown boundary data needs validation.
6. Export the block and include it in a package manifest.

## Bind CounterDemoBlock in an App

App owns CounterDemoModel state. The block stays reusable: it receives
render-time config and emits command intent facts, while the application
decides how state changes.

The binding pattern:

1. App owns `CounterDemoModel` state.
2. App keys become command intents through `counterDemoIntentForKey()`.
3. The app applies intent facts through `applyCounterDemoIntent()`.
4. Rendering derives `counterDemoBlockConfig()` from app state.
5. `counterDemoBlockSurface()` turns that config into terminal output.
6. The pipe and accessible modes still describe the value when no key loop exists.

```ts
import type { BijouContext, Surface } from '@flyingrobots/bijou';
import {
  applyCounterDemoIntent,
  counterDemoBlockConfig,
  counterDemoBlockSurface,
  counterDemoIntentForKey,
  createCounterDemoModel,
  tickCounterDemoModel,
  type CounterDemoModel,
} from './counter-block-demo.js';

interface CounterAppModel {
  readonly counterBlock: CounterDemoModel;
}

export function initCounterApp(): CounterAppModel {
  return {
    counterBlock: createCounterDemoModel(5),
  };
}

export function updateCounterApp(
  model: CounterAppModel,
  key: string,
): CounterAppModel {
  const intent = counterDemoIntentForKey(key);
  if (intent === undefined) return model;

  return {
    ...model,
    counterBlock: applyCounterDemoIntent(model.counterBlock, intent),
  };
}

export function tickCounterApp(
  model: CounterAppModel,
  deltaMs: number,
): CounterAppModel {
  return {
    ...model,
    counterBlock: tickCounterDemoModel(model.counterBlock, deltaMs),
  };
}

export function viewCounterApp(
  model: CounterAppModel,
  ctx: BijouContext,
  width: number,
): Surface {
  return counterDemoBlockSurface(
    counterDemoBlockConfig(model.counterBlock, ctx, width),
  );
}
```

## Minimal Shape

```ts
import {
  commandIntent,
  defineBlock,
  defineBlockPackage,
  defineDataRequirement,
  defineViewData,
} from '@flyingrobots/bijou';

const article = defineDataRequirement({
  id: 'docs.article',
  resource: 'docs.article',
});

const readerData = defineViewData({
  id: 'reader.data',
  requirements: [{ name: 'article', requirement: article }],
});

export const readerBlock = defineBlock({
  metadata: {
    packageName: '@example/blocks',
    blockName: 'Reader',
    family: 'reading',
    scale: 'section',
    modes: ['interactive', 'static', 'pipe', 'accessible'],
    docs: {
      summary: 'Renders validated article content.',
    },
    slots: [{ id: 'content', required: true }],
  },
  data: readerData,
  commands: [
    commandIntent('reader.selectHeading', {
      label: 'Select heading',
    }),
  ],
  render: ({ slots }) => ({
    output: String(slots?.content ?? ''),
  }),
});

export const manifest = defineBlockPackage({
  packageName: '@example/blocks',
  version: '1.0.0',
  bijouPeerRange: '^5.0.0',
  blocks: ['Reader'],
});
```

## Boundaries

Schema-bound blocks validate shape at the boundary. Provider-bound data flow is
separate: providers publish immutable snapshots, frames deliver render-time
data, and commands express user intent back to business logic.

Do not put provider handles, subscription handles, refresh methods, dispatch
callbacks, or hidden mutable stores in a block render input.

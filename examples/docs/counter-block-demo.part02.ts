import { defineBlock, type BlockDefinition } from '@flyingrobots/bijou';
import { isRuntimeCommandIntentEmission, runtimeCommandIntentEmission, type RuntimeCommandIntentEmission } from '@flyingrobots/bijou-tui';
import { BLOCK_NAME, COUNTER_DEMO_ANIMATION_MS, COUNTER_DEMO_MODES, COUNTER_DEMO_PACKAGE, counterDemoDataContract, counterDemoDecrementIntent, counterDemoIncrementIntent, normalizeCounterValue, renderCounterDemoBlock } from './counter-block-demo.part01.js';
import type { CounterDemoBlockConfig, CounterDemoIntentAction, CounterDemoIntentPayload, CounterDemoModel } from './counter-block-demo.part01.js';

export const counterDemoBlock: BlockDefinition<CounterDemoBlockConfig, string> = defineBlock({
  metadata: {
    packageName: COUNTER_DEMO_PACKAGE,
    blockName: BLOCK_NAME,
    family: 'fixture-blocks',
    scale: 'control',
    modes: COUNTER_DEMO_MODES,
    docs: {
      summary: 'Non-shipping DOGFOOD fixture block for proving bounded counter intents and mode lowering.',
      useWhen: ['Testing block previews, command intents, and lowering paths without shipping a catalog block.'],
      avoidWhen: ['A production app needs a reusable counter control. This fixture is intentionally DOGFOOD-only.'],
      relatedDocs: ['docs/design-system/blocks.md'],
    },
    sourcePath: 'examples/docs/counter-block-demo.ts',
    slots: [
      { id: 'counter', required: true, description: 'Bounded counter value from 0 to 10.' },
    ],
    variants: [
      {
        id: 'interactive',
        label: 'Interactive',
        requiredSlots: ['counter'],
        facts: [{ kind: 'state', key: 'fixture.mode', value: 'interactive' }],
      },
      {
        id: 'static',
        label: 'Static',
        requiredSlots: ['counter'],
        facts: [{ kind: 'state', key: 'fixture.mode', value: 'static' }],
      },
      {
        id: 'plain',
        label: 'Pipe / screenreader',
        requiredSlots: ['counter'],
        facts: [{ kind: 'state', key: 'fixture.mode', value: 'plain' }],
      },
    ],
    configOptions: [
      {
        id: 'counter',
        label: 'Counter',
        kind: 'number',
        required: true,
        description: 'Target counter value, clamped from 0 through 10.',
      },
    ],
    composedComponents: ['progressBar()', 'commandIntent()', 'BindingFrame'],
    semanticFacts: [
      { kind: 'entity', key: 'block', value: BLOCK_NAME },
      { kind: 'state', key: 'shipping', value: false },
    ],
    examples: [{ id: 'counter-block.dogfood', label: 'DOGFOOD Blocks preview' }],
    tags: ['fixture', 'counter', 'intent', 'lowering'],
  },
  data: counterDemoDataContract,
  commands: [
    counterDemoDecrementIntent,
    counterDemoIncrementIntent,
  ],
  render: renderCounterDemoBlock,
});

export function createCounterDemoModel(counter = 5): CounterDemoModel {
  const normalized = normalizeCounterValue(counter);
  return Object.freeze({
    counter: normalized,
    previousCounter: normalized,
    animationTimeMs: COUNTER_DEMO_ANIMATION_MS,
  });
}

export function tickCounterDemoModel(model: CounterDemoModel, deltaMs: number): CounterDemoModel {
  const nextTime = Math.min(
    COUNTER_DEMO_ANIMATION_MS,
    Math.max(0, model.animationTimeMs + Math.max(0, Math.round(deltaMs))),
  );
  if (nextTime === model.animationTimeMs) return model;
  return Object.freeze({ ...model, animationTimeMs: nextTime });
}

export function counterDemoIntentForAction(
  action: CounterDemoIntentAction,
): RuntimeCommandIntentEmission<CounterDemoIntentPayload> {
  return runtimeCommandIntentEmission(
    action === 'decrement' ? counterDemoDecrementIntent : counterDemoIncrementIntent,
    { delta: action === 'decrement' ? -1 : 1 },
  );
}

export function counterDemoIntentForKey(
  key: string,
): RuntimeCommandIntentEmission<CounterDemoIntentPayload> | undefined {
  if (key === '-') return counterDemoIntentForAction('decrement');
  if (key === '+' || key === '=') return counterDemoIntentForAction('increment');
  return undefined;
}

export function applyCounterDemoIntent(
  model: CounterDemoModel,
  emission: RuntimeCommandIntentEmission<CounterDemoIntentPayload>,
): CounterDemoModel {
  const candidate: unknown = emission;
  if (!isRuntimeCommandIntentEmission(candidate)) {
    throw new Error('counter demo: intent emission must be created by runtimeCommandIntentEmission()');
  }
  const previousCounter = model.counter;
  const nextCounter = normalizeCounterValue(previousCounter + emission.payload.delta);
  return Object.freeze({
    counter: nextCounter,
    previousCounter,
    animationTimeMs: 0,
    lastIntentId: emission.intent.id,
  });
}

import type { BijouContext, Surface } from '@flyingrobots/bijou';
import {
  applyCounterDemoIntent,
  counterDemoBlockConfig,
  counterDemoBlockSurface,
  counterDemoIntentForKey,
  createCounterDemoModel,
  tickCounterDemoModel,
  type CounterDemoModel,
} from '../counter-block-demo.js';

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

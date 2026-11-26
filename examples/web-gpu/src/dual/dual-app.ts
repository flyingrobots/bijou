import type { BijouContext } from '@flyingrobots/bijou';
import { isKeyMsg, type SemanticSceneApp } from '@flyingrobots/bijou-tui';
import { dualScene, dualSurface, type DualModel } from './dual-projections.js';

export type { DualModel } from './dual-projections.js';

export type DualMsg =
  | { readonly type: 'increment' }
  | { readonly type: 'decrement' }
  | { readonly type: 'rename'; readonly name: string }
  | { readonly type: 'toggle' };

/** The counter's keys, as `examples/counter` reads them, and `t` for the switch. */
function fromKey(key: string): DualMsg | undefined {
  if (key === 'k' || key === '+' || key === 'up') return { type: 'increment' };
  if (key === 'j' || key === '-' || key === 'down') return { type: 'decrement' };
  if (key === 't') return { type: 'toggle' };
  return undefined;
}

function apply(msg: DualMsg, model: DualModel): DualModel {
  switch (msg.type) {
    case 'increment': return { ...model, count: model.count + 1 };
    case 'decrement': return { ...model, count: model.count - 1 };
    case 'rename': return { ...model, name: msg.name };
    case 'toggle': return { ...model, enabled: !model.enabled };
  }
}

/**
 * One app for both hosts. `mountBijouCanvas()` paints `view()` and sends key
 * messages; `mountBijouDom()` lowers `viewScene()` and sends the scene's
 * actions through `dispatchAction()`. `update()` takes both, and returns a new
 * model object for every change, so a stopped run never alters a model it
 * handed on.
 */
export function createDualApp(ctx: BijouContext): SemanticSceneApp<DualModel, DualMsg> {
  return {
    init: () => [{ count: 0, name: '', enabled: true }, []],
    update(msg, model) {
      if (isKeyMsg(msg)) {
        const keyed = msg.ctrl || msg.alt ? undefined : fromKey(msg.key);
        return [keyed === undefined ? model : apply(keyed, model), []];
      }
      if (msg.type === 'resize' || msg.type === 'mouse' || msg.type === 'pulse') return [model, []];
      return [apply(msg, model), []];
    },
    view: (model) => dualSurface(model, ctx),
    viewScene: (model) => dualScene(model),
    dispatchAction(action) {
      if (action.command === 'rename') return typeof action.value === 'string' ? { type: 'rename', name: action.value } : undefined;
      if (action.command === 'increment' || action.command === 'decrement' || action.command === 'toggle') return { type: action.command };
      return undefined;
    },
  };
}

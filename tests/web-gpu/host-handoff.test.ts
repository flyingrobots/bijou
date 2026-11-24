import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import { createSemanticSceneController, type Cmd } from '@flyingrobots/bijou-tui';
import { createDualApp, type DualModel, type DualMsg } from '../../examples/web-gpu/src/dual/dual-app.js';
import { withCarriedModel } from '../../examples/web-gpu/src/handoff.js';

// A host switch stops one mount and starts the other with the app wrapped so
// that init() returns the model the stopped mount left. These cases hold the
// wrapper to that, with the showcase's own dual-host counter.

/** The dual-host counter, with an init command that records each time it runs. */
function recordingApp(runs: string[]) {
  const app = createDualApp(createTestContext());
  const started: Cmd<DualMsg> = () => { runs.push('init command'); return undefined; };
  const init = (): [DualModel, Cmd<DualMsg>[]] => {
    runs.push('init');
    return [{ count: 0, name: '', enabled: true }, [started]];
  };
  return { ...app, init };
}

const flush = (): Promise<void> => new Promise((resolve) => { setTimeout(resolve, 0); });

describe('examples/web-gpu host handoff', () => {
  it('starts from the carried model and runs neither the app init nor its commands', async () => {
    const runs: string[] = [];
    const carried: DualModel = { count: 5, name: 'Ada', enabled: false };
    const wrapped = withCarriedModel(recordingApp(runs), carried);
    const controller = createSemanticSceneController(wrapped, { ctx: createTestContext() });
    await flush();
    expect(controller.frame().model).toBe(carried);
    expect(wrapped.init()).toEqual([carried, []]);
    expect(runs).toEqual([]);
    controller.stop();
  });

  it('runs the app init and its command once without the wrapper, so the case above can fail', async () => {
    const runs: string[] = [];
    const controller = createSemanticSceneController(recordingApp(runs), { ctx: createTestContext() });
    await flush();
    expect(runs).toEqual(['init', 'init command']);
    expect(controller.frame().model).toEqual({ count: 0, name: '', enabled: true });
    controller.stop();
  });

  it('keeps every other member of the app, so both projections and the update are the same functions', () => {
    const app = createDualApp(createTestContext());
    const wrapped = withCarriedModel(app, { count: 1, name: '', enabled: true });
    // Compared by key, so no method is taken off its object.
    const same = (['update', 'view', 'viewScene', 'dispatchAction'] as const).map((member) => Object.is(wrapped[member], app[member]));
    expect(same).toEqual([true, true, true, true]);
    expect(app.init()).toEqual([{ count: 0, name: '', enabled: true }, []]);
  });

  it('carries on from the handed model: the next action updates it, and the handed object is left as it was', () => {
    const carried: DualModel = { count: 5, name: '', enabled: true };
    const controller = createSemanticSceneController(withCarriedModel(createDualApp(createTestContext()), carried), { ctx: createTestContext() });
    controller.invoke({ actionId: 'app.increment' });
    expect(controller.frame().model).toEqual({ count: 6, name: '', enabled: true });
    expect(carried).toEqual({ count: 5, name: '', enabled: true });
    controller.stop();
  });
});

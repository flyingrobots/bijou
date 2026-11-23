import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import { createEventBus } from './eventbus.js';
import {
  createSemanticSceneController,
  replaySemanticSceneActions,
} from './semantic-scene.js';
import {
  createPanelApp,
  INCREMENT,
  rename,
  RESET,
  TOGGLE,
  type PanelModel,
  type PanelMsg,
} from './semantic-scene.test-support.js';
import { QUIT } from './types.js';

describe('semantic scene controller: replay', () => {
  it('gives identical checkpoints for one trace on two hosts', () => {
    const trace = [INCREMENT, rename('Ada'), RESET, RESET, TOGGLE, INCREMENT];
    const first = createSemanticSceneController(createPanelApp(), {
      ctx: createTestContext({ runtime: { columns: 80, rows: 24 } }),
    });
    const bus = createEventBus<PanelMsg>();
    bus.use((msg, next) => {
      next(msg);
    });
    const second = createSemanticSceneController(createPanelApp(), {
      ctx: createTestContext({
        mode: 'static',
        runtime: { columns: 200, rows: 60 },
      }),
      bus,
    });

    const checkpoints = replaySemanticSceneActions(first, trace);

    expect(replaySemanticSceneActions(second, trace)).toEqual(checkpoints);
    expect(checkpoints.map((checkpoint) => checkpoint.result.status)).toEqual([
      'dispatched',
      'dispatched',
      'dispatched',
      'ignored',
      'dispatched',
      'ignored',
    ]);
    expect(checkpoints.at(-1)?.model.name).toBe('Ada');
    expect(second.bus).toBe(bus);
    first.stop();
    second.stop();
    bus.dispose();
  });

  it('replays 200 alternating valid and stale invocations deterministically', () => {
    const cycle = [INCREMENT, INCREMENT, RESET, RESET];
    const trace = Array.from(
      { length: 200 },
      (_, index) => cycle[index % cycle.length] ?? INCREMENT,
    );
    const run = () => {
      const controller = createSemanticSceneController(createPanelApp(1), {
        ctx: createTestContext(),
      });
      const checkpoints = replaySemanticSceneActions(controller, trace);
      controller.stop();
      return checkpoints;
    };

    const first = run();

    expect(run()).toEqual(first);
    expect(first.map((checkpoint) => checkpoint.result.status)).toEqual(
      trace.map((_, index) => index % 2 === 0 ? 'dispatched' : 'ignored'),
    );
    expect(first.map((checkpoint) => checkpoint.model.count)).toEqual(
      trace.map((_, index) => index % 4 < 2 ? 1 : 0),
    );
    expect(first.every((checkpoint, index) =>
      index % 2 === 0 || checkpoint.model === first[index - 1]?.model))
      .toBe(true);
  });
});

describe('semantic scene controller: quit', () => {
  it('stops when a command returns QUIT', async () => {
    const base = createPanelApp();
    const controller = createSemanticSceneController<PanelModel, PanelMsg>({
      ...base,
      update: (msg, model) => msg.type === 'toggle'
        ? [model, [() => QUIT]]
        : base.update(msg, model),
    }, { ctx: createTestContext() });

    expect(controller.invoke(TOGGLE).status).toBe('dispatched');
    expect(controller.status).toBe('running');
    await controller.bus.drain();

    expect(controller.status).toBe('stopped');
    expect(controller.invoke(TOGGLE).status).toBe('ignored');
  });
});

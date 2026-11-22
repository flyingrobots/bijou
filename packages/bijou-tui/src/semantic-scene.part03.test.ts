import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import { createEventBus, type BusMsg } from './eventbus.js';
import {
  createSemanticSceneController,
  replaySemanticSceneActions,
  type SemanticSceneCrash,
} from './semantic-scene.js';
import {
  createPanelApp,
  INCREMENT,
  rename,
  RESET,
  TOGGLE,
  type PanelApp,
  type PanelModel,
  type PanelMsg,
} from './semantic-scene.test-support.js';

function start(app: PanelApp = createPanelApp()) {
  const crashes: SemanticSceneCrash<PanelModel>[] = [];
  const controller = createSemanticSceneController(app, {
    ctx: createTestContext(),
    onCrash(crash) {
      crashes.push(crash);
    },
  });
  return { controller, crashes };
}

describe('semantic scene controller: failure modes', () => {
  it('sends every dispatched message through the event bus', () => {
    const { controller } = start();
    const seen: BusMsg<PanelMsg>[] = [];
    controller.bus.use((msg, next) => {
      seen.push(msg);
      if (msg.type !== 'rename') next(msg);
    });

    controller.invoke(INCREMENT);
    const dropped = controller.invoke(rename('Ada'));

    expect(seen).toEqual([
      { type: 'increment' },
      { type: 'rename', name: 'Ada' },
    ]);
    expect(dropped.status).toBe('dispatched');
    expect(controller.frame().model.count).toBe(1);
    expect(controller.frame().model.name).toBe('');
    controller.stop();
  });

  it('contains an update failure as a crash and keeps the frame', () => {
    const base = createPanelApp();
    const { controller, crashes } = start({
      ...base,
      update(msg, model) {
        if (msg.type === 'toggle') throw new Error('update failed');
        return base.update(msg, model);
      },
    });
    controller.invoke(INCREMENT);
    const before = controller.frame();

    const result = controller.invoke(TOGGLE);

    const crash: SemanticSceneCrash<PanelModel> = {
      phase: 'update',
      error: new Error('update failed'),
      model: before.model,
    };
    expect(result).toEqual({ status: 'crashed', crash });
    expect(crashes).toEqual([crash]);
    expect(controller.crash()).toEqual(crash);
    expect(controller.status).toBe('crashed');
    expect(controller.frame().model).toBe(before.model);
    expect(controller.frame().scene).toBe(before.scene);
    expect(controller.invoke(INCREMENT).status).toBe('ignored');
    controller.stop();
  });

  it('contains a dispatchAction failure as a crash', () => {
    const { controller, crashes } = start({
      ...createPanelApp(),
      dispatchAction() {
        throw new Error('dispatch failed');
      },
    });
    const before = controller.frame().model;

    expect(controller.invoke(TOGGLE).status).toBe('crashed');
    expect(crashes.map((crash) => crash.phase)).toEqual(['dispatch']);
    expect(controller.frame().model).toBe(before);
    controller.stop();
  });
});

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
      const { controller } = start(createPanelApp(1));
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

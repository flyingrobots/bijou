import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import type { BusMsg } from './eventbus.js';
import {
  createSemanticSceneController,
  type SemanticSceneCrash,
} from './semantic-scene.js';
import {
  createPanelApp,
  INCREMENT,
  rename,
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

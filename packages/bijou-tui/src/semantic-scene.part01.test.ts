import { validateUiSceneIr } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import {
  createSemanticSceneController,
  type SemanticSceneFrame,
} from './semantic-scene.js';
import {
  createPanelApp,
  INCREMENT,
  panelScene,
  rename,
  RESET,
  TOGGLE,
  type PanelModel,
} from './semantic-scene.test-support.js';

const INITIAL: PanelModel = {
  count: 0,
  limit: 3,
  name: '',
  enabled: true,
  log: [],
};

function start() {
  return createSemanticSceneController(createPanelApp(), {
    ctx: createTestContext(),
  });
}

describe('semantic scene controller: recorded action trace', () => {
  it('projects a validated scene from the initial model', () => {
    const controller = start();
    const { model, scene } = controller.frame();

    expect(controller.status).toBe('running');
    expect(model).toEqual(INITIAL);
    expect(scene).toEqual(panelScene(INITIAL));
    expect(validateUiSceneIr(scene)).toEqual({ ok: true, issues: [] });
    controller.stop();
  });

  it('replays button, text input and toggle actions into model transitions', () => {
    const controller = start();
    const trace = [INCREMENT, rename('Ada'), TOGGLE, TOGGLE, INCREMENT, RESET];
    const models = trace.map((request) => {
      expect(controller.invoke(request).status).toBe('dispatched');
      return controller.frame().model;
    });

    expect(models).toEqual([
      { ...INITIAL, count: 1 },
      { ...INITIAL, count: 1, name: 'Ada' },
      { ...INITIAL, count: 1, name: 'Ada', enabled: false },
      { ...INITIAL, count: 1, name: 'Ada' },
      { ...INITIAL, count: 2, name: 'Ada' },
      { ...INITIAL, count: 0, name: 'Ada' },
    ]);
    controller.stop();
  });

  it('executes the commands that init and update return through the event bus', async () => {
    const controller = start();
    await controller.bus.drain();
    expect(controller.frame().model.log).toEqual(['init']);

    controller.invoke(INCREMENT);
    controller.invoke(INCREMENT);
    expect(controller.bus.getCommandDiagnostics().pendingCommands).toBe(2);
    await controller.bus.drain();

    expect(controller.frame().model).toEqual({
      ...INITIAL,
      count: 2,
      log: ['init', 'count:1', 'count:2'],
    });
    controller.stop();
  });

  it('projects an updated scene after each transition', () => {
    const controller = start();
    const frames: SemanticSceneFrame<PanelModel>[] = [];
    controller.subscribe((frame) => {
      frames.push(frame);
    });

    controller.invoke(INCREMENT);
    controller.invoke(TOGGLE);

    const expected = [
      { ...INITIAL, count: 1 },
      { ...INITIAL, count: 1, enabled: false },
    ];
    expect(frames.map((frame) => frame.model)).toEqual(expected);
    expect(frames.map((frame) => frame.scene)).toEqual(
      expected.map((model) => panelScene(model)),
    );
    expect(controller.frame().scene.actions.map((action) => action.id))
      .toEqual(['panel.toggle', 'panel.reset']);
    expect(controller.frame().scene.nodes[1]?.text)
      .toEqual({ kind: 'literal', value: 'Count 1' });
    controller.stop();
  });

  it('gives dispatchAction the declared command, target and input value', () => {
    const controller = start();

    expect(controller.invoke(rename('Grace'))).toEqual({
      status: 'dispatched',
      invocation: {
        actionId: 'panel.rename',
        command: 'name.set',
        targetNodeId: 'panel.name',
        value: 'Grace',
      },
      message: { type: 'rename', name: 'Grace' },
    });
    expect(controller.invoke(TOGGLE)).toEqual({
      status: 'dispatched',
      invocation: {
        actionId: 'panel.toggle',
        command: 'enabled.toggle',
        targetNodeId: 'panel.enabled',
      },
      message: { type: 'toggle' },
    });
    controller.stop();
  });
});

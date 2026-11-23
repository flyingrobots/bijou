import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import {
  createSemanticSceneController,
  type SemanticSceneDiagnostic,
} from './semantic-scene.js';
import {
  createPanelApp,
  INCREMENT,
  panelScene,
  RESET,
  TOGGLE,
  type PanelApp,
} from './semantic-scene.test-support.js';

function start(app: PanelApp = createPanelApp()) {
  const diagnostics: SemanticSceneDiagnostic[] = [];
  const controller = createSemanticSceneController(app, {
    ctx: createTestContext(),
    onDiagnostic(diagnostic) {
      diagnostics.push(diagnostic);
    },
  });
  return { controller, diagnostics };
}

describe('semantic scene controller: edges', () => {
  it('ignores an action that the prior transition removed', () => {
    const { controller, diagnostics } = start();
    controller.invoke(INCREMENT);
    controller.invoke(RESET);
    const before = controller.frame();

    const result = controller.invoke(RESET);

    const diagnostic: SemanticSceneDiagnostic = {
      code: 'action-not-declared',
      actionId: 'panel.reset',
      sceneId: 'fixture.panel-scene',
      message:
        'Action panel.reset is not declared by scene fixture.panel-scene.',
    };
    expect(result).toEqual({ status: 'ignored', diagnostic });
    expect(diagnostics).toEqual([diagnostic]);
    expect(controller.frame().model).toBe(before.model);
    expect(controller.frame().scene).toBe(before.scene);
    expect(controller.status).toBe('running');
    controller.stop();
  });

  it('ignores an action that no scene declared', () => {
    const { controller, diagnostics } = start();
    const before = controller.frame().model;

    const result = controller.invoke({ actionId: 'panel.ghost', value: 1 });

    expect(result.status).toBe('ignored');
    expect(diagnostics.map((diagnostic) => diagnostic.code))
      .toEqual(['action-not-declared']);
    expect(controller.frame().model).toBe(before);
    controller.stop();
  });

  it('reports a declared action that the app does not map to a message', () => {
    const { controller, diagnostics } = start();
    const before = controller.frame().model;

    const result = controller.invoke({ actionId: 'panel.rename', value: 7 });

    expect(result).toEqual({
      status: 'ignored',
      diagnostic: {
        code: 'action-unhandled',
        actionId: 'panel.rename',
        sceneId: 'fixture.panel-scene',
        message:
          'Action panel.rename (command name.set) produced no message.',
      },
    });
    expect(diagnostics).toHaveLength(1);
    expect(controller.frame().model).toBe(before);
    controller.stop();
  });

  it('fails loudly when the initial scene is invalid', () => {
    const app: PanelApp = {
      ...createPanelApp(),
      viewScene: (model) => ({ ...panelScene(model), rootNodeId: 'missing' }),
    };

    expect(() => start(app)).toThrow(
      'Invalid ui-scene-ir/1 scene fixture.panel-scene: '
        + 'root-node-missing: Root node does not exist: missing',
    );
  });

  it('crashes without changing the frame when a transition projects an invalid scene', () => {
    const app: PanelApp = {
      ...createPanelApp(),
      viewScene: (model) => model.enabled
        ? panelScene(model)
        : { ...panelScene(model), rootNodeId: 'missing' },
    };
    const { controller, diagnostics } = start(app);
    const before = controller.frame();

    expect(controller.invoke(TOGGLE).status).toBe('crashed');
    expect(controller.status).toBe('crashed');
    expect(controller.crash()?.phase).toBe('view');
    const error = controller.crash()?.error;
    expect(error instanceof Error ? error.message : '')
      .toContain('root-node-missing');
    expect(controller.frame()).toEqual(before);
    expect(controller.invoke(TOGGLE).status).toBe('ignored');
    expect(diagnostics.map((diagnostic) => diagnostic.code))
      .toEqual(['controller-crashed']);
    controller.stop();
  });

  it('runs a scene with an empty action list', () => {
    const app: PanelApp = {
      ...createPanelApp(),
      viewScene: (model) => ({ ...panelScene(model), actions: [] }),
    };
    const { controller, diagnostics } = start(app);

    expect(controller.status).toBe('running');
    expect(controller.frame().scene.actions).toEqual([]);
    expect(controller.invoke(TOGGLE).status).toBe('ignored');
    expect(diagnostics.map((diagnostic) => diagnostic.code))
      .toEqual(['action-not-declared']);
    controller.stop();
  });

  it('ignores an invocation after stop, and stops twice safely', () => {
    const { controller, diagnostics } = start();
    const before = controller.frame().model;
    controller.stop();
    controller.stop();

    expect(controller.status).toBe('stopped');
    expect(controller.invoke(TOGGLE).status).toBe('ignored');
    expect(diagnostics.map((diagnostic) => diagnostic.code))
      .toEqual(['controller-stopped']);
    expect(controller.frame().model).toBe(before);
  });
});

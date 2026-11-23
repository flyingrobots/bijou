import {
  lowerUiSceneToBrowser,
  type UiSceneBrowserElement,
} from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, expectTypeOf, it } from 'vitest';
import * as packageRoot from './index.js';
import type { App } from './types.js';
import {
  createSemanticSceneController,
  parseUiSceneActionAttribute,
  replaySemanticSceneActions,
  UI_SCENE_ACTION_ATTRIBUTE,
  UI_SCENE_NODE_ID_ATTRIBUTE,
  type SceneProjection,
} from './semantic-scene.js';
import {
  createPanelApp,
  type PanelModel,
  type PanelMsg,
} from './semantic-scene.test-support.js';

function start() {
  return createSemanticSceneController(createPanelApp(), {
    ctx: createTestContext(),
  });
}

function elements(
  element: UiSceneBrowserElement,
): readonly UiSceneBrowserElement[] {
  return [element, ...element.children.flatMap(elements)];
}

function attribute(
  element: UiSceneBrowserElement,
  name: string,
): string | undefined {
  return element.attributes.find((entry) => entry.name === name)?.value;
}

/** Read `(node id, action id)` pairs back from a lowered browser tree. */
function loweredActions(controller: ReturnType<typeof start>) {
  const { root } = lowerUiSceneToBrowser(controller.frame().scene);
  return elements(root).flatMap((element) => {
    const nodeId = attribute(element, UI_SCENE_NODE_ID_ATTRIBUTE);
    const actions = attribute(element, UI_SCENE_ACTION_ATTRIBUTE);
    if (nodeId === undefined || actions === undefined) return [];
    return parseUiSceneActionAttribute(actions)
      .map((actionId) => ({ nodeId, actionId }));
  });
}

describe('semantic scene contract: browser seam attributes', () => {
  it('names the node and action attributes that the browser seam emits', () => {
    const controller = start();
    const { scene } = controller.frame();
    const { root } = lowerUiSceneToBrowser(scene);

    const nodeIds = elements(root).flatMap((element) =>
      attribute(element, UI_SCENE_NODE_ID_ATTRIBUTE) ?? []);

    expect(UI_SCENE_NODE_ID_ATTRIBUTE).toBe('data-bijou-node-id');
    expect(UI_SCENE_ACTION_ATTRIBUTE).toBe('data-bijou-action');
    expect(nodeIds).toEqual(scene.nodes.map((node) => node.id));
    expect(loweredActions(controller)).toEqual(scene.actions.map((action) => ({
      nodeId: action.targetNodeId,
      actionId: action.id,
    })));
    controller.stop();
  });

  it('dispatches every action id read back from the lowered tree', () => {
    const controller = start();
    const requests = loweredActions(controller)
      .map(({ actionId }) => ({ actionId, value: 'Ada' }));

    const checkpoints = replaySemanticSceneActions(controller, requests);

    expect(requests).toHaveLength(3);
    expect(checkpoints.map((checkpoint) => checkpoint.result.status))
      .toEqual(['dispatched', 'dispatched', 'dispatched']);
    controller.stop();
  });

  it('splits a data-bijou-action value into action ids', () => {
    expect(parseUiSceneActionAttribute('panel.a panel.b'))
      .toEqual(['panel.a', 'panel.b']);
    expect(parseUiSceneActionAttribute('  panel.a \n panel.b '))
      .toEqual(['panel.a', 'panel.b']);
    expect(parseUiSceneActionAttribute('')).toEqual([]);
  });
});

describe('semantic scene contract: package surface', () => {
  it('exports the contract from the package root', () => {
    expect(packageRoot.createSemanticSceneController)
      .toBe(createSemanticSceneController);
    expect(packageRoot.replaySemanticSceneActions)
      .toBe(replaySemanticSceneActions);
    expect(packageRoot.parseUiSceneActionAttribute)
      .toBe(parseUiSceneActionAttribute);
    expect(packageRoot.UI_SCENE_NODE_ID_ATTRIBUTE)
      .toBe(UI_SCENE_NODE_ID_ATTRIBUTE);
    expect(packageRoot.UI_SCENE_ACTION_ATTRIBUTE)
      .toBe(UI_SCENE_ACTION_ATTRIBUTE);
    expectTypeOf<packageRoot.SemanticSceneApp<PanelModel, PanelMsg>>()
      .toEqualTypeOf<
        App<PanelModel, PanelMsg> & SceneProjection<PanelModel, PanelMsg>
      >();
    expectTypeOf<packageRoot.SceneProjection<PanelModel, PanelMsg>>()
      .toEqualTypeOf<SceneProjection<PanelModel, PanelMsg>>();
  });

  it('runs where no document or window exists', () => {
    const controller = start();

    expect('document' in globalThis).toBe(false);
    expect('window' in globalThis).toBe(false);
    expect(controller.invoke({ actionId: 'panel.toggle' }).status)
      .toBe('dispatched');
    controller.stop();
  });
});

import { createSurface, type UiAction, type UiNode, type UiSceneIr } from '@flyingrobots/bijou';
import type { SemanticSceneApp } from '@flyingrobots/bijou-tui';

/** State of the DOM check app. `dispatches` counts every action message `update()` received. */
export interface ControlsModel {
  readonly count: number;
  readonly name: string;
  readonly enabled: boolean;
  readonly dispatches: number;
}

export type ControlsMsg =
  | { readonly type: 'increment' }
  | { readonly type: 'rename'; readonly name: string }
  | { readonly type: 'toggle' };

const ROWS: readonly (readonly [id: string, role: string | undefined, command: string | undefined])[] = [
  ['app.count', 'status', undefined],
  ['app.increment', 'button', 'increment'],
  ['app.name', 'textbox', 'rename'],
  ['app.greeting', undefined, undefined],
  ['app.enabled', 'switch', 'toggle'],
];

function text(model: ControlsModel, id: string): string {
  if (id === 'app.count') return `Count ${String(model.count)}`;
  if (id === 'app.increment') return 'Increment';
  if (id === 'app.name') return model.name;
  if (id === 'app.greeting') return model.name === '' ? 'Type a name' : `Hello, ${model.name}`;
  return model.enabled ? 'On' : 'Off';
}

/** A `ui-scene-ir/1` scene: a status, a Button, a text input that re-renders a greeting, and a switch. */
export function controlsScene(model: ControlsModel): UiSceneIr {
  const nodes = ROWS.map(([id, role], y): UiNode => ({
    id, kind: 'text', parentId: 'app', layout: { x: 0, y },
    ...(role === undefined ? {} : { role }),
    text: { kind: 'literal', value: text(model, id) },
  }));
  const actions = ROWS.flatMap(([id, , command]): UiAction[] => (command === undefined ? [] : [{ id, command, targetNodeId: id }]));
  return {
    irVersion: 'ui-scene-ir/1',
    id: 'web-gpu.dom-check',
    sourceHash: 'sha256:web-gpu-dom-check',
    rootNodeId: 'app',
    nodes: [{ id: 'app', kind: 'group', role: 'region', children: ROWS.map(([id]) => id) }, ...nodes],
    bindings: [],
    actions,
    tokenUses: [],
    i18nUses: [],
    sourceMap: [],
    targetProfiles: [{ kind: 'geordi-browser', width: 640, height: 360 }],
  };
}

/** The semantic scene app the DOM check mounts with `mountBijouDom()`. */
export function createControlsApp(): SemanticSceneApp<ControlsModel, ControlsMsg> {
  return {
    init: () => [{ count: 0, name: '', enabled: true, dispatches: 0 }, []],
    update(msg, model) {
      if (msg.type === 'key' || msg.type === 'resize' || msg.type === 'mouse' || msg.type === 'pulse') return [model, []];
      const next = { ...model, dispatches: model.dispatches + 1 };
      switch (msg.type) {
        case 'increment': return [{ ...next, count: model.count + 1 }, []];
        case 'rename': return [{ ...next, name: msg.name }, []];
        case 'toggle': return [{ ...next, enabled: !model.enabled }, []];
      }
    },
    view: () => createSurface(1, 1),
    viewScene: (model) => controlsScene(model),
    dispatchAction(action) {
      if (action.command === 'rename') return typeof action.value === 'string' ? { type: 'rename', name: action.value } : undefined;
      if (action.command === 'increment' || action.command === 'toggle') return { type: action.command };
      return undefined;
    },
  };
}

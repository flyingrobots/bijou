import {
  createSurface,
  type UiAction,
  type UiNode,
  type UiSceneIr,
} from '@flyingrobots/bijou';
import type { SemanticSceneApp, UiActionRequest } from './semantic-scene.js';
import type { Cmd } from './types.js';

/** State of the panel fixture: a counter, a name field, and a switch. */
export interface PanelModel {
  readonly count: number;
  readonly limit: number;
  readonly name: string;
  readonly enabled: boolean;
  readonly log: readonly string[];
}

export type PanelMsg =
  | { readonly type: 'increment' }
  | { readonly type: 'reset' }
  | { readonly type: 'rename'; readonly name: string }
  | { readonly type: 'toggle' }
  | { readonly type: 'logged'; readonly entry: string };

export type PanelApp = SemanticSceneApp<PanelModel, PanelMsg>;

export const INCREMENT: UiActionRequest = { actionId: 'panel.increment' };
export const RESET: UiActionRequest = { actionId: 'panel.reset' };
export const TOGGLE: UiActionRequest = { actionId: 'panel.toggle' };

export function rename(value: string): UiActionRequest {
  return { actionId: 'panel.rename', value };
}

/**
 * A deterministic panel app. `panel.increment` is declared while the panel
 * is enabled and the count is under `limit`. `panel.rename` is declared while
 * the panel is enabled. `panel.reset` is declared while the count is over 0.
 */
export function createPanelApp(limit = 3): PanelApp {
  return {
    init: () => [
      { count: 0, limit, name: '', enabled: true, log: [] },
      [logCmd('init')],
    ],
    update(msg, model) {
      if (msg.type === 'increment') {
        const count = model.count + 1;
        return [{ ...model, count }, [logCmd(`count:${String(count)}`)]];
      }
      if (msg.type === 'reset') return [{ ...model, count: 0 }, []];
      if (msg.type === 'rename') return [{ ...model, name: msg.name }, []];
      if (msg.type === 'toggle') {
        return [{ ...model, enabled: !model.enabled }, []];
      }
      if (msg.type === 'logged') {
        return [{ ...model, log: [...model.log, msg.entry] }, []];
      }
      return [model, []];
    },
    view: () => createSurface(1, 1),
    viewScene: (model) => panelScene(model),
    dispatchAction(action) {
      if (action.command === 'counter.increment') return { type: 'increment' };
      if (action.command === 'counter.reset') return { type: 'reset' };
      if (action.command === 'enabled.toggle') return { type: 'toggle' };
      if (action.command === 'name.set' && typeof action.value === 'string') {
        return { type: 'rename', name: action.value };
      }
      return undefined;
    },
  };
}

function logCmd(entry: string): Cmd<PanelMsg> {
  const logged: PanelMsg = { type: 'logged', entry };
  return () => Promise.resolve(logged);
}

export function panelActions(model: PanelModel): readonly UiAction[] {
  const canIncrement = model.enabled && model.count < model.limit;
  const candidates: readonly (readonly [boolean, UiAction])[] = [
    [canIncrement, action('increment', 'counter.increment', 'increment')],
    [model.enabled, action('rename', 'name.set', 'name')],
    [true, action('toggle', 'enabled.toggle', 'enabled')],
    [model.count > 0, action('reset', 'counter.reset', 'reset')],
  ];
  return candidates.flatMap(([declared, item]) => declared ? [item] : []);
}

function action(name: string, command: string, target: string): UiAction {
  return { id: `panel.${name}`, command, targetNodeId: `panel.${target}` };
}

export function panelScene(model: PanelModel): UiSceneIr {
  const rows: readonly (readonly [string, string, string])[] = [
    ['panel.count', 'status', `Count ${String(model.count)}`],
    ['panel.increment', 'button', 'Increment'],
    ['panel.name', 'textbox', model.name],
    ['panel.enabled', 'switch', model.enabled ? 'On' : 'Off'],
    ['panel.reset', 'button', 'Reset'],
  ];
  const nodes: readonly UiNode[] = rows.map(([id, role, value], y): UiNode => ({
    id,
    kind: 'text',
    role,
    parentId: 'panel',
    layout: { x: 0, y },
    text: { kind: 'literal', value },
  }));
  return {
    irVersion: 'ui-scene-ir/1',
    id: 'fixture.panel-scene',
    sourceHash: 'sha256:fixture-panel-scene',
    rootNodeId: 'panel',
    nodes: [
      {
        id: 'panel',
        kind: 'group',
        role: 'region',
        children: rows.map(([id]) => id),
        layout: { x: 0, y: 0, width: 32, height: rows.length },
      },
      ...nodes,
    ],
    bindings: [{
      id: 'panel.count.value',
      targetNodeId: 'panel.count',
      targetProperty: 'text',
      source: { kind: 'state', path: 'count' },
    }],
    actions: panelActions(model),
    tokenUses: [],
    i18nUses: [],
    sourceMap: [],
    targetProfiles: [
      { kind: 'bijou-terminal', cols: 32, rows: rows.length },
      { kind: 'geordi-browser', width: 640, height: 360 },
    ],
  };
}

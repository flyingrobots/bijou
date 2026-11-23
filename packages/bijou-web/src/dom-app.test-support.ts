import { createSurface, type ClockPort, type UiAction, type UiNode, type UiSceneIr } from '@flyingrobots/bijou';
import type { Cmd, SemanticSceneApp } from '@flyingrobots/bijou-tui';

/** State of the controls fixture. */
export interface ControlsModel {
  readonly count: number;
  readonly name: string;
  readonly enabled: boolean;
  readonly dir: 'ltr' | 'rtl';
  readonly ticks: number;
  readonly showChip: boolean;
}

export type ControlsMsg =
  | { readonly type: 'increment' } | { readonly type: 'reset' }
  | { readonly type: 'rename'; readonly name: string } | { readonly type: 'toggle' }
  | { readonly type: 'theme' } | { readonly type: 'direction' }
  | { readonly type: 'tick' } | { readonly type: 'chip' };

export interface ControlsOptions {
  /** Runs when the theme switch is pressed, inside a command. */
  readonly onTheme?: () => void;
  /** With a clock, `init()` starts a 1000 ms interval that a cleanup stops. */
  readonly clock?: ClockPort;
}

const ROWS: readonly (readonly [string, string | undefined, string])[] = [
  ['app.count', 'status', 'count'],
  ['app.increment', 'button', 'increment'],
  ['app.name', 'textbox', 'rename'],
  ['app.enabled', 'switch', 'toggle'],
  ['app.theme', 'button', 'theme'],
  ['app.dir', 'button', 'direction'],
  ['app.chip', undefined, 'chip'],
  ['app.reset', 'button', 'reset'],
];

/**
 * A multi-control app: a counter Button, a text input, a toggle, a theme
 * switch, a direction switch, a plain actionable chip, and a reset Button that
 * exists only while the count is over 0.
 */
export function createControlsApp(options: ControlsOptions = {}): SemanticSceneApp<ControlsModel, ControlsMsg> {
  const effect = (run: () => void): Cmd<ControlsMsg> => () => { run(); return undefined; };
  return {
    init: () => [
      { count: 0, name: '', enabled: true, dir: 'ltr', ticks: 0, showChip: true },
      options.clock === undefined ? [] : [intervalCmd(options.clock)],
    ],
    update(msg, model) {
      switch (msg.type) {
        case 'increment': return [{ ...model, count: model.count + 1 }, []];
        case 'reset': return [{ ...model, count: 0 }, []];
        case 'rename': return [{ ...model, name: msg.name }, []];
        case 'toggle': return [{ ...model, enabled: !model.enabled }, []];
        case 'theme': return [model, [effect(() => { options.onTheme?.(); })]];
        case 'direction': return [{ ...model, dir: model.dir === 'ltr' ? 'rtl' : 'ltr' }, []];
        case 'tick': return [{ ...model, ticks: model.ticks + 1 }, []];
        case 'chip': return [{ ...model, showChip: false }, []];
        default: return [model, []];
      }
    },
    view: () => createSurface(1, 1),
    viewScene: (model) => controlsScene(model),
    dispatchAction(action) {
      const command = action.command;
      if (command === 'rename') return typeof action.value === 'string' ? { type: 'rename', name: action.value } : undefined;
      if (command === 'increment' || command === 'reset' || command === 'toggle') return { type: command };
      if (command === 'theme' || command === 'direction' || command === 'chip') return { type: command };
      return undefined;
    },
  };
}

function intervalCmd(clock: ClockPort): Cmd<ControlsMsg> {
  return (emit) => {
    const handle = clock.setInterval(() => { emit({ type: 'tick' }); }, 1000);
    return () => { handle.dispose(); };
  };
}

function text(model: ControlsModel, id: string): string {
  if (id === 'app.count') return `Count ${String(model.count)}`;
  if (id === 'app.name') return model.name;
  if (id === 'app.enabled') return model.enabled ? 'On' : 'Off';
  return id.slice('app.'.length);
}

export function controlsScene(model: ControlsModel): UiSceneIr {
  const rows = ROWS.filter(([id]) => (id !== 'app.reset' || model.count > 0) && (id !== 'app.chip' || model.showChip));
  const nodes = rows.map(([id, role], y): UiNode => ({
    id, kind: 'text', parentId: 'app', layout: { x: 0, y },
    ...(role === undefined ? {} : { role }),
    ...(id === 'app.count' ? { style: { fg: { token: 'semantic.primary' } } } : {}),
    text: { kind: 'literal', value: text(model, id) },
  }));
  const actions = rows.flatMap(([id, , command]): UiAction[] =>
    command === 'count' ? [] : [{ id, command, targetNodeId: id }]);
  return {
    irVersion: 'ui-scene-ir/1',
    id: 'fixture.controls',
    sourceHash: 'sha256:fixture-controls',
    rootNodeId: 'app',
    nodes: [{ id: 'app', kind: 'group', role: 'region', children: rows.map(([id]) => id) }, ...nodes],
    bindings: [],
    actions,
    tokenUses: [],
    i18nUses: [],
    sourceMap: [],
    targetProfiles: [{ kind: 'geordi-browser', width: 640, height: 360 }],
  };
}

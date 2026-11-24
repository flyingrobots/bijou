import {
  box,
  graphemeClusterWidth,
  graphemeWidth,
  kbd,
  segmentGraphemes,
  stripAnsi,
  type BijouContext,
  type Surface,
  type UiAction,
  type UiNode,
  type UiSceneIr,
} from '@flyingrobots/bijou';
import { ansiSurface } from '../../../_shared/example-surfaces.js';

/** The dual-host counter's state: one model, whichever host presents it. */
export interface DualModel {
  readonly count: number;
  readonly name: string;
  readonly enabled: boolean;
}

// The words both projections show, so the canvas and the DOM cannot drift apart.
export const countText = (model: DualModel): string => `Count ${String(model.count)}`;
export const greetingText = (name: string): string => (name === '' ? 'No name yet' : `Hello, ${name}`);
export const switchText = (model: DualModel): string => (model.enabled ? 'On' : 'Off');

const NAME_CELLS = 32;

/**
 * The name as the canvas can show it. The canvas contract takes width-1
 * graphemes only, so a wide or zero-width one (CJK, an emoji, a control
 * character) is shown as `?`, and a name past 32 cells ends in `…`.
 */
export function canvasName(name: string): string {
  const cells = segmentGraphemes(name).map((grapheme) => (graphemeClusterWidth(grapheme) === 1 ? grapheme : '?'));
  return cells.length > NAME_CELLS ? `${cells.slice(0, NAME_CELLS - 1).join('')}…` : cells.join('');
}

/** The canvas projection: the count in a box, the greeting, the switch and the app's own keys. */
export function dualSurface(model: DualModel, ctx: BijouContext): Surface {
  const keys = (names: readonly string[]): string => names.map((name) => kbd(name, { ctx })).join(' ');
  const text = [
    '',
    box(`  ${countText(model)}  `, { ctx }),
    `  ${greetingText(canvasName(model.name))}`,
    `  Switch: ${switchText(model)}`,
    '',
    `  ${keys(['↑', 'k', '+'])}  increment`,
    `  ${keys(['↓', 'j', '-'])}  decrement`,
    `  ${keys(['t'])}  switch`,
    '',
  ].join('\n');
  const lines = text.split('\n');
  const width = Math.max(24, ...lines.map((line) => graphemeWidth(stripAnsi(line))));
  return ansiSurface(text, width, lines.length);
}

type Row = readonly [id: string, role: string | undefined, command: string | undefined];

const ROWS: readonly Row[] = [
  ['app.count', 'status', undefined],
  ['app.increment', 'button', 'increment'],
  ['app.decrement', 'button', 'decrement'],
  ['app.name', 'textbox', 'rename'],
  ['app.greeting', undefined, undefined],
  ['app.enabled', 'switch', 'toggle'],
];

function rowText(model: DualModel, id: string): string {
  if (id === 'app.count') return countText(model);
  if (id === 'app.increment') return 'Increment';
  if (id === 'app.decrement') return 'Decrement';
  if (id === 'app.name') return model.name;
  if (id === 'app.greeting') return greetingText(model.name);
  return switchText(model);
}

/** The DOM projection: a `ui-scene-ir/1` scene of the same model, in `group` and `text` nodes only. */
export function dualScene(model: DualModel): UiSceneIr {
  const nodes = ROWS.map(([id, role], y): UiNode => ({
    id, kind: 'text', parentId: 'app', layout: { x: 0, y },
    ...(role === undefined ? {} : { role }),
    ...(id === 'app.enabled' ? { state: { checked: model.enabled } } : {}),
    text: { kind: 'literal', value: rowText(model, id) },
  }));
  const actions = ROWS.flatMap(([id, , command]): UiAction[] => (command === undefined ? [] : [{ id, command, targetNodeId: id }]));
  return {
    irVersion: 'ui-scene-ir/1',
    id: 'web-gpu.dual-host-counter',
    sourceHash: 'sha256:web-gpu-dual-host-counter',
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

/** Node ids that take focus, in order, for the DOM host's focus fallback. */
export const DUAL_FOCUSABLE = ROWS.flatMap(([id, , command]) => (command === undefined ? [] : [id]));

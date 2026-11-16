import {
  cpFilter,
  cpFocusNext,
  cpFocusPrev,
  cpSelectedItem,
  createCommandPaletteState,
  createSplitPaneState,
  splitPaneSetRatio,
  type CommandPaletteItem,
  type CommandPaletteState,
  type KeyMsg,
  type SplitPaneState,
} from '../../packages/bijou-tui/src/index.js';
import { HERO_THEMES, mixSeeds, type HeroThemeSeed } from './theme.js';

/* Hero app state, the command palette's commands, and key handling. */

const THEME_FADE_SEC = 0.6;

export interface HeroModel {
  readonly time: number;
  readonly frame: number;
  readonly cols: number;
  readonly rows: number;
  readonly focusIndex: number;
  readonly split: SplitPaneState;
  readonly braille: boolean;
  readonly palette: CommandPaletteState | undefined;
  readonly themeFrom: HeroThemeSeed;
  readonly themeTo: HeroThemeSeed;
  readonly themeChangedAt: number;
}

const PALETTE_ITEMS: readonly CommandPaletteItem[] = [
  ...HERO_THEMES.map((t) => ({ id: `theme:${t.id}`, label: `Theme: ${t.label}`, category: 'view', description: 'OKLCH ramp' })),
  { id: 'focus:next', label: 'DAG: focus next node', category: 'graph', shortcut: 'n' },
  { id: 'split:wide', label: 'Layout: widen raytracer', category: 'layout', shortcut: ']' },
  { id: 'render:braille', label: 'Raytracer: toggle Braille', category: 'render', shortcut: 'b' },
  { id: 'split:reset', label: 'Layout: reset split', category: 'layout' },
  { id: 'app:quit', label: 'Quit', category: 'app', shortcut: 'q' },
];

export function createInitialModel(cols: number, rows: number): HeroModel {
  const first = HERO_THEMES[0];
  if (first === undefined) throw new Error('hero demo needs at least one theme');
  return {
    time: 0, frame: 0, cols, rows, focusIndex: 0,
    split: createSplitPaneState({ ratio: 0.5 }), braille: false, palette: undefined,
    themeFrom: first, themeTo: first, themeChangedAt: -Infinity,
  };
}

export function currentSeed(model: HeroModel): HeroThemeSeed {
  return mixSeeds(model.themeFrom, model.themeTo, (model.time - model.themeChangedAt) / THEME_FADE_SEC);
}

function applyTheme(model: HeroModel, id: string): HeroModel {
  const next = HERO_THEMES.find((t) => t.id === id);
  return next === undefined ? model : { ...model, themeFrom: currentSeed(model), themeTo: next, themeChangedAt: model.time };
}

function runCommand(model: HeroModel, id: string): HeroModel {
  if (id.startsWith('theme:')) return applyTheme(model, id.slice('theme:'.length));
  if (id === 'focus:next') return { ...model, focusIndex: model.focusIndex + 1 };
  if (id === 'split:wide') return { ...model, split: splitPaneSetRatio(model.split, 0.68) };
  if (id === 'render:braille') return { ...model, braille: !model.braille };
  if (id === 'split:reset') return { ...model, split: splitPaneSetRatio(model.split, 0.5) };
  return model;
}

function updatePalette(model: HeroModel, state: CommandPaletteState, msg: KeyMsg): [HeroModel, boolean] {
  if (msg.key === 'escape') return [{ ...model, palette: undefined }, false];
  if (msg.key === 'enter' || msg.key === 'return') {
    const item = cpSelectedItem(state);
    const closed = { ...model, palette: undefined };
    return item === undefined ? [closed, false] : [runCommand(closed, item.id), item.id === 'app:quit'];
  }
  if (msg.key === 'down') return [{ ...model, palette: cpFocusNext(state) }, false];
  if (msg.key === 'up') return [{ ...model, palette: cpFocusPrev(state) }, false];
  if (msg.key === 'backspace') return [{ ...model, palette: cpFilter(state, state.query.slice(0, -1)) }, false];
  if (msg.key === 'space') return [{ ...model, palette: cpFilter(state, `${state.query} `) }, false];
  if (Array.from(msg.key).length === 1 && !msg.ctrl) return [{ ...model, palette: cpFilter(state, state.query + msg.key) }, false];
  return [model, false];
}

export function updateKey(model: HeroModel, msg: KeyMsg): [HeroModel, boolean] {
  if (model.palette !== undefined) return updatePalette(model, model.palette, msg);
  if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, true];
  if ((msg.ctrl && msg.key === 'p') || msg.key === ':') {
    return [{ ...model, palette: createCommandPaletteState(PALETTE_ITEMS, 7) }, false];
  }
  if (msg.key === 'b') return [{ ...model, braille: !model.braille }, false];
  if (msg.key === 'n') return [{ ...model, focusIndex: model.focusIndex + 1 }, false];
  if (msg.key === ']') return [{ ...model, split: splitPaneSetRatio(model.split, model.split.ratio + 0.03) }, false];
  if (msg.key === '[') return [{ ...model, split: splitPaneSetRatio(model.split, model.split.ratio - 0.03) }, false];
  return [model, false];
}

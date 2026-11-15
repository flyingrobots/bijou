import type { OutputMode } from '../../packages/bijou/src/index.js';
import { createKeyMap, type FrameCommandItem } from '../../packages/bijou-tui/src/index.js';
import { COMPONENT_STORIES } from '../docs/stories.js';

/* Zen's model, messages, timings and key map. */

/** 1–4 pick the lowering; the component itself is the only thing in the body. */
export const ZEN_MODES: readonly { readonly mode: OutputMode; readonly label: string }[] = [
  { mode: 'interactive', label: 'TUI' },
  { mode: 'static', label: 'static' },
  { mode: 'pipe', label: 'pipe' },
  { mode: 'accessible', label: 'accessible' },
];

export const LEGEND = 'h/l component · tab variant · j/k scroll · 1–4 mode · i info · / search · F2 · q quit';
export const SLIDE_SEC = 0.28;
export const INTRO_IN = 0.5;
export const INTRO_OUT = 0.5;
export const FAMILIES: readonly string[] = [...new Set(COMPONENT_STORIES.map((s) => s.family))];

/** Open each component on a variant that animates (one whose render reads timeMs), if it has one. */
export function liveVariant(index: number): number {
  const variants = COMPONENT_STORIES[index]?.variants ?? [];
  return Math.max(0, variants.findIndex((v) => v.render.toString().includes('timeMs')));
}
export const MAX_WIDTH = 76;

export type ZenMsg =
  | { readonly type: 'zen-step'; readonly delta: number }
  | { readonly type: 'zen-variant'; readonly delta: number }
  | { readonly type: 'zen-scroll'; readonly delta: number }
  | { readonly type: 'zen-mode'; readonly index: number }
  | { readonly type: 'zen-info' }
  | { readonly type: 'zen-start' }
  | { readonly type: 'zen-select'; readonly index: number };

export interface ZenModel {
  readonly index: number;
  readonly modeIndex: number;
  readonly variantIndex: number;
  readonly docs: boolean;
  readonly scroll: number;
  readonly time: number;
  /** Title screen, a family's intro slide (entered at `introAt`), or the component itself. */
  readonly stage: 'title' | 'intro' | 'component';
  readonly introAt: number;
  /** When the user dismissed the intro slide; the out-transition runs from here. Slides never time out. */
  readonly introExitAt: number | undefined;
  /** Carousel slide: the variant we came from, when, and which way. */
  readonly slide: { readonly from: number; readonly at: number; readonly dir: 1 | -1 } | undefined;
}

export function wrap(index: number, length: number): number {
  return ((index % length) + length) % length;
}

const step = (delta: number): ZenMsg => ({ type: 'zen-step', delta });
const scroll = (delta: number): ZenMsg => ({ type: 'zen-scroll', delta });
const mode = (index: number): ZenMsg => ({ type: 'zen-mode', index });

export const zenKeys = createKeyMap<ZenMsg>()
  .group('Components', (group) => group
    .bind('h', 'Previous component', step(-1))
    .bind('left', 'Previous component', step(-1))
    .bind('l', 'Next component', step(1))
    .bind('right', 'Next component', step(1))
    .bind('tab', 'Next variant', { type: 'zen-variant', delta: 1 })
    .bind('shift+tab', 'Previous variant', { type: 'zen-variant', delta: -1 }))
  .group('View', (group) => group
    .bind('j', 'Scroll down', scroll(1))
    .bind('down', 'Scroll down', scroll(1))
    .bind('k', 'Scroll up', scroll(-1))
    .bind('up', 'Scroll up', scroll(-1))
    .bind('i', 'Toggle info', { type: 'zen-info' })
    .bind('enter', 'Start', { type: 'zen-start' })
    .bind('space', 'Start', { type: 'zen-start' }))
  .group('Mode', (group) => group
    .bind('1', 'TUI', mode(0))
    .bind('2', 'Static', mode(1))
    .bind('3', 'Pipe', mode(2))
    .bind('4', 'Accessible', mode(3)));

/** `/` opens the frame's search over component names; picking one dispatches zen-select. */
export const SEARCH_ITEMS: readonly FrameCommandItem<ZenMsg>[] = COMPONENT_STORIES.map((story, index) => ({
  id: story.id, label: story.title, description: story.family, action: { type: 'zen-select', index },
}));

import type { OutputMode } from '../../packages/bijou/src/index.js';
import { createKeyMap, type FrameCommandItem } from '../../packages/bijou-tui/src/index.js';
import { COMPONENT_STORIES } from '../docs/stories.js';
import { findStoryIndex, type LibraryStart } from './library-cli.js';

/* The component library's model, messages, timings and key map. */

/** 1–4 pick the output mode the component renders in; the component is the only thing in the body. */
export const LIBRARY_MODES: readonly { readonly mode: OutputMode; readonly label: string }[] = [
  { mode: 'interactive', label: 'interactive' },
  { mode: 'static', label: 'static' },
  { mode: 'pipe', label: 'pipe' },
  { mode: 'accessible', label: 'accessible' },
];

// The mode row already shows 1–4, i and r on its chips; ? lists every key.
export const LEGEND = 'h/l slide · PgUp/PgDn section · tab variant · / search · ? help · q quit';
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

export type LibraryMsg =
  | { readonly type: 'library-step'; readonly delta: number }
  | { readonly type: 'library-family'; readonly delta: number }
  | { readonly type: 'library-variant'; readonly delta: number }
  | { readonly type: 'library-scroll'; readonly delta: number }
  | { readonly type: 'library-mode'; readonly index: number }
  | { readonly type: 'library-info' }
  | { readonly type: 'library-start' }
  | { readonly type: 'library-rtl' }
  | { readonly type: 'library-select'; readonly index: number };

export interface LibraryModel {
  readonly index: number;
  readonly modeIndex: number;
  readonly variantIndex: number;
  readonly docs: boolean;
  readonly scroll: number;
  /** Right-to-left reading direction, shared with the frame through its i18n runtime. */
  readonly rtl: boolean;
  readonly time: number;
  /** Title screen, a family's intro slide (entered at `introAt`), or the component itself. */
  readonly stage: 'title' | 'intro' | 'component' | 'end';
  readonly introAt: number;
  /** When the user dismissed the intro slide; the out-transition runs from here. Slides never time out. */
  readonly introExitAt: number | undefined;
  /** Carousel slide: the variant we came from, when, and which way. */
  readonly slide: { readonly from: number; readonly at: number; readonly dir: 1 | -1 } | undefined;
}

/** The model the library opens with, from command-line options (see library-cli.ts). */
export function initialModel(start: LibraryStart = {}): LibraryModel {
  const index = start.component === undefined ? 0 : Math.max(0, findStoryIndex(start.component));
  const variants = COMPONENT_STORIES[index]?.variants ?? [];
  const wanted = start.variant?.toLowerCase();
  const named = wanted === undefined ? -1 : variants.findIndex((v) => v.id.toLowerCase() === wanted || v.label.toLowerCase() === wanted);
  const slide = start.slide ?? (start.component === undefined ? 'title' : 'component');
  return {
    index, variantIndex: named >= 0 ? named : liveVariant(index),
    modeIndex: Math.max(0, LIBRARY_MODES.findIndex((m) => m.mode === start.mode)),
    docs: start.info ?? false, scroll: 0, rtl: start.rtl ?? false, time: 0,
    stage: slide === 'family' ? 'intro' : slide, introAt: 0, introExitAt: undefined, slide: undefined,
  };
}

export function wrap(index: number, length: number): number {
  return ((index % length) + length) % length;
}

const step = (delta: number): LibraryMsg => ({ type: 'library-step', delta });
const scroll = (delta: number): LibraryMsg => ({ type: 'library-scroll', delta });
const mode = (index: number): LibraryMsg => ({ type: 'library-mode', index });

export const libraryKeys = createKeyMap<LibraryMsg>()
  .group('Components', (group) => group
    .bind('h', 'Previous component', step(-1))
    .bind('left', 'Previous component', step(-1))
    .bind('l', 'Next component', step(1))
    .bind('right', 'Next component', step(1))
    .bind('pageup', 'Previous section', { type: 'library-family', delta: -1 })
    .bind('pagedown', 'Next section', { type: 'library-family', delta: 1 })
    .bind('[', 'Previous section', { type: 'library-family', delta: -1 })
    .bind(']', 'Next section', { type: 'library-family', delta: 1 })
    .bind('tab', 'Next variant', { type: 'library-variant', delta: 1 })
    .bind('shift+tab', 'Previous variant', { type: 'library-variant', delta: -1 }))
  .group('View', (group) => group
    .bind('j', 'Scroll down', scroll(1))
    .bind('down', 'Scroll down', scroll(1))
    .bind('k', 'Scroll up', scroll(-1))
    .bind('up', 'Scroll up', scroll(-1))
    .bind('i', 'Toggle info', { type: 'library-info' })
    .bind('r', 'Toggle right-to-left', { type: 'library-rtl' })
    .bind('enter', 'Start', { type: 'library-start' })
    .bind('space', 'Start', { type: 'library-start' }))
  .group('Mode', (group) => group
    .bind('1', 'TUI', mode(0))
    .bind('2', 'Static', mode(1))
    .bind('3', 'Pipe', mode(2))
    .bind('4', 'Accessible', mode(3)));

/** `/` opens the frame's search over component names; picking one dispatches library-select. */
export const SEARCH_ITEMS: readonly FrameCommandItem<LibraryMsg>[] = COMPONENT_STORIES.map((story, index) => ({
  id: story.id, label: story.title, description: story.family, action: { type: 'library-select', index },
}));

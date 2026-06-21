import type { BijouContext, Cell, TokenValue } from '@flyingrobots/bijou';

import { createScrollState } from './viewport.js';

import type { ScrollState, ScrollbarMode } from './viewport.js';

import { resolveFocusAreaViewportWidth } from './focus-area.part06.js';
export type OverflowX = 'scroll' | 'hidden';
export interface FocusAreaState {
  /** Full text content displayed in the focus area. */
  readonly content: string;
  /** Underlying scroll position state. */
  readonly scroll: ScrollState;
  /** Total width in columns (including gutter). */
  readonly width: number;
  /** Total height in rows. */
  readonly height: number;
  /** Horizontal overflow behavior. */
  readonly overflowX: OverflowX;
  /** Scrollbar ownership model for the pane edge. */
  readonly scrollbarMode: ScrollbarMode;
}
export interface FocusAreaOptions {
  /** Full text content to display. */
  readonly content: string;
  /** Total width in columns (including gutter). */
  readonly width: number;
  /** Total height in rows. */
  readonly height: number;
  /** Horizontal overflow behavior. Default: `'hidden'`. */
  readonly overflowX?: OverflowX;
  /** Reserve a gutter column or overlay the rightmost content cell. Default: `'gutter'`. */
  readonly scrollbarMode?: ScrollbarMode;
}
export interface FocusAreaRenderOptions {
  /** Whether the pane is currently focused. Default: `true`. */
  readonly focused?: boolean;
  /** Token for the focused gutter. Default: `theme.ui.focusGutter`. */
  readonly focusedGutterToken?: TokenValue;
  /** Token for the unfocused gutter. Default: `theme.semantic.muted`. */
  readonly unfocusedGutterToken?: TokenValue;
  /** Show a scrollbar track on the right edge. Default: `true`. */
  readonly showScrollbar?: boolean;
  /** Token for the scrollbar track. Default: `theme.ui.scrollTrack`. */
  readonly scrollbarTrackToken?: TokenValue;
  /** Token for the scrollbar thumb. Default: `theme.ui.scrollThumb`. */
  readonly scrollbarThumbToken?: TokenValue;
  /** Optional BCSS id for the focus area. */
  readonly id?: string;
  /** Optional BCSS classes for the focus area. */
  readonly classes?: readonly string[];
  /** Bijou context for styling and mode detection. */
  readonly ctx?: BijouContext;
}
export const GUTTER_CHAR = '▎';
export const EMPTY_CELL: Cell = { char: ' ', empty: false };
export const SCROLLBAR_TRACK_CELL: Cell = { char: '│', empty: false };
export const SCROLLBAR_THUMB_CELL: Cell = { char: '█', empty: false };
export const gutterCellCache = new Map<string, Cell>();
export const scrollbarCellCache = new Map<string, Cell>();
export function createFocusAreaState(options: FocusAreaOptions): FocusAreaState {
  const { content, overflowX = 'hidden', scrollbarMode = 'gutter' } = options;
  // Clamp dimensions to at least 1
  const width = Math.max(1, options.width);
  const height = Math.max(1, options.height);
  return {
    content,
    scroll: createScrollState(
      content,
      height,
      resolveFocusAreaViewportWidth(content.split('\n').length, width, height, overflowX, scrollbarMode),
    ),
    width,
    height,
    overflowX,
    scrollbarMode,
  };
}

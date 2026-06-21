import type { LayoutRect } from './layout-rect.js';

import { sanitizeNonNegativeInt, solveSplitAxisSizes } from '@flyingrobots/bijou';

import type { SplitLayoutDirection, Surface, WritePort } from '@flyingrobots/bijou';

import { clampRatio, warnInvalidRatio } from './split-pane.part02.js';

import { clamp } from './split-pane.part03.js';
export type SplitPaneDirection = SplitLayoutDirection;
export type SplitPaneFocus = 'a' | 'b';
export interface SplitPaneState {
  /** Relative size of pane A in the range `[0, 1]`. */
  readonly ratio: number;
  /** Currently focused pane. */
  readonly focused: SplitPaneFocus;
}
export interface SplitPaneLayout {
  /** Rectangle for pane A. */
  readonly paneA: LayoutRect;
  /** Rectangle for pane B. */
  readonly paneB: LayoutRect;
  /** Rectangle for divider area between panes. */
  readonly divider: LayoutRect;
}
export interface SplitPaneOptions {
  /** Split direction. Default: `'row'`. */
  readonly direction?: SplitPaneDirection;
  /** Total available width. */
  readonly width: number;
  /** Total available height. */
  readonly height: number;
  /** Minimum size for pane A in the main axis. Default: 0. */
  readonly minA?: number;
  /** Minimum size for pane B in the main axis. Default: 0. */
  readonly minB?: number;
  /** Divider thickness in the main axis. Default: 1. */
  readonly dividerSize?: number;
  /** Divider character (single terminal column). Default: `│` or `─` based on direction. */
  readonly dividerChar?: string;
  /** Pane A renderer. */
  readonly paneA: (width: number, height: number) => string;
  /** Pane B renderer. */
  readonly paneB: (width: number, height: number) => string;
}
export interface SplitPaneSurfaceOptions extends Omit<SplitPaneOptions, 'paneA' | 'paneB'> {
  /** Pane A renderer. */
  readonly paneA: (width: number, height: number) => Surface;
  /** Pane B renderer. */
  readonly paneB: (width: number, height: number) => Surface;
}
export function createSplitPaneState(options?: { ratio?: number; focused?: SplitPaneFocus; io?: WritePort }): SplitPaneState {
  if (options?.ratio != null && !Number.isFinite(options.ratio)) {
    warnInvalidRatio(options.ratio, options.io);
  }

  return {
    ratio: clampRatio(options?.ratio ?? 0.5),
    focused: options?.focused ?? 'a',
  };
}
export function splitPaneSetRatio(state: SplitPaneState, ratio: number): SplitPaneState {
  return { ...state, ratio: clampRatio(ratio) };
}
export function splitPaneResizeBy(
  state: SplitPaneState,
  delta: number,
  limits: { total: number; minA?: number; minB?: number; dividerSize?: number },
): SplitPaneState {
  const safeDelta = Number.isFinite(delta) ? Math.trunc(delta) : 0;
  const dividerSize = sanitizeNonNegativeInt(limits.dividerSize, 1);
  const total = sanitizeNonNegativeInt(limits.total, 0);
  const available = Math.max(0, total - dividerSize);
  if (available <= 0) return { ...state, ratio: 0 };

  const minA = sanitizeNonNegativeInt(limits.minA, 0);
  const minB = sanitizeNonNegativeInt(limits.minB, 0);
  const { paneA: currA } = solveSplitAxisSizes({
    available,
    ratio: state.ratio,
    minA,
    minB,
  });

  const maxA = Math.max(0, available - Math.min(minB, available));
  const clampedMinA = Math.min(minA, maxA);
  const nextA = clamp(currA + safeDelta, clampedMinA, maxA);
  return { ...state, ratio: nextA / available };
}
export function splitPaneToggleFocus(state: SplitPaneState): SplitPaneState {
  return { ...state, focused: state.focused === 'a' ? 'b' : 'a' };
}
export function splitPaneFocusNext(state: SplitPaneState): SplitPaneState {
  return splitPaneToggleFocus(state);
}
export function splitPaneFocusPrev(state: SplitPaneState): SplitPaneState {
  return splitPaneToggleFocus(state);
}

/**
 * Split-pane layout primitive.
 *
 * Stateful ratio + focus model with pure reducers and deterministic layout
 * solving for horizontal (`row`) and vertical (`column`) splits.
 */

import type { LayoutRect } from './layout-rect.js';
import { fitBlock } from './layout-utils.js';

/** Split direction. */
export type SplitPaneDirection = 'row' | 'column';
/** Focused pane identifier. */
export type SplitPaneFocus = 'a' | 'b';

/** Immutable split pane state. */
export interface SplitPaneState {
  /** Relative size of pane A in the range `[0, 1]`. */
  readonly ratio: number;
  /** Currently focused pane. */
  readonly focused: SplitPaneFocus;
}

/** Solved pane and divider rectangles. */
export interface SplitPaneLayout {
  /** Rectangle for pane A. */
  readonly paneA: LayoutRect;
  /** Rectangle for pane B. */
  readonly paneB: LayoutRect;
  /** Rectangle for divider area between panes. */
  readonly divider: LayoutRect;
}

/** Options for rendering split panes. */
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
  /** Divider character. Default: `│` or `─` based on direction. */
  readonly dividerChar?: string;
  /** Pane A renderer. */
  readonly paneA: (width: number, height: number) => string;
  /** Pane B renderer. */
  readonly paneB: (width: number, height: number) => string;
}

/**
 * Create split-pane state.
 */
export function createSplitPaneState(options?: { ratio?: number; focused?: SplitPaneFocus }): SplitPaneState {
  return {
    ratio: clampRatio(options?.ratio ?? 0.5),
    focused: options?.focused ?? 'a',
  };
}

/**
 * Update split ratio directly (clamped to `[0, 1]`).
 */
export function splitPaneSetRatio(state: SplitPaneState, ratio: number): SplitPaneState {
  return { ...state, ratio: clampRatio(ratio) };
}

/**
 * Resize pane A by `delta` main-axis units and derive the new ratio.
 */
export function splitPaneResizeBy(
  state: SplitPaneState,
  delta: number,
  limits: { total: number; minA?: number; minB?: number; dividerSize?: number },
): SplitPaneState {
  const dividerSize = Math.max(0, limits.dividerSize ?? 1);
  const available = Math.max(0, limits.total - dividerSize);
  if (available <= 0) return { ...state, ratio: 0 };

  const minA = Math.max(0, limits.minA ?? 0);
  const minB = Math.max(0, limits.minB ?? 0);
  const [currA] = solveSplit(available, state.ratio, minA, minB);

  const maxA = Math.max(0, available - Math.min(minB, available));
  const clampedMinA = Math.min(minA, maxA);
  const nextA = clamp(currA + delta, clampedMinA, maxA);
  return { ...state, ratio: nextA / available };
}

/**
 * Toggle focus between pane A and pane B.
 */
export function splitPaneToggleFocus(state: SplitPaneState): SplitPaneState {
  return { ...state, focused: state.focused === 'a' ? 'b' : 'a' };
}

/**
 * Focus the next pane (equivalent to toggle for a 2-pane split).
 */
export function splitPaneFocusNext(state: SplitPaneState): SplitPaneState {
  return splitPaneToggleFocus(state);
}

/**
 * Focus the previous pane (equivalent to toggle for a 2-pane split).
 */
export function splitPaneFocusPrev(state: SplitPaneState): SplitPaneState {
  return splitPaneToggleFocus(state);
}

/**
 * Solve split-pane geometry for the provided bounds.
 */
export function splitPaneLayout(
  state: SplitPaneState,
  options: Omit<SplitPaneOptions, 'paneA' | 'paneB'>,
): SplitPaneLayout {
  const direction = options.direction ?? 'row';
  const width = Math.max(0, options.width);
  const height = Math.max(0, options.height);
  const dividerSize = Math.max(0, options.dividerSize ?? 1);
  const minA = Math.max(0, options.minA ?? 0);
  const minB = Math.max(0, options.minB ?? 0);

  if (direction === 'row') {
    const available = Math.max(0, width - dividerSize);
    const [a, b] = solveSplit(available, state.ratio, minA, minB);
    return {
      paneA: { row: 0, col: 0, width: a, height },
      divider: { row: 0, col: a, width: dividerSize, height },
      paneB: { row: 0, col: a + dividerSize, width: b, height },
    };
  }

  const available = Math.max(0, height - dividerSize);
  const [a, b] = solveSplit(available, state.ratio, minA, minB);
  return {
    paneA: { row: 0, col: 0, width, height: a },
    divider: { row: a, col: 0, width, height: dividerSize },
    paneB: { row: a + dividerSize, col: 0, width, height: b },
  };
}

/**
 * Render a split-pane view string.
 */
export function splitPane(state: SplitPaneState, options: SplitPaneOptions): string {
  const direction = options.direction ?? 'row';
  const dividerChar = options.dividerChar ?? (direction === 'row' ? '│' : '─');
  const layout = splitPaneLayout(state, options);

  const aLines = fitBlock(options.paneA(layout.paneA.width, layout.paneA.height), layout.paneA.width, layout.paneA.height);
  const bLines = fitBlock(options.paneB(layout.paneB.width, layout.paneB.height), layout.paneB.width, layout.paneB.height);

  if (direction === 'row') {
    const dividerLine = dividerChar.repeat(Math.max(0, layout.divider.width));
    const lines: string[] = [];
    for (let r = 0; r < layout.paneA.height; r++) {
      lines.push((aLines[r] ?? '') + dividerLine + (bLines[r] ?? ''));
    }
    return lines.join('\n');
  }

  const dividerLines = Array.from({ length: layout.divider.height }, () =>
    dividerChar.repeat(Math.max(0, layout.divider.width)),
  );

  return [...aLines, ...dividerLines, ...bLines].join('\n');
}

function solveSplit(available: number, ratio: number, minA: number, minB: number): [number, number] {
  if (available <= 0) return [0, 0];

  // Priority: minB > minA when they conflict (B keeps its minimum first).
  const maxAFromMinB = Math.max(0, available - Math.min(minB, available));
  // A's minimum cannot exceed the maximum that still satisfies B's minimum.
  const clampedMinA = Math.min(minA, maxAFromMinB);

  // Ratio target is clamped to feasible bounds after applying constraints.
  let desiredA = Math.round(clampRatio(ratio) * available);
  desiredA = clamp(desiredA, clampedMinA, maxAFromMinB);

  // Guardrail: if rounding drift undercuts B's minimum, pull A back into range.
  const desiredB = available - desiredA;
  if (desiredB < Math.min(minB, available)) {
    desiredA = Math.max(clampedMinA, available - Math.min(minB, available));
  }

  const a = clamp(desiredA, 0, available);
  const b = Math.max(0, available - a);
  return [a, b];
}

function clampRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0.5;
  return clamp(ratio, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

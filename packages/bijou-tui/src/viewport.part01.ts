import { clipToWidth as coreClipToWidth, graphemeWidth } from '@flyingrobots/bijou';

import type { Cell, LayoutNode, Surface } from '@flyingrobots/bijou';
export type ScrollbarMode = 'gutter' | 'overlay';
export interface ViewportOptions {
  /** Visible width in columns. Content lines longer than this are clipped. */
  readonly width: number;
  /** Visible height in rows. */
  readonly height: number;
  /** Full content string (may be taller/wider than the viewport). */
  readonly content: string;
  /** Vertical scroll offset (0-based line index). Default: 0. */
  readonly scrollY?: number;
  /** Horizontal scroll offset (0-based column index). Default: 0. */
  readonly scrollX?: number;
  /** Show a scrollbar track on the right edge. Default: true. */
  readonly showScrollbar?: boolean;
  /** Reserve a gutter column or overlay the rightmost content cell. Default: `'gutter'`. */
  readonly scrollbarMode?: ScrollbarMode;
  /** Character used for the scrollbar track in string rendering. Default: `'│'`. */
  readonly scrollbarTrackChar?: string;
  /** Character used for the scrollbar thumb in string rendering. Default: `'█'`. */
  readonly scrollbarThumbChar?: string;
}
export interface ViewportSurfaceOptions extends Omit<ViewportOptions, 'content'> {
  /** Full content payload, either plain/ANSI text, a pre-rendered surface, or a layout tree. */
  readonly content: ViewportContent;
  /** Cell used for the scrollbar track in surface rendering. */
  readonly scrollbarTrackCell?: Cell;
  /** Cell used for the scrollbar thumb in surface rendering. */
  readonly scrollbarThumbCell?: Cell;
}
export type ViewportContent = string | Surface | LayoutNode;
export interface ScrollState {
  /** Current vertical scroll offset. */
  readonly y: number;
  /** Maximum vertical scroll offset. */
  readonly maxY: number;
  /** Current horizontal scroll offset. */
  readonly x: number;
  /** Maximum horizontal scroll offset. */
  readonly maxX: number;
  /** Total number of content lines. */
  readonly totalLines: number;
  /** Number of visible lines (viewport height). */
  readonly visibleLines: number;
}
export const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
export function stripAnsi(str: string): string {
  return str.replace(ANSI_RE, '');
}
export function visibleLength(str: string): number {
  return graphemeWidth(str);
}
export const clipToWidth = coreClipToWidth;

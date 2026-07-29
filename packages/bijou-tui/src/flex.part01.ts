import type { BijouContext, TokenValue, Surface } from '@flyingrobots/bijou';
import { visibleLength } from './viewport.js';

export interface FlexOptions {
  /** Layout direction. Default: 'row'. */
  readonly direction?: 'row' | 'column';
  /** Available width in columns. */
  readonly width: number;
  /** Available height in rows. */
  readonly height: number;
  /** Gap between children (in the main axis). Default: 0. */
  readonly gap?: number;
  /** Background token applied to the entire flex container (gap + padding areas). Requires `bg` field on the token. */
  readonly bgToken?: TokenValue;
  /** Bijou context for styled output (required for bgToken to take effect). */
  readonly ctx?: BijouContext;
}

export interface FlexChild {
  /**
   * Content to render. Either a static string, or a function that
   * receives the allocated (width, height) and returns a string.
   */
  readonly content: string | ((width: number, height: number) => string);
  /** Flex-grow factor. Children with flex > 0 share remaining space. Default: 0. */
  readonly flex?: number;
  /** Fixed size along the main axis (columns for row, rows for column). */
  readonly basis?: number;
  /** Minimum size along the main axis. */
  readonly minSize?: number;
  /** Maximum size along the main axis. */
  readonly maxSize?: number;
  /** Cross-axis alignment. Default: 'start'. */
  readonly align?: 'start' | 'center' | 'end';
  /** Background token for this child's allocated region. Requires `bg` field on the token and `ctx` on `FlexOptions`. */
  readonly bgToken?: TokenValue;
}

export type SurfaceFlexRenderable =
  | string
  | Surface
  | ((width: number, height: number) => string | Surface);

export interface SurfaceFlexChild {
  /** Content to render for this allocated region. */
  readonly content: SurfaceFlexRenderable;
  /** Flex-grow factor. Children with flex > 0 share remaining space. Default: 0. */
  readonly flex?: number;
  /** Fixed size along the main axis (columns for row, rows for column). */
  readonly basis?: number;
  /** Minimum size along the main axis. */
  readonly minSize?: number;
  /** Maximum size along the main axis. */
  readonly maxSize?: number;
  /** Cross-axis alignment. Default: 'start'. */
  readonly align?: 'start' | 'center' | 'end';
  /** Background token for this child's allocated region. Requires `bg` field on the token and `ctx` on `FlexOptions`. */
  readonly bgToken?: TokenValue;
}

function visualWidth(s: string): number {
  return visibleLength(s);
}

interface ResolvedChild {
  /** Allocated size along the main axis. */
  allocatedSize: number;
  /** Available size along the cross axis. */
  crossSize: number;
  /** Original child descriptor. */
  child: FlexChild;
}

interface FlexChildLike {
  readonly content: string | Surface | ((width: number, height: number) => string | Surface);
  readonly flex?: number;
  readonly basis?: number;
  readonly minSize?: number;
  readonly maxSize?: number;
  readonly align?: 'start' | 'center' | 'end';
  readonly bgToken?: TokenValue;
}

interface ResolvedFlexChild<T extends FlexChildLike> {
  allocatedSize: number;
  crossSize: number;
  child: T;
}

function clampSize(size: number, min?: number, max?: number): number {
  let result = size;
  if (min !== undefined) result = Math.max(result, min);
  if (max !== undefined) result = Math.min(result, max);
  return Math.max(0, result);
}

function measureContent(
  content: string | Surface | ((width: number, height: number) => string | Surface),
  isRow: boolean,
): number {
  if (typeof content === 'function') {
    // Can't measure a render function — treat as 0 (must use flex or basis)
    return 0;
  }
  if (typeof content !== 'string') {
    return isRow ? content.width : content.height;
  }
  const lines = content.split('\n');
  if (isRow) {
    // Width = max visible line width
    return Math.max(0, ...lines.map(visualWidth));
  }
  // Height = number of lines
  return lines.length;
}

export type { FlexChildLike, ResolvedChild, ResolvedFlexChild };
export { clampSize, measureContent, visualWidth };

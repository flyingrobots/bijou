import type { Surface } from './surface-contract.js';

export interface LayoutRect {
  /** Zero-based column index. */
  x: number;
  /** Zero-based row index. */
  y: number;
  /** Width in columns. */
  width: number;
  /** Height in rows. */
  height: number;
}

export interface LayoutNode {
  /** Unique identifier matching a CSS ID selector. */
  id?: string;
  /** Component type matching a CSS type selector. */
  type?: string;
  /** CSS class names attached to this node. */
  classes?: string[];
  /** Calculated rectangle for this node. */
  rect: LayoutRect;
  /** Child layout nodes. */
  children: LayoutNode[];
  /** Optional surface painted at this node's position. */
  surface?: Surface;
}

export interface LayoutEngine<Options, Child> {
  calculate(
    options: Options,
    children: Child[],
    bounds: LayoutRect,
  ): LayoutNode;
}

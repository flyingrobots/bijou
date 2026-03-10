/**
 * Core types for the Bijou decoupled layout engine.
 */

/**
 * A rectangular area in terminal coordinates.
 */
export interface LayoutRect {
  /** 0-based column index. */
  x: number;
  /** 0-based row index. */
  y: number;
  /** Width in columns. */
  width: number;
  /** Height in rows. */
  height: number;
}

/**
 * A node in the layout tree.
 */
export interface LayoutNode {
  /** Unique identifier for this layout node. Matches CSS #id. */
  id?: string;
  /** Component type name. Matches CSS type selectors (e.g. 'Badge'). */
  type?: string;
  /** List of CSS class names. Matches CSS .class selectors. */
  classes?: string[];
  /** The calculated rectangle for this node. */
  rect: LayoutRect;
  /** Child layout nodes. */
  children: LayoutNode[];
}

/**
 * Interface for a layout engine (e.g. Flex, Grid).
 */
export interface LayoutEngine<Options, Child> {
  /** Calculate the layout tree for a given set of options and children. */
  calculate(options: Options, children: Child[], bounds: LayoutRect): LayoutNode;
}

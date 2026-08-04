import { createSurface, type Surface } from '../../packages/bijou/src/index.js';

const COLUMN_GAP = 1;

// The left column carries the editor and its context prose, which is the
// wordiest content on the page; the right carries dependency lists, which are
// short. An even split would wrap the left and leave the right half empty.
const LEFT_COLUMN_SHARE = 0.55;

/** Width of the left column, given the pane body width. */
export function themeLabColumnWidth(bodyWidth: number): number {
  return Math.max(28, Math.floor((bodyWidth - COLUMN_GAP) * LEFT_COLUMN_SHARE));
}

/** Width of the right column, given the pane body width. */
export function themeLabRightColumnWidth(bodyWidth: number): number {
  return Math.max(24, bodyWidth - COLUMN_GAP - themeLabColumnWidth(bodyWidth));
}

/**
 * Place two stacks side by side.
 *
 * The Theme Lab used to be a single column of eight boxes running 138 rows
 * deep, so on a 46-row terminal most of it — including the theme list itself —
 * sat permanently below the fold. The pane is far wider than it is tall;
 * spending that width is what makes the page readable without scrolling.
 *
 * Columns are top-aligned and the surface takes the height of the taller one.
 */
export function themeLabColumns(left: Surface, right: Surface, bodyWidth: number): Surface {
  const columnWidth = themeLabColumnWidth(bodyWidth);
  const height = Math.max(1, left.height, right.height);
  const surface = createSurface(Math.max(1, bodyWidth), height);
  surface.blit(left, 0, 0);
  surface.blit(right, columnWidth + COLUMN_GAP, 0);
  return surface;
}

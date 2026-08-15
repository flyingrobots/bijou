import { createSurface, type Surface } from '../../packages/bijou/src/index.js';

const COLUMN_GAP = 1;
const MIN_TWO_COLUMN_WIDTH = 53;

// The left column carries the editor and its context prose, which is the
// wordiest content on the page; the right carries dependency lists, which are
// short. An even split would wrap the left and leave the right half empty.
const LEFT_COLUMN_SHARE = 0.55;

/** Width of the left column, given the pane body width. */
export function themeLabColumnWidth(bodyWidth: number): number {
  if (usesStackedLayout(bodyWidth)) return Math.max(1, bodyWidth);
  return Math.max(28, Math.floor((bodyWidth - COLUMN_GAP) * LEFT_COLUMN_SHARE));
}

/** Width of the right column, given the pane body width. */
export function themeLabRightColumnWidth(bodyWidth: number): number {
  if (usesStackedLayout(bodyWidth)) return Math.max(1, bodyWidth);
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
  if (usesStackedLayout(bodyWidth)) {
    const surface = createSurface(Math.max(1, bodyWidth), left.height + COLUMN_GAP + right.height);
    surface.blit(left, 0, 0);
    surface.blit(right, 0, left.height + COLUMN_GAP);
    return surface;
  }
  const columnWidth = themeLabColumnWidth(bodyWidth);
  const height = Math.max(1, left.height, right.height);
  const surface = createSurface(Math.max(1, bodyWidth), height);
  surface.blit(left, 0, 0);
  surface.blit(right, columnWidth + COLUMN_GAP, 0);
  return surface;
}

function usesStackedLayout(bodyWidth: number): boolean {
  return bodyWidth < MIN_TWO_COLUMN_WIDTH;
}

import type { FrameLayoutNode } from '../../packages/bijou-tui/src/index.js';
import {
  docsShellSlots,
  type DocsShellSlot,
} from './app-context-drawer.js';
import {
  DOCS_FLEX_TRACK,
  DOCS_SIDEBAR_WIDTH,
  type DocsLayoutVariant,
} from './app-ids.js';
import { docsNavWidthForVariant } from './app-pane-geometry.js';

export type DocsShellCells = Readonly<Record<DocsShellSlot, FrameLayoutNode>>;

/**
 * Lay out the docs shell. The contextual drawer is a grid participant: it takes
 * a track and the content pane reflows beside it. It is never an Overlay, so
 * opening it never dims the frame.
 */
export function createDocsShellLayout(
  gridId: string,
  variant: DocsLayoutVariant,
  drawerOpen: boolean,
  cells: DocsShellCells,
): FrameLayoutNode {
  const slots = docsShellSlots(variant, drawerOpen);
  const [first, second, third] = slots;
  if (first === undefined) throw new Error('docs shell layout has no slots');
  if (second === undefined) return cells[first];
  if (third === undefined) {
    const navWidth = docsNavWidthForVariant(variant);
    const narrow = hasNoTrailingGutter(variant);
    return {
      kind: 'grid',
      gridId,
      columns: narrow
        ? [1, navWidth, 1, DOCS_FLEX_TRACK]
        : [1, navWidth, 1, DOCS_FLEX_TRACK, 1],
      rows: [1, DOCS_FLEX_TRACK, 1],
      areas: narrow
        ? ['. . . .', `. ${first} . ${second}`, '. . . .']
        : ['. . . . .', `. ${first} . ${second} .`, '. . . . .'],
      gap: 0,
      cells: { [first]: cells[first], [second]: cells[second] },
    };
  }
  return {
    kind: 'grid',
    gridId,
    columns: [1, DOCS_SIDEBAR_WIDTH, 1, DOCS_FLEX_TRACK, 1, DOCS_SIDEBAR_WIDTH, 1],
    rows: [1, DOCS_FLEX_TRACK, 1],
    areas: [
      '. . . . . . .',
      `. ${first} . ${second} . ${third} .`,
      '. . . . . . .',
    ],
    gap: 0,
    cells: {
      [first]: cells[first],
      [second]: cells[second],
      [third]: cells[third],
    },
  };
}

function hasNoTrailingGutter(variant: DocsLayoutVariant): boolean {
  switch (variant) {
    case 'narrow':
      return true;
    case 'wide':
    case 'standard':
    case 'tiny':
      return false;
  }
}

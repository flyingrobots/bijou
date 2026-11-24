import { mirrorsLayout, type BijouContext, type InlineDirection } from '@flyingrobots/bijou';
import type { I18nRuntime } from '@flyingrobots/bijou-i18n';
import type { FrameLayoutNode } from './app-frame-layout-contract.js';
import type { DockDirection } from './panel-dock.js';

/**
 * The frame's explicit inline direction, read from its i18n runtime.
 *
 * `'auto'` and an absent runtime give `undefined`, so `mirrorsLayout()` falls
 * back to `ctx.direction` and then `'ltr'`.
 */
export function frameInlineDirection(
  i18n: I18nRuntime | undefined,
): InlineDirection | undefined {
  const direction = i18n?.direction;
  return direction === 'rtl' || direction === 'ltr' ? direction : undefined;
}

/** Whether the frame's row splits mirror: `rtl` in `interactive` or `static` output. */
export function frameMirrorsRowSplits(
  direction: InlineDirection | undefined,
  ctx: BijouContext | undefined,
): boolean {
  return mirrorsLayout({ direction, ctx });
}

function findSplit(
  node: FrameLayoutNode,
  splitId: string,
): Extract<FrameLayoutNode, { readonly kind: 'split' }> | undefined {
  if (node.kind === 'pane') return undefined;
  if (node.kind === 'split') {
    if (node.splitId === splitId) return node;
    return findSplit(node.paneA, splitId) ?? findSplit(node.paneB, splitId);
  }
  for (const child of Object.values(node.cells)) {
    const found = findSplit(child, splitId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Map a physical dock key to the logical move inside its container.
 *
 * `left` and `right` are physical. In a mirrored row split the logical start
 * pane is on the right, so moving left moves toward the logical end. Column
 * splits and grids keep the move unchanged.
 */
export function logicalDockDirection(
  layout: FrameLayoutNode,
  containerId: string,
  direction: DockDirection,
  mirrored: boolean,
): DockDirection {
  if (!mirrored || (direction !== 'left' && direction !== 'right')) return direction;
  const split = findSplit(layout, containerId);
  if (split == null || (split.direction ?? 'row') !== 'row') return direction;
  return direction === 'left' ? 'right' : 'left';
}

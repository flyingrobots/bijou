import {
  COMPONENTS_PAGE_ID,
  type DocsLayoutVariant,
  type DocsPageId,
} from './app-ids.js';

/** Pane id of the docs-shell contextual drawer in every layout variant. */
export const CONTEXT_DRAWER_PANE_ID = 'context-drawer';

/** Content the contextual drawer holds; one member per page kind (DL-031). */
export type ContextDrawerKind = 'story-variants' | 'guide-meta';

/** Page-owned contextual drawer state. Closed by default. */
export interface ContextDrawerState {
  readonly open: boolean;
  readonly kind: ContextDrawerKind;
  /** Pane that had focus when the drawer opened. Never the drawer pane. */
  readonly restorePaneId: string;
}

export function createContextDrawerState(pageId: DocsPageId): ContextDrawerState {
  return pageId === COMPONENTS_PAGE_ID
    ? { open: false, kind: 'story-variants', restorePaneId: 'story-content' }
    : { open: false, kind: 'guide-meta', restorePaneId: 'guide-content' };
}

export function docsShellPaneIds(
  pageId: DocsPageId,
  variant: DocsLayoutVariant,
  drawerOpen: boolean,
): readonly string[] {
  throw new Error(`docsShellPaneIds: not implemented (${pageId}, ${variant}, ${String(drawerOpen)})`);
}

export function resolveContextDrawerRestorePane(
  pageId: DocsPageId,
  restorePaneId: string,
  visiblePaneIds: readonly string[],
): string {
  throw new Error(`resolveContextDrawerRestorePane: not implemented (${pageId}, ${restorePaneId}, ${visiblePaneIds.join()})`);
}

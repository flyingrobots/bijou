import type {
  BindingSource,
  FramePageLayerRegistry,
} from '../../packages/bijou-tui/src/index.js';
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

/** Slots of the docs-shell grid, in reading order. */
export type DocsShellSlot = 'side' | 'main' | 'aside' | 'drawer';

interface DocsShellSlotsByMode {
  readonly closed: readonly DocsShellSlot[];
  readonly open: readonly DocsShellSlot[];
}

const DOCS_SHELL_SLOTS = {
  wide: { closed: ['side', 'main', 'aside'], open: ['side', 'main', 'drawer'] },
  standard: { closed: ['side', 'main'], open: ['drawer', 'main'] },
  narrow: { closed: ['side', 'main'], open: ['drawer', 'main'] },
  tiny: { closed: ['main'], open: ['drawer'] },
} satisfies Readonly<Record<DocsLayoutVariant, DocsShellSlotsByMode>>;

/**
 * The slots each layout variant shows. The drawer takes the right track in
 * `wide`, replaces the navigation track in `standard` and `narrow`, and takes
 * the whole body in `tiny` (DL-031 Layout and dimming).
 */
export function docsShellSlots(
  variant: DocsLayoutVariant,
  drawerOpen: boolean,
): readonly DocsShellSlot[] {
  const row = DOCS_SHELL_SLOTS[variant];
  return drawerOpen ? row.open : row.closed;
}

export function docsShellSlotPaneId(
  pageId: DocsPageId,
  slot: DocsShellSlot,
): string {
  const components = pageId === COMPONENTS_PAGE_ID;
  switch (slot) {
    case 'side':
      return components ? 'family-nav' : 'guide-nav';
    case 'main':
      return primaryContentPaneId(pageId);
    case 'aside':
      return components ? 'story-variants' : 'guide-meta';
    case 'drawer':
      return CONTEXT_DRAWER_PANE_ID;
  }
}

export function primaryContentPaneId(pageId: DocsPageId): string {
  return pageId === COMPONENTS_PAGE_ID ? 'story-content' : 'guide-content';
}

/** Visible pane ids for a page in one layout variant. */
export function docsShellPaneIds(
  pageId: DocsPageId,
  variant: DocsLayoutVariant,
  drawerOpen: boolean,
): readonly string[] {
  return docsShellSlots(variant, drawerOpen).map((slot) =>
    docsShellSlotPaneId(pageId, slot),
  );
}

/**
 * Close-time restore target: the captured pane when it is visible, otherwise
 * the page's primary content pane. Never the drawer pane.
 */
export function resolveContextDrawerRestorePane(
  pageId: DocsPageId,
  restorePaneId: string,
  visiblePaneIds: readonly string[],
): string {
  return restorePaneId !== CONTEXT_DRAWER_PANE_ID &&
    visiblePaneIds.includes(restorePaneId)
    ? restorePaneId
    : primaryContentPaneId(pageId);
}

/**
 * The page `context-drawer` frame layer. The frame puts it in the layer stack
 * only while the drawer pane has focus.
 */
export function contextDrawerLayers(
  drawer: ContextDrawerState,
  helpSource?: BindingSource,
): FramePageLayerRegistry {
  if (!drawer.open) return {};
  return {
    'context-drawer': {
      paneId: CONTEXT_DRAWER_PANE_ID,
      ...(helpSource === undefined ? {} : { hintSource: helpSource, helpSource }),
    },
  };
}

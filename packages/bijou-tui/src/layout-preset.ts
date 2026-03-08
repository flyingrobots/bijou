/**
 * Layout presets and session restore — serialize/restore layout state.
 *
 * Pure functions for converting FrameModel layout state to JSON-friendly
 * structures and applying them back.
 */

import type { FrameModel } from './app-frame.js';
import type { PanelVisibilityState } from './panel-state.js';
import type { PanelMaximizeState } from './panel-state.js';
import type { PanelDockState } from './panel-dock.js';

/** Serialized layout state for a single page. */
export interface SerializedPageLayout {
  /** Split ratio overrides keyed by splitId. */
  readonly splitRatios: Record<string, number>;
  /** Focused pane ID, or undefined if none. */
  readonly focusedPane: string | undefined;
  /** List of minimized pane IDs. */
  readonly minimized: string[];
  /** Dock order overrides keyed by container ID. */
  readonly dockOrder: Record<string, string[]>;
  /** ID of the maximized pane, or undefined if none. */
  readonly maximizedPane: string | undefined;
}

/** Serialized layout state for the entire app. */
export interface SerializedLayoutState {
  /** Schema version for forward compatibility. */
  readonly version: 1;
  /** Active page ID. */
  readonly activePageId: string;
  /** Per-page layout state. */
  readonly pages: Record<string, SerializedPageLayout>;
}

/** Named layout preset. */
export interface LayoutPreset {
  /** Human-readable preset name. */
  readonly name: string;
  /** Optional description. */
  readonly description?: string;
  /** The serialized state to apply. */
  readonly state: SerializedLayoutState;
}

/**
 * Serialize the current layout state of the frame model.
 *
 * Captures split ratios, focus, minimize/maximize state, and dock order
 * for each page.
 *
 * @param model - The current frame model.
 * @param pages - List of page IDs to serialize.
 * @param perPage - Per-page state maps.
 * @returns A JSON-friendly serialized layout state.
 */
export function serializeLayoutState<PageModel>(
  model: FrameModel<PageModel>,
  pages: readonly string[],
  perPage: {
    minimizedByPage?: Readonly<Record<string, PanelVisibilityState>>;
    maximizedPaneByPage?: Readonly<Record<string, PanelMaximizeState>>;
    dockStateByPage?: Readonly<Record<string, PanelDockState>>;
    splitRatiosByPage?: Readonly<Record<string, Readonly<Record<string, number>>>>;
  } = {},
): SerializedLayoutState {
  const serializedPages: Record<string, SerializedPageLayout> = {};

  for (const pageId of pages) {
    const visibility = perPage.minimizedByPage?.[pageId]
      ?? model.minimizedByPage?.[pageId];
    const maximize = perPage.maximizedPaneByPage?.[pageId]
      ?? model.maximizedPaneByPage?.[pageId];
    const dock = perPage.dockStateByPage?.[pageId]
      ?? model.dockStateByPage?.[pageId];
    const ratios = perPage.splitRatiosByPage?.[pageId]
      ?? model.splitRatioOverrides?.[pageId];

    serializedPages[pageId] = {
      splitRatios: ratios ? { ...ratios } : {},
      focusedPane: model.focusedPaneByPage[pageId],
      minimized: visibility ? [...visibility.minimized] : [],
      dockOrder: dock
        ? Object.fromEntries(
          Object.entries(dock.orderByContainer).map(([k, v]) => [k, [...v]]),
        )
        : {},
      maximizedPane: maximize?.maximizedPaneId,
    };
  }

  return {
    version: 1,
    activePageId: model.activePageId,
    pages: serializedPages,
  };
}

/**
 * Restore layout state from a serialized snapshot.
 *
 * Returns the per-page state maps that should be merged into the frame model.
 *
 * @param state - The serialized layout state to restore.
 * @returns Restored per-page state maps.
 */
export function restoreLayoutState(
  state: SerializedLayoutState,
): {
  activePageId: string;
  focusedPaneByPage: Record<string, string | undefined>;
  minimizedByPage: Record<string, PanelVisibilityState>;
  maximizedPaneByPage: Record<string, PanelMaximizeState>;
  dockStateByPage: Record<string, PanelDockState>;
  splitRatiosByPage: Record<string, Record<string, number>>;
} {
  const focusedPaneByPage: Record<string, string | undefined> = {};
  const minimizedByPage: Record<string, PanelVisibilityState> = {};
  const maximizedPaneByPage: Record<string, PanelMaximizeState> = {};
  const dockStateByPage: Record<string, PanelDockState> = {};
  const splitRatiosByPage: Record<string, Record<string, number>> = {};

  for (const [pageId, pageState] of Object.entries(state.pages)) {
    focusedPaneByPage[pageId] = pageState.focusedPane;
    minimizedByPage[pageId] = { minimized: new Set(pageState.minimized) };
    maximizedPaneByPage[pageId] = { maximizedPaneId: pageState.maximizedPane };
    dockStateByPage[pageId] = {
      orderByContainer: Object.fromEntries(
        Object.entries(pageState.dockOrder).map(([k, v]) => [k, [...v]]),
      ),
    };
    splitRatiosByPage[pageId] = { ...pageState.splitRatios };
  }

  return {
    activePageId: state.activePageId,
    focusedPaneByPage,
    minimizedByPage,
    maximizedPaneByPage,
    dockStateByPage,
    splitRatiosByPage,
  };
}

/** Preset: side-by-side split with equal ratio. */
export function presetSideBySide(splitId: string): SerializedPageLayout {
  return {
    splitRatios: { [splitId]: 0.5 },
    focusedPane: undefined,
    minimized: [],
    dockOrder: {},
    maximizedPane: undefined,
  };
}

/** Preset: stacked (vertical) split with equal ratio. */
export function presetStacked(splitId: string): SerializedPageLayout {
  return {
    splitRatios: { [splitId]: 0.5 },
    focusedPane: undefined,
    minimized: [],
    dockOrder: {},
    maximizedPane: undefined,
  };
}

/** Preset: focused on a single pane (maximized). */
export function presetFocused(paneId: string): SerializedPageLayout {
  return {
    splitRatios: {},
    focusedPane: paneId,
    minimized: [],
    dockOrder: {},
    maximizedPane: paneId,
  };
}

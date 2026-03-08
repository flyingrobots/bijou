/**
 * Panel visibility state — minimize/fold and maximize/restore.
 *
 * Pure, immutable state reducers for per-page panel visibility.
 */

/** Immutable panel visibility state tracking minimized panes. */
export interface PanelVisibilityState {
  /** Set of pane IDs that are currently minimized/folded. */
  readonly minimized: ReadonlySet<string>;
}

/** Immutable panel maximize state tracking the maximized pane. */
export interface PanelMaximizeState {
  /** ID of the pane currently maximized, or undefined if none. */
  readonly maximizedPaneId: string | undefined;
}

/** Create initial panel visibility state. */
export function createPanelVisibilityState(): PanelVisibilityState {
  return { minimized: new Set() };
}

/** Create initial panel maximize state. */
export function createPanelMaximizeState(): PanelMaximizeState {
  return { maximizedPaneId: undefined };
}

/** Toggle a pane's minimized state. Cannot minimize the last remaining visible pane. */
export function toggleMinimized(
  state: PanelVisibilityState,
  paneId: string,
  allPaneIds: readonly string[],
): PanelVisibilityState {
  if (state.minimized.has(paneId)) {
    return restorePane(state, paneId);
  }
  return minimizePane(state, paneId, allPaneIds);
}

/** Minimize a specific pane. Refuses if it's the last visible pane. */
export function minimizePane(
  state: PanelVisibilityState,
  paneId: string,
  allPaneIds: readonly string[],
): PanelVisibilityState {
  // Cannot minimize the last remaining visible pane
  const visibleCount = allPaneIds.filter((id) => !state.minimized.has(id)).length;
  if (visibleCount <= 1) return state;

  const next = new Set(state.minimized);
  next.add(paneId);
  return { minimized: next };
}

/** Restore a minimized pane. */
export function restorePane(
  state: PanelVisibilityState,
  paneId: string,
): PanelVisibilityState {
  if (!state.minimized.has(paneId)) return state;
  const next = new Set(state.minimized);
  next.delete(paneId);
  return { minimized: next };
}

/** Check if a pane is minimized. */
export function isMinimized(
  state: PanelVisibilityState,
  paneId: string,
): boolean {
  return state.minimized.has(paneId);
}

/** Toggle maximize on a pane. If already maximized, restore. */
export function toggleMaximize(
  state: PanelMaximizeState,
  paneId: string,
): PanelMaximizeState {
  if (state.maximizedPaneId === paneId) {
    return { maximizedPaneId: undefined };
  }
  return { maximizedPaneId: paneId };
}

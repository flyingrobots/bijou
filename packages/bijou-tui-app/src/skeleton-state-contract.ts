/** Page model owned by the stock skeleton shell. */
export interface SkeletonPageModel {
  readonly ready: true;
  readonly drawerOpen: boolean;
  readonly drawerProgress: number;
  readonly quitConfirmOpen: boolean;
}

/** Messages used by the skeleton app shell. */
export type SkeletonMsg =
  | { type: 'request-quit' }
  | { type: 'confirm-quit' }
  | { type: 'cancel-quit' }
  | { type: 'toggle-drawer' }
  | { type: 'drawer-progress'; value: number };

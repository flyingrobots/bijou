/** Stable frame-action facade over focused state-transition modules. */

export { applyFrameAction } from './app-frame-actions-dispatch.js';
export {
  cyclePane,
  syncPageFrameState,
} from './app-frame-actions-pane.js';
export {
  applyDockMove,
  applyToggleMaximize,
  applyToggleMinimize,
} from './app-frame-actions-panel.js';
export { scrollFocusedPane } from './app-frame-actions-scroll.js';
export {
  createTransitionTickCmd,
  switchTab,
} from './app-frame-actions-tabs.js';

import type { FramePage, CreateFramedAppOptions } from './app-frame.js';
import type {
  FrameAction,
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import type { Cmd } from './types.js';
import {
  applyFooterTransition,
  applyFooterTransitionComplete,
  toggleFooter,
} from './app-frame-actions-footer.js';
import {
  toggleNotificationCenter,
  toggleSettings,
} from './app-frame-actions-overlays.js';
import {
  applyDockMove,
  applyToggleMaximize,
  applyToggleMinimize,
} from './app-frame-actions-panel.js';
import { cyclePane } from './app-frame-actions-pane.js';
import { scrollFocusedPane } from './app-frame-actions-scroll.js';
import { switchTab } from './app-frame-actions-tabs.js';

export function applyFrameAction<PageModel, Msg>(
  action: FrameAction,
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
  switch (action.type) {
    case 'toggle-help':
      return [{ ...model, helpOpen: !model.helpOpen }, []];
    case 'toggle-perf-hud':
      return [{ ...model, perfHudOpen: !model.perfHudOpen }, []];
    case 'toggle-footer':
      return toggleFooter(model);
    case 'toggle-settings':
      return [toggleSettings(model, options, pagesById), []];
    case 'toggle-shell-theme-mode':
      return [model, []];
    case 'toggle-notifications':
      return [toggleNotificationCenter(model, options, pagesById), []];
    case 'push-notification':
      return [model, []];
    case 'prev-tab':
      return switchTab(model, -1, pagesById, options);
    case 'next-tab':
      return switchTab(model, 1, pagesById, options);
    case 'next-pane':
      return [cyclePane(model, 1, pagesById), []];
    case 'prev-pane':
      return [cyclePane(model, -1, pagesById), []];
    case 'open-palette':
    case 'open-search':
      return [model, []];
    case 'toggle-minimize':
      return [applyToggleMinimize(model, pagesById), []];
    case 'toggle-maximize':
      return [applyToggleMaximize(model), []];
    case 'dock-up':
      return [applyDockMove(model, 'up', pagesById), []];
    case 'dock-down':
      return [applyDockMove(model, 'down', pagesById), []];
    case 'dock-left':
      return [applyDockMove(model, 'left', pagesById), []];
    case 'dock-right':
      return [applyDockMove(model, 'right', pagesById), []];
    case 'scroll-up':
    case 'scroll-down':
    case 'page-up':
    case 'page-down':
    case 'top':
    case 'bottom':
    case 'scroll-left':
    case 'scroll-right':
      return [scrollFocusedPane(model, action, pagesById, options), []];
    case 'runtime-issue':
    case 'notification-tick':
      return [model, []];
    case 'footer-transition':
      return [applyFooterTransition(model, action), []];
    case 'footer-transition-complete':
      return [applyFooterTransitionComplete(model, action), []];
    case 'transition':
    case 'transition-complete':
      return [model, []];
  }
}

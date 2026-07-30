import type { KeyMsg } from './types.js';
import { isShellQuitRequest } from './shell-quit.js';
import { isHelpScrollAction } from './app-frame-overlays.js';
import type { FrameLayerKind } from './app-frame-layers.js';
import type {
  FrameKeyCommands,
  FrameKeyRouteDependencies,
  FrameKeyRouteShared,
} from './app-frame-key-route-contract.js';

export function routePaletteKey<PageModel, Msg>(
  msg: KeyMsg,
  layerKind: FrameLayerKind,
  dependencies: FrameKeyRouteDependencies<PageModel, Msg>,
  shared: FrameKeyRouteShared<Msg>,
): FrameKeyCommands<Msg> {
  const observed = { type: 'observed-key', msg, route: 'palette' } as const;
  if (msg.ctrl && !msg.alt && msg.key === 'c') {
    return shared.quit(msg, 'palette');
  }
  if (!msg.ctrl && !msg.alt && !msg.shift && msg.key === 'escape') {
    return [observed, { type: 'close-palette' }];
  }
  const action = dependencies.frameKeys.handle(msg);
  if (action?.type === 'open-search') {
    return layerKind === 'search'
      ? [observed, { type: 'close-palette' }]
      : [observed, { type: 'open-search-palette' }];
  }
  if (action?.type === 'open-palette') {
    return layerKind === 'command-palette'
      ? [observed, { type: 'close-palette' }]
      : [observed, { type: 'open-command-palette' }];
  }
  if (action?.type === 'toggle-shell-theme-mode') {
    return [observed, { type: 'toggle-shell-theme-mode' }];
  }
  if (action?.type === 'toggle-notifications') {
    return [
      observed,
      { type: 'close-palette' },
      { type: 'apply-frame-action', action },
    ];
  }
  if (action?.type === 'toggle-perf-hud') {
    return [observed, { type: 'apply-frame-action', action }];
  }
  return [observed, { type: 'palette-key', msg }];
}

export function routeHelpKey<PageModel, Msg>(
  msg: KeyMsg,
  dependencies: FrameKeyRouteDependencies<PageModel, Msg>,
  shared: FrameKeyRouteShared<Msg>,
): FrameKeyCommands<Msg> {
  const observed = { type: 'observed-key', msg, route: 'help' } as const;
  if (!msg.ctrl && !msg.alt && (msg.key === '?' || msg.key === 'escape')) {
    return [observed, { type: 'close-help' }];
  }
  if (isShellQuitRequest(msg)) return shared.quit(msg, 'help');
  const action = dependencies.frameKeys.handle(msg);
  if (action?.type === 'toggle-shell-theme-mode') {
    return [observed, { type: 'toggle-shell-theme-mode' }];
  }
  if (action?.type === 'toggle-perf-hud') {
    return [observed, { type: 'apply-frame-action', action }];
  }
  if (action && isHelpScrollAction(action)) {
    const scrollAction =
      action.type === 'scroll-down'
        ? 'down'
        : action.type === 'scroll-up'
          ? 'up'
          : action.type === 'page-down'
            ? 'page-down'
            : action.type === 'page-up'
              ? 'page-up'
              : action.type === 'bottom'
                ? 'bottom'
                : 'top';
    return [observed, { type: 'help-scroll', action: scrollAction }];
  }
  return [observed];
}

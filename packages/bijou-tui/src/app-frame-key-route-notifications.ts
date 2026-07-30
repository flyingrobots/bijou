import type { KeyMsg } from './types.js';
import type { InternalFrameModel } from './app-frame-types.js';
import { resolveNotificationCenterLayout } from './app-frame-overlays.js';
import { isShellQuitRequest } from './shell-quit.js';
import type {
  FrameKeyCommands,
  FrameKeyRouteDependencies,
  FrameKeyRouteShared,
} from './app-frame-key-route-contract.js';

export function routeNotificationCenterKey<PageModel, Msg>(
  msg: KeyMsg,
  model: InternalFrameModel<PageModel, Msg>,
  dependencies: FrameKeyRouteDependencies<PageModel, Msg>,
  shared: FrameKeyRouteShared<Msg>,
): FrameKeyCommands<Msg> | undefined {
  const { frameKeys, options, pagesById, resolveFrameThemeCtx } = dependencies;
  const layout = resolveNotificationCenterLayout(
    model,
    options,
    pagesById,
    resolveFrameThemeCtx(model.activeShellThemeId),
  );
  if (layout == null) return undefined;
  const observed = { type: 'observed-key', msg, route: 'frame' } as const;
  if (!msg.ctrl && !msg.alt && msg.key === 'escape') {
    return [observed, { type: 'close-notification-center' }];
  }
  if (isShellQuitRequest(msg)) return shared.quit(msg, 'frame');
  const action = frameKeys.handle(msg);
  if (action?.type === 'toggle-shell-theme-mode') {
    return [observed, { type: 'toggle-shell-theme-mode' }];
  }
  if (
    action?.type === 'toggle-notifications' ||
    action?.type === 'toggle-perf-hud'
  ) {
    return [observed, { type: 'apply-frame-action', action }];
  }
  if (!msg.ctrl && !msg.alt && msg.key === 'f2') {
    return [
      observed,
      { type: 'close-notification-center' },
      { type: 'apply-frame-action', action: { type: 'toggle-settings' } },
    ];
  }
  if (!msg.ctrl && !msg.alt && msg.key === '?') {
    return [
      observed,
      { type: 'close-notification-center' },
      { type: 'open-help' },
    ];
  }
  if (options.enableCommandPalette && !msg.ctrl && !msg.alt) {
    if (msg.key === '/') {
      return [
        observed,
        { type: 'close-notification-center' },
        { type: 'open-search-palette' },
      ];
    }
    if (msg.key === ':') {
      return [
        observed,
        { type: 'close-notification-center' },
        { type: 'open-command-palette' },
      ];
    }
  }
  if (
    options.enableCommandPalette &&
    msg.ctrl &&
    !msg.alt &&
    msg.key === 'p'
  ) {
    return [
      observed,
      { type: 'close-notification-center' },
      { type: 'open-command-palette' },
    ];
  }
  if (
    !msg.ctrl &&
    !msg.alt &&
    ['up', 'down', 'j', 'k'].includes(msg.key)
  ) {
    const delta = msg.key === 'up' || msg.key === 'k' ? -1 : 1;
    return [observed, { type: 'notification-center-scroll', delta }];
  }
  if (!msg.ctrl && !msg.alt && (msg.key === 'd' || msg.key === 'u')) {
    const delta = Math.max(1, layout.contentHeight - 2);
    return [
      observed,
      {
        type: 'notification-center-scroll',
        delta: msg.key === 'd' ? delta : -delta,
      },
    ];
  }
  if (!msg.ctrl && !msg.alt && (msg.key === 'g' || msg.key === 'G')) {
    return [
      observed,
      {
        type: 'notification-center-scroll-to',
        position: msg.key === 'g' ? 'top' : 'bottom',
      },
    ];
  }
  if (!msg.ctrl && !msg.alt && msg.key === 'f') {
    return [observed, { type: 'cycle-notification-filter' }];
  }
  return [observed];
}

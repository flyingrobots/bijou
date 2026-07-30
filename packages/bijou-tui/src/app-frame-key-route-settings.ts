import type { KeyMsg } from './types.js';
import type { InternalFrameModel } from './app-frame-types.js';
import {
  clampSettingsFocus,
  resolveSettingsLayout,
} from './app-frame-overlays.js';
import { isShellQuitRequest } from './shell-quit.js';
import type {
  FrameKeyCommands,
  FrameKeyRouteDependencies,
  FrameKeyRouteShared,
} from './app-frame-key-route-contract.js';

export function routeSettingsKey<PageModel, Msg>(
  msg: KeyMsg,
  model: InternalFrameModel<PageModel, Msg>,
  dependencies: FrameKeyRouteDependencies<PageModel, Msg>,
  shared: FrameKeyRouteShared<Msg>,
): FrameKeyCommands<Msg> | undefined {
  const { frameKeys, options, pagesById, resolveShellThemes } = dependencies;
  const layout = resolveSettingsLayout(
    model,
    options,
    pagesById,
    resolveShellThemes(),
  );
  if (layout == null) return undefined;
  const observed = { type: 'observed-key', msg, route: 'frame' } as const;
  if (
    !msg.ctrl &&
    !msg.alt &&
    (msg.key === 'escape' || msg.key === 'f2')
  ) {
    return [observed, { type: 'close-settings' }];
  }
  if (msg.ctrl && !msg.alt && msg.key === ',') {
    return [observed, { type: 'close-settings' }];
  }
  if (!msg.ctrl && !msg.alt && msg.key === '?') {
    return [observed, { type: 'open-help' }];
  }
  if (isShellQuitRequest(msg)) return shared.quit(msg, 'frame');
  if (options.enableCommandPalette && !msg.ctrl && !msg.alt) {
    if (msg.key === '/') {
      return [observed, { type: 'open-search-palette' }];
    }
    if (msg.key === ':') {
      return [observed, { type: 'open-command-palette' }];
    }
  }
  if (
    options.enableCommandPalette &&
    msg.ctrl &&
    !msg.alt &&
    msg.key === 'p'
  ) {
    return [observed, { type: 'open-command-palette' }];
  }
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
  if (!msg.ctrl && !msg.alt && msg.key === 'up') {
    return [observed, { type: 'settings-focus-move', delta: -1 }];
  }
  if (!msg.ctrl && !msg.alt && msg.key === 'down') {
    return [observed, { type: 'settings-focus-move', delta: 1 }];
  }
  if (!msg.ctrl && !msg.alt && (msg.key === 'j' || msg.key === 'k')) {
    return [
      observed,
      { type: 'settings-scroll', delta: msg.key === 'j' ? 1 : -1 },
    ];
  }
  if (!msg.ctrl && !msg.alt && (msg.key === 'd' || msg.key === 'u')) {
    const delta = Math.max(1, layout.contentHeight - 1);
    return [
      observed,
      { type: 'settings-scroll', delta: msg.key === 'd' ? delta : -delta },
    ];
  }
  if (!msg.ctrl && !msg.alt && (msg.key === 'g' || msg.key === 'G')) {
    return [
      observed,
      {
        type: 'settings-scroll-to',
        position: msg.key === 'g' ? 'top' : 'bottom',
      },
    ];
  }
  if (
    !msg.ctrl &&
    !msg.alt &&
    (msg.key === 'enter' || msg.key === 'space')
  ) {
    const row = layout.rows[clampSettingsFocus(model, layout)];
    if (
      row != null &&
      row.row.enabled !== false &&
      row.row.kind !== 'info' &&
      (row.behavior === 'cycle-shell-theme' || row.row.action !== undefined)
    ) {
      return [
        observed,
        { type: 'activate-settings-row', rowIndex: row.index },
      ];
    }
  }
  return [observed];
}

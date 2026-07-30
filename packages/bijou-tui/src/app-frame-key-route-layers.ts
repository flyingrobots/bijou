import type { KeyMsg } from './types.js';
import {
  isShellQuitConfirmAccept,
  isShellQuitConfirmDismiss,
} from './shell-quit.js';
import type {
  FrameKeyCommands,
  FrameKeyRouteDependencies,
} from './app-frame-key-route-contract.js';
import type { FrameLayerContext } from './app-frame-layer-context.js';

export function routeQuitConfirmKey<PageModel, Msg>(
  msg: KeyMsg,
  dependencies: FrameKeyRouteDependencies<PageModel, Msg>,
): FrameKeyCommands<Msg> {
  const observed = { type: 'observed-key', msg, route: 'frame' } as const;
  const action = dependencies.frameKeys.handle(msg);
  if (action?.type === 'toggle-perf-hud') {
    return [observed, { type: 'apply-frame-action', action }];
  }
  if (isShellQuitConfirmAccept(msg)) {
    return [
      observed,
      { type: 'close-quit-confirm' },
      { type: 'quit' },
    ];
  }
  if (isShellQuitConfirmDismiss(msg)) {
    return [observed, { type: 'close-quit-confirm' }];
  }
  return [observed];
}

export function routePageModalKey<PageModel, Msg>(
  msg: KeyMsg,
  model: { readonly activePageId: string },
  context: FrameLayerContext<PageModel, Msg>,
  dependencies: FrameKeyRouteDependencies<PageModel, Msg>,
): FrameKeyCommands<Msg> {
  const observed = { type: 'observed-key', msg, route: 'page' } as const;
  const action = dependencies.frameKeys.handle(msg);
  if (action?.type === 'toggle-perf-hud') {
    return [observed, { type: 'apply-frame-action', action }];
  }
  const modalAction = context.modalKeyMap?.handle(msg);
  if (modalAction === undefined) return [observed];
  return [
    observed,
    {
      type: 'emit-page-msg',
      pageId: model.activePageId,
      msg: modalAction,
    },
  ];
}

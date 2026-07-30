import type { KeyMsg } from './types.js';
import type { InternalFrameModel } from './app-frame-types.js';
import { isShellQuitRequest } from './shell-quit.js';
import { resolveFrameLayerContext } from './app-frame-layer-context.js';
import type {
  FrameKeyCommands,
  FrameKeyRouteDependencies,
  FrameKeyRouteShared,
} from './app-frame-key-route-contract.js';

export function routeWorkspaceKey<PageModel, Msg>(
  msg: KeyMsg,
  model: InternalFrameModel<PageModel, Msg>,
  dependencies: FrameKeyRouteDependencies<PageModel, Msg>,
  shared: FrameKeyRouteShared<Msg>,
): FrameKeyCommands<Msg> {
  if (isShellQuitRequest(msg)) return shared.quit(msg, 'frame');
  const context = resolveFrameLayerContext(model, dependencies.pagesById);
  const paneAction = context.activeInputArea?.keyMap?.handle(msg);
  const pageAction = context.activePage.keyMap?.handle(msg);
  const globalAction = dependencies.options.globalKeys?.handle(msg);
  const frameAction = dependencies.frameKeys.handle(msg);

  if ((dependencies.options.keyPriority ?? 'frame-first') === 'page-first') {
    if (paneAction !== undefined) {
      return [
        { type: 'observed-key', msg, route: 'page' },
        {
          type: 'emit-page-msg',
          pageId: model.activePageId,
          msg: paneAction,
        },
      ];
    }
    if (pageAction !== undefined) {
      return [
        { type: 'observed-key', msg, route: 'page' },
        {
          type: 'emit-page-msg',
          pageId: model.activePageId,
          msg: pageAction,
        },
      ];
    }
    if (globalAction !== undefined) {
      return [
        { type: 'observed-key', msg, route: 'global' },
        { type: 'emit-global-msg', msg: globalAction },
      ];
    }
    return frameAction === undefined
      ? [{ type: 'observed-key', msg, route: 'unhandled' }]
      : shared.frameAction(msg, frameAction, 'frame');
  }
  if (frameAction !== undefined) {
    const commands = shared.frameAction(msg, frameAction, 'frame');
    return pageAction === undefined
      ? commands
      : [...commands, { type: 'warn-frame-key-collision', msg }];
  }
  if (paneAction !== undefined) {
    return [
      { type: 'observed-key', msg, route: 'page' },
      {
        type: 'emit-page-msg',
        pageId: model.activePageId,
        msg: paneAction,
      },
    ];
  }
  if (globalAction !== undefined) {
    return [
      { type: 'observed-key', msg, route: 'global' },
      { type: 'emit-global-msg', msg: globalAction },
    ];
  }
  if (pageAction !== undefined) {
    return [
      { type: 'observed-key', msg, route: 'page' },
      {
        type: 'emit-page-msg',
        pageId: model.activePageId,
        msg: pageAction,
      },
    ];
  }
  return [{ type: 'observed-key', msg, route: 'unhandled' }];
}

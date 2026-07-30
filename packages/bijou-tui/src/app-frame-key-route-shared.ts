import type { KeyMsg } from './types.js';
import { shouldUseShellQuitConfirm } from './shell-quit.js';
import type {
  FrameAction,
  FrameShellCommand,
  ObservedKeyRoute,
} from './app-frame-types.js';
import type {
  FrameKeyCommands,
  FrameKeyRouteShared,
} from './app-frame-key-route-contract.js';

export function createFrameKeyRouteShared<Msg>(
  enableCommandPalette: boolean | undefined,
): FrameKeyRouteShared<Msg> {
  const quit = (
    msg: KeyMsg,
    route: ObservedKeyRoute,
  ): FrameKeyCommands<Msg> => {
    const next: FrameShellCommand<Msg> = shouldUseShellQuitConfirm()
      ? { type: 'open-quit-confirm' }
      : { type: 'quit' };
    return [{ type: 'observed-key', msg, route }, next];
  };
  const frameAction = (
    msg: KeyMsg,
    action: FrameAction,
    route: ObservedKeyRoute,
  ): FrameKeyCommands<Msg> => {
    if (action.type === 'open-search' && enableCommandPalette) {
      return [
        { type: 'observed-key', msg, route },
        { type: 'open-search-palette' },
      ];
    }
    if (action.type === 'open-palette' && enableCommandPalette) {
      return [
        { type: 'observed-key', msg, route },
        { type: 'open-command-palette' },
      ];
    }
    if (action.type === 'toggle-shell-theme-mode') {
      return [
        { type: 'observed-key', msg, route },
        { type: 'toggle-shell-theme-mode' },
      ];
    }
    return [
      { type: 'observed-key', msg, route },
      { type: 'apply-frame-action', action },
    ];
  };
  return { quit, frameAction };
}

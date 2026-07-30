import type { BijouContext } from '@flyingrobots/bijou';
import type { KeyMap } from './keybindings.js';
import type { FramePage } from './app-frame-page-contract.js';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import type { ResolvedFrameShellTheme } from './app-frame-overlays.js';
import type {
  FrameAction,
  FrameShellCommand,
  ObservedKeyRoute,
} from './app-frame-types.js';
import type { KeyMsg } from './types.js';

export interface FrameKeyRouteDependencies<PageModel, Msg> {
  readonly options: CreateFramedAppOptions<PageModel, Msg>;
  readonly pagesById: Map<string, FramePage<PageModel, Msg>>;
  readonly frameKeys: KeyMap<FrameAction>;
  readonly resolveShellThemes: () => readonly ResolvedFrameShellTheme[];
  readonly resolveFrameThemeCtx: (
    themeId: string | undefined,
  ) => BijouContext | undefined;
}

export type FrameKeyCommands<Msg> = FrameShellCommand<Msg>[];

export interface FrameKeyRouteShared<Msg> {
  quit(
    msg: KeyMsg,
    route: ObservedKeyRoute,
  ): FrameKeyCommands<Msg>;
  frameAction(
    msg: KeyMsg,
    action: FrameAction,
    route: ObservedKeyRoute,
  ): FrameKeyCommands<Msg>;
}

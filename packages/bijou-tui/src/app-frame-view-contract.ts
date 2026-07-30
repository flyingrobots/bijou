import type { Surface } from '@flyingrobots/bijou';
import type { FramePage } from './app-frame-page-contract.js';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import type { ResolvedFrameNotificationOptions } from './app-frame-notification-runtime.js';
import type { FrameThemeRuntime } from './app-frame-theme-runtime.js';
import type { WorkspaceLayoutServices } from './app-frame-workspace-layout.js';
import type { FramePresentationDependencies } from './app-frame-presentation.js';
import { createFramePaneScratchPool } from './app-frame-render.js';

export interface FrameViewScratch {
  composed: Surface | null;
  header: Surface | undefined;
  helpLine: Surface | undefined;
}

export interface FrameViewDependencies<PageModel, Msg> {
  readonly options: CreateFramedAppOptions<PageModel, Msg>;
  readonly pagesById: Map<string, FramePage<PageModel, Msg>>;
  readonly notificationOptions: ResolvedFrameNotificationOptions;
  readonly themeRuntime: FrameThemeRuntime<PageModel, Msg>;
  readonly presentation: FramePresentationDependencies<PageModel, Msg>;
  readonly workspace: WorkspaceLayoutServices<PageModel, Msg>;
  readonly paneScratchPool: ReturnType<typeof createFramePaneScratchPool>;
  readonly scratch: FrameViewScratch;
}

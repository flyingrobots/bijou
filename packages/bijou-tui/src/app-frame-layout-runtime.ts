import { createFramePaneScratchPool } from './app-frame-render.js';
import type { FramePageRegistry } from './app-frame-page-registry.js';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import type { FrameViewScratch } from './app-frame-app-view.js';
import { createWorkspaceLayoutServices } from './app-frame-workspace-layout.js';
import type { FrameThemeRuntime } from './app-frame-theme-runtime.js';
import type { ResolvedFrameNotificationOptions } from './app-frame-notification-runtime.js';

export function createFrameLayoutRuntime<PageModel, Msg>(
  options: CreateFramedAppOptions<PageModel, Msg>,
  registry: FramePageRegistry<PageModel, Msg>,
  themeRuntime: FrameThemeRuntime<PageModel, Msg>,
  notificationOptions: ResolvedFrameNotificationOptions,
) {
  const scratch = {
    composed: null,
    header: undefined,
    helpLine: undefined,
  } satisfies FrameViewScratch;
  const paneScratchPool = createFramePaneScratchPool();
  const resolveThemeContext = (themeId: string | undefined) =>
    themeRuntime.resolveThemeContext(themeId);
  const workspace = createWorkspaceLayoutServices({
    options,
    pagesById: registry.pagesById,
    resolveHeaderScratch: () => scratch.header,
    paneScratchPool,
    resolveThemeContext,
  });
  return {
    mouseRoute: {
      pagesById: registry.pagesById,
      frameNotificationOptions: notificationOptions,
      mouseLayoutDependencies: {
        options,
        pagesById: registry.pagesById,
        resolveShellThemes: () => themeRuntime.resolvedThemes,
        workspace,
        resolveThemeContext,
      },
      workspaceLayout: workspace,
      resolveFrameThemeCtx: resolveThemeContext,
    },
    paneScratchPool,
    scratch,
    workspace,
  };
}

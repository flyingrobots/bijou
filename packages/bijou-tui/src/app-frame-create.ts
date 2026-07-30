import type { App } from './types.js';
import type {
  FramedApp,
  FramedAppMsg,
  FramedAppRunOptions,
  InternalFrameModel,
} from './app-frame-types.js';
import { wrapFrameMsg } from './app-frame-types.js';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import { FrameThemeRuntime } from './app-frame-theme-runtime.js';
import { createFramePageRegistry } from './app-frame-page-registry.js';
import { createFrameControlsRuntime } from './app-frame-controls-runtime.js';
import { createFrameLayoutRuntime } from './app-frame-layout-runtime.js';
import { initializeFrameApp } from './app-frame-app-init.js';
import { updateFrameApp } from './app-frame-app-update.js';
import { renderFrameApp } from './app-frame-app-view.js';
import { createHostedFrameApp } from './app-frame-host.js';

/**
 * Create a fully framed TEA app shell.
 */
export function createFramedApp<PageModel, Msg>(
  options: CreateFramedAppOptions<PageModel, Msg>,
): FramedApp<PageModel, Msg> {
  const registry = createFramePageRegistry(options);
  const themeRuntime = new FrameThemeRuntime(options);
  const controls = createFrameControlsRuntime(
    options,
    registry,
    themeRuntime,
  );
  const layout = createFrameLayoutRuntime(
    options,
    registry,
    themeRuntime,
    controls.notificationOptions,
  );
  const app: App<InternalFrameModel<PageModel, Msg>, FramedAppMsg<Msg>> = {
    init: () =>
      initializeFrameApp({
        options,
        pagesById: registry.pagesById,
        pageOrder: registry.pageOrder,
        defaultPageId: registry.defaultPageId,
        themeRuntime,
      }),
    update: (msg, model) =>
      updateFrameApp(msg, model, {
        options,
        pagesById: registry.pagesById,
        notificationOptions: controls.notificationOptions,
        notificationState: controls.notificationState,
        themeMode: controls.themeMode,
        themeRuntime,
        shellCommands: controls.shellCommands,
        keyRoutes: controls.keyRoutes,
        mouseRoute: layout.mouseRoute,
      }),
    view: (model) =>
      renderFrameApp(model, {
        options,
        pagesById: registry.pagesById,
        notificationOptions: controls.notificationOptions,
        themeRuntime,
        presentation: controls.presentation,
        workspace: layout.workspace,
        paneScratchPool: layout.paneScratchPool,
        scratch: layout.scratch,
      }),
    routeRuntimeIssue(issue) {
      if (!controls.notificationOptions.enabled) return undefined;
      return wrapFrameMsg({ type: 'runtime-issue', issue });
    },
  };
  return createHostedFrameApp(app, themeRuntime);
}

/**
 * Create and immediately run a batteries-included framed shell.
 *
 * This is the one-call hosted path for users who want the frame to own the
 * runtime pump while `run(app)` remains the low-level TEA contract.
 */
export async function runFramedApp<PageModel, Msg>(
  options: CreateFramedAppOptions<PageModel, Msg>,
  runOptions?: FramedAppRunOptions<Msg>,
): Promise<void> {
  await createFramedApp(options).run(runOptions);
}

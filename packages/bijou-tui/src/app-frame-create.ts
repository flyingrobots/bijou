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
import { createFocusedPaneMeasureCache } from './app-frame-scroll-measure-cache.js';
import { createHostedFrameApp } from './app-frame-host.js';
import { isKeyMsg, isMouseMsg, isPulseMsg } from './runtime-messages.js';
import { resolveFrameLayerContext } from './app-frame-layer-context.js';
import { acknowledgeFrameShadowAlert, detectFrameShadowAlert, shadowAlertKeyAction } from './app-frame-shadow-alert.js';

/**
 * Create a fully framed TEA app shell.
 */
export function createFramedApp<PageModel, Msg>(
  options: CreateFramedAppOptions<PageModel, Msg>,
): FramedApp<PageModel, Msg> {
  const registry = createFramePageRegistry(options);
  const themeRuntime = new FrameThemeRuntime(options);
  const measureCache = createFocusedPaneMeasureCache();
  const controls = createFrameControlsRuntime(
    options,
    registry,
    themeRuntime,
    measureCache,
  );
  const layout = createFrameLayoutRuntime(
    options,
    registry,
    themeRuntime,
    controls.notificationOptions,
  );
  // Debug mode: open the shadowed-bindings dialog when the active layer has bindings that can never fire.
  const withShadowAlert = (model: InternalFrameModel<PageModel, Msg>): InternalFrameModel<PageModel, Msg> => {
    if (options.debug !== true) return model;
    const shadowAlert = detectFrameShadowAlert(model, {
      activePageId: model.activePageId,
      context: resolveFrameLayerContext(model, registry.pagesById),
      frameKeys: controls.frameKeys,
      globalKeys: options.globalKeys,
      keyPriority: options.keyPriority,
    });
    return shadowAlert === model.shadowAlert ? model : { ...model, shadowAlert };
  };
  const app: App<InternalFrameModel<PageModel, Msg>, FramedAppMsg<Msg>> = {
    init: () => {
      measureCache.invalidate();
      const [model, cmds] = initializeFrameApp({
        options,
        pagesById: registry.pagesById,
        pageOrder: registry.pageOrder,
        defaultPageId: registry.defaultPageId,
        themeRuntime,
      });
      return [withShadowAlert(model), cmds];
    },
    update: (msg, model) => {
      // While the debug dialog is open the app is halted: only acknowledging it, or opening the key inspector, acts.
      if (model.shadowAlert !== undefined) {
        if (isPulseMsg(msg) || isMouseMsg(msg)) return [model, []];
        if (isKeyMsg(msg)) {
          const action = shadowAlertKeyAction(msg);
          if (action === 'acknowledge') return [{ ...model, ...acknowledgeFrameShadowAlert(model) }, []];
          if (action === 'inspect') return [{ ...model, keyInspectorOpen: !model.keyInspectorOpen }, []];
          return [model, []];
        }
      }
      const [next, cmds] = updateFrameApp(msg, model, {
        options,
        measureCache,
        pagesById: registry.pagesById,
        notificationOptions: controls.notificationOptions,
        notificationState: controls.notificationState,
        themeMode: controls.themeMode,
        themeRuntime,
        shellCommands: controls.shellCommands,
        keyRoutes: controls.keyRoutes,
        mouseRoute: layout.mouseRoute,
      });
      return [withShadowAlert(next), cmds];
    },
    view: (model) =>
      renderFrameApp(model, {
        options,
        pagesById: registry.pagesById,
        frameKeys: controls.frameKeys,
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

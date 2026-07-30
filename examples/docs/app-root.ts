import type { BijouContext } from '../../packages/bijou/src/index.js';
import {
  mapCmds,
  type App,
  type Cmd,
  type FramedAppMsg,
} from '../../packages/bijou-tui/src/index.js';
import { createRuntimeLocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { syncDocsSharedSettings } from './app-docs-model-sync.js';
import { createDocsExplorerApp } from './app-explorer.js';
import { createDocsI18nRuntime } from './app-i18n-runtime.js';
import { createLandingRenderer } from './app-landing.js';
import type {
  DocsAppOptions,
  DocsMsg,
  RootMsg,
} from './app-model.js';
import type { RootModel } from './app-model.js';
import { createInitialRootModel } from './app-root-initial.js';
import { updateRootApp } from './app-root-update.js';
import { renderRootApp } from './app-root-view.js';
import { LANDING_TEXT_MODIFIERS } from './app-shell-theme-state.js';
import {
  applyDocsShellThemeToContext,
  resolveLandingThemeIndexForShellThemeId,
} from './app-theme-state.js';
import {
  resetGuideContentScrollOnGuideSelection,
  syncDocsExplorerViewportLayout,
} from './app-viewport-sync.js';
import { VERSION_TEXT } from './app-ids.js';
import { resolveDogfoodInitialLocale } from './locale.js';

export function createDocsApp(
  ctx: BijouContext,
  options: DocsAppOptions = {},
): App<RootModel, RootMsg> {
  let currentContext = ctx;
  const syncShellThemeContext = (themeId: string | undefined) => {
    currentContext = applyDocsShellThemeToContext(ctx, themeId);
  };
  const initialLocale = resolveDogfoodInitialLocale(options);
  const i18n = createDocsI18nRuntime(options);
  const localization = createRuntimeLocalizationPort(i18n);
  const explorer = createDocsExplorerApp(
    () => currentContext,
    (nextContext) => {
      currentContext = nextContext;
    },
    i18n,
    localization,
    options,
    initialLocale.id,
  );
  const renderLanding = createLandingRenderer({
    getCtx: () => currentContext,
    localization,
    textModifiers: LANDING_TEXT_MODIFIERS,
    versionText: VERSION_TEXT,
  });
  const mapExplorer = (
    commands: Cmd<FramedAppMsg<DocsMsg>>[],
  ): Cmd<RootMsg>[] =>
    mapCmds(commands, (message) => ({ type: 'docs', msg: message }));
  const updateExplorer: Parameters<
    typeof updateRootApp
  >[2]['updateExplorer'] = (message, model) => {
    const [docsModel, commands] = explorer.update(
      message,
      model.docsModel,
    );
    const reset = resetGuideContentScrollOnGuideSelection(
      model.docsModel,
      docsModel,
    );
    const synced = syncDocsSharedSettings(
      syncDocsExplorerViewportLayout(reset),
    );
    return [
      {
        ...model,
        docsModel: synced,
        landingThemeIndex:
          resolveLandingThemeIndexForShellThemeId(
            synced.activeShellThemeId,
          ),
      },
      mapExplorer(commands),
    ];
  };
  return {
    init: () => {
      const [docsModel, commands] = explorer.init();
      const synced = syncDocsSharedSettings(
        syncDocsExplorerViewportLayout(docsModel),
      );
      return [
        createInitialRootModel(
          ctx,
          options,
          synced,
        ),
        mapExplorer(commands),
      ];
    },
    update: (message, model) =>
      updateRootApp(message, model, {
        baseContext: ctx,
        localization,
        syncShellThemeContext,
        updateExplorer,
      }),
    view: (model) =>
      renderRootApp(model, {
        getContext: () => currentContext,
        i18n,
        explorer,
        renderLanding,
        localization,
      }),
    routeRuntimeIssue: (issue) => {
      const routed = explorer.routeRuntimeIssue?.(issue);
      return routed === undefined
        ? undefined
        : { type: 'docs', msg: routed };
    },
  };
}

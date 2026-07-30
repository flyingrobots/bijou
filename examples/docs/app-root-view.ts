import type {
  BijouContext,
  Surface,
} from '../../packages/bijou/src/index.js';
import {
  compositeSurface,
  renderShellQuitOverlay,
  type FramedApp,
  type ViewOutput,
} from '../../packages/bijou-tui/src/index.js';
import { normalizeViewOutput } from '../../packages/bijou-tui/src/view-output.js';
import type {
  I18nRuntime,
  LocalizationPort,
} from '../../packages/bijou-i18n/src/index.js';
import {
  renderLandingPerfHudOverlay,
} from './app-landing.js';
import type {
  DocsExplorerModel,
  DocsMsg,
  RootModel,
} from './app-model.js';
import { renderThemeInspectorDrawer } from './app-theme-inspector-render.js';

interface RootViewServices {
  readonly getContext: () => BijouContext;
  readonly i18n: I18nRuntime;
  readonly explorer: FramedApp<DocsExplorerModel, DocsMsg>;
  readonly renderLanding: (model: RootModel) => Surface;
  readonly localization: LocalizationPort;
}

export function renderRootApp(
  model: RootModel,
  services: RootViewServices,
): ViewOutput {
  if (model.route === 'landing') {
    const landing = services.renderLanding(model);
    const overlays = landingOverlays(model, services);
    return overlays.length === 0
      ? landing
      : compositeSurface(landing, overlays, {
          dim: model.landingQuitConfirmOpen,
        });
  }
  const docs = services.explorer.view(model.docsModel);
  if (!model.themeInspectorOpen) return docs;
  const docsSurface = normalizeViewOutput(docs, {
    width: model.columns,
    height: model.rows,
  }).surface;
  return compositeSurface(docsSurface, [
    renderThemeInspectorDrawer(
      model,
      services.getContext(),
      services.localization,
    ),
  ]);
}

function landingOverlays(
  model: RootModel,
  services: RootViewServices,
) {
  return [
    ...(model.landingQuitConfirmOpen
      ? [renderShellQuitOverlay(model.columns, model.rows)]
      : []),
    ...(model.docsModel.perfHudOpen
      ? [
          renderLandingPerfHudOverlay(model, {
            ctx: services.getContext(),
            i18n: services.i18n,
          }),
        ]
      : []),
  ];
}

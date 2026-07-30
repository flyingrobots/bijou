import type { FrameModel } from '../../packages/bijou-tui/src/index.js';
import {
  isDocsPageId,
  type DocsPageId,
} from './app-ids.js';
import type {
  DocsExplorerModel,
  RootModel,
} from './app-model.js';
import {
  normalizeLandingThemeIndex,
  resolveLandingTheme,
  type LandingQualityMode,
} from './app-landing.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { landingQualityModeLabel } from './app-landing.js';
import { dogfoodText } from './app-localization.js';
import {
  resolveDocsShellThemeById,
  resolveLandingThemeIndexForShellThemeId,
} from './app-theme-state.js';

export function mapDocsPageModels(
  docsModel: FrameModel<DocsExplorerModel>,
  transform: (
    pageModel: DocsExplorerModel,
    pageId: DocsPageId,
  ) => DocsExplorerModel,
): FrameModel<DocsExplorerModel> {
  let changed = false;
  const pageModels: Record<string, DocsExplorerModel> = {};
  for (const [pageId, pageModel] of Object.entries(docsModel.pageModels)) {
    if (!isDocsPageId(pageId)) continue;
    const next = transform(pageModel, pageId);
    pageModels[pageId] = next;
    if (next !== pageModel) changed = true;
  }
  return changed ? { ...docsModel, pageModels } : docsModel;
}

export function syncDocsSharedSettings(
  docsModel: FrameModel<DocsExplorerModel>,
): FrameModel<DocsExplorerModel> {
  const active = docsModel.pageModels[docsModel.activePageId];
  if (active == null) return docsModel;
  const landingThemeIndex = resolveLandingThemeIndexForShellThemeId(
    docsModel.activeShellThemeId,
  );
  const activeShellThemeId = resolveDocsShellThemeById(
    docsModel.activeShellThemeId,
  ).id;
  return mapDocsPageModels(docsModel, (pageModel) =>
    pageModel.showHints === active.showHints &&
    pageModel.locale === active.locale &&
    pageModel.landingThemeIndex === landingThemeIndex &&
    pageModel.activeShellThemeId === activeShellThemeId &&
    pageModel.landingQualityMode === active.landingQualityMode
      ? pageModel
      : {
          ...pageModel,
          showHints: active.showHints,
          locale: active.locale,
          landingThemeIndex,
          activeShellThemeId,
          landingQualityMode: active.landingQualityMode,
        },
  );
}

export function applyLandingThemeSelection(
  syncShellThemeContext: (themeId: string | undefined) => void,
  model: RootModel,
  index: number,
): RootModel {
  const nextIndex = normalizeLandingThemeIndex(index);
  const theme = resolveLandingTheme(nextIndex);
  if (
    nextIndex === model.landingThemeIndex &&
    model.docsModel.activeShellThemeId === theme.id
  ) {
    return model;
  }
  syncShellThemeContext(theme.id);
  return {
    ...model,
    landingThemeIndex: nextIndex,
    docsModel: syncDocsSharedSettings({
      ...model.docsModel,
      activeShellThemeId: theme.id,
    }),
    landingToast: {
      message: theme.label,
      expiresAtMs: model.landingTimeMs + 1600,
    },
  };
}

export function applyLandingQualitySelection(
  model: RootModel,
  mode: LandingQualityMode,
  localization?: LocalizationPort,
): RootModel {
  const active = model.docsModel.pageModels[model.docsModel.activePageId];
  if (active == null || active.landingQualityMode === mode) return model;
  return {
    ...model,
    docsModel: mapDocsPageModels(model.docsModel, (pageModel) =>
      pageModel.landingQualityMode === mode
        ? pageModel
        : { ...pageModel, landingQualityMode: mode },
    ),
    landingToast: {
      message: dogfoodText(
        localization,
        'landing.toast.quality',
        'Landing quality: {quality}',
        { quality: landingQualityModeLabel(mode, localization) },
      ),
      expiresAtMs: model.landingTimeMs + 1600,
    },
  };
}

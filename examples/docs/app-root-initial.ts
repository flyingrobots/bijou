import type { BijouContext } from '../../packages/bijou/src/index.js';
import type {
  DocsAppOptions,
  RootModel,
} from './app-model.js';
import {
  resolveLandingThemeIndexForShellThemeId,
} from './app-theme-state.js';

export function createInitialRootModel(
  context: BijouContext,
  options: DocsAppOptions,
  docsModel: RootModel['docsModel'],
): RootModel {
  return {
    route: options.initialRoute ?? 'landing',
    columns: Math.max(1, context.runtime.columns),
    rows: Math.max(1, context.runtime.rows),
    landingTimeMs: 0,
    landingFps: Math.max(
      1,
      Math.round(context.runtime.refreshRate),
    ),
    landingThemeIndex: resolveLandingThemeIndexForShellThemeId(
      docsModel.activeShellThemeId,
    ),
    landingToast: undefined,
    landingQuitConfirmOpen: false,
    themeInspectorOpen: false,
    themeInspectorScrollY: 0,
    docsModel,
  };
}

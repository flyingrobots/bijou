import type { BijouContext } from '../../packages/bijou/src/index.js';
import {
  isResizeMsg,
  type KeyMsg,
  type MouseMsg,
  type ResizeMsg,
} from '../../packages/bijou-tui/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { updateDocsRoute } from './app-docs-route-update.js';
import {
  updateLandingRoute,
  type RootUpdateResult,
  type UpdateExplorer,
} from './app-landing-route-update.js';
import type {
  PulseLikeMsg,
  RootModel,
  RootMsg,
} from './app-model.js';
import {
  clampThemeInspectorScroll,
} from './app-theme-inspector-state.js';
import { resolveDocsShellThemeById } from './app-theme-state.js';

type RootInput =
  | KeyMsg
  | ResizeMsg
  | MouseMsg
  | PulseLikeMsg
  | RootMsg;

interface RootUpdateServices {
  readonly baseContext: BijouContext;
  readonly localization: LocalizationPort;
  readonly syncShellThemeContext: (
    themeId: string | undefined,
  ) => void;
  readonly updateExplorer: UpdateExplorer;
}

export function updateRootApp(
  message: RootInput,
  model: RootModel,
  services: RootUpdateServices,
): RootUpdateResult {
  if (message.type === 'docs') {
    return services.updateExplorer(message.msg, model);
  }
  if (isResizeMsg(message)) {
    const resized = {
      ...model,
      columns: message.columns,
      rows: message.rows,
    };
    const theme = resolveDocsShellThemeById(
      resized.docsModel.activeShellThemeId,
    ).theme;
    return services.updateExplorer(message, {
      ...resized,
      themeInspectorScrollY: clampThemeInspectorScroll(
        resized.rows,
        theme,
        resized.themeInspectorScrollY,
      ),
    });
  }
  return model.route === 'landing'
    ? updateLandingRoute(
        message,
        model,
        services.baseContext,
        services.localization,
        services.syncShellThemeContext,
        services.updateExplorer,
      )
    : updateDocsRoute(
        message,
        model,
        services.updateExplorer,
      );
}

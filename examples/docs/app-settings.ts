import type {
  CreateFramedAppOptions,
} from '../../packages/bijou-tui/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  docsThemeBorderToken,
  docsThemePreferenceListTheme,
  docsThemeSurfaceToken,
} from './app-docs-theme-tokens.js';
import { landingSettingsSection } from './app-settings-landing.js';
import { localizationSettingsSection } from './app-settings-localization.js';
import { shellSettingsSection } from './app-settings-shell.js';
import type {
  DocsExplorerModel,
  DocsMsg,
} from './app-model.js';
import {
  resolveDocsVisualThemeByShellThemeId,
} from './app-theme-state.js';

type SettingsBuilder = NonNullable<
  CreateFramedAppOptions<DocsExplorerModel, DocsMsg>['settings']
>;

export function createDocsSettingsBuilder(
  localization: LocalizationPort,
): SettingsBuilder {
  return ({ model, pageModel }) => {
    const theme = resolveDocsVisualThemeByShellThemeId(
      pageModel.activeShellThemeId,
    );
    return {
      borderToken: docsThemeBorderToken(theme),
      bgToken: docsThemeSurfaceToken(theme),
      listTheme: docsThemePreferenceListTheme(theme),
      sections: [
        shellSettingsSection(pageModel, localization),
        localizationSettingsSection(pageModel, localization),
        landingSettingsSection(
          model.columns,
          model.rows,
          pageModel,
          localization,
        ),
      ],
    };
  };
}

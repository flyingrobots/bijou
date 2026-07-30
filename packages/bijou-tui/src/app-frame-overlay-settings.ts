import type { I18nRuntime } from '@flyingrobots/bijou-i18n';
import type {
  CreateFramedAppOptions,
  FramePage,
  FrameSettingRow,
  FrameSettings,
} from './app-frame.js';
import {
  FRAME_SHELL_THEME_ROW_ID,
  type ResolvedFrameShellTheme,
} from './app-frame-overlay-contract.js';
import { frameMessage } from './app-frame-i18n.js';
import type { InternalFrameModel } from './app-frame-types.js';
import {
  resolveCurrentShellTheme,
  resolveNextShellTheme,
} from './app-frame-overlay-shell-theme.js';

export function resolveShellThemeOptionsText(
  shellThemes: readonly ResolvedFrameShellTheme[],
  i18n: I18nRuntime | undefined,
): string {
  const labels = shellThemes.map((theme) => theme.label);
  if (labels.length === 0) return '';
  return i18n == null ? labels.join(', ') : i18n.formatList(labels, i18n.locale);
}

export function mergeShellThemeSettings<Msg>(
  settings: FrameSettings<Msg> | undefined,
  shellThemes: readonly ResolvedFrameShellTheme[],
  activeShellThemeId: string | undefined,
  i18n: I18nRuntime | undefined,
): FrameSettings<Msg> | undefined {
  if (shellThemes.length < 2) return settings;
  const current = resolveCurrentShellTheme(shellThemes, activeShellThemeId);
  const next = resolveNextShellTheme(shellThemes, activeShellThemeId);
  if (current == null || next == null) return settings;
  const row: FrameSettingRow<Msg> = {
    id: FRAME_SHELL_THEME_ROW_ID,
    label: frameMessage(i18n, 'settings.shellTheme.label', 'Shell theme'),
    description:
      current.description ??
      frameMessage(
        i18n,
        'settings.shellTheme.description',
        'Current theme: {theme}. Options: {options}.',
        {
          theme: current.label,
          options: resolveShellThemeOptionsText(shellThemes, i18n),
        },
      ),
    valueLabel: current.label,
    kind: 'choice',
    feedback: {
      title: frameMessage(i18n, 'settings.title', 'Settings'),
      message: frameMessage(
        i18n,
        'settings.shellTheme.feedback',
        'Shell theme set to {theme}.',
        { theme: next.label },
      ),
    },
  };
  const title = frameMessage(i18n, 'settings.section.shell', 'Shell');
  if (settings == null) {
    return {
      title: frameMessage(i18n, 'settings.title', 'Settings'),
      sections: [{ id: 'shell', title, rows: [row] }],
    };
  }
  const shell = settings.sections.find((section) => section.id === 'shell');
  if (shell == null) {
    return {
      ...settings,
      sections: [{ id: 'shell', title, rows: [row] }, ...settings.sections],
    };
  }
  const existing = shell.rows.findIndex(
    (candidate) => candidate.id === FRAME_SHELL_THEME_ROW_ID,
  );
  const rows =
    existing >= 0
      ? shell.rows.map((candidate, index) =>
          index === existing ? row : candidate,
        )
      : [...shell.rows, row];
  return {
    ...settings,
    sections: settings.sections.map((section) =>
      section === shell ? { ...shell, rows } : section,
    ),
  };
}

export function resolveFrameSettings<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  shellThemes: readonly ResolvedFrameShellTheme[],
): FrameSettings<Msg> | undefined {
  const activePage = pagesById.get(model.activePageId);
  const pageModel = model.pageModels[model.activePageId];
  const provided =
    activePage == null || pageModel === undefined
      ? undefined
      : options.settings?.({ model, activePage, pageModel });
  return mergeShellThemeSettings(
    provided,
    shellThemes,
    model.activeShellThemeId,
    options.i18n,
  );
}

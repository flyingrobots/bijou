import {
  preparePreferenceSections,
  resolvePreferenceRowLayout,
  type PreferenceRow,
  type PreferenceSection,
} from '@flyingrobots/bijou';
import type {
  CreateFramedAppOptions,
  FramePage,
  FrameSettingRow,
  FrameSettingSection,
} from './app-frame.js';
import {
  FRAME_SHELL_THEME_ROW_ID,
  type FlatSettingsRow,
  type ResolvedFrameShellTheme,
  type ResolvedSettingsLayout,
} from './app-frame-overlay-contract.js';
import { frameStartAnchor } from './app-frame-i18n.js';
import type { InternalFrameModel } from './app-frame-types.js';
import { resolveFrameSettings } from './app-frame-overlay-settings.js';

export function resolveSettingsLayout<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  shellThemes: readonly ResolvedFrameShellTheme[],
): ResolvedSettingsLayout<Msg> | undefined {
  const settings = resolveFrameSettings(model, options, pagesById, shellThemes);
  if (settings == null) return undefined;
  const sections = settings.sections.filter(
    (section) => section.rows.length > 0,
  );
  if (sections.length === 0) return undefined;
  const drawerWidth = resolveSettingsDrawerWidth(model.columns);
  const anchor = frameStartAnchor(options.i18n);
  const startCol =
    anchor === 'left' ? 0 : Math.max(0, model.columns - drawerWidth);
  const contentWidth = Math.max(16, drawerWidth - 4);
  const preferenceSections = preparePreferenceSections(
    toPreferenceSections(sections),
  );
  const rows: FlatSettingsRow<Msg>[] = [];
  let line = 0;
  for (const [sectionIndex, section] of preferenceSections.entries()) {
    const sourceSection = sections[sectionIndex];
    if (sourceSection === undefined) continue;
    if (sectionIndex > 0) line += 1;
    line += 2;
    for (const [rowIndex, preparedRow] of section.rows.entries()) {
      const row = sourceSection.rows[rowIndex];
      if (row === undefined) continue;
      const rowLayout = resolvePreferenceRowLayout(
        preparedRow,
        contentWidth,
      );
      rows.push({
        index: rows.length,
        line,
        height: rowLayout.height,
        row,
        behavior:
          row.id === FRAME_SHELL_THEME_ROW_ID
            ? 'cycle-shell-theme'
            : undefined,
      });
      line += rowLayout.height;
      if (rowIndex < section.rows.length - 1) line += 1;
    }
  }
  const contentHeight = Math.max(1, model.rows - 2);
  const totalLines = Math.max(1, line);
  return {
    settings: { ...settings, sections },
    preferenceSections,
    rows,
    anchor,
    startCol,
    drawerWidth,
    contentWidth,
    contentHeight,
    totalLines,
    maxScrollY: Math.max(0, totalLines - contentHeight),
  };
}

export function clampSettingsFocus<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedSettingsLayout<Msg>,
): number {
  return layout.rows.length === 0
    ? 0
    : Math.max(
        0,
        Math.min(model.settingsFocusIndex, layout.rows.length - 1),
      );
}

export function clampSettingsScroll<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedSettingsLayout<Msg>,
): number {
  return Math.max(0, Math.min(model.settingsScrollY, layout.maxScrollY));
}

function resolveSettingsDrawerWidth(columns: number): number {
  const bounded = Math.max(24, columns);
  return Math.min(
    Math.max(28, Math.floor(bounded * 0.3)),
    Math.max(28, bounded - 4),
    42,
  );
}

function toPreferenceSections<Msg>(
  sections: readonly FrameSettingSection<Msg>[],
): readonly PreferenceSection[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    rows: section.rows.map(toPreferenceRow),
  }));
}

function toPreferenceRow<Msg>(row: FrameSettingRow<Msg>): PreferenceRow {
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    valueLabel: row.valueLabel,
    kind: row.kind,
    checked: row.checked,
    enabled: row.enabled,
  };
}

import {
  createSurface,
  preparePreferenceSections,
  preferenceListSurface,
  resolvePreferenceRowLayout,
  type BijouContext,
  type PreparedPreferenceSection,
  type PreferenceRow,
  type PreferenceSection,
  type ResolvedTheme,
  type Surface,
} from '@flyingrobots/bijou';
import type { I18nRuntime } from '@flyingrobots/bijou-i18n';
import { helpViewSurface, type BindingSource } from './help.js';
import type {
  CreateFramedAppOptions,
  FrameInputArea,
  FramePage,
  FrameSettingRow,
  FrameSettingSection,
  FrameSettings,
  FrameShellTheme,
} from './app-frame.js';
import {
  frameEndAnchor,
  frameMessage,
  frameNotificationCue,
  frameNotificationFilterLabel,
  frameStartAnchor,
} from './app-frame-i18n.js';
import type { FrameAction, FramedAppMsg, InternalFrameModel } from './app-frame-types.js';
import type { Overlay } from './overlay.js';
import { drawer } from './overlay.js';
import {
  countNotificationHistory,
  renderNotificationHistorySurface,
  renderNotificationReviewEntrySurface,
  type NotificationHistoryFilter,
  type NotificationHistoryLabels,
  type NotificationState,
} from './notification.js';
import { createPagerStateForSurface, pagerSurface } from './pager.js';
import { insetLineSurface } from './collection-surface.js';
import { vstackSurface } from './surface-layout.js';
import { emitMsgForPage } from './app-frame-types.js';

export const FRAME_SHELL_THEME_ROW_ID = '__frame-shell-theme__';

type SettingsRowBehavior = 'cycle-shell-theme';

export interface ResolvedFrameShellTheme {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly shellTheme: FrameShellTheme;
  readonly resolvedTheme: ResolvedTheme;
}

interface FlatSettingsRow<Msg> {
  readonly index: number;
  readonly line: number;
  readonly height: number;
  readonly row: FrameSettingRow<Msg>;
  readonly behavior?: SettingsRowBehavior;
}

export interface ResolvedSettingsLayout<Msg> {
  readonly settings: FrameSettings<Msg>;
  readonly preferenceSections: readonly PreparedPreferenceSection[];
  readonly rows: readonly FlatSettingsRow<Msg>[];
  readonly anchor: 'left' | 'right';
  readonly startCol: number;
  readonly drawerWidth: number;
  readonly contentWidth: number;
  readonly contentHeight: number;
  readonly totalLines: number;
  readonly maxScrollY: number;
}

export interface ResolvedFrameNotificationCenter<Msg> {
  readonly title: string;
  readonly state: NotificationState<Msg>;
  readonly filters: readonly NotificationHistoryFilter[];
  readonly activeFilter: NotificationHistoryFilter;
  readonly onFilterChange?: (filter: NotificationHistoryFilter) => Msg | undefined;
}

export interface ResolvedNotificationCenterLayout<Msg> {
  readonly center: ResolvedFrameNotificationCenter<Msg>;
  readonly anchor: 'left' | 'right';
  readonly startCol: number;
  readonly drawerWidth: number;
  readonly contentWidth: number;
  readonly contentHeight: number;
  readonly content: Surface;
  readonly maxScrollY: number;
}

const DEFAULT_NOTIFICATION_CENTER_FILTERS: readonly NotificationHistoryFilter[] = [
  'ALL',
  'ACTIONABLE',
  'ERROR',
  'WARNING',
  'SUCCESS',
  'INFO',
];

export function renderHelpOverlay<PageModel, Msg>(
  model: Pick<InternalFrameModel<PageModel, Msg>, 'columns' | 'rows' | 'helpScrollY'>,
  source: BindingSource,
  i18n?: I18nRuntime,
): { body: Surface; maxScrollY: number; scrollY: number } {
  const maxDialogWidth = Math.max(28, Math.min(model.columns - 4, 88));
  const bodyWidth = Math.max(20, maxDialogWidth - 4);
  const helpSurface = helpViewSurface(source, {
    title: undefined,
    width: bodyWidth,
    defaultGroupName: frameMessage(i18n, 'help.group.general', 'General'),
  });
  const pagerHeight = Math.max(4, Math.min(helpSurface.height + 1, Math.max(4, model.rows - 8)));
  const pagerState = createPagerStateForSurface(helpSurface, {
    width: bodyWidth,
    height: pagerHeight,
  });
  const scrollY = Math.max(0, Math.min(model.helpScrollY, pagerState.scroll.maxY));
  const scrolledState = {
    ...pagerState,
    scroll: {
      ...pagerState.scroll,
      y: scrollY,
    },
  };
  return {
    body: pagerSurface(helpSurface, scrolledState, { showScrollbar: true, showStatus: true }),
    maxScrollY: pagerState.scroll.maxY,
    scrollY,
  };
}

export function isHelpScrollAction(
  action: FrameAction,
): action is Extract<FrameAction, { type: 'scroll-up' | 'scroll-down' | 'page-up' | 'page-down' | 'top' | 'bottom' }> {
  return action.type === 'scroll-up'
    || action.type === 'scroll-down'
    || action.type === 'page-up'
    || action.type === 'page-down'
    || action.type === 'top'
    || action.type === 'bottom';
}

export function resolveShellThemeOptionsText(
  shellThemes: readonly ResolvedFrameShellTheme[],
  i18n: I18nRuntime | undefined,
): string {
  const labels = shellThemes.map((theme) => theme.label);
  if (labels.length === 0) return '';
  if (i18n == null) return labels.join(', ');
  return i18n.formatList(labels, i18n.locale);
}

export function resolveCurrentShellTheme(
  shellThemes: readonly ResolvedFrameShellTheme[],
  activeShellThemeId: string | undefined,
): ResolvedFrameShellTheme | undefined {
  return shellThemes.find((theme) => theme.id === activeShellThemeId) ?? shellThemes[0];
}

export function resolveNextShellTheme(
  shellThemes: readonly ResolvedFrameShellTheme[],
  activeShellThemeId: string | undefined,
): ResolvedFrameShellTheme | undefined {
  if (shellThemes.length === 0) return undefined;
  const currentIndex = Math.max(0, shellThemes.findIndex((theme) => theme.id === activeShellThemeId));
  return shellThemes[(currentIndex + 1) % shellThemes.length];
}

export function resolveShellThemeForContext(
  shellThemes: readonly ResolvedFrameShellTheme[],
  ctx: BijouContext | undefined,
): ResolvedFrameShellTheme | undefined {
  if (ctx == null) return undefined;
  return shellThemes.find((theme) => theme.resolvedTheme.theme === ctx.theme.theme);
}

export function mergeShellThemeSettings<Msg>(
  settings: FrameSettings<Msg> | undefined,
  shellThemes: readonly ResolvedFrameShellTheme[],
  activeShellThemeId: string | undefined,
  i18n: I18nRuntime | undefined,
): FrameSettings<Msg> | undefined {
  if (shellThemes.length < 2) return settings;

  const currentTheme = resolveCurrentShellTheme(shellThemes, activeShellThemeId);
  const nextTheme = resolveNextShellTheme(shellThemes, activeShellThemeId);
  if (currentTheme == null || nextTheme == null) return settings;

  const row: FrameSettingRow<Msg> = {
    id: FRAME_SHELL_THEME_ROW_ID,
    label: frameMessage(i18n, 'settings.shellTheme.label', 'Shell theme'),
    description: currentTheme.description ?? frameMessage(
      i18n,
      'settings.shellTheme.description',
      'Current theme: {theme}. Options: {options}.',
      {
        theme: currentTheme.label,
        options: resolveShellThemeOptionsText(shellThemes, i18n),
      },
    ),
    valueLabel: currentTheme.label,
    kind: 'choice',
    feedback: {
      title: frameMessage(i18n, 'settings.title', 'Settings'),
      message: frameMessage(
        i18n,
        'settings.shellTheme.feedback',
        'Shell theme set to {theme}.',
        { theme: nextTheme.label },
      ),
    },
  };

  const shellSectionTitle = frameMessage(i18n, 'settings.section.shell', 'Shell');
  if (settings == null) {
    return {
      title: frameMessage(i18n, 'settings.title', 'Settings'),
      sections: [{ id: 'shell', title: shellSectionTitle, rows: [row] }],
    };
  }

  const shellSectionIndex = settings.sections.findIndex((section) => section.id === 'shell');
  if (shellSectionIndex >= 0) {
    const shellSection = settings.sections[shellSectionIndex]!;
    const existingRowIndex = shellSection.rows.findIndex((existingRow) => existingRow.id === FRAME_SHELL_THEME_ROW_ID);
    const nextRows = existingRowIndex >= 0
      ? shellSection.rows.map((existingRow, index) => (index === existingRowIndex ? row : existingRow))
      : [...shellSection.rows, row];
    return {
      ...settings,
      sections: settings.sections.map((section, index) => (
        index === shellSectionIndex
          ? { ...shellSection, rows: nextRows }
          : section
      )),
    };
  }

  return {
    ...settings,
    sections: [
      { id: 'shell', title: shellSectionTitle, rows: [row] },
      ...settings.sections,
    ],
  };
}

export function resolveFrameSettings<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  shellThemes: readonly ResolvedFrameShellTheme[],
): FrameSettings<Msg> | undefined {
  const activePage = pagesById.get(model.activePageId)!;
  const provided = options.settings?.({
    model,
    activePage,
    pageModel: model.pageModels[model.activePageId]!,
  });
  return mergeShellThemeSettings(provided, shellThemes, model.activeShellThemeId, options.i18n);
}

export function resolveFrameNotificationCenter<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): ResolvedFrameNotificationCenter<Msg> | undefined {
  const activePage = pagesById.get(model.activePageId)!;
  const pageModel = model.pageModels[model.activePageId]!;
  const provided = options.notificationCenter?.({
    model,
    activePage,
    pageModel,
    runtimeNotifications: model.runtimeNotifications,
  });

  if (provided != null) {
    const filters = provided.filters != null && provided.filters.length > 0
      ? provided.filters
      : DEFAULT_NOTIFICATION_CENTER_FILTERS;
    const activeFilter = filters.includes(provided.activeFilter ?? 'ALL')
      ? (provided.activeFilter ?? 'ALL')
      : filters[0]!;
    return {
      title: provided.title ?? frameMessage(options.i18n, 'notifications.title', 'Notifications'),
      state: provided.state,
      filters,
      activeFilter,
      onFilterChange: provided.onFilterChange,
    };
  }

  if (options.runtimeNotifications === false) return undefined;

  return {
    title: frameMessage(options.i18n, 'notifications.title', 'Notifications'),
    state: model.runtimeNotifications as NotificationState<Msg>,
    filters: DEFAULT_NOTIFICATION_CENTER_FILTERS,
    activeFilter: model.runtimeNotificationHistoryFilter,
  };
}

export function resolveSettingsLayout<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  shellThemes: readonly ResolvedFrameShellTheme[],
): ResolvedSettingsLayout<Msg> | undefined {
  const settings = resolveFrameSettings(model, options, pagesById, shellThemes);
  if (settings == null) return undefined;

  const sections = settings.sections.filter((section) => section.rows.length > 0);
  if (sections.length === 0) return undefined;

  const drawerWidth = resolveSettingsDrawerWidth(model.columns);
  const anchor = frameStartAnchor(options.i18n);
  const startCol = anchor === 'left' ? 0 : Math.max(0, model.columns - drawerWidth);
  const contentWidth = Math.max(16, drawerWidth - 4);
  const preferenceSections = preparePreferenceSections(toPreferenceSections(sections));
  const rows: FlatSettingsRow<Msg>[] = [];
  let line = 0;

  for (let sectionIndex = 0; sectionIndex < preferenceSections.length; sectionIndex++) {
    const section = preferenceSections[sectionIndex]!;
    if (sectionIndex > 0) {
      line += 1;
    }
    line += 1;
    line += 1;
    for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex++) {
      const preparedRow = section.rows[rowIndex]!;
      const row = sections[sectionIndex]!.rows[rowIndex]!;
      const rowLayout = resolvePreferenceRowLayout(preparedRow, contentWidth);
      rows.push({
        index: rows.length,
        line,
        height: rowLayout.height,
        row,
        behavior: row.id === FRAME_SHELL_THEME_ROW_ID ? 'cycle-shell-theme' : undefined,
      });
      line += rowLayout.height;
      if (rowIndex < section.rows.length - 1) {
        line += 1;
      }
    }
  }

  const contentHeight = Math.max(1, model.rows - 2);
  const totalLines = Math.max(1, line);
  const maxScrollY = Math.max(0, totalLines - contentHeight);

  return {
    settings: {
      ...settings,
      sections,
    },
    preferenceSections,
    rows,
    anchor,
    startCol,
    drawerWidth,
    contentWidth,
    contentHeight,
    totalLines,
    maxScrollY,
  };
}

export function resolveNotificationCenterLayout<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  ctx?: BijouContext,
): ResolvedNotificationCenterLayout<Msg> | undefined {
  const center = resolveFrameNotificationCenter(model, options, pagesById);
  if (center == null) return undefined;

  const drawerWidth = resolveNotificationCenterDrawerWidth(model.columns);
  const anchor = frameEndAnchor(options.i18n);
  const startCol = anchor === 'left' ? 0 : Math.max(0, model.columns - drawerWidth);
  const contentWidth = Math.max(18, drawerWidth - 4);
  const content = renderNotificationCenterSurface(center, contentWidth, options.i18n, ctx);
  const contentHeight = Math.max(1, model.rows - 2);
  const pagerState = createPagerStateForSurface(content, {
    width: contentWidth,
    height: contentHeight,
  });

  return {
    center,
    anchor,
    startCol,
    drawerWidth,
    contentWidth,
    contentHeight,
    content,
    maxScrollY: pagerState.scroll.maxY,
  };
}

export function clampSettingsFocus<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedSettingsLayout<Msg>,
): number {
  if (layout.rows.length === 0) return 0;
  return Math.max(0, Math.min(model.settingsFocusIndex, layout.rows.length - 1));
}

export function resolveInputAreas<PageModel, Msg>(
  page: FramePage<PageModel, Msg>,
  pageModel: PageModel,
): readonly FrameInputArea<PageModel, Msg>[] {
  return page.inputAreas?.(pageModel) ?? [];
}

export function findInputAreaByPaneId<PageModel, Msg>(
  inputAreas: readonly FrameInputArea<PageModel, Msg>[],
  paneId: string | undefined,
): FrameInputArea<PageModel, Msg> | undefined {
  if (paneId == null) return undefined;
  return inputAreas.find((area) => area.paneId === paneId);
}

export function moveSettingsFocus<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedSettingsLayout<Msg>,
  delta: number,
): InternalFrameModel<PageModel, Msg> {
  if (layout.rows.length === 0) return model;
  const nextFocus = Math.max(0, Math.min(clampSettingsFocus(model, layout) + delta, layout.rows.length - 1));
  const focusedRow = layout.rows[nextFocus]!;
  return {
    ...model,
    settingsFocusIndex: nextFocus,
    settingsScrollY: ensureSettingsRangeVisible(
      focusedRow.line,
      focusedRow.height,
      clampSettingsScroll(model, layout),
      layout.contentHeight,
      layout.maxScrollY,
    ),
  };
}

export function scrollSettingsBy<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedSettingsLayout<Msg>,
  delta: number,
): InternalFrameModel<PageModel, Msg> {
  return {
    ...model,
    settingsScrollY: Math.max(0, Math.min(clampSettingsScroll(model, layout) + delta, layout.maxScrollY)),
  };
}

export function scrollNotificationCenterBy<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedNotificationCenterLayout<Msg>,
  delta: number,
): InternalFrameModel<PageModel, Msg> {
  return {
    ...model,
    notificationCenterScrollY: Math.max(0, Math.min(model.notificationCenterScrollY + delta, layout.maxScrollY)),
  };
}

export function cycleNotificationCenterFilter<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedNotificationCenterLayout<Msg>,
): [InternalFrameModel<PageModel, Msg>, import('./types.js').Cmd<FramedAppMsg<Msg>>[]] {
  const filters = layout.center.filters;
  if (filters.length < 2) return [model, []];
  const currentIndex = Math.max(0, filters.indexOf(layout.center.activeFilter));
  const nextFilter = filters[(currentIndex + 1) % filters.length]!;
  if (layout.center.onFilterChange != null) {
    const action = layout.center.onFilterChange(nextFilter);
    return [{
      ...model,
      notificationCenterScrollY: 0,
    }, action === undefined ? [] : [emitMsgForPage(model.activePageId, action)]];
  }
  return [{
    ...model,
    runtimeNotificationHistoryFilter: nextFilter,
    notificationCenterScrollY: 0,
  }, []];
}

export function renderSettingsDrawer<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  shellThemes: readonly ResolvedFrameShellTheme[],
  titleOverride?: string,
  ctx?: BijouContext,
): Overlay | undefined {
  const layout = resolveSettingsLayout(model, options, pagesById, shellThemes);
  if (layout == null) return undefined;

  const scrollY = clampSettingsScroll(model, layout);
  const content = renderSettingsSurface(layout, model, ctx);
  const pagerState = createPagerStateForSurface(content, {
    width: layout.contentWidth,
    height: layout.contentHeight,
  });
  const scrolledState = {
    ...pagerState,
    scroll: {
      ...pagerState.scroll,
      y: scrollY,
    },
  };
  const body = pagerSurface(content, scrolledState, {
    showScrollbar: layout.maxScrollY > 0,
    showStatus: false,
  });

  return drawer({
    anchor: layout.anchor,
    title: titleOverride ?? layout.settings.title ?? frameMessage(options.i18n, 'settings.title', 'Settings'),
    content: body,
    borderToken: layout.settings.borderToken,
    bgToken: layout.settings.bgToken,
    ctx,
    width: layout.drawerWidth,
    screenWidth: model.columns,
    screenHeight: model.rows,
  });
}

export function renderNotificationCenterDrawer<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  titleOverride?: string,
  ctx?: BijouContext,
): Overlay | undefined {
  const layout = resolveNotificationCenterLayout(model, options, pagesById, ctx);
  if (layout == null) return undefined;

  const pagerState = createPagerStateForSurface(layout.content, {
    width: layout.contentWidth,
    height: layout.contentHeight,
  });
  const scrolledState = {
    ...pagerState,
    scroll: {
      ...pagerState.scroll,
      y: Math.max(0, Math.min(model.notificationCenterScrollY, layout.maxScrollY)),
    },
  };
  const body = pagerSurface(layout.content, scrolledState, {
    showScrollbar: layout.maxScrollY > 0,
    showStatus: false,
  });

  return drawer({
    anchor: layout.anchor,
    title: titleOverride ?? `${layout.center.title} • ${frameNotificationFilterLabel(options.i18n, layout.center.activeFilter)}`,
    content: body,
    borderToken: ctx?.border('primary'),
    bgToken: ctx?.surface('elevated'),
    ctx,
    width: layout.drawerWidth,
    screenWidth: model.columns,
    screenHeight: model.rows,
  });
}

export function resolveNotificationFooterCue<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): string | undefined {
  const center = resolveFrameNotificationCenter(model, options, pagesById);
  if (center == null) return undefined;
  const liveCount = center.state.items.length;
  const archivedCount = countNotificationHistory(center.state, center.activeFilter);
  return frameNotificationCue(options.i18n, liveCount, archivedCount);
}

function resolveNotificationCenterDrawerWidth(columns: number): number {
  const boundedColumns = Math.max(28, columns);
  return Math.min(Math.max(32, Math.floor(boundedColumns * 0.34)), Math.max(32, boundedColumns - 4), 52);
}

function resolveSettingsDrawerWidth(columns: number): number {
  const boundedColumns = Math.max(24, columns);
  return Math.min(Math.max(28, Math.floor(boundedColumns * 0.3)), Math.max(28, boundedColumns - 4), 42);
}

export function clampSettingsScroll<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedSettingsLayout<Msg>,
): number {
  return Math.max(0, Math.min(model.settingsScrollY, layout.maxScrollY));
}

function ensureSettingsRangeVisible(
  startLine: number,
  height: number,
  scrollY: number,
  visibleLines: number,
  maxScrollY: number,
): number {
  let next = scrollY;
  const endLine = startLine + Math.max(1, height) - 1;
  if (startLine < next) {
    next = startLine;
  } else if (endLine >= next + visibleLines) {
    next = endLine - visibleLines + 1;
  }
  return Math.max(0, Math.min(next, maxScrollY));
}

function renderSettingsSurface<PageModel, Msg>(
  layout: ResolvedSettingsLayout<Msg>,
  model: InternalFrameModel<PageModel, Msg>,
  ctx?: BijouContext,
): Surface {
  const focusedIndex = clampSettingsFocus(model, layout);
  return preferenceListSurface(layout.preferenceSections, {
    width: layout.contentWidth,
    selectedRowId: layout.rows[focusedIndex]?.row.id,
    ctx,
    theme: layout.settings.listTheme,
  });
}

function toPreferenceSections<Msg>(
  sections: readonly FrameSettingSection<Msg>[],
): readonly PreferenceSection[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    rows: section.rows.map((row) => toPreferenceRow(row)),
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

function notificationHistoryLabels(
  i18n: I18nRuntime | undefined,
): NotificationHistoryLabels {
  return {
    filterLabel: (filter) => frameNotificationFilterLabel(i18n, filter),
    headerLabel: ({ filterLabel, start, end, total }) => frameMessage(
      i18n,
      'notifications.history.title',
      'History • {filter} • {range}',
      {
        filter: filterLabel,
        range: total === 0
          ? frameMessage(i18n, 'notifications.history.range.empty', '0 items')
          : frameMessage(i18n, 'notifications.history.range.window', '{start}-{end} of {total}', {
            start,
            end,
            total,
          }),
      },
    ),
    emptyLabel: ({ filterLabel }) => frameMessage(
      i18n,
      'notifications.history.empty',
      'No archived notifications for {filter} yet.',
      { filter: filterLabel },
    ),
    actionLabel: (label) => frameMessage(
      i18n,
      'notifications.history.action',
      'Action: {label}',
      { label },
    ),
  };
}

function renderNotificationCenterSurface<Msg>(
  center: ResolvedFrameNotificationCenter<Msg>,
  width: number,
  i18n?: I18nRuntime,
  ctx?: BijouContext,
): Surface {
  const historyLabels = notificationHistoryLabels(i18n);
  const rows: Surface[] = [
    insetLineSurface(
      frameMessage(
        i18n,
        'notifications.summary.liveArchived',
        'Live: {liveCount} • Archived: {archivedCount}',
        {
          liveCount: center.state.items.length,
          archivedCount: center.state.history.length,
        },
      ),
      width,
    ),
    insetLineSurface(
      frameMessage(
        i18n,
        'notifications.summary.filter',
        'Filter: {filter}',
        { filter: frameNotificationFilterLabel(i18n, center.activeFilter) },
      ),
      width,
    ),
  ];

  const liveItems = [...center.state.items].sort(
    (left, right) => right.updatedAtMs - left.updatedAtMs || right.id - left.id,
  );

  if (liveItems.length > 0) {
    rows.push(createSurface(width, 1));
    rows.push(insetLineSurface(
      ctx == null
        ? frameMessage(i18n, 'notifications.currentStack', 'Current stack')
        : ctx.style.bold(frameMessage(i18n, 'notifications.currentStack', 'Current stack')),
      width,
    ));
    rows.push(createSurface(width, 1));
    for (let index = 0; index < liveItems.length; index++) {
      rows.push(renderNotificationReviewEntrySurface(liveItems[index]!, {
        width,
        ctx,
        actionLabel: historyLabels.actionLabel,
        metaLabel: `${liveItems[index]!.variant} • live`,
      }));
      if (index < liveItems.length - 1) rows.push(createSurface(width, 1));
    }
  }

  rows.push(createSurface(width, 1));
  rows.push(renderNotificationHistorySurface(center.state, {
    width,
    height: Number.MAX_SAFE_INTEGER,
    filter: center.activeFilter,
    ctx,
    labels: historyLabels,
  }));

  return vstackSurface(...rows);
}

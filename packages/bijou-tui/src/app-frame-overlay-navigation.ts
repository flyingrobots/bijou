import type {
  FrameInputArea,
  FramePage,
} from './app-frame.js';
import type {
  ResolvedNotificationCenterLayout,
  ResolvedSettingsLayout,
} from './app-frame-overlay-contract.js';
import {
  clampSettingsFocus,
  clampSettingsScroll,
} from './app-frame-overlay-layout.js';
import {
  emitMsgForPage,
  type FramedAppMsg,
  type InternalFrameModel,
} from './app-frame-types.js';
import type { Cmd } from './types.js';

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
  return paneId == null
    ? undefined
    : inputAreas.find((area) => area.paneId === paneId);
}

export function moveSettingsFocus<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedSettingsLayout<Msg>,
  delta: number,
): InternalFrameModel<PageModel, Msg> {
  if (layout.rows.length === 0) return model;
  const nextFocus = Math.max(
    0,
    Math.min(
      clampSettingsFocus(model, layout) + delta,
      layout.rows.length - 1,
    ),
  );
  const focusedRow = layout.rows[nextFocus];
  if (focusedRow === undefined) return model;
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
    settingsScrollY: Math.max(
      0,
      Math.min(clampSettingsScroll(model, layout) + delta, layout.maxScrollY),
    ),
  };
}

export function scrollNotificationCenterBy<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedNotificationCenterLayout<Msg>,
  delta: number,
): InternalFrameModel<PageModel, Msg> {
  return {
    ...model,
    notificationCenterScrollY: Math.max(
      0,
      Math.min(
        model.notificationCenterScrollY + delta,
        layout.maxScrollY,
      ),
    ),
  };
}

export function cycleNotificationCenterFilter<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  layout: ResolvedNotificationCenterLayout<Msg>,
): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
  const filters = layout.center.filters;
  if (filters.length < 2) return [model, []];
  const index = Math.max(0, filters.indexOf(layout.center.activeFilter));
  const next = filters[(index + 1) % filters.length] ?? filters[0];
  if (next === undefined) return [model, []];
  if (layout.center.onFilterChange != null) {
    const action = layout.center.onFilterChange(next);
    return [
      { ...model, notificationCenterScrollY: 0 },
      action === undefined
        ? []
        : [emitMsgForPage(model.activePageId, action)],
    ];
  }
  return [
    {
      ...model,
      runtimeNotificationHistoryFilter: next,
      notificationCenterScrollY: 0,
    },
    [],
  ];
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
  if (startLine < next) next = startLine;
  else if (endLine >= next + visibleLines) {
    next = endLine - visibleLines + 1;
  }
  return Math.max(0, Math.min(next, maxScrollY));
}

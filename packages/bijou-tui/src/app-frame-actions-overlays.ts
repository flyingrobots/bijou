import type { FramePage, CreateFramedAppOptions } from './app-frame.js';
import type { InternalFrameModel } from './app-frame-types.js';
import { hasNotificationCenter } from './app-frame-actions-footer.js';

export function toggleSettings<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const activePage = pagesById.get(model.activePageId);
  const pageModel = model.pageModels[model.activePageId];
  if (activePage == null || pageModel === undefined) return model;
  const settings = options.settings?.({ model, activePage, pageModel });
  const shellThemes = options.shellThemes ?? [];
  const hasStockSettings = shellThemes.length > 1
    || shellThemes.some((theme) => (theme.modes?.length ?? 0) > 1);
  if (
    !hasStockSettings
    && (
      settings == null
      || settings.sections.every((section) => section.rows.length === 0)
    )
  ) {
    return model;
  }
  const opening = !model.settingsOpen;
  return {
    ...model,
    settingsOpen: opening,
    settingsFocusIndex: opening ? 0 : model.settingsFocusIndex,
    settingsScrollY: opening ? 0 : model.settingsScrollY,
    notificationCenterOpen: opening ? false : model.notificationCenterOpen,
    helpOpen: opening ? false : model.helpOpen,
    helpScrollY: opening ? 0 : model.helpScrollY,
    commandPalette: opening ? undefined : model.commandPalette,
    commandPaletteEntries: opening ? undefined : model.commandPaletteEntries,
    commandPaletteTitle: opening ? undefined : model.commandPaletteTitle,
    commandPaletteKind: opening ? undefined : model.commandPaletteKind,
  };
}

export function toggleNotificationCenter<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  if (!hasNotificationCenter(model, options, pagesById)) return model;
  return {
    ...model,
    notificationCenterOpen: !model.notificationCenterOpen,
    notificationCenterScrollY: model.notificationCenterOpen
      ? model.notificationCenterScrollY
      : 0,
    settingsOpen: false,
    helpOpen: false,
    helpScrollY: 0,
    commandPalette: undefined,
    commandPaletteEntries: undefined,
    commandPaletteTitle: undefined,
    commandPaletteKind: undefined,
    quitConfirmOpen: false,
  };
}

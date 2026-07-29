import type { FramePage, CreateFramedAppOptions } from './app-frame.js';
import type {
  InternalFrameModel,
  FrameAction,
  PaletteEntry,
  PaletteKind,
} from './app-frame-types.js';
import type { KeyMap } from './keybindings.js';
import { frameMessage } from './app-frame-i18n.js';
import { resolveFramePageText } from './app-frame-utils.js';
import { createCommandPaletteState } from './command-palette.js';
import { buildSearchEntries } from './app-frame-palette.part04.js';

export function openSearchPalette<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const page = pagesById.get(model.activePageId);
  const pageModel = model.pageModels[model.activePageId];
  if (page == null || pageModel === undefined) return model;
  const entries = buildSearchEntries(model, frameKeys, options, pagesById);
  const title =
    resolveFramePageText(page.searchTitle, pageModel) ??
    frameMessage(options.i18n, 'search.title', 'Search');
  return openPaletteModel(model, entries, title, 'search');
}
export function openPaletteModel<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  entries: readonly PaletteEntry<Msg>[],
  title: string,
  kind: PaletteKind,
): InternalFrameModel<PageModel, Msg> {
  const items = entries.map((x) => x.item);
  return {
    ...model,
    commandPalette: createCommandPaletteState(
      items,
      Math.max(5, Math.min(10, model.rows - 8)),
    ),
    commandPaletteEntries: entries,
    commandPaletteTitle: title,
    commandPaletteKind: kind,
  };
}

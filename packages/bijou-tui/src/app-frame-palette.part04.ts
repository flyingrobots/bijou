import type { FramePage, CreateFramedAppOptions } from './app-frame.js';
import type {
  InternalFrameModel,
  FrameAction,
  PaletteEntry,
} from './app-frame-types.js';
import type { KeyMap } from './keybindings.js';
import { resolveFramePageText } from './app-frame-utils.js';

export function buildSearchEntries<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  _frameKeys: KeyMap<FrameAction>,
  _options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): readonly PaletteEntry<Msg>[] {
  const page = pagesById.get(model.activePageId);
  const pageModel = model.pageModels[model.activePageId];
  if (page == null || pageModel === undefined) return [];
  const pageTitle = resolveFramePageText(page.title, pageModel) ?? '';
  const items =
    page.searchItems?.(pageModel) ?? page.commandItems?.(pageModel) ?? [];

  return items.map((item, index) => ({
    id: `search:${String(index)}`,
    item: {
      ...item,
      id: `search:${String(index)}`,
      category: item.category ?? pageTitle,
    },
    msgAction: item.action,
    targetPageId: item.targetPageId ?? model.activePageId,
  }));
}

import type { FramePage, CreateFramedAppOptions } from './app-frame.js';
import type {
  InternalFrameModel,
  FrameAction,
  PaletteEntry,
} from './app-frame-types.js';
import { comboToMsg } from './app-frame-types.js';
import type { KeyMap } from './keybindings.js';
import { formatKeyCombo } from './keybindings.js';
import { resolveFramePageText } from './app-frame-utils.js';

export function buildPaletteEntries<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): readonly PaletteEntry<Msg>[] {
  const entries: PaletteEntry<Msg>[] = [];
  let seq = 0;

  for (const b of frameKeys.bindings()) {
    if (!b.enabled) continue;
    const action = frameKeys.handle(comboToMsg(b));
    if (action === undefined) continue;
    const id = `frame:${String(seq++)}`;
    entries.push({
      id,
      item: {
        id,
        label: b.description,
        category: 'Frame',
        shortcut: formatKeyCombo(b.combo),
      },
      frameAction: action,
    });
  }

  const global = options.globalKeys;
  if (global != null) {
    for (const b of global.bindings()) {
      if (!b.enabled) continue;
      const action = global.handle(comboToMsg(b));
      if (action === undefined) continue;
      const id = `global:${String(seq++)}`;
      entries.push({
        id,
        item: {
          id,
          label: b.description,
          category: 'Global',
          shortcut: formatKeyCombo(b.combo),
        },
        msgAction: action,
      });
    }
  }

  const page = pagesById.get(model.activePageId);
  const pageModel = model.pageModels[model.activePageId];
  if (page == null || pageModel === undefined) return entries;
  const pageTitle = resolveFramePageText(page.title, pageModel) ?? '';
  if (page.keyMap != null) {
    for (const b of page.keyMap.bindings()) {
      if (!b.enabled) continue;
      const action = page.keyMap.handle(comboToMsg(b));
      if (action === undefined) continue;
      const id = `page:${String(seq++)}`;
      entries.push({
        id,
        item: {
          id,
          label: b.description,
          category: pageTitle,
          shortcut: formatKeyCombo(b.combo),
        },
        msgAction: action,
        targetPageId: model.activePageId,
      });
    }
  }

  if (page.commandItems != null) {
    for (const item of page.commandItems(pageModel)) {
      const id = `custom:${String(seq++)}`;
      entries.push({
        id,
        item: {
          ...item,
          id,
          category: item.category ?? pageTitle,
        },
        msgAction: item.action,
        targetPageId: item.targetPageId ?? model.activePageId,
      });
    }
  }

  return entries;
}

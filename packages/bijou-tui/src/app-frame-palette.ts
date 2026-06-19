import type { FramePage, CreateFramedAppOptions } from './app-frame.js';
import type {
  InternalFrameModel,
  FrameAction,
  PaletteAction,
  PaletteEntry,
  PaletteKind,
  FramedAppMsg,
} from './app-frame-types.js';
import { comboToMsg, emitMsg, emitMsgForPage } from './app-frame-types.js';
import { applyFrameAction, syncPageFrameState } from './app-frame-actions.js';
import type { Cmd, KeyMsg } from './types.js';
import type { KeyMap } from './keybindings.js';
import { formatKeyCombo } from './keybindings.js';
import { frameMessage } from './app-frame-i18n.js';
import { resolveFramePageText } from './app-frame-utils.js';
import {
  createCommandPaletteState,
  cpFilter,
  cpFocusNext,
  cpFocusPrev,
  cpPageDown,
  cpPageUp,
  cpSelectedItem,
} from './command-palette.js';

export function handlePaletteKey<PageModel, Msg>(
  msg: KeyMsg,
  model: InternalFrameModel<PageModel, Msg>,
  paletteKeys: KeyMap<PaletteAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  applyFrameActionOverride?: (
    action: FrameAction,
    model: InternalFrameModel<PageModel, Msg>,
  ) => [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] | undefined,
): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
  const cp = model.commandPalette;
  if (cp == null) return [model, []];
  const action = paletteKeys.handle(msg);

  if (action != null) {
    switch (action.type) {
      case 'cp-next':
        return [{ ...model, commandPalette: cpFocusNext(cp) }, []];
      case 'cp-prev':
        return [{ ...model, commandPalette: cpFocusPrev(cp) }, []];
      case 'cp-page-down':
        return [{ ...model, commandPalette: cpPageDown(cp) }, []];
      case 'cp-page-up':
        return [{ ...model, commandPalette: cpPageUp(cp) }, []];
      case 'cp-close':
        return [{ ...model, commandPalette: undefined, commandPaletteEntries: undefined, commandPaletteTitle: undefined, commandPaletteKind: undefined }, []];
      case 'cp-select': {
        const selected = cpSelectedItem(cp);
        if (selected == null) {
          return [{ ...model, commandPalette: undefined, commandPaletteEntries: undefined, commandPaletteTitle: undefined, commandPaletteKind: undefined }, []];
        }
        const entry = model.commandPaletteEntries?.find((x) => x.id === selected.id);
        if (entry?.frameAction != null) {
          const closed = {
            ...model,
            commandPalette: undefined,
            commandPaletteEntries: undefined,
            commandPaletteTitle: undefined,
            commandPaletteKind: undefined,
          };
          const overridden = applyFrameActionOverride?.(entry.frameAction, closed);
          if (overridden !== undefined) return overridden;
          return applyFrameAction(entry.frameAction, closed, options, pagesById);
        }
        if (entry?.msgAction !== undefined) {
          const closed = {
            ...model,
            commandPalette: undefined,
            commandPaletteEntries: undefined,
            commandPaletteTitle: undefined,
            commandPaletteKind: undefined,
          };
          const targetPageId = entry.targetPageId;
          const targetPageExists = targetPageId != null
            && pagesById.has(targetPageId)
            && model.pageModels[targetPageId] !== undefined;
          const nextModel = targetPageExists && targetPageId !== model.activePageId
            ? syncPageFrameState({
                ...closed,
                activePageId: targetPageId,
                previousPageId: model.activePageId,
                transitionProgress: 1,
              }, targetPageId, pagesById)
            : closed;
          const cmd = entry.targetPageId != null
            ? emitMsgForPage(entry.targetPageId, entry.msgAction)
            : emitMsg(entry.msgAction);
          return [nextModel, [cmd]];
        }
        return [{ ...model, commandPalette: undefined, commandPaletteEntries: undefined, commandPaletteTitle: undefined, commandPaletteKind: undefined }, []];
      }
    }
  }

  if (msg.key === 'backspace') {
    const next = cpFilter(cp, cp.query.slice(0, -1));
    return [{ ...model, commandPalette: next }, []];
  }

  if (!msg.ctrl && !msg.alt && msg.key.length === 1) {
    const next = cpFilter(cp, cp.query + msg.key);
    return [{ ...model, commandPalette: next }, []];
  }

  return [model, []];
}

export function openCommandPalette<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const entries = buildPaletteEntries(model, frameKeys, options, pagesById);
  return openPaletteModel(
    model,
    entries,
    frameMessage(options.i18n, 'palette.title', 'Command Palette'),
    'command',
  );
}

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
  const title = resolveFramePageText(page.searchTitle, pageModel)
    ?? frameMessage(options.i18n, 'search.title', 'Search');
  return openPaletteModel(model, entries, title, 'search');
}

function openPaletteModel<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  entries: readonly PaletteEntry<Msg>[],
  title: string,
  kind: PaletteKind,
): InternalFrameModel<PageModel, Msg> {
  const items = entries.map((x) => x.item);
  return {
    ...model,
    commandPalette: createCommandPaletteState(items, Math.max(5, Math.min(10, model.rows - 8))),
    commandPaletteEntries: entries,
    commandPaletteTitle: title,
    commandPaletteKind: kind,
  };
}

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
  const items = page.searchItems?.(pageModel)
    ?? page.commandItems?.(pageModel)
    ?? [];

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

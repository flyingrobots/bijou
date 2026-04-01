/**
 * Command palette integration for `app-frame.ts`.
 *
 * Handles palette key routing, entry building, and palette state management.
 */

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
import { applyFrameAction } from './app-frame-actions.js';
import type { Cmd, KeyMsg } from './types.js';
import type { KeyMap } from './keybindings.js';
import { formatKeyCombo } from './keybindings.js';
import { frameMessage } from './app-frame-i18n.js';
import {
  createCommandPaletteState,
  cpFilter,
  cpFocusNext,
  cpFocusPrev,
  cpPageDown,
  cpPageUp,
  cpSelectedItem,
} from './command-palette.js';

/** Route a key press through the command palette, returning updated model and commands. */
export function handlePaletteKey<PageModel, Msg>(
  msg: KeyMsg,
  model: InternalFrameModel<PageModel, Msg>,
  paletteKeys: KeyMap<PaletteAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
  const cp = model.commandPalette!;
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
          return applyFrameAction(entry.frameAction, closed, options, pagesById);
        }
        if (entry?.msgAction !== undefined) {
          const cmd = entry.targetPageId != null
            ? emitMsgForPage(entry.targetPageId, entry.msgAction)
            : emitMsg(entry.msgAction);
          return [{
            ...model,
            commandPalette: undefined,
            commandPaletteEntries: undefined,
            commandPaletteTitle: undefined,
            commandPaletteKind: undefined,
          }, [cmd]];
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

/** Initialize the command palette with entries from frame, global, page key maps, and custom page command items. */
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

/** Initialize a page-scoped search palette, falling back to page command items when needed. */
export function openSearchPalette<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const page = pagesById.get(model.activePageId)!;
  const entries = buildSearchEntries(model, frameKeys, options, pagesById);
  const title = page.searchTitle ?? frameMessage(options.i18n, 'search.title', 'Search');
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

/** Collect all available commands from frame, global, page, and custom sources. */
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
    const id = `frame:${seq++}`;
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
      const id = `global:${seq++}`;
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

  const page = pagesById.get(model.activePageId)!;
  if (page.keyMap != null) {
    for (const b of page.keyMap.bindings()) {
      if (!b.enabled) continue;
      const action = page.keyMap.handle(comboToMsg(b));
      if (action === undefined) continue;
      const id = `page:${seq++}`;
      entries.push({
        id,
        item: {
          id,
          label: b.description,
          category: page.title,
          shortcut: formatKeyCombo(b.combo),
        },
        msgAction: action,
        targetPageId: model.activePageId,
      });
    }
  }

  if (page.commandItems != null) {
    for (const item of page.commandItems(model.pageModels[model.activePageId]!)) {
      const id = `custom:${seq++}`;
      entries.push({
        id,
        item: {
          ...item,
          id,
          category: item.category ?? page.title,
        },
        msgAction: item.action,
        targetPageId: model.activePageId,
      });
    }
  }

  return entries;
}

/** Collect page-scoped search items, falling back to page command items when search items are absent. */
export function buildSearchEntries<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  _frameKeys: KeyMap<FrameAction>,
  _options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): readonly PaletteEntry<Msg>[] {
  const page = pagesById.get(model.activePageId)!;
  const items = page.searchItems?.(model.pageModels[model.activePageId]!)
    ?? page.commandItems?.(model.pageModels[model.activePageId]!)
    ?? [];

  return items.map((item, index) => ({
    id: `search:${index}`,
    item: {
      ...item,
      id: `search:${index}`,
      category: item.category ?? page.title,
    },
    msgAction: item.action,
    targetPageId: model.activePageId,
  }));
}

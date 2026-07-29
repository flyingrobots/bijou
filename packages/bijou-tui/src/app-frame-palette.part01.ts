import type { FramePage, CreateFramedAppOptions } from './app-frame.js';
import type {
  InternalFrameModel,
  FrameAction,
  PaletteAction,
  FramedAppMsg,
} from './app-frame-types.js';
import type { Cmd, KeyMsg } from './types.js';
import type { KeyMap } from './keybindings.js';
import { frameMessage } from './app-frame-i18n.js';
import {
  cpFilter,
  cpFocusNext,
  cpFocusPrev,
  cpPageDown,
  cpPageUp,
  cpSelectedItem,
} from './command-palette.js';
import { openPaletteModel } from './app-frame-palette.part02.js';
import { buildPaletteEntries } from './app-frame-palette.part03.js';
import {
  applyPaletteSelection,
  closePalette,
} from './app-frame-palette-selection.js';

export function handlePaletteKey<PageModel, Msg>(
  msg: KeyMsg,
  model: InternalFrameModel<PageModel, Msg>,
  paletteKeys: KeyMap<PaletteAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  applyFrameActionOverride?: (
    action: FrameAction,
    model: InternalFrameModel<PageModel, Msg>,
  ) =>
    [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] | undefined,
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
        return [closePalette(model), []];
      case 'cp-select': {
        const selected = cpSelectedItem(cp);
        const entry = model.commandPaletteEntries?.find(
          (candidate) => candidate.id === selected?.id,
        );
        return applyPaletteSelection(
          model,
          entry,
          options,
          pagesById,
          applyFrameActionOverride,
        );
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

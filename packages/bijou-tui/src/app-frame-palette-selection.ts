import type { CreateFramedAppOptions, FramePage } from './app-frame.js';
import { applyFrameAction, syncPageFrameState } from './app-frame-actions.js';
import type {
  FrameAction,
  FramedAppMsg,
  InternalFrameModel,
  PaletteEntry,
} from './app-frame-types.js';
import { emitMsg, emitMsgForPage } from './app-frame-types.js';
import type { Cmd } from './types.js';

export type PaletteSelectionResult<PageModel, Msg> = [
  InternalFrameModel<PageModel, Msg>,
  Cmd<FramedAppMsg<Msg>>[],
];

export function closePalette<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
): InternalFrameModel<PageModel, Msg> {
  return {
    ...model,
    commandPalette: undefined,
    commandPaletteEntries: undefined,
    commandPaletteTitle: undefined,
    commandPaletteKind: undefined,
  };
}

export function applyPaletteSelection<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  entry: PaletteEntry<Msg> | undefined,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  applyFrameActionOverride?: (
    action: FrameAction,
    model: InternalFrameModel<PageModel, Msg>,
  ) => PaletteSelectionResult<PageModel, Msg> | undefined,
): PaletteSelectionResult<PageModel, Msg> {
  const closed = closePalette(model);
  if (entry?.frameAction != null) {
    const overridden = applyFrameActionOverride?.(entry.frameAction, closed);
    if (overridden !== undefined) return overridden;
    return applyFrameAction(entry.frameAction, closed, options, pagesById);
  }
  if (entry?.msgAction === undefined) return [closed, []];

  const targetPageId = entry.targetPageId;
  const targetPageExists =
    targetPageId != null &&
    pagesById.has(targetPageId) &&
    model.pageModels[targetPageId] !== undefined;
  const nextModel =
    targetPageExists && targetPageId !== model.activePageId
      ? syncPageFrameState(
          {
            ...closed,
            activePageId: targetPageId,
            previousPageId: model.activePageId,
            transitionProgress: 1,
          },
          targetPageId,
          pagesById,
        )
      : closed;
  const cmd =
    targetPageId != null
      ? emitMsgForPage(targetPageId, entry.msgAction)
      : emitMsg(entry.msgAction);
  return [nextModel, [cmd]];
}

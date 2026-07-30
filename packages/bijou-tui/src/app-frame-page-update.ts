import type { Cmd } from './types.js';
import type { FramePage } from './app-frame-page-contract.js';
import type {
  FramePageMsg,
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import { wrapCmdForPage } from './app-frame-types.js';
import { syncPageFrameState } from './app-frame-actions.js';

export function updateTargetPage<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  targetPageId: string,
  targetMsg: FramePageMsg<Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
  const targetPage = pagesById.get(targetPageId);
  const pageModel = model.pageModels[targetPageId];
  if (targetPage == null || pageModel === undefined) return [model, []];
  const [nextPageModel, commands] = targetPage.update(
    targetMsg,
    pageModel,
  );
  const pageModels = {
    ...model.pageModels,
    [targetPageId]: nextPageModel,
  };
  const synced = syncPageFrameState(
    { ...model, pageModels },
    targetPageId,
    pagesById,
  );
  return [
    synced,
    commands.map((command) => wrapCmdForPage(targetPageId, command)),
  ];
}

import type { FramePage } from './app-frame-page-contract.js';
import type { CreateFramedAppOptions } from './app-frame-options.js';

export interface FramePageRegistry<PageModel, Msg> {
  readonly pagesById: Map<string, FramePage<PageModel, Msg>>;
  readonly pageOrder: string[];
  readonly defaultPageId: string;
}

export function createFramePageRegistry<PageModel, Msg>(
  options: CreateFramedAppOptions<PageModel, Msg>,
): FramePageRegistry<PageModel, Msg> {
  if (options.pages.length === 0) {
    throw new Error('createFramedApp: "pages" must contain at least one page');
  }
  const pagesById = new Map<string, FramePage<PageModel, Msg>>();
  for (const page of options.pages) {
    if (pagesById.has(page.id)) {
      throw new Error(`createFramedApp: duplicate page id "${page.id}"`);
    }
    pagesById.set(page.id, page);
  }
  const pageOrder = options.pages.map((page) => page.id);
  const defaultPageId = options.defaultPageId ?? pageOrder.at(0);
  if (defaultPageId === undefined || !pagesById.has(defaultPageId)) {
    throw new Error(
      `createFramedApp: defaultPageId "${String(defaultPageId)}" not found in pages`,
    );
  }
  return { pagesById, pageOrder, defaultPageId };
}

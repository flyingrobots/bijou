import {
  createKeyMap,
  createSplitPaneState,
  type FramePage,
} from '@flyingrobots/bijou-tui';

export type Msg =
  | { type: 'inc' }
  | { type: 'toggle-inspector' };

export interface PageModel {
  count: number;
  inspector: boolean;
  editorSplit: ReturnType<typeof createSplitPaneState>;
}

function createInitialPageModel(): PageModel {
  return {
    count: 0,
    inspector: false,
    editorSplit: createSplitPaneState({ ratio: 0.38 }),
  };
}

function updatePageModel(msg: Msg, model: PageModel): [PageModel, []] {
  if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
  return [{ ...model, inspector: !model.inspector }, []];
}

function createPageKeyMap() {
  return createKeyMap<Msg>().bind('x', 'Increment counter', { type: 'inc' });
}

export function createPage(
  id: string,
  title: string,
  layout: FramePage<PageModel, Msg>['layout'],
): FramePage<PageModel, Msg> {
  return {
    id,
    title,
    init: () => [createInitialPageModel(), []],
    update: updatePageModel,
    keyMap: createPageKeyMap(),
    layout,
  };
}

export const globalKeys = createKeyMap<Msg>()
  .bind('o', 'Toggle inspector drawer', { type: 'toggle-inspector' });

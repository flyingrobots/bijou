import {
  makeLongContent,
  textView,
  type FramePage,
} from './app-frame.test-support.js';
import { createSplitPaneState } from './split-pane.js';

export interface Counts {
  layout: number;
  focused: number;
  side: number;
}

interface CacheMsg { readonly type: 'inc' }
interface CacheModel { readonly count: number }

export function countingFixture() {
  const counts: Counts = { layout: 0, focused: 0, side: 0 };
  const home: FramePage<CacheModel, CacheMsg> = {
    id: 'home',
    title: 'Home',
    init: () => [{ count: 0 }, []],
    update: (_msg, model) => [{ count: model.count + 1 }, []],
    layout: () => {
      counts.layout += 1;
      return {
        kind: 'split',
        splitId: 'root',
        state: createSplitPaneState({ ratio: 0.5 }),
        paneA: {
          kind: 'pane',
          paneId: 'main',
          render: () => {
            counts.focused += 1;
            return textView(makeLongContent('main', 200));
          },
        },
        paneB: {
          kind: 'pane',
          paneId: 'side',
          render: () => {
            counts.side += 1;
            return textView(makeLongContent('side', 200));
          },
        },
      };
    },
  };
  const other: FramePage<CacheModel, CacheMsg> = {
    id: 'other',
    title: 'Other',
    init: () => [{ count: 0 }, []],
    update: (_msg, model) => [model, []],
    layout: () => ({
      kind: 'pane',
      paneId: 'main',
      render: () => textView(makeLongContent('other', 200)),
    }),
  };
  return { counts, pages: [home, other] };
}

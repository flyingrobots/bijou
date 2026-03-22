import { initDefaultContext } from '@flyingrobots/bijou-node';
import { boxSurface, kbd } from '@flyingrobots/bijou';
import {
  run,
  quit,
  isKeyMsg,
  isResizeMsg,
  type App,
  createSplitPaneState,
  splitPaneSurface,
  splitPaneFocusNext,
  splitPaneResizeBy,
} from '@flyingrobots/bijou-tui';
import { column, row } from '../_shared/example-surfaces.ts';

initDefaultContext();

interface Model {
  cols: number;
  rows: number;
  split: ReturnType<typeof createSplitPaneState>;
}

type Msg = never;
const MIN_PANE_SIZE = 16;

const app: App<Model, Msg> = {
  init: () => [{
    cols: process.stdout.columns ?? 80,
    rows: process.stdout.rows ?? 24,
    split: createSplitPaneState({ ratio: 0.35, focused: 'a' }),
  }, []],

  update(msg, model) {
    if (isResizeMsg(msg)) {
      return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
    }

    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
      if (msg.key === 'tab') return [{ ...model, split: splitPaneFocusNext(model.split) }, []];
      // Divider-centric semantics: h moves divider left, l moves divider right.
      if (msg.key === 'h') {
        return [{
          ...model,
          split: splitPaneResizeBy(model.split, -2, {
            total: model.cols,
            minA: MIN_PANE_SIZE,
            minB: MIN_PANE_SIZE,
          }),
        }, []];
      }
      if (msg.key === 'l') {
        return [{
          ...model,
          split: splitPaneResizeBy(model.split, 2, {
            total: model.cols,
            minA: MIN_PANE_SIZE,
            minB: MIN_PANE_SIZE,
          }),
        }, []];
      }
    }

    return [model, []];
  },

  view(model) {
    const bodyHeight = Math.max(0, model.rows - 1);
    const leftFocused = model.split.focused === 'a';

    const body = splitPaneSurface(model.split, {
      direction: 'row',
      width: model.cols,
      height: bodyHeight,
      minA: MIN_PANE_SIZE,
      minB: MIN_PANE_SIZE,
      paneA: (w, h) => boxSurface(`\n Project Tree\n\n ${leftFocused ? '●' : '○'} src\n ${leftFocused ? '●' : '○'} test\n\n ${w}x${h}`, {
        width: w,
      }),
      paneB: (w, h) => boxSurface(`\n Editor\n\n function hello() {\n   return 'bijou';\n }\n\n ${w}x${h}`, {
        width: w,
      }),
    });

    const help = row([' ', kbd('tab'), ' focus  ', kbd('h'), '/', kbd('l'), ' resize  ', kbd('q'), ' quit']);
    return column([body, help]);
  },
};

run(app);

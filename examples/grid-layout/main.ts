import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, kbd } from '@flyingrobots/bijou';
import {
  run,
  quit,
  isKeyMsg,
  isResizeMsg,
  type App,
  grid,
} from '@flyingrobots/bijou-tui';
import { legacyApp } from '../_shared/v3.ts';

const ctx = initDefaultContext();

interface Model {
  cols: number;
  rows: number;
}

type Msg = never;

const app: App<Model, Msg> = {
  init: () => [{
    cols: process.stdout.columns ?? 80,
    rows: process.stdout.rows ?? 24,
  }, []],

  update(msg, model) {
    if (isResizeMsg(msg)) {
      return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
    }

    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
    }

    return [model, []];
  },

  view(model) {
    const bodyHeight = Math.max(0, model.rows - 1);
    const layout = grid({
      width: model.cols,
      height: bodyHeight,
      columns: [22, '1fr'],
      rows: [3, '1fr', 6],
      areas: [
        'header header',
        'nav main',
        'logs main',
      ],
      gap: 1,
      cells: {
        header: (w) => box('Grid layout primitive (fixed + fr tracks)', { width: w }),
        nav: (w, h) => box(`Navigation\n\n- Inbox\n- Build\n- Deploy\n\n${w}x${h}`, { width: w }),
        logs: (w, h) => box(`Logs\n\n[ok] build passed\n[ok] tests passed\n\n${w}x${h}`, { width: w }),
        main: (w, h) => box(`Main View\n\nUse this as a page body in appFrame()\n\n${w}x${h}`, { width: w }),
      },
    });

    return `${layout}\n ${kbd('q')} quit`;
  },
};

run(legacyApp(ctx, app));

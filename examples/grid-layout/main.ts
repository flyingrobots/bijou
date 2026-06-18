import { initDefaultContext } from '@flyingrobots/bijou-node';
import { boxSurface, kbd } from '@flyingrobots/bijou';
import {
  run,
  quit,
  isKeyMsg,
  isResizeMsg,
  type App,
  gridSurface,
} from '@flyingrobots/bijou-tui';
import { column, row } from '../_shared/example-surfaces.ts';

initDefaultContext();

interface Model {
  cols: number;
  rows: number;
}

const app: App<Model> = {
  init: () => [{
    cols: process.stdout.columns,
    rows: process.stdout.rows,
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
    const layout = gridSurface({
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
        header: (w) => boxSurface('Grid layout primitive (fixed + fr tracks)', { width: w }),
        nav: (w, h) => boxSurface(`Navigation\n\n- Inbox\n- Build\n- Deploy\n\n${String(w)}x${String(h)}`, { width: w }),
        logs: (w, h) => boxSurface(`Logs\n\n[ok] build passed\n[ok] tests passed\n\n${String(w)}x${String(h)}`, { width: w }),
        main: (w, h) => boxSurface(`Main View\n\nUse this as a page body in appFrame()\n\n${String(w)}x${String(h)}`, { width: w }),
      },
    });

    return column([layout, row([' ', kbd('q'), ' quit'])]);
  },
};

void run(app);

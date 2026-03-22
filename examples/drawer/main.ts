import { initDefaultContext } from '@flyingrobots/bijou-node';
import { separator } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg, type ResizeMsg,
  compositeSurface, drawer,
} from '@flyingrobots/bijou-tui';
import { badgeSurface, column, contentSurface, line, row, screenSurface, spacer } from '../_shared/example-surfaces.ts';

const ctx = initDefaultContext();

type Msg = KeyMsg | ResizeMsg;

interface Model {
  showDrawer: boolean;
  cols: number;
  rows: number;
}

const app: App<Model, Msg> = {
  init: () => {
    const cols = ctx.runtime.columns;
    const rows = ctx.runtime.rows;
    return [{ showDrawer: false, cols, rows }, []];
  },

  update: (msg, model) => {
    if (msg.type === 'resize') {
      return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
    }
    if (msg.type === 'key') {
      if (msg.key === 'q') return [model, [quit()]];
      if (msg.key === 'd') return [{ ...model, showDrawer: !model.showDrawer }, []];
    }
    return [model, []];
  },

  view: (model) => {
    const { cols, rows } = model;

    const header = separator({ label: 'drawer demo', width: cols, ctx });
    const background = screenSurface(cols, rows, column([
      contentSurface(header),
      spacer(),
      row(['  Press ', badgeSurface('d', 'info', ctx), ' to toggle drawer · ', badgeSurface('q', 'warning', ctx), ' to quit']),
    ]));

    if (!model.showDrawer) return background;

    const drawerWidth = Math.min(40, Math.floor(cols / 3));
    const drawerContent = column([
      line('Details Panel'),
      spacer(),
      line('Name:    bijou'),
      line('Version: 4.0.0'),
      line('Status:  active'),
      spacer(),
      line('Press d to close'),
    ]);

    const d = drawer({
      content: drawerContent,
      width: drawerWidth,
      screenWidth: cols,
      screenHeight: rows,
      title: 'Info',
      borderToken: ctx.border('primary'),
      ctx,
    });

    return compositeSurface(background, [d], { dim: true });
  },
};

run(app);

import { initDefaultContext } from '@flyingrobots/bijou-node';
import { separator, badge } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg, type ResizeMsg,
  vstack, composite, drawer,
} from '@flyingrobots/bijou-tui';

const ctx = initDefaultContext();

type Msg = KeyMsg | ResizeMsg;

interface Model {
  showDrawer: boolean;
  cols: number;
  rows: number;
}

const app: App<Model, Msg> = {
  init: () => {
    const cols = ctx.runtime.columns();
    const rows = ctx.runtime.rows();
    return [{ showDrawer: false, cols, rows }, []];
  },

  update: (msg, model) => {
    if (msg.type === 'resize') {
      return [{ ...model, cols: msg.cols, rows: msg.rows }, []];
    }
    if (msg.type === 'key') {
      if (msg.key === 'q') return [model, [quit()]];
      if (msg.key === 'd') return [{ ...model, showDrawer: !model.showDrawer }, []];
    }
    return [model, []];
  },

  view: (model) => {
    const { cols, rows } = model;

    // Build background
    const header = separator({ label: 'drawer demo', width: cols, ctx });
    const help = `  Press ${badge('d', { ctx })} to toggle drawer · ${badge('q', { ctx })} to quit`;
    const bgLines = [header, '', help];
    // Fill to full screen
    while (bgLines.length < rows) bgLines.push('');
    const bg = bgLines.join('\n');

    if (!model.showDrawer) return bg;

    // Overlay the drawer
    const drawerWidth = Math.min(40, Math.floor(cols / 3));
    const drawerContent = vstack(
      'Details Panel',
      '',
      'Name:    bijou',
      'Version: 0.7.0',
      'Status:  active',
      '',
      'Press d to close',
    );

    const d = drawer({
      content: drawerContent,
      width: drawerWidth,
      screenWidth: cols,
      screenHeight: rows,
      title: 'Info',
      borderToken: ctx.theme.theme.border.primary,
      ctx,
    });

    return composite(bg, [d], { dim: true });
  },
};

run(app);

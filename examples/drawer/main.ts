import { initDefaultContext } from '@flyingrobots/bijou-node';
import { separator, badge, surfaceToString } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg, type ResizeMsg,
  vstack, composite, drawer,
} from '@flyingrobots/bijou-tui';
import { ansiSurface } from '../_shared/v3.ts';

const ctx = initDefaultContext();
const badgeText = (label: string, variant: Parameters<typeof badge>[1]['variant'] = 'info') =>
  surfaceToString(badge(label, { variant, ctx }), ctx.style);

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

    // Build background
    const header = separator({ label: 'drawer demo', width: cols, ctx });
    const help = `  Press ${badgeText('d')} to toggle drawer · ${badgeText('q')} to quit`;
    const bgLines = [header, '', help];
    // Fill to full screen
    while (bgLines.length < rows) bgLines.push('');
    const bg = bgLines.join('\n');

    if (!model.showDrawer) return ansiSurface(bg, cols, rows);

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
      borderToken: ctx.border('primary'),
      ctx,
    });

    return ansiSurface(composite(bg, [d], { dim: true }), cols, rows);
  },
};

run(app);

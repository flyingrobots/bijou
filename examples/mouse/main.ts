import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, badge, kbd } from '@flyingrobots/bijou';
import {
  run, quit, isKeyMsg, isMouseMsg,
  type App, type MouseMsg,
} from '@flyingrobots/bijou-tui';

initDefaultContext();

interface Model {
  events: MouseMsg[];
  lastClick: { col: number; row: number } | null;
}

type Msg = { type: 'quit' };

const MAX_EVENTS = 10;

const app: App<Model, Msg> = {
  init: () => [{ events: [], lastClick: null }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if ((msg.ctrl && msg.key === 'c') || msg.key === 'q') {
        return [model, [quit()]];
      }
      return [model, []];
    }
    if (isMouseMsg(msg)) {
      const events = [...model.events, msg].slice(-MAX_EVENTS);
      const lastClick = msg.action === 'press' ? { col: msg.col, row: msg.row } : model.lastClick;
      return [{ events, lastClick }, []];
    }
    return [model, []];
  },

  view: (model) => {
    const lines: string[] = [
      '',
      '  Mouse Event Inspector',
      '',
    ];

    if (model.events.length === 0) {
      lines.push('  Click or scroll anywhere...');
    } else {
      for (const e of model.events) {
        const mods: string[] = [];
        if (e.ctrl) mods.push(badge('CTRL', { variant: 'warning' }));
        if (e.alt) mods.push(badge('ALT', { variant: 'info' }));
        if (e.shift) mods.push(badge('SHIFT', { variant: 'accent' }));
        const modStr = mods.length > 0 ? mods.join(' ') + ' ' : '';
        lines.push(`  ${modStr}${e.action} ${e.button} (${e.col}, ${e.row})`);
      }
    }

    if (model.lastClick) {
      lines.push('');
      lines.push(box(`Last click: (${model.lastClick.col}, ${model.lastClick.row})`));
    }

    lines.push('');
    lines.push(`  ${kbd('q')} to quit`);
    lines.push('');

    return lines.join('\n');
  },
};

run(app, { mouse: true });

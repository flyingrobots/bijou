import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, kbd } from '@flyingrobots/bijou';
import {
  run, quit, isKeyMsg, isMouseMsg,
  type App, type MouseMsg,
} from '@flyingrobots/bijou-tui';
import { badgeSurface, column, contentSurface, line, row, spacer } from '../_shared/example-surfaces.ts';

const ctx = initDefaultContext();

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
    const rows = [
      spacer(),
      line('  Mouse Event Inspector'),
      spacer(),
    ];

    if (model.events.length === 0) {
      rows.push(line('  Click or scroll anywhere...'));
    } else {
      for (const e of model.events) {
        const parts: (string | ReturnType<typeof badgeSurface>)[] = ['  '];
        if (e.ctrl) parts.push(badgeSurface('CTRL', 'warning', ctx), ' ');
        if (e.alt) parts.push(badgeSurface('ALT', 'info', ctx), ' ');
        if (e.shift) parts.push(badgeSurface('SHIFT', 'accent', ctx), ' ');
        parts.push(`${e.action} ${e.button} (${e.col}, ${e.row})`);
        rows.push(row(parts));
      }
    }

    if (model.lastClick) {
      rows.push(spacer());
      rows.push(contentSurface(box(`Last click: (${model.lastClick.col}, ${model.lastClick.row})`)));
    }

    rows.push(spacer());
    rows.push(line(`  ${kbd('q')} to quit`));
    rows.push(spacer());

    return column(rows);
  },
};

run(app, { mouse: true });

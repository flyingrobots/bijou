import { initDefaultContext } from '@flyingrobots/bijou-node';
import { kbd } from '@flyingrobots/bijou';
import {
  run, quit, isKeyMsg, isResizeMsg, type App,
  flexSurface, viewportSurface, createScrollState, scrollBy, pageDown, pageUp,
} from '@flyingrobots/bijou-tui';
import { LEFT_CONTENT, RIGHT_CONTENT } from './content.js';
initDefaultContext();

interface Model {
  leftScroll: ReturnType<typeof createScrollState>;
  rightScroll: ReturnType<typeof createScrollState>;
  focusLeft: boolean;
  cols: number;
  rows: number;
}

interface Msg { type: 'quit' }

const VP_HEIGHT = 18;

const app: App<Model, Msg> = {
  init: () => [{
    leftScroll: createScrollState(LEFT_CONTENT, VP_HEIGHT),
    rightScroll: createScrollState(RIGHT_CONTENT, VP_HEIGHT),
    focusLeft: true,
    cols: process.stdout.columns,
    rows: process.stdout.rows,
  }, []],

  update: (msg, model) => {
    if (isResizeMsg(msg)) {
      return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
    }
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];

      if (msg.key === 'tab') {
        return [{ ...model, focusLeft: !model.focusLeft }, []];
      }

      const scrollKey = model.focusLeft ? 'leftScroll' : 'rightScroll';
      let scroll = model[scrollKey];

      if (msg.key === 'j' || msg.key === 'down') scroll = scrollBy(scroll, 1);
      else if (msg.key === 'k' || msg.key === 'up') scroll = scrollBy(scroll, -1);
      else if (msg.key === 'd') scroll = pageDown(scroll);
      else if (msg.key === 'u') scroll = pageUp(scroll);

      return [{ ...model, [scrollKey]: scroll }, []];
    }
    return [model, []];
  },

  view: (model) => {
    const leftLabel = model.focusLeft ? '[app.ts]' : 'app.ts';
    const rightLabel = !model.focusLeft ? '[app.test.ts]' : 'app.test.ts';
    return flexSurface(
      { direction: 'column', width: model.cols, height: model.rows },
      {
        basis: 1,
        content: (w) =>
          flexSurface(
            { direction: 'row', width: w, height: 1, gap: 1 },
            { flex: 1, content: `  ${leftLabel}` },
            { basis: 1, content: '│' },
            { flex: 1, content: `  ${rightLabel}` },
          ),
      },
      {
        flex: 1,
        content: (w, h) =>
          flexSurface(
          { direction: 'row', width: w, height: h, gap: 1 },
          {
            flex: 1,
            content: (pw, ph) =>
              viewportSurface({ width: pw, height: ph, content: LEFT_CONTENT, scrollY: model.leftScroll.y, showScrollbar: true }),
          },
          { basis: 1, content: (_, ph) => '\u2502\n'.repeat(ph).trimEnd() },
          {
            flex: 1,
            content: (pw, ph) =>
              viewportSurface({ width: pw, height: ph, content: RIGHT_CONTENT, scrollY: model.rightScroll.y, showScrollbar: true }),
          },
          ),
      },
      { basis: 1, content: `  ${kbd('Tab')} switch pane  ${kbd('j')}${kbd('k')} scroll  ${kbd('q')} quit` },
    );
  },
};
void run(app);

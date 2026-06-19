import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, kbd } from '@flyingrobots/bijou';
import { run, quit, isKeyMsg, isResizeMsg, type App } from '@flyingrobots/bijou-tui';
import { ansiSurface } from '../_shared/example-surfaces.ts';

initDefaultContext();

interface Model {
  cols: number;
  rows: number;
}

interface Msg { type: 'quit' }

function terminalSize(): Model {
  return {
    cols: Number.isFinite(process.stdout.columns) ? process.stdout.columns : 80,
    rows: Number.isFinite(process.stdout.rows) ? process.stdout.rows : 24,
  };
}

const app: App<Model, Msg> = {
  init: () => [terminalSize(), []],

  update: (msg, model) => {
    if (isResizeMsg(msg)) {
      return [{ cols: msg.columns, rows: msg.rows }, []];
    }
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || msg.key === 'enter' || (msg.ctrl && msg.key === 'c')) {
        return [model, [quit()]];
      }
    }
    return [model, []];
  },

  view: (model) => {
    const content = [
      'You are in the alternate screen.',
      '',
      `Terminal: ${String(model.cols)}×${String(model.rows)}`,
      '',
      `Press ${kbd('q')} or ${kbd('Enter')} to return.`,
    ].join('\n');

    const boxed = box(content, { padding: { top: 1, bottom: 1, left: 3, right: 3 } });
    const boxLines = boxed.split('\n');
    const padTop = Math.max(0, Math.floor((model.rows - boxLines.length) / 2));
    const padLeft = Math.max(0, Math.floor((model.cols - 44) / 2));
    const indent = ' '.repeat(padLeft);

    return ansiSurface('\n'.repeat(padTop) + boxLines.map(l => indent + l).join('\n'), model.cols, model.rows);
  },
};

void run(app);

import { initDefaultContext } from '@flyingrobots/bijou-node';
import { progressBar, type Surface } from '@flyingrobots/bijou';
import { run, quit, tick, isKeyMsg, type App } from '@flyingrobots/bijou-tui';
import { badgeSurface, column, line, row, spacer } from '../_shared/example-surfaces.ts';

const ctx = initDefaultContext();

interface Model {
  percent: number;
  done: boolean;
}

type Msg = { type: 'tick' } | { type: 'quit' };

const app: App<Model, Msg> = {
  init: () => [
    { percent: 0, done: false },
    [tick(50, { type: 'tick' })],
  ],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) {
        return [model, [quit()]];
      }
    }

    if ('type' in msg && msg.type === 'tick') {
      const next = Math.min(model.percent + 1, 100);
      if (next >= 100) {
        return [{ percent: 100, done: true }, [tick(1500, { type: 'quit' })]];
      }
      return [{ percent: next, done: false }, [tick(50, { type: 'tick' })]];
    }

    return [model, []];
  },

  view: (model) => {
    const rows = [spacer(), line('  Building project...'), spacer()] as Surface[];

    if (model.done) {
      rows.push(line(`  ${progressBar(100, { width: 50, showPercent: true })}`));
      rows.push(spacer());
      rows.push(row(['  ', badgeSurface('COMPLETE', 'success', ctx), '  Build finished.']));
    } else {
      rows.push(line(`  ${progressBar(model.percent, { width: 50, showPercent: true })}`));
    }

    rows.push(spacer());
    return column(rows);
  },
};

run(app);

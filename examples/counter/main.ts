import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, kbd } from '@flyingrobots/bijou';
import { run, quit, type App, type KeyMsg } from '@flyingrobots/bijou-tui';

initDefaultContext();

interface Model {
  count: number;
}

type Msg = { type: 'increment' } | { type: 'decrement' } | { type: 'quit' };

const app: App<Model, Msg> = {
  init: () => [{ count: 0 }, []],

  update: (msg, model) => {
    if ('type' in msg && msg.type === 'key') {
      const key = (msg as KeyMsg).key;
      if (key === 'k' || key === '+' || key === 'up') return [{ count: model.count + 1 }, []];
      if (key === 'j' || key === '-' || key === 'down') return [{ count: model.count - 1 }, []];
      if (key === 'q') return [model, [quit()]];
      if ((msg as KeyMsg).ctrl && key === 'c') return [model, [quit()]];
    }
    return [model, []];
  },

  view: (model) => {
    const lines = [
      '',
      box(`  Count: ${model.count}  `),
      '',
      `  ${kbd('↑')} ${kbd('k')} ${kbd('+')}  increment`,
      `  ${kbd('↓')} ${kbd('j')} ${kbd('-')}  decrement`,
      `  ${kbd('q')}          quit`,
      '',
    ];
    return lines.join('\n');
  },
};

run(app);

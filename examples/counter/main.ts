import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, kbd } from '@flyingrobots/bijou';
import { run, quit, isKeyMsg, type App } from '@flyingrobots/bijou-tui';

initDefaultContext();

interface Model {
  count: number;
}

type Msg = { type: 'increment' } | { type: 'decrement' } | { type: 'quit' };

const app: App<Model, Msg> = {
  init: () => [{ count: 0 }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'k' || msg.key === '+' || msg.key === 'up') return [{ count: model.count + 1 }, []];
      if (msg.key === 'j' || msg.key === '-' || msg.key === 'down') return [{ count: model.count - 1 }, []];
      if (msg.key === 'q') return [model, [quit()]];
      if (msg.ctrl && msg.key === 'c') return [model, [quit()]];
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

import { initDefaultContext } from '@flyingrobots/bijou-node';
import { badge, createSurface, type Surface } from '@flyingrobots/bijou';
import { run, quit, isKeyMsg, type App, vstackV3, hstackV3 } from '@flyingrobots/bijou-tui';

initDefaultContext();

interface Model {
  count: number;
}

type Msg = { type: 'inc' } | { type: 'quit' };

const app: App<Model, Msg> = {
  init: () => [{ count: 0 }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
      if (msg.key === ' ') return [{ ...model, count: model.count + 1 }, []];
    }
    return [model, []];
  },

  view: (model) => {
    const header = badge('BIJOU V3', { variant: 'primary' });
    const counter = badge(`Count: ${model.count}`, { variant: 'accent' });
    const instruction = stringToSurface('Press SPACE to increment, Q to quit', 40, 1);

    const content = vstackV3(
      header,
      createSurface(1, 1), // Spacer
      counter,
      createSurface(1, 1), // Spacer
      instruction
    );

    // Center the content on a full-screen surface
    const full = createSurface(process.stdout.columns, process.stdout.rows);
    full.blit(content, Math.floor((full.width - content.width) / 2), Math.floor((full.height - content.height) / 2));
    
    return full;
  },
};

// stringToSurface is needed for the instruction
import { stringToSurface } from '@flyingrobots/bijou';

run(app);

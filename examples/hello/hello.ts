import { startApp } from '@flyingrobots/bijou-node';
import { isKeyMsg, quit, type App } from '@flyingrobots/bijou-tui';

interface Model {
  readonly text: string;
}

const app: App<Model, never> = {
  init: () => [{ text: 'Hello, Bijou!' }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg) && msg.key === 'q') {
      return [model, [quit()]];
    }
    return [model, []];
  },

  view: (model) => `${model.text}\n\nPress q to exit.`,
};

await startApp(app);

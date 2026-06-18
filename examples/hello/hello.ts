import { startApp } from '@flyingrobots/bijou-node';
import { isKeyMsg, quit, type App } from '@flyingrobots/bijou-tui';
import { ansiSurface } from '../_shared/example-surfaces.ts';

interface Model {
  readonly text: string;
}

const app: App<Model> = {
  init: () => [{ text: 'Hello, Bijou!' }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg) && msg.key === 'q') {
      return [model, [quit()]];
    }
    return [model, []];
  },

  view: (model) => {
    const lines = [model.text, '', 'Press q to exit.'];
    return ansiSurface(lines.join('\n'), Math.max(24, ...lines.map((line) => line.length)), lines.length);
  },
};

await startApp(app);

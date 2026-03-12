import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run, quit, tick, isKeyMsg, canvas, type App, type ShaderFn } from '@flyingrobots/bijou-tui';
import { stringToSurface } from '@flyingrobots/bijou';
import { vstackV3 } from '@flyingrobots/bijou-tui';

initDefaultContext();

interface Model {
  time: number;
  cols: number;
  rows: number;
}

type Msg = { type: 'tick' } | { type: 'quit' };

const CHARS = ' .:-=+*#%@';

const shader: ShaderFn = ({ u, v, time }) => {
  const dx = u - 0.5;
  const dy = (v - 0.5) * 2; // aspect ratio correction
  const dist = Math.sqrt(dx * dx + dy * dy);
  const wave = Math.sin(dist * 10 - time * 3) * 0.5 + 0.5;
  const idx = Math.floor(wave * (CHARS.length - 1));
  return CHARS[idx]!;
};

const app: App<Model, Msg> = {
  init: () => [
    { time: 0, cols: 60, rows: 20 },
    [tick(16)],
  ],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if ((msg.ctrl && msg.key === 'c') || msg.key === 'q') {
        return [model, [quit()]];
      }
      return [model, []];
    }
    if (msg && typeof msg === 'object' && 'type' in msg && msg.type === 'tick') {
      return [{ ...model, time: model.time + 0.016 }, [tick(16)]];
    }
    return [model, []];
  },

  view: (model) => {
    const art = canvas(model.cols, model.rows, shader, { time: model.time });
    const title = stringToSurface('  Plasma Shader  (q to quit)', model.cols, 3);
    return vstackV3(title, art);
  },
};

run(app);

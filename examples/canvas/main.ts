import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run, quit, tick, isKeyMsg, canvas, type App, type ShaderFn } from '@flyingrobots/bijou-tui';

initDefaultContext();

interface Model {
  time: number;
  cols: number;
  rows: number;
}

type Msg = { type: 'tick' } | { type: 'quit' };

const CHARS = ' .:-=+*#%@';

const shader: ShaderFn = (x, y, cols, rows, time) => {
  const cx = cols / 2;
  const cy = rows / 2;
  const dx = x - cx;
  const dy = (y - cy) * 2; // aspect ratio correction
  const dist = Math.sqrt(dx * dx + dy * dy);
  const wave = Math.sin(dist * 0.5 - time * 3) * 0.5 + 0.5;
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
    if ('type' in msg && (msg as Msg).type === 'tick') {
      return [{ ...model, time: model.time + 0.016 }, [tick(16)]];
    }
    return [model, []];
  },

  view: (model) => {
    const art = canvas(model.cols, model.rows, shader, { time: model.time });
    return `\n  Plasma Shader  (q to quit)\n\n${art}\n`;
  },
};

run(app);

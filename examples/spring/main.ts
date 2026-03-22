import { initDefaultContext } from '@flyingrobots/bijou-node';
import { kbd, type Surface } from '@flyingrobots/bijou';
import {
  run, quit, isKeyMsg, type App,
  animate, SPRING_PRESETS,
} from '@flyingrobots/bijou-tui';
import { badgeSurface, column, line, row, spacer } from '../_shared/example-surfaces.ts';

const ctx = initDefaultContext();

const PRESETS = ['gentle', 'default', 'wobbly', 'stiff'] as const;
const WIDTH = 50;

interface Model {
  positions: Record<string, number>;
  running: boolean;
}

type Msg =
  | { type: 'frame'; preset: string; value: number }
  | { type: 'done' }
  | { type: 'go' }
  | { type: 'quit' };

function launchAll(from: number, to: number): ReturnType<typeof animate>[] {
  return PRESETS.map(preset =>
    animate({
      from,
      to,
      spring: preset,
      fps: 60,
      onFrame: (value: number) => ({ type: 'frame' as const, preset, value }),
      onComplete: () => ({ type: 'done' as const }),
    })
  );
}

const app: App<Model, Msg> = {
  init: () => {
    const positions: Record<string, number> = {};
    for (const p of PRESETS) positions[p] = 0;
    return [{ positions, running: true }, launchAll(0, WIDTH)];
  },

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
      if (msg.key === 'space' && !model.running) {
        // Toggle direction
        const current = model.positions[PRESETS[0]] ?? 0;
        const target = current > WIDTH / 2 ? 0 : WIDTH;
        return [{ ...model, running: true }, launchAll(current, target)];
      }
    }

    if ('type' in msg && msg.type === 'frame') {
      return [{ ...model, positions: { ...model.positions, [msg.preset]: msg.value } }, []];
    }

    if ('type' in msg && msg.type === 'done') {
      return [{ ...model, running: false }, []];
    }

    return [model, []];
  },

  view: (model) => {
    const rows = [spacer(), line('  Spring Physics Comparison'), spacer()] as Surface[];

    for (const preset of PRESETS) {
      const pos = Math.round(model.positions[preset] ?? 0);
      const bar = ' '.repeat(Math.max(0, pos)) + '\u2588';
      const label = preset.padEnd(9);
      rows.push(row(['  ', badgeSurface(label, 'primary', ctx), ` ${bar}`]));
    }

    rows.push(spacer());
    if (model.running) {
      rows.push(line('  animating...'));
    } else {
      rows.push(line(`  ${kbd('Space')} bounce  ${kbd('q')} quit`));
    }
    rows.push(spacer());

    return column(rows);
  },
};

run(app);

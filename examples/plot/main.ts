import { initDefaultContext } from '@flyingrobots/bijou-node';
import { surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  isKeyMsg,
  isResizeMsg,
  quit,
  run,
  tick,
  type App,
} from '@flyingrobots/bijou-tui';
import { renderDashboardSurface, type VizModel } from './plot-scene.js';

interface Msg {
  readonly type: 'tick';
}

const FRAME_MS = 40;
const stdout: { columns?: number; rows?: number; isTTY?: boolean } = process.stdout;
const onceMode = process.argv.includes('--once') || !stdout.isTTY;

if (onceMode) {
  const ctx = createTestContext({ mode: 'interactive' });
  const surface = renderDashboardSurface(
    {
      frame: 12,
      paused: false,
      cursorIdx: 24,
      yMax: 100,
      preset: 1,
      cols: stdout.columns ?? 96,
      rows: stdout.rows ?? 24,
    },
    ctx,
  );
  console.log(surfaceToString(surface, ctx.style));
} else {
  const ctx = initDefaultContext();
  const app: App<VizModel, Msg> = {
    init: () => [
      {
        frame: 0,
        paused: false,
        cursorIdx: 24,
        yMax: 100,
        preset: 1,
        cols: stdout.columns ?? 96,
        rows: stdout.rows ?? 24,
      },
      [tick(FRAME_MS, { type: 'tick' })],
    ],
    update: (msg, model) => {
      if (isKeyMsg(msg)) {
        if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) {
          return [model, [quit()]];
        }
        if (msg.key === ' ' || msg.key === 'space') {
          const paused = !model.paused;
          return [{ ...model, paused }, paused ? [] : [tick(FRAME_MS, { type: 'tick' })]];
        }
        if (msg.key === 'left' || msg.key === 'h') {
          return [{ ...model, cursorIdx: Math.max(0, model.cursorIdx - 1) }, []];
        }
        if (msg.key === 'right' || msg.key === 'l') {
          return [{ ...model, cursorIdx: Math.min(47, model.cursorIdx + 1) }, []];
        }
        if (msg.key === '+' || msg.key === '=') {
          return [{ ...model, yMax: Math.max(40, model.yMax - 20) }, []];
        }
        if (msg.key === '-' || msg.key === '_') {
          return [{ ...model, yMax: Math.min(200, model.yMax + 20) }, []];
        }
        if (msg.key === '1' || msg.key === '2' || msg.key === '3') {
          return [{ ...model, preset: Number(msg.key) }, []];
        }
        return [model, []];
      }
      if (isResizeMsg(msg)) {
        return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
      }
      if (model.paused) return [model, []];
      return [
        { ...model, frame: model.frame + 1 },
        [tick(FRAME_MS, { type: 'tick' })],
      ];
    },
    view: (model) => renderDashboardSurface(model, ctx),
  };

  await run(app);
}

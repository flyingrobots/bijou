import { initDefaultContext } from '@flyingrobots/bijou-node';
import {
  isKeyMsg,
  isMouseMsg,
  isResizeMsg,
  quit,
  run,
  tick,
  type App,
} from '@flyingrobots/bijou-tui';
import {
  CAPPED_MS,
  MODE_COUNT,
  UNCAPPED_MS,
  phaseTiming,
  type Model,
  type Msg,
} from './perf-model.js';
import { sampleMemStats } from './perf-memory.js';
import { pushViewTime } from './perf-chart.js';
import { renderFrame } from './perf-render.js';

initDefaultContext();
const output: { columns?: number; rows?: number } = process.stdout;

const app: App<Model, Msg> = {
  init: () => [{
    frame: 0,
    elapsed: 0,
    fps: 0,
    fpsAccum: 0,
    fpsSamples: 0,
    cols: output.columns ?? 80,
    rows: output.rows ?? 24,
    mouseDown: false,
    mode: 0,
    capped: true,
    tickGen: 0,
    lastTickMs: performance.now(),
    frameTimeMs: 0,
    mem: sampleMemStats(),
    memSampleFrame: 0,
  }, [tick(CAPPED_MS, { type: 'tick', gen: 0 })]],
  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) {
        return [model, [quit()]];
      }
      const modeKey = Number.parseInt(msg.key, 10);
      if (modeKey >= 1 && modeKey <= MODE_COUNT) {
        return [{ ...model, mode: modeKey - 1 }, []];
      }
      if (msg.key === ' ' || msg.key === 'space') {
        const capped = !model.capped;
        const tickGen = model.tickGen + 1;
        return [{ ...model, capped, tickGen }, [
          tick(capped ? CAPPED_MS : UNCAPPED_MS, {
            type: 'tick',
            gen: tickGen,
          }),
        ]];
      }
      return [model, []];
    }
    if (isResizeMsg(msg)) {
      return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
    }
    if (isMouseMsg(msg)) {
      const mouseDown = msg.action === 'press'
        ? true
        : msg.action === 'release' ? false : model.mouseDown;
      return [{ ...model, mouseDown }, []];
    }
    if (msg.type !== 'tick' || msg.gen !== model.tickGen) return [model, []];
    const updateStart = performance.now();
    const frameTimeMs = updateStart - model.lastTickMs;
    pushViewTime(phaseTiming.viewMs);
    const fpsAccum = model.fpsAccum + frameTimeMs / 1000;
    const fpsSamples = model.fpsSamples + 1;
    const sampled = fpsAccum >= 0.5;
    const mem = model.frame - model.memSampleFrame >= 30
      ? sampleMemStats()
      : model.mem;
    phaseTiming.updateMs = performance.now() - updateStart;
    return [{
      ...model,
      frame: model.frame + 1,
      elapsed: model.elapsed + frameTimeMs,
      fps: sampled ? fpsSamples / fpsAccum : model.fps,
      fpsAccum: sampled ? 0 : fpsAccum,
      fpsSamples: sampled ? 0 : fpsSamples,
      lastTickMs: updateStart,
      frameTimeMs,
      mem,
      memSampleFrame: mem !== model.mem ? model.frame : model.memSampleFrame,
    }, [
      tick(model.capped ? CAPPED_MS : UNCAPPED_MS, {
        type: 'tick',
        gen: model.tickGen,
      }),
    ]];
  },
  view: (model) => {
    const start = performance.now();
    const surface = renderFrame(model);
    phaseTiming.viewMs = performance.now() - start;
    return surface;
  },
};

await run(app, { mouse: true });

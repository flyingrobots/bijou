/**
 * Performance stress test — animated cosine gradient.
 *
 * Fills the entire terminal with a per-cell color gradient that
 * animates every frame.  Tracks FPS, frame count, and elapsed time.
 * Hold mouse button to reverse the gradient direction.
 *
 * Usage:  npx tsx examples/perf-gradient/main.ts
 */

import { initDefaultContext } from '@flyingrobots/bijou-node';
import { createSurface } from '@flyingrobots/bijou';
import {
  run, quit, tick,
  isKeyMsg, isMouseMsg, isPulseMsg, isResizeMsg,
  type App,
} from '@flyingrobots/bijou-tui';

initDefaultContext();

const TARGET_FPS = 60;
const FRAME_MS = Math.round(1000 / TARGET_FPS);

interface Model {
  frame: number;
  elapsed: number;
  fps: number;
  fpsAccum: number;
  fpsSamples: number;
  cols: number;
  rows: number;
  mouseDown: boolean;
}

type Msg = { type: 'tick' };

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function hexByte(n: number): string {
  const h = clamp(Math.round(n), 0, 255).toString(16);
  return h.length === 1 ? `0${h}` : h;
}

function rgbHex(r: number, g: number, b: number): string {
  return `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`;
}

const { cos, PI } = Math;

function renderGradient(model: Model) {
  const { cols, rows, frame, mouseDown } = model;
  const surface = createSurface(cols, rows);
  const direction = mouseDown ? -1 : 1;
  const f = frame * 0.05 * direction;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const phase = (col + row * 0.5) * 0.08;
      const r1 = clamp((cos(phase + 1 * f) + 1) * 127.5, 0, 255);
      const g1 = clamp((cos(phase + 2 * f + 2 * PI / 3) + 1) * 127.5, 0, 255);
      const b1 = clamp((cos(phase + 3 * f + 4 * PI / 3) + 1) * 127.5, 0, 255);
      const r2 = clamp((cos(phase * 0.06 + 1 * f) + 1) * 127.5, 0, 255);
      const g2 = clamp((cos(phase * 0.07 + 2 * f + 2 * PI / 3) + 1) * 127.5, 0, 255);
      const b2 = clamp((cos(phase * 0.08 + 3 * f + 4 * PI / 3) + 1) * 127.5, 0, 255);

      surface.set(col, row, {
        char: '█',
        fg: rgbHex(r2, g2, b2),
        bg: rgbHex(r1, g1, b1),
      });
    }
  }

  // FPS overlay (top-left)
  const stats = [
    `FPS  ${model.fps.toFixed(0).padStart(4)}`,
    `frame ${String(model.frame).padStart(6)}`,
    `time  ${(model.elapsed / 1000).toFixed(1).padStart(6)}s`,
    `size  ${cols}×${rows}`,
    `mouse ${mouseDown ? 'DOWN' : 'up'}`,
  ];
  const boxW = Math.max(...stats.map((s) => s.length)) + 4;
  const boxH = stats.length + 2;
  if (cols >= boxW + 2 && rows >= boxH + 2) {
    for (let r = 1; r < 1 + boxH; r++) {
      for (let c = 1; c < 1 + boxW; c++) {
        surface.set(c, r, { char: ' ', bg: '#000000', fg: '#cccccc' });
      }
    }
    for (let i = 0; i < stats.length; i++) {
      const text = stats[i]!;
      for (let j = 0; j < text.length; j++) {
        surface.set(3 + j, 2 + i, {
          char: text[j]!,
          fg: i === 0 ? '#00ff88' : '#cccccc',
          bg: '#000000',
        });
      }
    }
  }

  return surface;
}

const app: App<Model, Msg> = {
  init: () => [{
    frame: 0,
    elapsed: 0,
    fps: 0,
    fpsAccum: 0,
    fpsSamples: 0,
    cols: process.stdout.columns ?? 80,
    rows: process.stdout.rows ?? 24,
    mouseDown: false,
  }, [tick(FRAME_MS, { type: 'tick' })]],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) {
        return [model, [quit()]];
      }
      return [model, []];
    }
    if (isResizeMsg(msg)) {
      return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
    }
    if (isMouseMsg(msg)) {
      const down = msg.action === 'press' ? true
        : msg.action === 'release' ? false
        : model.mouseDown;
      return [{ ...model, mouseDown: down }, []];
    }
    if (msg.type === 'tick') {
      const dt = FRAME_MS / 1000;
      const nextElapsed = model.elapsed + FRAME_MS;
      const nextAccum = model.fpsAccum + dt;
      const nextSamples = model.fpsSamples + 1;
      let fps = model.fps;
      let accum = nextAccum;
      let samples = nextSamples;
      if (nextAccum >= 0.5) {
        fps = nextSamples / nextAccum;
        accum = 0;
        samples = 0;
      }
      return [{
        ...model,
        frame: model.frame + 1,
        elapsed: nextElapsed,
        fps,
        fpsAccum: accum,
        fpsSamples: samples,
      }, [tick(FRAME_MS, { type: 'tick' })]];
    }
    return [model, []];
  },

  view: (model) => renderGradient(model),
};

run(app, { mouse: true });

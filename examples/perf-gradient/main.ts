/**
 * Performance stress test — animated cosine gradient.
 *
 * Fills the entire terminal with a per-cell color gradient that
 * animates every frame.  Tracks FPS, frame time, and frame count.
 * Hold mouse button to reverse the gradient direction.
 *
 * Keys:
 *   space  — toggle 60fps cap (uncapped = as fast as possible)
 *   q      — quit
 *
 * Usage:  npx tsx examples/perf-gradient/main.ts
 */

import { initDefaultContext } from '@flyingrobots/bijou-node';
import { createSurface } from '@flyingrobots/bijou';
import {
  run, quit, tick,
  isKeyMsg, isMouseMsg, isResizeMsg,
  type App,
} from '@flyingrobots/bijou-tui';

initDefaultContext();

const CAPPED_MS = Math.round(1000 / 60);
const UNCAPPED_MS = 0;

// Frame-time graph history length (one sample per frame)
const GRAPH_SAMPLES = 60;

interface Model {
  frame: number;
  elapsed: number;
  fps: number;
  fpsAccum: number;
  fpsSamples: number;
  cols: number;
  rows: number;
  mouseDown: boolean;
  capped: boolean;
  lastTickMs: number;
  frameTimeMs: number;
  frameTimeHistory: number[];
}

type Msg = { type: 'tick'; atMs: number };

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

const { cos, PI, max, min, round } = Math;

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

  // --- Stats overlay (top-left) ---
  const stats = [
    `FPS   ${model.fps.toFixed(0).padStart(5)}`,
    `frame ${String(model.frame).padStart(7)}`,
    `time  ${(model.elapsed / 1000).toFixed(1).padStart(6)}s`,
    `ft    ${model.frameTimeMs.toFixed(1).padStart(5)}ms`,
    `size  ${cols}×${rows}`,
    `cap   ${model.capped ? '60fps' : 'OFF'}`,
    `mouse ${mouseDown ? 'DOWN' : 'up'}`,
  ];

  const graphW = GRAPH_SAMPLES;
  const graphH = 8;
  const boxW = max(max(...stats.map((s) => s.length)) + 4, graphW + 4);
  const boxH = stats.length + 2 + graphH + 2; // stats + border + graph + label+border

  if (cols >= boxW + 2 && rows >= boxH + 2) {
    // Background
    for (let r = 1; r < 1 + boxH; r++) {
      for (let c = 1; c < 1 + boxW; c++) {
        surface.set(c, r, { char: ' ', bg: '#000000', fg: '#cccccc' });
      }
    }
    // Stats text
    for (let i = 0; i < stats.length; i++) {
      const text = stats[i]!;
      for (let j = 0; j < text.length; j++) {
        surface.set(3 + j, 2 + i, {
          char: text[j]!,
          fg: i === 0 ? '#00ff88' : i === 3 ? '#ffaa00' : '#cccccc',
          bg: '#000000',
        });
      }
    }

    // --- Frame time graph ---
    const graphTop = 2 + stats.length + 1;
    const graphLeft = 3;

    // Graph label
    const label = 'frame time (ms)';
    for (let j = 0; j < label.length; j++) {
      surface.set(graphLeft + j, graphTop - 1, {
        char: label[j]!,
        fg: '#666666',
        bg: '#000000',
      });
    }

    // Find scale
    const history = model.frameTimeHistory;
    const maxFt = max(16.7, ...history);
    const scale = graphH / maxFt;

    // 16.7ms reference line row
    const refRow = graphTop + graphH - 1 - round(16.7 * scale);

    for (let x = 0; x < graphW; x++) {
      const sampleIdx = history.length - graphW + x;
      const ft = sampleIdx >= 0 ? history[sampleIdx]! : 0;
      const barH = max(0, min(graphH, round(ft * scale)));

      for (let y = 0; y < graphH; y++) {
        const screenRow = graphTop + y;
        const screenCol = graphLeft + x;
        const barY = graphH - 1 - y;
        const inBar = barY < barH;

        if (inBar) {
          // Color by frame time: green < 16ms, yellow < 33ms, red >= 33ms
          const fg = ft < 16.7 ? '#00cc66' : ft < 33.3 ? '#ccaa00' : '#cc3333';
          surface.set(screenCol, screenRow, { char: '▄', fg, bg: '#000000' });
        } else if (y === refRow - graphTop) {
          // 16.7ms reference line
          surface.set(screenCol, screenRow, { char: '╌', fg: '#444444', bg: '#000000' });
        }
      }
    }
  }

  // Controls hint (bottom)
  const hint = ' space: toggle cap │ hold mouse: reverse │ q: quit ';
  if (rows > 2 && cols >= hint.length + 2) {
    const hintRow = rows - 1;
    const hintCol = round((cols - hint.length) / 2);
    for (let j = 0; j < hint.length; j++) {
      surface.set(hintCol + j, hintRow, {
        char: hint[j]!,
        fg: '#888888',
        bg: '#111111',
      });
    }
  }

  return surface;
}

function nowMs(): number {
  return performance.now();
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
    capped: true,
    lastTickMs: nowMs(),
    frameTimeMs: 0,
    frameTimeHistory: [],
  }, [tick(CAPPED_MS, { type: 'tick', atMs: nowMs() })]],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) {
        return [model, [quit()]];
      }
      if (msg.key === ' ' || msg.key === 'space') {
        const next = !model.capped;
        const delay = next ? CAPPED_MS : UNCAPPED_MS;
        return [{ ...model, capped: next }, [tick(delay, { type: 'tick', atMs: nowMs() })]];
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
      const now = msg.atMs;
      const frameTimeMs = now - model.lastTickMs;
      const dt = frameTimeMs / 1000;
      const nextElapsed = model.elapsed + frameTimeMs;
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
      const history = [...model.frameTimeHistory, frameTimeMs];
      if (history.length > GRAPH_SAMPLES * 2) {
        history.splice(0, history.length - GRAPH_SAMPLES);
      }
      const delay = model.capped ? CAPPED_MS : UNCAPPED_MS;
      return [{
        ...model,
        frame: model.frame + 1,
        elapsed: nextElapsed,
        fps,
        fpsAccum: accum,
        fpsSamples: samples,
        lastTickMs: now,
        frameTimeMs,
        frameTimeHistory: history,
      }, [tick(delay, { type: 'tick', atMs: nowMs() })]];
    }
    return [model, []];
  },

  view: (model) => renderGradient(model),
};

run(app, { mouse: true });

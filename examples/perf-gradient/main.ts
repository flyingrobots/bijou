/**
 * Performance stress test — animated cosine gradient.
 *
 * Fills the entire terminal with a per-cell color gradient that
 * animates every frame.  Tracks FPS, frame time, heap usage, and
 * GC pauses.
 *
 * Keys:
 *   space  — toggle 60fps cap (uncapped = as fast as possible)
 *   q      — quit
 *
 * Mouse:
 *   hold   — reverse gradient direction
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
const GRAPH_SAMPLES = 60;

// --- Ring buffer for frame time history (zero-alloc after init) ---
const ftRing = new Float64Array(GRAPH_SAMPLES);
let ftRingHead = 0;
let ftRingCount = 0;

function pushFt(ms: number): void {
  ftRing[ftRingHead] = ms;
  ftRingHead = (ftRingHead + 1) % GRAPH_SAMPLES;
  if (ftRingCount < GRAPH_SAMPLES) ftRingCount++;
}

function readFt(i: number): number {
  // i=0 is oldest, i=ftRingCount-1 is newest
  const idx = (ftRingHead - ftRingCount + i + GRAPH_SAMPLES) % GRAPH_SAMPLES;
  return ftRing[idx]!;
}

interface MemStats {
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
  externalMB: number;
  gcCountSinceLastSample: number;
}

// --- GC tracking via PerformanceObserver ---
let gcCount = 0;
let gcCountAtLastSample = 0;

try {
  const { PerformanceObserver } = await import('node:perf_hooks');
  const obs = new PerformanceObserver((list) => {
    gcCount += list.getEntries().length;
  });
  obs.observe({ entryTypes: ['gc'] });
} catch {
  // GC observation not available — gcCount stays 0
}

function sampleMemStats(): MemStats {
  const mem = process.memoryUsage();
  const gcSince = gcCount - gcCountAtLastSample;
  gcCountAtLastSample = gcCount;
  return {
    heapUsedMB: mem.heapUsed / (1024 * 1024),
    heapTotalMB: mem.heapTotal / (1024 * 1024),
    rssMB: mem.rss / (1024 * 1024),
    externalMB: mem.external / (1024 * 1024),
    gcCountSinceLastSample: gcSince,
  };
}

// --- Frame phase timing ---
// Stored outside the model to avoid TEA allocation overhead.
// Written by update() and view(), read by view() on the next frame.
interface PhaseTiming {
  updateMs: number;
  viewMs: number;
}

const phaseTiming: PhaseTiming = { updateMs: 0, viewMs: 0 };

interface Model {
  frame: number;
  elapsed: number;
  fps: number;
  fpsAccum: number;
  fpsSamples: number;
  cols: number;
  rows: number;
  mouseDown: boolean;
  mode: number;
  capped: boolean;
  lastTickMs: number;
  frameTimeMs: number;
  mem: MemStats;
  memSampleFrame: number;
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

const { cos, PI, max, min, round } = Math;

// Reusable surface — only reallocated on resize
let cachedSurface: ReturnType<typeof createSurface> | undefined;
let cachedW = 0;
let cachedH = 0;

function getOrCreateSurface(w: number, h: number): ReturnType<typeof createSurface> {
  if (cachedSurface == null || cachedW !== w || cachedH !== h) {
    cachedSurface = createSurface(w, h);
    cachedW = w;
    cachedH = h;
  }
  return cachedSurface;
}

// Reusable cell object — mutated in place to avoid per-cell allocation
const cell: { char: string; fg: string; bg: string } = { char: '█', fg: '', bg: '' };

function stampText(
  surface: ReturnType<typeof createSurface>,
  x: number, y: number,
  text: string, fg: string, bg: string,
): void {
  for (let j = 0; j < text.length; j++) {
    surface.set(x + j, y, { char: text[j]!, fg, bg });
  }
}

const MODE_NAMES = ['gradient', 'horizon', 'noise'];
const MODE_COUNT = MODE_NAMES.length;

// --- OpenSimplex noise (adapted from ertdfgcvb) ---
function openSimplexNoise2D(seed: number): (x: number, y: number) => number {
  const STRETCH = (1 / Math.sqrt(3) - 1) / 2;
  const SQUISH = (Math.sqrt(3) - 1) / 2;
  const NORM = 1.0 / 47.0;
  const grads = [5,2, 2,5, -5,2, -2,5, 5,-2, 2,-5, -5,-2, -2,-5];
  const perm = new Uint8Array(256);
  const source = new Uint8Array(256);
  for (let i = 0; i < 256; i++) source[i] = i;
  let s = (seed * 1664525 + 1013904223) | 0;
  s = (s * 1664525 + 1013904223) | 0;
  s = (s * 1664525 + 1013904223) | 0;
  for (let i = 255; i >= 0; i--) {
    s = (s * 1664525 + 1013904223) | 0;
    let r = ((s + 31) % (i + 1));
    if (r < 0) r += i + 1;
    perm[i] = source[r];
    source[r] = source[i];
  }
  return (x: number, y: number): number => {
    const stretch = (x + y) * STRETCH;
    const xs = x + stretch, ys = y + stretch;
    const xsb = Math.floor(xs), ysb = Math.floor(ys);
    const squish = (xsb + ysb) * SQUISH;
    const dx0 = x - (xsb + squish), dy0 = y - (ysb + squish);
    const xins = xs - xsb, yins = ys - ysb;
    const inSum = xins + yins;
    let value = 0;
    // Contribution (0,0)
    let dx = dx0, dy = dy0;
    let attn = 2 - dx * dx - dy * dy;
    if (attn > 0) {
      const i = (perm[(perm[xsb & 0xFF] + ysb) & 0xFF] & 0x0E);
      attn *= attn; value += attn * attn * (grads[i] * dx + grads[i + 1] * dy);
    }
    // (1,0)
    dx = dx0 - 1 - SQUISH; dy = dy0 - SQUISH;
    attn = 2 - dx * dx - dy * dy;
    if (attn > 0) {
      const i = (perm[(perm[(xsb + 1) & 0xFF] + ysb) & 0xFF] & 0x0E);
      attn *= attn; value += attn * attn * (grads[i] * dx + grads[i + 1] * dy);
    }
    // (0,1)
    dx = dx0 - SQUISH; dy = dy0 - 1 - SQUISH;
    attn = 2 - dx * dx - dy * dy;
    if (attn > 0) {
      const i = (perm[(perm[xsb & 0xFF] + ysb + 1) & 0xFF] & 0x0E);
      attn *= attn; value += attn * attn * (grads[i] * dx + grads[i + 1] * dy);
    }
    if (inSum > 1) {
      // (1,1)
      dx = dx0 - 1 - 2 * SQUISH; dy = dy0 - 1 - 2 * SQUISH;
      attn = 2 - dx * dx - dy * dy;
      if (attn > 0) {
        const i = (perm[(perm[(xsb + 1) & 0xFF] + ysb + 1) & 0xFF] & 0x0E);
        attn *= attn; value += attn * attn * (grads[i] * dx + grads[i + 1] * dy);
      }
    }
    return value * NORM;
  };
}

const noise2D = openSimplexNoise2D(42);
const DENSITY = 'Ñ@#W$9876543210?!abcxyz;:+=-,._ ';

function fillGradient(surface: ReturnType<typeof createSurface>, model: Model): void {
  const { cols, rows, frame, mouseDown } = model;
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
      cell.fg = rgbHex(r2, g2, b2);
      cell.bg = rgbHex(r1, g1, b1);
      surface.set(col, row, cell);
    }
  }
}

function fillHorizon(surface: ReturnType<typeof createSurface>, model: Model): void {
  const { cols, rows, frame, mouseDown } = model;
  const halfY = rows / 2;
  const halfX = cols / 2;
  const speed = (mouseDown ? -0.3 : 0.3);

  for (let row = 0; row < rows; row++) {
    const z = row - halfY;
    for (let col = 0; col < cols; col++) {
      if (z === 0) {
        surface.set(col, row, { char: '─', fg: '#ffffff', bg: '#000000' });
        continue;
      }
      const val = (col - halfX) / z;
      const code = (Math.floor(val + halfX + frame * speed) % 94 + 94) % 94 + 33;
      const depth = clamp(1 - Math.abs(z) / halfY, 0, 1);
      const bright = Math.round(depth * 200 + 55);
      const skyGround = z < 0
        ? rgbHex(bright * 0.3, bright * 0.4, bright)
        : rgbHex(bright * 0.2, bright * 0.6, bright * 0.2);
      surface.set(col, row, {
        char: String.fromCharCode(code),
        fg: rgbHex(bright, bright, bright),
        bg: skyGround,
      });
    }
  }
}

function fillNoise(surface: ReturnType<typeof createSurface>, model: Model): void {
  const { cols, rows, mouseDown } = model;
  const t = model.elapsed * 0.0007 * (mouseDown ? -1 : 1);
  const s = 0.03;
  const aspect = 0.5; // terminal chars are ~2:1

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * s;
      const y = row * s / aspect + t;
      const n = noise2D(x, y + t * 0.3) * 0.5 + 0.5;
      const i = Math.floor(n * DENSITY.length);
      const ch = DENSITY[clamp(i, 0, DENSITY.length - 1)] ?? ' ';
      // Lerp between the two colors based on noise value
      const bright = n;
      const r = Math.round(255 * bright * 0.3 + 246 * (1 - bright));
      const g = Math.round(89 * bright * 0.3 + 246 * (1 - bright));
      const b = Math.round(55 * bright * 0.3 + 244 * (1 - bright));
      surface.set(col, row, { char: ch, fg: rgbHex(r, g, b), bg: '#000000' });
    }
  }
}

function renderFrame(model: Model) {
  const { cols, rows } = model;
  const surface = getOrCreateSurface(cols, rows);

  switch (model.mode) {
    case 0: fillGradient(surface, model); break;
    case 1: fillHorizon(surface, model); break;
    case 2: fillNoise(surface, model); break;
  }

  // --- Stats overlay ---
  const BG = '#000000';
  const FG = '#cccccc';
  const p = phaseTiming;
  const ftColor = (ms: number) => ms < 2 ? '#00cc66' : ms < 8 ? '#ccaa00' : '#cc3333';
  const stats = [
    { text: `FPS   ${model.fps.toFixed(0).padStart(5)}`, fg: '#00ff88' },
    { text: `frame ${String(model.frame).padStart(7)}`, fg: FG },
    { text: `time  ${(model.elapsed / 1000).toFixed(1).padStart(6)}s`, fg: FG },
    { text: `ft    ${model.frameTimeMs.toFixed(1).padStart(5)}ms`, fg: '#ffaa00' },
    { text: `size  ${cols}×${rows}  (${cols * rows} cells)`, fg: FG },
    { text: `cap   ${model.capped ? '60fps' : 'OFF'}`, fg: model.capped ? FG : '#ff6666' },
    { text: `mode  ${model.mode + 1}`, fg: FG },
    { text: `mouse ${model.mouseDown ? 'DOWN' : 'up'}`, fg: FG },
    { text: '', fg: FG },
    { text: '── timing ────────────', fg: '#555555' },
    { text: `upd   ${p.updateMs.toFixed(1).padStart(5)}ms`, fg: ftColor(p.updateMs) },
    { text: `view  ${p.viewMs.toFixed(1).padStart(5)}ms`, fg: ftColor(p.viewMs) },
    { text: '', fg: FG },
    { text: '── memory ────────────', fg: '#555555' },
    { text: `heap  ${mem.heapUsedMB.toFixed(1)}/${mem.heapTotalMB.toFixed(1)} MB`, fg: '#88aaff' },
    { text: `rss   ${mem.rssMB.toFixed(1)} MB`, fg: '#88aaff' },
    { text: `ext   ${mem.externalMB.toFixed(1)} MB`, fg: '#88aaff' },
    { text: `gc    ${mem.gcCountSinceLastSample}/0.5s`, fg: mem.gcCountSinceLastSample > 5 ? '#ff6666' : '#88aaff' },
  ];

  const graphW = GRAPH_SAMPLES;
  const graphH = 8;
  const textW = max(...stats.map((s) => s.text.length));
  const boxW = max(textW + 4, graphW + 4);
  const boxH = stats.length + 2 + graphH + 2;

  if (cols >= boxW + 2 && rows >= boxH + 2) {
    // Background
    for (let r = 1; r < 1 + boxH; r++) {
      for (let c = 1; c < 1 + boxW; c++) {
        surface.set(c, r, { char: ' ', bg: BG, fg: FG });
      }
    }

    // Stats text
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i]!;
      if (s.text.length > 0) {
        stampText(surface, 3, 2 + i, s.text, s.fg, BG);
      }
    }

    // --- Frame time graph ---
    const graphTop = 2 + stats.length + 1;
    const graphLeft = 3;

    stampText(surface, graphLeft, graphTop - 1, 'frame time (ms)', '#666666', BG);

    // Scale
    let maxFt = 16.7;
    for (let i = 0; i < ftRingCount; i++) {
      const v = readFt(i);
      if (v > maxFt) maxFt = v;
    }
    const scale = graphH / maxFt;
    const refRow = graphTop + graphH - 1 - round(16.7 * scale);

    for (let x = 0; x < graphW; x++) {
      const sampleIdx = ftRingCount - graphW + x;
      const ft = sampleIdx >= 0 ? readFt(sampleIdx) : 0;
      const barH = max(0, min(graphH, round(ft * scale)));

      for (let y = 0; y < graphH; y++) {
        const screenRow = graphTop + y;
        const screenCol = graphLeft + x;
        const barY = graphH - 1 - y;
        const inBar = barY < barH;

        if (inBar) {
          const fg = ft < 16.7 ? '#00cc66' : ft < 33.3 ? '#ccaa00' : '#cc3333';
          surface.set(screenCol, screenRow, { char: '▄', fg, bg: BG });
        } else if (y === refRow - graphTop) {
          surface.set(screenCol, screenRow, { char: '╌', fg: '#444444', bg: BG });
        }
      }
    }
  }

  // Controls hint
  const modeName = MODE_NAMES[model.mode] ?? '?';
  const hint = ` space: cap │ 1-${MODE_COUNT}: mode (${modeName}) │ mouse: reverse │ q: quit `;
  if (rows > 2 && cols >= hint.length + 2) {
    const hintRow = rows - 1;
    const hintCol = round((cols - hint.length) / 2);
    stampText(surface, hintCol, hintRow, hint, '#888888', '#111111');
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
    mode: 0,
    capped: true,
    lastTickMs: performance.now(),
    frameTimeMs: 0,
    mem: sampleMemStats(),
    memSampleFrame: 0,
  }, [tick(CAPPED_MS, { type: 'tick' })]],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) {
        return [model, [quit()]];
      }
      const modeKey = parseInt(msg.key, 10);
      if (modeKey >= 1 && modeKey <= MODE_COUNT) {
        return [{ ...model, mode: modeKey - 1 }, []];
      }
      if (msg.key === ' ' || msg.key === 'space') {
        const next = !model.capped;
        return [{ ...model, capped: next }, [tick(next ? CAPPED_MS : UNCAPPED_MS, { type: 'tick' })]];
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
      const updateStart = performance.now();
      const now = updateStart;
      const frameTimeMs = now - model.lastTickMs;

      pushFt(frameTimeMs);

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

      // Sample memory every 30 frames (~0.5s at 60fps)
      const mem = (model.frame - model.memSampleFrame >= 30)
        ? sampleMemStats()
        : model.mem;
      const memFrame = mem !== model.mem ? model.frame : model.memSampleFrame;

      const delay = model.capped ? CAPPED_MS : UNCAPPED_MS;
      phaseTiming.updateMs = performance.now() - updateStart;
      return [{
        ...model,
        frame: model.frame + 1,
        elapsed: nextElapsed,
        fps,
        fpsAccum: accum,
        fpsSamples: samples,
        lastTickMs: now,
        frameTimeMs,
        mem,
        memSampleFrame: memFrame,
      }, [tick(delay, { type: 'tick' })]];
    }
    return [model, []];
  },

  view: (model) => {
    const viewStart = performance.now();
    const surface = renderFrame(model);
    phaseTiming.viewMs = performance.now() - viewStart;
    return surface;
  },
};

run(app, { mouse: true });

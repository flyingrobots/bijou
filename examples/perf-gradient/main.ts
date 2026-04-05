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
const UNCAPPED_MS = 1; // >0 to yield to the event loop for key input
const GRAPH_SAMPLES = 60;

// --- Ring buffer for view() time history (zero-alloc after init) ---
const vtRing = new Float64Array(GRAPH_SAMPLES);
let vtRingHead = 0;
let vtRingCount = 0;

function pushVt(ms: number): void {
  vtRing[vtRingHead] = ms;
  vtRingHead = (vtRingHead + 1) % GRAPH_SAMPLES;
  if (vtRingCount < GRAPH_SAMPLES) vtRingCount++;
}

function readVt(i: number): number {
  const idx = (vtRingHead - vtRingCount + i + GRAPH_SAMPLES) % GRAPH_SAMPLES;
  return vtRing[idx]!;
}

// --- Braille line chart renderer ---
// Each braille char is a 2×4 dot grid (U+2800 base).
// Dot positions:  col0: bits 0,1,2,6  col1: bits 3,4,5,7
// Row mapping (top=0): row0=bit0/3, row1=bit1/4, row2=bit2/5, row3=bit6/7
const BRAILLE_BASE = 0x2800;
const BRAILLE_DOT_LEFT  = [0x01, 0x02, 0x04, 0x40]; // rows 0-3, left column
const BRAILLE_DOT_RIGHT = [0x08, 0x10, 0x20, 0x80]; // rows 0-3, right column

function renderBrailleLineChart(
  surface: ReturnType<typeof createSurface>,
  sx: number, sy: number,
  chartW: number, chartH: number, // in chars
  sampleCount: number,
  readSample: (i: number) => number,
  maxVal: number,
  fg: string, bg: string, refFg: string,
  refVal?: number,
): void {
  const dotsH = chartH * 4; // vertical dot resolution
  const dotsW = chartW * 2; // horizontal dot resolution

  // Build braille grid (one code point per char cell)
  const grid = new Uint8Array(chartW * chartH);

  // Plot the reference line
  if (refVal !== undefined && refVal <= maxVal) {
    const refDotY = dotsH - 1 - Math.round((refVal / maxVal) * (dotsH - 1));
    const refCharRow = Math.floor(refDotY / 4);
    const refDotRow = refDotY % 4;
    for (let cx = 0; cx < chartW; cx++) {
      // Set both left and right dots for a full horizontal line
      grid[refCharRow * chartW + cx] |= BRAILLE_DOT_LEFT[refDotRow]! | BRAILLE_DOT_RIGHT[refDotRow]!;
    }
    // Draw the reference line first in ref color
    for (let cx = 0; cx < chartW; cx++) {
      const code = BRAILLE_BASE | grid[refCharRow * chartW + cx]!;
      surface.set(sx + cx, sy + refCharRow, { char: String.fromCharCode(code), fg: refFg, bg });
    }
  }

  // Plot data points as a connected line
  for (let dotX = 0; dotX < dotsW && dotX < sampleCount; dotX++) {
    const sampleIdx = sampleCount - dotsW + dotX;
    if (sampleIdx < 0) continue;
    const val = readSample(sampleIdx);
    const dotY = dotsH - 1 - Math.round((Math.min(val, maxVal) / maxVal) * (dotsH - 1));
    const charCol = Math.floor(dotX / 2);
    const charRow = Math.floor(dotY / 4);
    const dotCol = dotX % 2;
    const dotRow = dotY % 4;
    const bits = dotCol === 0 ? BRAILLE_DOT_LEFT[dotRow]! : BRAILLE_DOT_RIGHT[dotRow]!;
    grid[charRow * chartW + charCol] |= bits;
  }

  // Render to surface
  for (let cy = 0; cy < chartH; cy++) {
    for (let cx = 0; cx < chartW; cx++) {
      const code = grid[cy * chartW + cx]!;
      if (code !== 0) {
        surface.set(sx + cx, sy + cy, {
          char: String.fromCharCode(BRAILLE_BASE | code),
          fg, bg,
        });
      }
    }
  }
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
  tickGen: number;
  lastTickMs: number;
  frameTimeMs: number;
  mem: MemStats;
  memSampleFrame: number;
}

type Msg = { type: 'tick'; gen: number };

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

const MODE_NAMES = ['gradient', 'horizon', 'noise', 'quad'];
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

// Cached quadrant surfaces — only reallocated on resize
let quadSurfaces: ReturnType<typeof createSurface>[] | undefined;
let quadW = 0;
let quadH = 0;

function getQuadSurfaces(cols: number, rows: number): ReturnType<typeof createSurface>[] {
  if (quadSurfaces == null || quadW !== cols || quadH !== rows) {
    const halfC = Math.floor(cols / 2);
    const halfR = Math.floor(rows / 2);
    quadSurfaces = [
      createSurface(halfC, halfR),
      createSurface(cols - halfC, halfR),
      createSurface(halfC, rows - halfR),
      createSurface(cols - halfC, rows - halfR),
    ];
    quadW = cols;
    quadH = rows;
  }
  return quadSurfaces;
}

function fillQuad(surface: ReturnType<typeof createSurface>, model: Model): void {
  const { cols, rows } = model;
  const halfC = Math.floor(cols / 2);
  const halfR = Math.floor(rows / 2);
  const [sTL, sTR, sBL, sBR] = getQuadSurfaces(cols, rows);

  const tr: Model = { ...model, cols: cols - halfC, rows: halfR };
  const bl: Model = { ...model, cols: halfC, rows: rows - halfR };
  const br: Model = { ...model, cols: cols - halfC, rows: rows - halfR };

  sTL.fill({ char: ' ', bg: '#0a0a0a' });
  fillGradient(sTR, tr);
  fillNoise(sBL, bl);
  fillHorizon(sBR, br);

  surface.blit(sTL, 0, 0);
  surface.blit(sTR, halfC, 0);
  surface.blit(sBL, 0, halfR);
  surface.blit(sBR, halfC, halfR);
}

function renderFrame(model: Model) {
  const { cols, rows, mem } = model;
  const surface = getOrCreateSurface(cols, rows);

  switch (model.mode) {
    case 0: fillGradient(surface, model); break;
    case 1: fillHorizon(surface, model); break;
    case 2: fillNoise(surface, model); break;
    case 3: fillQuad(surface, model); break;
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

  const graphCharsW = 30; // braille chars wide (60 dot columns = 60 samples)
  const graphCharsH = 6;  // braille chars tall (24 dot rows of resolution)
  const axisW = 6;        // width of Y axis labels
  const textW = max(...stats.map((s) => s.text.length));
  const boxW = max(textW + 4, graphCharsW + axisW + 5);
  const boxH = stats.length + 2 + graphCharsH + 3; // stats + border + label + graph + x-label

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

    // --- View time braille line chart ---
    const graphTop = 2 + stats.length + 1;
    const graphLeft = 3 + axisW;

    // Determine max scale from data
    let maxVt = 4; // minimum 4ms scale
    for (let i = 0; i < vtRingCount; i++) {
      const v = readVt(i);
      if (v > maxVt) maxVt = v;
    }
    maxVt = Math.ceil(maxVt); // round up for clean labels

    // Title
    stampText(surface, 3, graphTop - 1, `render time (ms)`, '#666666', BG);

    // Y axis labels (top, middle, bottom)
    stampText(surface, 3, graphTop, `${maxVt.toFixed(0).padStart(4)}┤`, '#555555', BG);
    stampText(surface, 3, graphTop + Math.floor(graphCharsH / 2), `${(maxVt / 2).toFixed(0).padStart(4)}┤`, '#555555', BG);
    stampText(surface, 3, graphTop + graphCharsH - 1, `   0┤`, '#555555', BG);

    // Render braille chart
    renderBrailleLineChart(
      surface,
      graphLeft, graphTop,
      graphCharsW, graphCharsH,
      vtRingCount,
      readVt,
      maxVt,
      '#00cc66', BG, '#444444',
      maxVt > 16.7 ? 16.7 : undefined, // show 16.7ms ref line if in range
    );

    // X axis label
    const xLabel = `last ${GRAPH_SAMPLES}`;
    stampText(surface, graphLeft, graphTop + graphCharsH, `╰${'─'.repeat(max(1, graphCharsW - xLabel.length - 1))} ${xLabel}`, '#555555', BG);
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
      const modeKey = parseInt(msg.key, 10);
      if (modeKey >= 1 && modeKey <= MODE_COUNT) {
        return [{ ...model, mode: modeKey - 1 }, []];
      }
      if (msg.key === ' ' || msg.key === 'space') {
        const next = !model.capped;
        const nextGen = model.tickGen + 1;
        return [{ ...model, capped: next, tickGen: nextGen }, [tick(next ? CAPPED_MS : UNCAPPED_MS, { type: 'tick', gen: nextGen })]];
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
      // Ignore ticks from a stale generation (previous cap/uncap cycle)
      if (msg.gen !== model.tickGen) return [model, []];
      const updateStart = performance.now();
      const now = updateStart;
      const frameTimeMs = now - model.lastTickMs;

      pushVt(phaseTiming.viewMs);

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
      }, [tick(delay, { type: 'tick', gen: model.tickGen })]];
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

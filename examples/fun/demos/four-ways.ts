// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Four Ways to See: one comet, one state, lowered at once into Bijou's four output modes,
// `interactive`, `static`, `pipe` and `accessible`, every pane updating on the same pulse.
import { createSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { header, place, staticReport, stream, visible, type Inked } from './four-ways-panes.js';
import { advance, elements, rollComet, type Comet } from './four-ways-sim.js';
import { paintSky } from './four-ways-sky.js';
import { arrival, eventLine, eventSentence, sampleLine, wrap } from './four-ways-words.js';

export interface FourWaysState {
  readonly comet: Comet;
  /** Simulated years since the demo began. */
  readonly t: number;
  readonly seed: number;
  /** Multiplies the time rate: `+` and `-` double or halve it. */
  readonly speed: number;
  readonly pulses: number;
  /** The `pipe` stream, oldest first. */
  readonly pipe: readonly string[];
  /** The `accessible` sentences, oldest first. */
  readonly said: readonly string[];
  readonly hideUI: boolean;
}

/** Simulated years per second at speed 1. */
const RATE = 0.3;
const MIN_SPEED = 0.125;
const MAX_SPEED = 16;
/** A `pipe` sample line every this many pulses. */
const SAMPLE_EVERY = 6;
const KEEP_LINES = 80;
const KEEP_SENTENCES = 24;

const keep = (lines: readonly string[], more: readonly string[], cap: number): readonly string[] => [...lines, ...more].slice(-cap);

function launch(state: FourWaysState, seed: number): FourWaysState {
  const [comet, next] = rollComet(seed);
  const [line, sentence] = arrival(comet, state.t);
  return { ...state, comet, seed: next, pipe: keep(state.pipe, [line], KEEP_LINES), said: keep(state.said, [sentence], KEEP_SENTENCES) };
}

function pulse(state: FourWaysState, dt: number): FourWaysState {
  const { comet, events } = advance(state.comet, state.t, dt * RATE * state.speed);
  const t = state.t + dt * RATE * state.speed;
  const pulses = state.pulses + 1;
  const lines = events.map(eventLine);
  if (pulses % SAMPLE_EVERY === 0) lines.push(sampleLine(comet, t));
  return { ...state, comet, t, pulses, pipe: keep(state.pipe, lines, KEEP_LINES), said: keep(state.said, events.map(eventSentence), KEEP_SENTENCES) };
}

const speedBy = (state: FourWaysState, factor: number): FourWaysState =>
  ({ ...state, speed: Math.max(MIN_SPEED, Math.min(MAX_SPEED, state.speed * factor)) });

function pipeLines(lines: readonly string[]): Inked[] {
  return lines.map((text, i) => {
    const fade = Math.max(0.35, 1 - (lines.length - 1 - i) * 0.06);
    return { text, ink: text.includes('event=') ? [230 * fade, 220 * fade, 110 * fade] : [90 * fade, 200 * fade, 120 * fade] };
  });
}

/** Whole sentences only, newest last, as many as fit in `height` rows. */
function spoken(sentences: readonly string[], width: number, height: number): Inked[] {
  const lines: Inked[] = [];
  for (let age = 0; age < sentences.length; age += 1) {
    const level = age === 0 ? 245 : Math.max(110, 200 - age * 25);
    const wrapped = wrap(sentences[sentences.length - 1 - age] ?? '', width);
    if (lines.length + wrapped.length > height && lines.length > 0) break;
    lines.unshift(...wrapped.map((text): Inked => ({ text, ink: [level, level, age === 0 ? 255 : level] })));
  }
  return lines;
}

function paintPanes(surface: Surface, state: FourWaysState, ctx: BijouContext, elapsed: number): void {
  const { width, height } = surface;
  const topH = Math.max(2, Math.min(height - 2, Math.round(height * 0.56)));
  const bottomH = height - topH;
  const leftW = Math.floor(width / 2);
  const rightW = width - leftW;
  const { phase } = elements(state.comet);
  const sky = createSurface(leftW, topH - 1);
  paintSky(sky, state.comet, state.t, elapsed);
  surface.blit(sky, 0, 1);
  header(surface, 0, 0, leftW, 'interactive', 'true-colour graphics', phase, ctx);
  const report = staticReport(state.comet, state.t, phase, rightW - 2, ctx);
  const reportLines = report.split('\n');
  const reportWidth = Math.max(...reportLines.map(visible));
  const offsetX = Math.max(1, Math.floor((rightW - reportWidth) / 2));
  const offsetY = Math.max(0, Math.floor((topH - 1 - reportLines.length) / 2));
  place(surface, report, leftW + offsetX, 1 + offsetY, rightW - offsetX, topH - 1 - offsetY);
  header(surface, leftW, 0, rightW, 'static', 'box, table, progressBar', phase, ctx);
  stream(surface, 1, topH + 1, leftW - 2, bottomH - 1, pipeLines(state.pipe));
  header(surface, 0, topH, leftW, 'pipe', 'machine log lines', phase, ctx);
  stream(surface, leftW + 1, topH + 1, rightW - 2, bottomH - 1, spoken(state.said, rightW - 2, bottomH - 1));
  header(surface, leftW, topH, rightW, 'accessible', 'spoken on events', phase, ctx);
}

export const fourWays: Demo<FourWaysState> = {
  id: 'four-ways',
  name: 'Four Ways to See',
  description: 'One comet simulation lowered live into all four output modes: interactive, static, pipe, accessible',
  keys: '+ and - time speed, r new comet, h hides the panel, space pause',
  init(seed) {
    const blank: FourWaysState = { comet: { x: 1, y: 0, vx: 0, vy: 6 }, t: 0, seed, speed: 1, pulses: 0, pipe: [], said: [], hideUI: false };
    const state = launch(blank, seed);
    return { ...state, pipe: keep(state.pipe, [sampleLine(state.comet, 0)], KEEP_LINES) };
  },
  update(msg, state) {
    if (msg.type === 'pulse') return pulse(state, msg.dt);
    if (msg.type !== 'key') return state;
    if (msg.key === '+' || msg.key === '=') return speedBy(state, 2);
    if (msg.key === '-') return speedBy(state, 0.5);
    if (msg.key === 'r') return launch(state, state.seed);
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, elapsed, ctx }) {
    const surface = createSurface(width, height);
    if (width < 8 || height < 6) return surface;
    paintPanes(surface, state, ctx, elapsed);
    if (!state.hideUI) {
      const { a, e } = elements(state.comet);
      stampPanel(surface, [
        '  ***  FOUR WAYS TO SEE  ***  ',
        '─',
        `  comet a ${a.toFixed(2)} AU, e ${e.toFixed(2)}`,
        `  time x${String(state.speed)} (${(RATE * state.speed).toFixed(2)} yr/s)`,
        '  - + / - : Time speed',
        '  - R     : New comet',
        '  - H     : Hide panel',
      ], ctx, (free) => ({ x: Math.min(1, free.x), y: free.y }));
    }
    return surface;
  },
};

export const fourWaysDemo = defineDemo(fourWays);

// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Butterfly Effect: three universes of the same double-pendulum ensemble, apart by 1e-12 and 1e-9 in one angle.
// They move in lockstep for seconds, then each finds its own future.
import { createSurface, type Surface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { forkNow, restart, scrub, startWorld, type World } from './butterfly-history.js';
import { paintHeader, paintTimeline, nudgeLabel } from './butterfly-hud.js';
import { paintUniverse } from './butterfly-paint.js';
import { distance, SAMPLE_RATE } from './butterfly-physics.js';
import type { Rgb } from './hsl.js';

export interface ButterflyState {
  readonly world: World;
  /** Simulated time owed but not yet run, in samples. */
  readonly owed: number;
  /** The pointer's column, for highlighting the pane under it; null when it is away. */
  readonly pointer: number | null;
  readonly hideUI: boolean;
}

const PAPER: Rgb = { r: 6, g: 7, b: 12 };
const LIT: Rgb = { r: 16, g: 21, b: 36 };
const RULE: Rgb = { r: 40, g: 46, b: 64 };
/** `[` and `]` scrub one second; `,` and `.` eight. */
const SHORT = SAMPLE_RATE;
const LONG = SAMPLE_RATE * 8;

/** Pane `index` of three equal panes across `width`, with one-column rules between them, so all three draw alike. */
function paneX(width: number, index: number): readonly [number, number] {
  const pane = Math.max(1, Math.floor((width - 2) / 3));
  return [index * (pane + 1), pane];
}

function paneAt(width: number, col: number): number {
  for (let i = 2; i >= 0; i -= 1) if (col >= paneX(width, i)[0]) return i;
  return 0;
}

function paintPanes(surface: Surface, state: ButterflyState): void {
  const { world } = state;
  const lit = state.pointer === null ? -1 : paneAt(surface.width, state.pointer);
  const artHeight = Math.max(1, surface.height - 3);
  for (let i = 0; i < 3; i += 1) {
    const [x, width] = paneX(surface.width, i);
    const paper = i === lit ? LIT : PAPER;
    const universe = world.trio[i] ?? world.trio[0];
    paintUniverse(surface, { x, y: 2, width, height: artHeight }, universe, paper);
    paintHeader(surface, x, 0, width, nudgeLabel(world, i), i === 0 ? null : distance(world.trio[0], universe), i === lit, paper);
    if (i < 2) for (let y = 0; y < surface.height - 1; y += 1) surface.setRGB(x + width, y, '│', RULE.r, RULE.g, RULE.b, 0, 0, 0);
  }
  paintTimeline(surface, surface.height - 1, world, PAPER);
}

export const butterfly: Demo<ButterflyState> = {
  id: 'butterfly',
  name: 'Butterfly Effect',
  description: 'Three universes of 180 double pendulums, one 1e-12 apart: lockstep for seconds, then three futures',
  keys: '[ ] scrub 1 s, , . scrub 8 s, f fork C from A, r restart, pointer highlights, h hides the panel, space pause',
  init(seed) {
    const [roll] = nextRandom(seed);
    return { world: startWorld(2.4 + 0.2 * roll), owed: 0, pointer: null, hideUI: false };
  },
  update(msg, state) {
    if (msg.type === 'resize') return state;
    if (msg.type === 'pointer') return { ...state, pointer: msg.col };
    if (msg.type === 'pointer-leave') return { ...state, pointer: null };
    if (msg.type === 'pulse') {
      const owed = state.owed + Math.min(0.25, Math.max(0, msg.dt)) * SAMPLE_RATE;
      const whole = Math.floor(owed);
      return { ...state, world: scrub(state.world, whole), owed: owed - whole };
    }
    const moves: Readonly<Record<string, number>> = { '[': -SHORT, ']': SHORT, ',': -LONG, '.': LONG };
    const move = moves[msg.key];
    if (move !== undefined) return { ...state, world: scrub(state.world, move) };
    if (msg.key === 'f') return { ...state, world: forkNow(state.world) };
    if (msg.key === 'r') return { ...state, world: restart(state.world), owed: 0 };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    paintPanes(surface, state);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  BUTTERFLY EFFECT  ***  ',
        '─'.repeat(30),
        '  180 double pendulums, RK4',
        '  B: +1e-12 rad   C: +1e-9 rad',
        '─'.repeat(30),
        '  - [ / ]   : Scrub 1 s',
        '  - , / .   : Scrub 8 s',
        '  - F       : Fork C from A now',
        '  - R       : Restart',
        '  - POINTER : Highlight a pane',
        '  - H       : Hide panel',
        '  - [Space] : Pause/Resume',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(2, free.x)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const butterflyDemo = defineDemo(butterfly);

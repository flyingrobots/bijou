// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Shatter: a live Bijou dashboard is made of matter. Break it and every cell falls as a glyph, keeping its
// character and colours; rewind plays the recorded flight backwards until the dashboard works again.
import { createSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { dashboard, layout, PANE_BG } from './shatter-dash.js';
import { initial, point, pulse, resize, rewind, smash, type ShatterState } from './shatter-phase.js';

export type { ShatterState } from './shatter-phase.js';

const PHASE_LABEL = { live: 'live', flying: 'debris', rewind: 'rewinding' } as const;

/** The pane with every glyph drawn where its particle is, read from the dashboard frozen at the moment it broke. */
function paintDebris(state: ShatterState, width: number, height: number, ctx: BijouContext): Surface {
  const surface = createSurface(width, height);
  surface.fill({ char: ' ', bg: PANE_BG });
  const sim = state.sim;
  if (sim === null) return surface;
  const source = dashboard(state.width, state.height, state.look, state.clock, ctx);
  for (let i = 0; i < sim.x.length; i += 1) {
    const x = Math.round(sim.x[i] ?? 0);
    const y = Math.round(sim.y[i] ?? 0);
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    surface.set(x, y, { ...source.get(sim.hx[i] ?? 0, sim.hy[i] ?? 0), empty: false });
  }
  return surface;
}

function infoPanel(surface: Surface, state: ShatterState, ctx: BijouContext): void {
  const rects = layout(surface.width, surface.height);
  const rightEdge = rects.header.x + rects.header.w;
  stampPanel(surface, [
    '  ***  SHATTER  ***',
    '─'.repeat(24),
    `  ${PHASE_LABEL[state.phase]} · ${state.sim === null ? 'whole' : `${String(state.sim.x.length)} glyphs`}`,
    `  frames ${String(state.phase === 'rewind' ? state.cursor : state.history.length)} · auto ${state.auto ? 'on' : 'off'}`,
    '─'.repeat(24),
    '  S shatter   R rewind',
    '  A auto      H hide',
    '  POINTER shoves debris',
  ], ctx, (free) => (free.x >= rightEdge + 1
    ? { x: Math.max(0, free.x - 1), y: 1 }
    : { x: Math.max(0, free.x - 1), y: Math.max(0, free.y - 1) }));
}

export const shatter: Demo<ShatterState> = {
  id: 'shatter',
  name: 'Shatter',
  description: 'Your UI is made of matter: a live dashboard breaks into glyph debris, then rewinds itself',
  keys: 's shatters, r rewinds, move the pointer to shove debris, a auto-loop, h hides the panel, space pause',
  // An 80 by 24 pane until the host says how big it is, like the star field.
  init: (seed) => initial(seed, 80, 24),
  update(msg, state) {
    if (msg.type === 'resize') return resize(state, msg.width, msg.height);
    if (msg.type === 'pulse') return pulse(state, msg.dt);
    if (msg.type === 'pointer') return point(state, { col: msg.col, row: msg.row });
    if (msg.type === 'pointer-leave') return { ...state, pointer: null, push: null };
    if (msg.key === 's') return smash(state);
    if (msg.key === 'r') return rewind(state);
    if (msg.key === 'a') return { ...state, auto: !state.auto, phaseTime: 0, calm: 0 };
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = state.phase === 'live'
      ? dashboard(width, height, state.look, state.clock, ctx)
      : paintDebris(state, width, height, ctx);
    if (!state.hideUI) infoPanel(surface, state, ctx);
    return surface;
  },
};

export const shatterDemo = defineDemo(shatter);

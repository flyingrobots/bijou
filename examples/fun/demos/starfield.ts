// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface, type Surface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { emptyTrail, seedStars, step, type Stars, type Trail } from './starfield-sim.js';

export interface StarfieldState {
  readonly stars: Stars;
  readonly trail: Trail;
  readonly seed: number;
  /** Multiplies the original's speed: `+` and `-` double or halve it, between 1/4 and 8. */
  readonly warp: number;
  /** The pointer in pane cells moves the vanishing point; null keeps it centred. */
  readonly pointer: { readonly col: number; readonly row: number } | null;
  readonly hideUI: boolean;
}

/** Stars in the field. The original draws 10,000 on 1152 px; a braille pane has far fewer dots. */
export const STAR_COUNT = 1500;
const MIN_WARP = 0.25;
const MAX_WARP = 8;
/** A dot dimmer than this is off. */
const VISIBLE = 0.04;
/** Braille bit for the dot at (column, row) of a cell. */
const BITS = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]] as const;

function centre(state: StarfieldState): readonly [number, number] {
  const { trail, pointer } = state;
  if (pointer === null) return [trail.width / 2, trail.height / 2];
  return [Math.max(0, Math.min(trail.width, pointer.col * 2 + 1)), Math.max(0, Math.min(trail.height, pointer.row * 4 + 2))];
}

function lightAt(trail: Trail, px: number, py: number, width: number, height: number): number {
  if (trail.width === 0 || trail.height === 0) return 0;
  const tx = Math.min(trail.width - 1, Math.floor((px * trail.width) / width));
  const ty = Math.min(trail.height - 1, Math.floor((py * trail.height) / height));
  return trail.light[ty * trail.width + tx] ?? 0;
}

/** Paint the trail as white braille on black, each cell as bright as its brightest dot. */
export function paintTrail(surface: Surface, trail: Trail): void {
  const dotsWide = surface.width * 2;
  const dotsHigh = surface.height * 4;
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = 0; x < surface.width; x += 1) {
      let mask = 0;
      let brightest = 0;
      for (let dy = 0; dy < 4; dy += 1) {
        for (let dx = 0; dx < 2; dx += 1) {
          const light = lightAt(trail, x * 2 + dx, y * 4 + dy, dotsWide, dotsHigh);
          if (light < VISIBLE) continue;
          mask |= BITS[dy]?.[dx] ?? 0;
          brightest = Math.max(brightest, light);
        }
      }
      const level = Math.round(255 * Math.min(1, brightest));
      surface.setRGB(x, y, mask === 0 ? ' ' : String.fromCharCode(0x2800 + mask), level, level, level, 0, 0, 0);
    }
  }
}

const warpBy = (state: StarfieldState, factor: number): StarfieldState =>
  ({ ...state, warp: Math.max(MIN_WARP, Math.min(MAX_WARP, state.warp * factor)) });

export const starfield: Demo<StarfieldState> = {
  id: 'starfield',
  name: 'Star Field',
  description: 'Stars rush past the viewer and leave fading trails, after Mike Bostock\'s d3 star field',
  keys: 'move the pointer to steer, + and - warp speed, h hides the panel, space pause',
  init(seed) {
    const [stars, next] = seedStars(STAR_COUNT, seed);
    // An 80 by 24 trail until the host says how big the pane is; the view scales the trail to whatever it paints.
    return { stars, trail: emptyTrail(80, 24), seed: next, warp: 1, pointer: null, hideUI: false };
  },
  update(msg, state) {
    if (msg.type === 'resize') return { ...state, trail: emptyTrail(msg.width, msg.height) };
    if (msg.type === 'pointer') return { ...state, pointer: { col: msg.col, row: msg.row } };
    if (msg.type === 'pointer-leave') return { ...state, pointer: null };
    if (msg.type === 'pulse') {
      const [stars, trail, seed] = step(state.stars, state.trail, state.seed, msg.dt * 60, state.warp, centre(state));
      return { ...state, stars, trail, seed };
    }
    if (msg.key === '+' || msg.key === '=') return warpBy(state, 2);
    if (msg.key === '-') return warpBy(state, 0.5);
    return msg.key === 'h' ? { ...state, hideUI: !state.hideUI } : state;
  },
  view(state, { width, height, ctx }) {
    const surface = createSurface(width, height);
    paintTrail(surface, state.trail);
    if (!state.hideUI) {
      stampPanel(surface, [
        '  ***  STAR FIELD  ***  ',
        '─'.repeat(28),
        `  Stars : ${String(STAR_COUNT)}`,
        `  Warp  : ${String(state.warp)}x`,
        '─'.repeat(28),
        '  - MOVE POINTER : Steer',
        '  - + / -        : Warp speed',
        '  - H            : Hide panel',
        '  - [Space]      : Pause/Resume',
      ], ctx, (free) => ({ x: Math.max(0, Math.min(4, free.x - 2)), y: Math.max(0, free.y - 1) }));
    }
    return surface;
  },
};

export const starfieldDemo = defineDemo(starfield);

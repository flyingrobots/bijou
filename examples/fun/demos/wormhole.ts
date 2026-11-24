// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface, type Surface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { stampPanel } from '../panel.js';
import { nextRandom } from '../random.js';
import { funnelHeight, project, wireframe } from './wormhole-geometry.js';
import { shade, type RenderMode } from './wormhole-shade.js';

/** A speck on its way down the funnel: `progress` from 0 at the rim to 1 at the mouth. */
interface Particle {
  readonly angle: number;
  readonly speed: number;
  readonly progress: number;
}

interface State {
  readonly particles: readonly Particle[];
  readonly mode: RenderMode;
  /** The generator seed: reseeded each time a particle respawns. */
  readonly seed: number;
}

const COUNT = 45;

function spawn(seed: number): readonly [Particle, number] {
  const [angle, s1] = nextRandom(seed);
  const [speed, s2] = nextRandom(s1);
  const [progress, s3] = nextRandom(s2);
  return [{ angle: angle * Math.PI * 2, speed: 0.005 + speed * 0.01, progress }, s3];
}

function advance(state: State, dt: number): State {
  let seed = state.seed;
  const particles = state.particles.map((particle) => {
    const progress = particle.progress + particle.speed * dt * 60;
    if (progress < 1) return { ...particle, progress };
    const [angle, next] = nextRandom(seed);
    seed = next;
    return { ...particle, angle: angle * Math.PI * 2, progress: 0 };
  });
  return { ...state, particles, seed };
}

function paintParticles(surface: Surface, particles: readonly Particle[]): void {
  for (const { angle, progress } of particles) {
    const r = 1 + 24 * progress * progress;
    const a = angle + progress * 0.25;
    const at = project(r * Math.cos(a), funnelHeight(r), 12 + r * Math.sin(a), surface.width, surface.height);
    if (at === null) continue;
    const x = Math.round(at.sx / 2);
    const y = Math.round(at.sy / 4);
    if (x < 0 || x >= surface.width || y < 0 || y >= surface.height) continue;
    const bg = surface.get(x, y).bgRGB ?? [0, 0, 0];
    const light = Math.round(progress * 155 + 100);
    const glyph = progress < 0.35 ? '.' : progress < 0.65 ? '•' : '*';
    surface.setRGB(x, y, glyph, light, Math.round(light * 0.95), Math.round(light * 0.75), bg[0], bg[1], bg[2]);
  }
}

const wormhole: Demo<State> = {
  id: 'wormhole',
  name: 'Retro Wormhole',
  description: 'Perspective rings and vector lines with drifting depth particles',
  keys: 'm render mode, space pause',
  init(seed) {
    let rng = seed;
    const particles: Particle[] = [];
    for (let i = 0; i < COUNT; i += 1) {
      const [particle, next] = spawn(rng);
      rng = next;
      particles.push(particle);
    }
    return { particles, mode: 'braille', seed: rng };
  },
  update(msg, state) {
    if (msg.type === 'pulse') return advance(state, msg.dt);
    if (msg.type === 'key' && msg.key === 'm') return { ...state, mode: state.mode === 'braille' ? 'ascii' : 'braille' };
    return state;
  },
  view(state, { width, height, frame, elapsed, ctx }) {
    const surface = createSurface(width, height);
    shade(surface, wireframe(width, height, elapsed), elapsed, state.mode);
    paintParticles(surface, state.particles);
    stampPanel(surface, [
      '  ***  BIJOU ART CHALLENGE #02  ***  ',
      '─'.repeat(37),
      '  Name:        Retro Wormhole Mesh',
      `  Viewport:    ${String(width)}x${String(height)}`,
      `  Particles:   ${String(state.particles.length)}`,
      `  Frame:       ${String(frame)}`,
      `  Mode:        ${state.mode.toUpperCase()}`,
    ], ctx, (free) => ({ x: Math.floor(free.x / 2), y: Math.floor(free.y * 0.15) }));
    return surface;
  },
};

export const wormholeDemo = defineDemo(wormhole);

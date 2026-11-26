import { describe, expect, it } from 'vitest';
import { flipFluid, flipFluidDemo, startFlip } from '../examples/fun/demos/flip.js';
import { pourParticles } from '../examples/fun/demos/flip-simulate.js';
import { fluid, fluidDemo } from '../examples/fun/demos/fluid.js';
import type { DemoEntry, DemoMsg } from '../examples/fun/contract.js';
import { cellsOf, digest, feed, funContext, lcg, mountEntry } from './helpers/fun-demos.js';
import { pulse, seededInputs } from './helpers/fun-fluid.js';

const key = (name: string): DemoMsg => ({ type: 'key', key: name });
const steps = (count: number): DemoMsg[] => Array.from({ length: count }, () => pulse);

describe('the fluid demos with no fluid', () => {
  it('the particle fluid starts empty, paints, and steps with nothing to move', () => {
    const state = steps(10).reduce((s, m) => fluid.update(m, s), fluid.init(1));
    expect(state.particles).toHaveLength(0);
    expect(cellsOf(feed(mountEntry(fluidDemo), steps(10)).view(80, 24, funContext(80, 24)))).toHaveLength(80 * 24);
  });

  it('a dam break with zero particles stays finite and paints', () => {
    const empty = startFlip(1, 0);
    expect(empty.fluid.numParticles).toBe(0);
    const state = steps(10).reduce((s, m) => flipFluid.update(m, s), empty);
    expect(state.fluid.numParticles).toBe(0);
    expect(Array.from(state.fluid.u).every(Number.isFinite)).toBe(true);
    expect(flipFluid.view(state, { width: 80, height: 24, frame: 10, elapsed: 1, ctx: funContext(80, 24) }).width).toBe(80);
  });
});

describe('the fluid demos with a shake at the first step', () => {
  it('shaking an empty tank does nothing', () => {
    const shaken = feed(mountEntry(fluidDemo), [key('z'), pulse, key('x'), key('c'), pulse]);
    const after = feed(mountEntry(fluidDemo), steps(2));
    expect(digest(shaken.view(80, 24, funContext(80, 24)))).toBe(digest(after.view(80, 24, funContext(80, 24))));
  });

  it('shaking the dam break on its first pulse gives finite positions that differ from the unshaken run', () => {
    const shaken = [key('x'), ...steps(20)].reduce((s, m) => flipFluid.update(m, s), flipFluid.init(1));
    const calm = steps(20).reduce((s, m) => flipFluid.update(m, s), flipFluid.init(1));
    const n = shaken.fluid.numParticles * 2;
    expect(Array.from(shaken.fluid.particlePos.slice(0, n)).every(Number.isFinite)).toBe(true);
    expect(Array.from(shaken.fluid.particlePos.slice(0, n))).not.toEqual(Array.from(calm.fluid.particlePos.slice(0, n)));
  });
});

describe('the fluid demos painted in panes of other sizes', () => {
  const sizes: readonly (readonly [number, number])[] = [[80, 24], [30, 8], [177, 53], [1, 1], [120, 40]];
  const script: DemoMsg[] = [...Array.from({ length: 20 }, () => [key('p'), pulse]).flat(), ...steps(5)];
  for (const entry of [fluidDemo, flipFluidDemo]) {
    it(`${entry.id} paints every size and keeps its fluid as it was (a view never changes the state)`, () => {
      const plain = feed(mountEntry(entry), script);
      for (const [width, height] of sizes) {
        const surface = plain.view(width, height, funContext(width, height));
        expect([surface.width, surface.height]).toEqual([width, height]);
      }
      const twin = feed(mountEntry(entry), script);
      expect(digest(plain.view(80, 24, funContext(80, 24)))).toBe(digest(twin.view(80, 24, funContext(80, 24))));
    });
  }
});

describe('the fluid demos when the shell sizes the tank', () => {
  const poured = (entry: DemoEntry, size: DemoMsg): ReturnType<typeof mountEntry> =>
    feed(mountEntry(entry), [size, ...Array.from({ length: 12 }, () => [key('p'), pulse]).flat()]);

  it('the particle fluid keeps its particles when the pane changes, and holds them in the new walls', () => {
    const big = fluid.update({ type: 'resize', width: 177, height: 53 }, fluid.init(3));
    const before = [...Array.from({ length: 20 }, () => [key('p'), pulse]).flat()].reduce((s, m) => fluid.update(m, s), big);
    const small = fluid.update({ type: 'resize', width: 30, height: 12 }, before);
    expect(small.particles).toEqual(before.particles);
    const settled = steps(5).reduce((s, m) => fluid.update(m, s), small);
    expect(settled.particles.every((p) => p.x <= 28.5 && p.y <= 10.5)).toBe(true);
  });

  it('the dam break starts again at the new size, as the original did, and keeps its source and obstacle', () => {
    const moved = [key('t'), key('w')].reduce((s, m) => flipFluid.update(m, s), flipFluid.init(3));
    const grown = flipFluid.update({ type: 'resize', width: 120, height: 40 }, steps(3).reduce((s, m) => flipFluid.update(m, s), moved));
    expect([grown.fluid.fNumX, grown.fluid.fNumY]).toEqual([120, 40]);
    expect(grown.fluid.numParticles).toBe(startFlip(3, Infinity, { width: 120, height: 40 }).fluid.numParticles);
    expect([grown.source, grown.obstacle]).toEqual([moved.source, moved.obstacle]);
    expect(flipFluid.update({ type: 'resize', width: 120, height: 40 }, grown)).toBe(grown);
  });

  it('a large pane gives the dam break no more particles than its buffer', () => {
    expect(startFlip(1, Infinity, { width: 400, height: 120 }).fluid.numParticles).toBeLessThanOrEqual(8000);
  });

  it('a tiny pane is held to the smallest tank the solvers work in', () => {
    const tiny: DemoMsg = { type: 'resize', width: 1, height: 1 };
    for (const entry of [fluidDemo, flipFluidDemo]) {
      const surface = poured(entry, tiny).view(1, 1, funContext(1, 1));
      expect(surface.width).toBe(1);
    }
  });

  it('state is a pure function of the seed, the messages and the sizes', () => {
    const run = (): string => digest(poured(flipFluidDemo, { type: 'resize', width: 60, height: 18 }).view(60, 18, funContext(60, 18)));
    expect(run()).toBe(run());
    expect(run()).not.toBe(digest(poured(flipFluidDemo, { type: 'resize', width: 61, height: 18 }).view(61, 18, funContext(61, 18))));
  });
});

describe('a long pour', () => {
  it('stops the particle fluid at its cap', () => {
    const hold = Array.from({ length: 700 }, () => [key('p'), pulse]).flat();
    const state = hold.reduce((s, m) => fluid.update(m, s), fluid.init(2));
    expect(state.particles).toHaveLength(1500);
  });

  it('stops the dam break at its buffer', () => {
    const { fluid: tank } = startFlip(2);
    let rng = 2;
    for (let i = 0; i < 3000; i += 1) rng = pourParticles(tank, 'left', rng);
    expect(tank.numParticles).toBe(tank.maxParticles);
  });
});

describe('the fluid demos under 5,000 steps of seeded input', () => {
  it('the particle fluid keeps finite positions and a bounded particle count', () => {
    const random = lcg(31);
    let state = fluid.init(31);
    let most = 0;
    for (const [i, msg] of seededInputs(random, 5000).entries()) {
      state = fluid.update(msg, state);
      if (i % 700 === 0) state = fluid.update({ type: 'resize', width: 30 + (i % 9) * 15, height: 8 + (i % 5) * 9 }, state);
      most = Math.max(most, state.particles.length);
    }
    expect(state.particles.every((p) => [p.x, p.y, p.vx, p.vy].every(Number.isFinite))).toBe(true);
    expect(most).toBeLessThanOrEqual(1500);
  });

  it('the dam break keeps finite positions and a bounded particle count', () => {
    // A small tank keeps 5,000 steps quick: the solver's cost is the grid times the particles.
    let state = flipFluid.update({ type: 'resize', width: 24, height: 8 }, flipFluid.init(31));
    let most = 0;
    for (const msg of seededInputs(lcg(32), 5000)) {
      state = flipFluid.update(msg, state);
      most = Math.max(most, state.fluid.numParticles);
    }
    const n = state.fluid.numParticles * 2;
    expect(Array.from(state.fluid.particlePos.slice(0, n)).every(Number.isFinite)).toBe(true);
    expect(Array.from(state.fluid.particleVel.slice(0, n)).every(Number.isFinite)).toBe(true);
    expect(most).toBeLessThanOrEqual(state.fluid.maxParticles);
  });
});

import { describe, expect, it } from 'vitest';
import { flipFluid, flipFluidDemo } from '../examples/fun/demos/flip.js';
import { fluid, fluidDemo } from '../examples/fun/demos/fluid.js';
import type { Demo, DemoEntry, DemoMsg } from '../examples/fun/contract.js';
import { GOLDENS } from './fixtures/examples-fun-goldens.js';
import { byId, digest, feed, funContext, lcg, mountEntry } from './helpers/fun-demos.js';
import { fluidScript, numbersHash, pulse, seededInputs } from './helpers/fun-fluid.js';

interface Case<S> {
  readonly name: string;
  readonly demo: Demo<S>;
  readonly entry: DemoEntry;
  readonly hash: (state: S) => string;
}

const fluidCase: Case<ReturnType<typeof fluid.init>> = {
  name: 'fluid', demo: fluid, entry: fluidDemo,
  hash: (state) => numbersHash(state.particles.flatMap((p) => [[p.x, p.y, p.vx, p.vy]])),
};
const flipCase: Case<ReturnType<typeof flipFluid.init>> = {
  name: 'flip-fluid', demo: flipFluid, entry: flipFluidDemo,
  hash: (state) => numbersHash([state.fluid.particlePos, state.fluid.particleVel, state.fluid.u, state.fluid.v]),
};

function run<S>(demo: Demo<S>, seed: number, messages: readonly DemoMsg[]): S {
  return messages.reduce((state, msg) => demo.update(msg, state), demo.init(seed));
}

describe('the fluid demos are registered with their ids', () => {
  it('the registry lists both fluid demos after the first three', () => {
    expect(byId('fluid').name).toBe(fluidDemo.name);
    expect(byId('flip-fluid').name).toBe(flipFluidDemo.name);
  });
});

function suite<S>(c: Case<S>): void {
  describe(`the ${c.name} demo from a fixed seed and a scripted input`, () => {
    const script = [...(fluidScript(c.name) ?? []), ...Array.from({ length: 240 }, () => pulse)];
    it(`${c.name} reaches the recorded state hash after 300 steps, and the same one on every run`, () => {
      const first = c.hash(run(c.demo, 1888, script));
      expect(first).toBe(c.hash(run(c.demo, 1888, script)));
      expect(first).toBe(GOLDENS[`${c.name} state after 300 steps`]);
    });

    it(`${c.name} gives two instances no shared state`, () => {
      const a = c.entry.mount(1888);
      const b = c.entry.mount(1888);
      const ctx = funContext(80, 24);
      const moved = feed(a, script);
      expect(digest(b.view(80, 24, ctx))).toBe(digest(mountEntry(c.entry).view(80, 24, ctx)));
      expect(digest(moved.view(80, 24, ctx))).not.toBe(digest(b.view(80, 24, ctx)));
      const fresh = c.entry.mount(1888);
      expect(digest(fresh.view(80, 24, ctx))).toBe(digest(b.view(80, 24, ctx)));
    });

    it(`${c.name} ignores the pulse dt: the step is fixed`, () => {
      const slow: DemoMsg[] = script.map((m) => (m.type === 'pulse' ? { type: 'pulse', dt: 0.5 } : m));
      expect(c.hash(run(c.demo, 7, slow))).toBe(c.hash(run(c.demo, 7, script)));
    });

    it(`${c.name} reads its randomness from the seed`, () => {
      expect(c.hash(run(c.demo, 1, script))).not.toBe(c.hash(run(c.demo, 2, script)));
    });

    it(`${c.name} follows a seeded input list to the same state twice`, () => {
      const inputs = seededInputs(lcg(5), 300);
      expect(c.hash(run(c.demo, 3, inputs))).toBe(c.hash(run(c.demo, 3, inputs)));
    });

    it(`${c.name} resets to its start on r`, () => {
      const reset = c.demo.update({ type: 'key', key: 'r' }, run(c.demo, 9, script));
      expect(c.hash(reset)).toBe(c.hash(c.demo.init(9)));
    });
  });
}

suite(fluidCase);
suite(flipCase);

describe('the fluid demos controls', () => {
  it('pouring adds fluid, from the side that t picks', () => {
    const pour = (side: readonly DemoMsg[]): ReturnType<typeof fluid.init> =>
      run(fluid, 4, [...side, { type: 'key', key: 'p' }, pulse, pulse, pulse]);
    const left = pour([]);
    const right = pour([{ type: 'key', key: 't' }]);
    expect(left.particles.length).toBeGreaterThan(0);
    expect(left.particles.every((p) => p.x < 40)).toBe(true);
    expect(right.particles.every((p) => p.x > 40)).toBe(true);
  });

  it('the dam break pours and moves its obstacle', () => {
    const base = run(flipFluid, 4, [pulse]);
    const poured = run(flipFluid, 4, [{ type: 'key', key: 'p' }, pulse]);
    const moved = run(flipFluid, 4, [{ type: 'key', key: 'w' }, pulse]);
    expect(poured.fluid.numParticles).toBeGreaterThan(base.fluid.numParticles);
    expect(moved.obstacle.y).toBeGreaterThan(base.obstacle.y);
    expect(run(flipFluid, 4, [{ type: 'key', key: 'a' }]).obstacle.x).toBeLessThan(0.5);
  });

  it('a session paused by space keeps its fluid and still takes keys', () => {
    const session = feed(fluidDemo.mount(1), [{ type: 'key', key: 'space' }, { type: 'key', key: 'p' }, pulse, pulse]);
    expect(session.paused).toBe(true);
    expect(session.frame).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { demos } from '../examples/fun/registry.js';
import { byId, digest, textOf, feed, funContext, lcg, mountEntry, pulses } from './helpers/fun-demos.js';

describe('the bijou-fun demos at the edges', () => {
  for (const entry of demos) {
    it(`${entry.id} paints a one-cell pane without throwing`, () => {
      const surface = feed(mountEntry(entry), pulses(5)).view(1, 1, funContext(1, 1));
      expect([surface.width, surface.height]).toEqual([1, 1]);
    });

    it(`${entry.id} stands still while paused and moves again on resume`, () => {
      const ctx = funContext(80, 24);
      const running = feed(mountEntry(entry), pulses(10));
      const paused = feed(running, [{ type: 'key', key: 'space' }]);
      expect(paused.paused).toBe(true);
      const held = feed(paused, pulses(20));
      expect(digest(held.view(80, 24, ctx))).toBe(digest(paused.view(80, 24, ctx)));
      const resumed = feed(held, [{ type: 'key', key: 'space' }, ...pulses(20)]);
      expect(resumed.paused).toBe(false);
      expect(resumed.frame).toBe(30);
      if (entry.id !== 'rainbow-gradient') {
        expect(digest(resumed.view(80, 24, ctx))).not.toBe(digest(held.view(80, 24, ctx)));
      }
    });
  }

  it('the metaballs ignore a pointer outside the pane', () => {
    const ctx = funContext(80, 24);
    const base = feed(byId('metaballs').mount(1), pulses(10));
    const outside = feed(base, [{ type: 'pointer', col: -5, row: 400 }]);
    const inside = feed(base, [{ type: 'pointer', col: 40, row: 12 }]);
    expect(digest(outside.view(80, 24, ctx))).toBe(digest(base.view(80, 24, ctx)));
    expect(digest(inside.view(80, 24, ctx))).not.toBe(digest(base.view(80, 24, ctx)));
    const left = feed(inside, [{ type: 'pointer-leave' }]);
    expect(digest(left.view(80, 24, ctx))).toBe(digest(base.view(80, 24, ctx)));
  });

  it('the wormhole toggles between braille and ascii on m', () => {
    const ctx = funContext(80, 24);
    const braille = feed(byId('wormhole').mount(1), pulses(3));
    const ascii = feed(braille, [{ type: 'key', key: 'm' }]);
    const text = (s: typeof braille): string => textOf(s.view(80, 24, ctx));
    expect(text(braille)).toMatch(/[⠁-⣿]/u);
    expect(text(ascii)).not.toMatch(/[⠁-⣿]/u);
  });
});

describe('the bijou-fun demos under 1,000 pulses with seeded pointer moves', () => {
  for (const entry of demos) {
    it(`${entry.id} neither throws nor grows the heap without bound`, () => {
      const ctx = funContext(80, 24);
      const random = lcg(888);
      let session = mountEntry(entry);
      const before = process.memoryUsage().heapUsed;
      for (let i = 0; i < 1000; i += 1) {
        session = session.update({ type: 'pulse', dt: 1 / 30 });
        session = session.update({ type: 'pointer', col: Math.floor(random() * 120) - 20, row: Math.floor(random() * 40) - 8 });
        if (i % 100 === 0) expect(session.view(80, 24, ctx).width).toBe(80);
      }
      expect(session.frame).toBe(1000);
      expect(process.memoryUsage().heapUsed - before).toBeLessThan(96 * 1024 * 1024);
    });
  }
});

import { describe, expect, it } from 'vitest';
import { demos } from '../examples/fun/registry.js';
import type { DemoMsg } from '../examples/fun/contract.js';
import { GOLDENS } from './fixtures/examples-fun-goldens.js';
import { SEED, byId, digest, feed, funContext, mountEntry, pulses } from './helpers/fun-demos.js';

const SIZES: readonly (readonly [number, number])[] = [[80, 24], [177, 53]];

function script(id: string, width: number, height: number): DemoMsg[] {
  const middle: DemoMsg[] = id === 'wormhole'
    ? [{ type: 'key', key: 'm' }]
    : id === 'metaballs' ? [{ type: 'pointer', col: Math.floor(width / 3), row: Math.floor(height / 2) }] : [];
  return [...pulses(30), ...middle, ...pulses(30)];
}

describe('the bijou-fun demos at a fixed size, seed and frame', () => {
  it('the registry lists the three ported demos in order', () => {
    expect(demos.map((entry) => entry.id)).toEqual(['rainbow-gradient', 'wormhole', 'metaballs']);
  });

  for (const entry of demos) {
    for (const [width, height] of SIZES) {
      const label = `${entry.id} ${String(width)}x${String(height)}`;
      it(`${entry.id} paints its recorded frames at ${String(width)}x${String(height)}`, () => {
        const ctx = funContext(width, height);
        const start = mountEntry(entry);
        const later = feed(start, script(entry.id, width, height));
        expect({
          [`${label} start`]: digest(start.view(width, height, ctx)),
          [`${label} frame 60`]: digest(later.view(width, height, ctx)),
        }).toEqual({
          [`${label} start`]: GOLDENS[`${label} start`],
          [`${label} frame 60`]: GOLDENS[`${label} frame 60`],
        });
      });
    }

    it(`${entry.id} repeats itself: the same seed and messages give the same frame`, () => {
      const ctx = funContext(80, 24);
      const a = feed(mountEntry(entry), script(entry.id, 80, 24)).view(80, 24, ctx);
      const b = feed(entry.mount(SEED), script(entry.id, 80, 24)).view(80, 24, ctx);
      expect(digest(a)).toBe(digest(b));
    });
  }

  it('the wormhole particles depend on the seed', () => {
    const ctx = funContext(80, 24);
    const a = feed(byId('wormhole').mount(1), pulses(10)).view(80, 24, ctx);
    const b = feed(byId('wormhole').mount(2), pulses(10)).view(80, 24, ctx);
    expect(digest(a)).not.toBe(digest(b));
  });
});

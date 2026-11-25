import { describe, expect, it } from 'vitest';
import { demos } from '../examples/fun/registry.js';
import { raymarcher } from '../examples/fun/demos/raymarcher.js';
import { raytracer } from '../examples/fun/demos/raytracer.js';
import { byId, digest, feed, funContext, mountEntry, pulses, textOf } from './helpers/fun-demos.js';
import { repeatKey } from './helpers/fun-3d.js';

const IDS = ['raymarcher', 'raycaster', 'raytracer'];
const press = (id: string, key: string, count = 1): ReturnType<typeof feed> => feed(byId(id).mount(7), repeatKey(key, count));

describe('the three 3D demos', () => {
  it('the registry lists the raymarcher, the raycaster and the raytracer', () => {
    expect(demos.map((entry) => entry.id)).toEqual(expect.arrayContaining(IDS));
  });

  for (const id of IDS) {
    it(`${id} paints a one-row pane at several widths`, () => {
      for (const width of [1, 5, 80]) {
        const surface = feed(mountEntry(byId(id)), pulses(3)).view(width, 1, funContext(width, 1));
        expect([surface.width, surface.height]).toEqual([width, 1]);
      }
    });

    it(`${id} paints the same frame twice from the same state`, () => {
      const session = feed(mountEntry(byId(id)), pulses(4));
      const ctx = funContext(60, 20);
      expect(digest(session.view(60, 20, ctx))).toBe(digest(session.view(60, 20, ctx)));
    });

    it(`${id} h hides the heads-up panel and a second h brings it back`, () => {
      const ctx = funContext(100, 36);
      const shown = feed(mountEntry(byId(id)), pulses(2));
      const hidden = feed(shown, repeatKey('h', 1));
      const again = feed(hidden, repeatKey('h', 1));
      expect(digest(hidden.view(100, 36, ctx))).not.toBe(digest(shown.view(100, 36, ctx)));
      expect(digest(again.view(100, 36, ctx))).toBe(digest(shown.view(100, 36, ctx)));
    });
  }

  it('the raymarcher light follows w, s, a and d and stops at the edge of the unit square', () => {
    const start = raymarcher.init(1);
    const moved = (key: string, count: number) => repeatKey(key, count).reduce((s, msg) => raymarcher.update(msg, s), start);
    expect(moved('w', 3).lightY).toBeCloseTo(start.lightY + 0.12);
    expect(moved('d', 3).lightX).toBeCloseTo(start.lightX + 0.09);
    expect(moved('s', 3).lightY).toBeCloseTo(start.lightY - 0.12);
    expect(moved('a', 3).lightX).toBeCloseTo(start.lightX - 0.09);
    expect([moved('w', 99).lightY, moved('s', 99).lightY, moved('a', 99).lightX, moved('d', 99).lightX]).toEqual([0.95, 0.05, 0.05, 0.95]);
    expect(moved('up', 2)).toEqual(moved('w', 2));
  });

  it('the raymarcher paints a different frame once the light has moved', () => {
    const ctx = funContext(80, 24);
    expect(digest(press('raymarcher', 'd', 5).view(80, 24, ctx))).not.toBe(digest(press('raymarcher', 'a', 5).view(80, 24, ctx)));
  });

  it('the raytracer camera distance stops at both limits, on keys', () => {
    const start = raytracer.init(1);
    const zoom = (key: string, count: number) => repeatKey(key, count).reduce((s, msg) => raytracer.update(msg, s), start).distance;
    expect(start.distance).toBe(4.3);
    expect([zoom('+', 50), zoom('=', 50), zoom('-', 50)]).toEqual([1.5, 1.5, 10]);
    expect(zoom('+', 1)).toBeCloseTo(4.05);
    expect(zoom('-', 1)).toBeCloseTo(4.55);
  });

  it('the raytracer dithering depends on the seed and on nothing else', () => {
    const ctx = funContext(40, 12);
    const at = (seed: number) => digest(feed(byId('raytracer').mount(seed), pulses(3)).view(40, 12, ctx));
    expect(at(1)).toBe(at(1));
    expect(at(1)).not.toBe(at(2));
  });

  it('the raytracer tilts with the pointer and keeps the tilt when the pointer leaves', () => {
    const ctx = funContext(60, 20);
    const base = feed(byId('raytracer').mount(3), pulses(2));
    const tilted = feed(base, [{ type: 'pointer', col: 50, row: 3 }]);
    const left = feed(tilted, [{ type: 'pointer-leave' }]);
    expect(digest(tilted.view(60, 20, ctx))).not.toBe(digest(base.view(60, 20, ctx)));
    expect(digest(left.view(60, 20, ctx))).toBe(digest(tilted.view(60, 20, ctx)));
    expect(textOf(tilted.view(60, 20, ctx)).length).toBe(60 * 20);
  });
});

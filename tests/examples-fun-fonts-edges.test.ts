import { describe, expect, it } from 'vitest';
import { demosWithFonts } from '../examples/fun/registry.js';
import { loadTypeface } from '../examples/fun/demos/typeface.js';
import { SEED, digest, feed, funContext, lcg, pulses, textOf } from './helpers/fun-demos.js';
import { FONT_IDS, face, fontEntry, key } from './helpers/fun-font.js';

const MISSING = 'Error: TTF Font file missing or failed to parse.';

function printable(random: () => number, length: number): string {
  return Array.from({ length }, () => String.fromCharCode(32 + Math.floor(random() * 95))).join('');
}

describe('the font demos at the edges', () => {
  for (const id of FONT_IDS) {
    it(`${id} paints a one-cell pane without throwing`, () => {
      const surface = feed(fontEntry(id).mount(SEED), pulses(5)).view(1, 1, funContext(1, 1));
      expect([surface.width, surface.height]).toEqual([1, 1]);
    });

    it(`${id} paints an empty message, a missing character and a lone surrogate without throwing`, () => {
      const ctx = funContext(80, 24);
      for (const message of ['', ' ', 'é€ж漢', '\ud83d', 'a😀b']) {
        const surface = feed(fontEntry(id, message).mount(SEED), pulses(20)).view(80, 24, ctx);
        expect([surface.width, surface.height]).toEqual([80, 24]);
      }
    });

    it(`${id} stands still while paused and moves again on resume`, () => {
      const ctx = funContext(80, 24);
      const paused = feed(fontEntry(id).mount(SEED), [...pulses(10), key('space')]);
      expect(paused.paused).toBe(true);
      const held = feed(paused, pulses(20));
      expect(digest(held.view(80, 24, ctx))).toBe(digest(paused.view(80, 24, ctx)));
      const resumed = feed(held, [key('space'), ...pulses(20)]);
      expect(digest(resumed.view(80, 24, ctx))).not.toBe(digest(held.view(80, 24, ctx)));
    });

    it(`${id} types a space while typing instead of pausing`, () => {
      const typing = feed(fontEntry(id).mount(SEED), [key('r'), key('i'), key('a'), key('space'), key('b')]);
      expect(typing.paused).toBe(false);
      expect(textOf(typing.view(100, 30, funContext(100, 30)))).toContain('"a b"');
    });

    it(`${id} paints seeded printable messages of up to 200 characters without throwing`, () => {
      const random = lcg(891);
      const ctx = funContext(80, 24);
      for (let round = 0; round < 12; round += 1) {
        const message = printable(random, Math.floor(random() * 201));
        const session = feed(fontEntry(id, message).mount(SEED), pulses(3));
        expect(session.view(80, 24, ctx).width).toBe(80);
      }
    });

    it(`${id} answers a seeded storm of keys without throwing`, () => {
      const random = lcg(8910);
      let session = fontEntry(id).mount(SEED);
      for (let i = 0; i < 400; i += 1) {
        session = session.update(random() < 0.3 ? { type: 'pulse', dt: 1 / 30 } : key(printable(random, 1).replace(' ', 'space')));
      }
      expect(session.view(80, 24, funContext(80, 24)).height).toBe(24);
    });
  }
});

describe('the font demos when the font does not arrive', () => {
  const failures: readonly (readonly [string, () => Promise<ArrayBuffer | Uint8Array>])[] = [
    ['a port that rejects', () => Promise.reject(new Error('offline'))],
    ['a port that throws', () => { throw new Error('no network'); }],
    ['bytes that are no font', () => Promise.resolve(new Uint8Array([1, 2, 3, 4]))],
    ['no bytes at all', () => Promise.resolve(new Uint8Array(0))],
  ];

  for (const [label, port] of failures) {
    it(`shows a message in the pane for ${label}, and never throws`, async () => {
      const missing = await loadTypeface(port);
      for (const id of FONT_IDS) {
        const entry = demosWithFonts(missing).find((candidate) => candidate.id === id);
        const pane = textOf((entry?.mount(SEED) ?? fontEntry(id).mount(SEED)).view(80, 24, funContext(80, 24)));
        expect(pane).toContain(MISSING);
        expect(entry?.mount(SEED).update(key('i')).update(key('a')).view(1, 1, funContext(1, 1)).width).toBe(1);
      }
    });
  }

  it('says why in the pane when the port gave a reason', async () => {
    const missing = await loadTypeface(() => Promise.reject(new Error('offline')));
    const entry = demosWithFonts(missing).find((candidate) => candidate.id === 'font-renderer');
    expect(textOf((entry?.mount(SEED) ?? fontEntry('font-renderer').mount(SEED)).view(100, 24, funContext(100, 24)))).toContain('offline');
  });

  it('keeps a face that loaded', () => {
    expect(face.status).toBe('ready');
  });
});

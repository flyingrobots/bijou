import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderFrameText } from '../scripts/frame-assertions.js';
import { demosWithFonts } from '../examples/fun/registry.js';
import { FONT_GOLDENS } from './fixtures/examples-fun-font-goldens.js';
import { SEED, digest, feed, funContext, pulses, textOf } from './helpers/fun-demos.js';
import { FONT_IDS, face, fontEntry, fontScript, key } from './helpers/fun-font.js';

const SIZES: readonly (readonly [number, number])[] = [[80, 24], [177, 53]];
const FRAMES = join(import.meta.dirname, 'fixtures', 'examples-fun', 'frames');

describe('the two font demos of bijou-fun', () => {
  it('the registry lists both after the demos that need no font', () => {
    expect(demosWithFonts(face).slice(-2).map((entry) => entry.id)).toEqual([...FONT_IDS]);
  });

  for (const id of FONT_IDS) {
    for (const [width, height] of SIZES) {
      const label = `${id} ${String(width)}x${String(height)}`;
      it(`${id} paints its recorded frames at ${String(width)}x${String(height)}`, () => {
        const ctx = funContext(width, height);
        const start = fontEntry(id).mount(SEED);
        const later = feed(start, fontScript());
        expect({
          [`${label} start`]: digest(start.view(width, height, ctx)),
          [`${label} frame 60`]: digest(later.view(width, height, ctx)),
        }).toEqual({ [`${label} start`]: FONT_GOLDENS[`${label} start`], [`${label} frame 60`]: FONT_GOLDENS[`${label} frame 60`] });
      });
    }

    it(`${id} at 80x24 matches tests/fixtures/examples-fun/frames/${id}-80x24.txt`, () => {
      const ctx = funContext(80, 24);
      const frame = feed(fontEntry(id).mount(SEED), fontScript()).view(80, 24, ctx);
      expect(renderFrameText(frame, ctx.style)).toBe(readFileSync(join(FRAMES, `${id}-80x24.txt`), 'utf8'));
    });

    it(`${id} repeats itself: the same seed and messages give the same frame`, () => {
      const ctx = funContext(80, 24);
      const a = feed(fontEntry(id).mount(SEED), fontScript()).view(80, 24, ctx);
      const b = feed(fontEntry(id).mount(SEED), fontScript()).view(80, 24, ctx);
      expect(digest(a)).toBe(digest(b));
    });

    it(`${id} shows the message typed in its own update and the HUD that says so`, () => {
      const ctx = funContext(100, 30);
      const typing = feed(fontEntry(id).mount(SEED), [...pulses(2), key('r'), key('i'), key('shift+h'), key('i'), key('space'), key('1')]);
      expect(textOf(typing.view(100, 30, ctx))).toContain('MODE: [INSERT]');
      expect(textOf(typing.view(100, 30, ctx))).toContain('"Hi 1"');
      const done = feed(typing, [key('escape'), key('h')]);
      expect(textOf(done.view(100, 30, ctx))).not.toContain('MODE:');
      expect(textOf(feed(done, [key('h')]).view(100, 30, ctx))).toContain('MODE: [NORMAL]');
    });

    it(`${id} edits the message with backspace and stops at 24 characters`, () => {
      const ctx = funContext(200, 30);
      const long = feed(fontEntry(id).mount(SEED), [key('r'), key('i'), ...Array.from({ length: 30 }, () => key('x'))]);
      expect(textOf(long.view(200, 30, ctx))).toContain(`"${'x'.repeat(24)}"`);
      const shorter = feed(long, [key('backspace'), key('backspace')]);
      expect(textOf(shorter.view(200, 30, ctx))).toContain(`"${'x'.repeat(22)}"`);
      expect(textOf(feed(fontEntry(id).mount(SEED), [key('r'), key('backspace'), key('i'), key('backspace')]).view(200, 30, ctx))).toContain('""');
    });
  }
});

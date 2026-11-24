import { describe, expect, it } from 'vitest';
import { SEQUENCE } from '../../examples/components/library-nav.js';
import { createHeroApp } from '../../examples/hero/app.js';
import { createClipContext, KEY, recordClip } from '../../examples/hero/clip.js';
import { COLS, PART_COUNT, refusals, ROWS, slidesOfPart } from './app-cell-widths.test-support.js';

describe('the components and hero apps paint only what the canvas contract takes', () => {
  it('the library parts together take every Components library slide exactly once', () => {
    const union = Array.from({ length: PART_COUNT }, (_part, index) => slidesOfPart(index)).flat();
    expect([...union].sort()).toEqual([...SEQUENCE].sort());
  });

  it('the whole hero reel, with the palette open and a theme switch', async () => {
    const clip = createClipContext(COLS, ROWS);
    const perf = () => ({ fps: 60, frameTimeMs: 1, history: [1, 2] });
    const frames = await recordClip(createHeroApp({ ctx: clip.ctx, perf }, { cols: COLS, rows: ROWS }), clip, {
      seconds: 18, fps: 4,
      keys: [[4.6, 'n'], [12.4, ']'], [13.6, 'b'], [14.4, KEY.ctrlP], [14.8, 'a'], [15.6, KEY.enter]],
    });
    expect(refusals(frames, 'hero')).toEqual([]);
  }, 120_000);
});

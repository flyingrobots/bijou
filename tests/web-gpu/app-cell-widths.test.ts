import { isWideUnitGlyph } from '@flyingrobots/geordi-bijou-gpu';
import { describe, expect, it } from 'vitest';
import { isPackedSurface, type Surface } from '../../packages/bijou/src/index.js';
import type { LibraryStart } from '../../examples/components/library-cli.js';
import { SEQUENCE } from '../../examples/components/library-nav.js';
import { createLibraryApp, LIBRARY_CSS } from '../../examples/components/library.js';
import { COMPONENT_STORIES } from '../../examples/docs/stories.js';
import { createHeroApp } from '../../examples/hero/app.js';
import { createClipContext, KEY, recordClip } from '../../examples/hero/clip.js';

// The canvas presenters implement bijou-surface-gpu/1, which is width-1 only:
// a width-2 grapheme is refused with GEORDI_E_BIJOU_UNSUPPORTED_WIDE_GLYPH,
// and mountBijouCanvas() refuses a Surface without packed storage. These
// cases paint what the showcase mounts and look for either.
const COLS = 120;
const ROWS = 36;

function refusals(frames: readonly Surface[], where: string): string[] {
  const found = new Set<string>();
  for (const frame of frames) {
    if (!isPackedSurface(frame)) found.add(`${where}: unpacked Surface`);
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        const { char } = frame.get(x, y);
        if (isWideUnitGlyph(char)) found.add(`${where}: width-2 ${JSON.stringify(char)}`);
      }
    }
  }
  return [...found];
}

/** Where examples/components/record.ts opens each slide. */
function startOf(key: string): LibraryStart {
  if (key === 'title' || key === 'end') return { slide: key };
  if (key.startsWith('family:')) {
    const first = COMPONENT_STORIES.find((story) => story.family === key.slice('family:'.length));
    return { component: first?.id ?? '', slide: 'family' };
  }
  return { component: COMPONENT_STORIES[Number(key.slice('component:'.length))]?.id ?? '', slide: 'component', info: true };
}

describe('the components and hero apps paint only what the canvas contract takes', () => {
  it('every Components library slide, with its info, in each output mode', async () => {
    const found: string[] = [];
    for (const key of SEQUENCE) {
      const clip = createClipContext(COLS, ROWS);
      const keys = ['1', '2', '3', '4'].map((mode, index) => [0.2 + index * 0.2, mode] as const);
      const frames = await recordClip(createLibraryApp(clip.ctx, startOf(key)), clip, { seconds: 1, fps: 5, css: LIBRARY_CSS, keys });
      found.push(...refusals(frames, key));
    }
    expect(found).toEqual([]);
  }, 120_000);

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

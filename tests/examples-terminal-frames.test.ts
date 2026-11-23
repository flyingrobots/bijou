import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { Surface } from '../packages/bijou/src/index.js';
import { surfaceToString } from '../packages/bijou/src/core/render/differ.js';
import type { LibraryStart } from '../examples/components/library-cli.js';
import { createLibraryApp, LIBRARY_CSS } from '../examples/components/library.js';
import { createHeroApp } from '../examples/hero/app.js';
import { createClipContext, KEY, recordClip, type ClipContext } from '../examples/hero/clip.js';

// What the Components library and the hero app paint in a styled terminal,
// frame by frame, pinned by digest. The digests were recorded before their
// data loading moved from file reads to imports (flyingrobots/bijou#809).
// The library digests were recorded again for the Guided flows family
// (flyingrobots/bijou#586): guidedFlow() has its own section, so the deck has
// 59 slides in 15 sections and covers 36 families.
const COLS = 120;
const ROWS = 36;

function digest(frames: readonly Surface[], clip: ClipContext): string {
  const hash = createHash('sha256');
  for (const frame of frames) hash.update(surfaceToString(frame, clip.ctx.style)).update('\n\u0000\n');
  return `${String(frames.length)}:${hash.digest('hex')}`;
}

async function library(start: LibraryStart, keys: readonly (readonly [number, string])[] = []): Promise<string> {
  const clip = createClipContext(COLS, ROWS);
  const frames = await recordClip(createLibraryApp(clip.ctx, start), clip, { seconds: 1.2, fps: 5, css: LIBRARY_CSS, keys });
  return digest(frames, clip);
}

describe('the Components library and the hero app paint what they did before #809', () => {
  it('the library title, a component with its docs and snippet, and the end slide', async () => {
    expect({
      title: await library({ slide: 'title' }),
      docs: await library({ component: 'alert', info: true }, [[0.4, '\t']]),
      family: await library({ component: 'guidedFlow', slide: 'family' }),
      end: await library({ slide: 'end' }),
    }).toEqual({
      title: '6:e5de299124e4836d1767c862679727aa7e2acccfd65593648376c22746fbdd8c',
      docs: '6:62a0ef38b482bc24663f7f4c072771806c5f65bd0b9bebfd63ea03ff41526c74',
      family: '6:6f515456a714eb0fcd7bea9bc4c1b555b465044b3df4c549255ebc44c6318ff8',
      end: '6:2d6d4690c7b75b2947513f2abe5d6de3f8e5831d1f4026ed40b2e5249de9a4d9',
    });
  });

  it('the hero reel from the melt-in title through the render lab, with a fixed perf sample', async () => {
    const clip = createClipContext(COLS, ROWS);
    const perf = () => ({ fps: 60, frameTimeMs: 1.25, history: [1, 1.5, 1.25, 2], heapUsedMB: 48.5, rssMB: 120.25 });
    const frames = await recordClip(createHeroApp({ ctx: clip.ctx, perf }, { cols: COLS, rows: ROWS }), clip, {
      seconds: 15, fps: 4, keys: [[4.6, 'n'], [12.4, ']'], [13.6, 'b'], [14.4, KEY.ctrlP]],
    });
    expect(digest(frames, clip)).toBe('60:22c76ad91620ec7b9b3b50281bf27f5f5b70f315f0f1b37d510af686ce256d18');
  });
});

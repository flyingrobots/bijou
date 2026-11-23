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
      title: '6:a3a44d710435e8463bc3ff90423a74c5442363b3b833357ba9ff766bd7273ac6',
      docs: '6:3d31c38e8f46ed68f30cad9583ce2a5853976b6893fc628f0a1150b29f749471',
      family: '6:1b0c67222fc04373be1f8599292a97bd664d7cda9025ca393cccf10e427da7df',
      end: '6:7085e49e8535ce91d3b49f9c71369c43cee645ab3e678c994e11ee93da136164',
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

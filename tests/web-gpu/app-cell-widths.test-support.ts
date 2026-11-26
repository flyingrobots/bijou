import { isWideUnitGlyph } from '@flyingrobots/geordi-bijou-gpu';
import { isPackedSurface, type Surface } from '../../packages/bijou/src/index.js';
import type { LibraryStart } from '../../examples/components/library-cli.js';
import { SEQUENCE } from '../../examples/components/library-nav.js';
import { createLibraryApp, LIBRARY_CSS } from '../../examples/components/library.js';
import { COMPONENT_STORIES } from '../../examples/docs/stories.js';
import { createClipContext, recordClip } from '../../examples/hero/clip.js';

// The canvas presenters implement bijou-surface-gpu/1, which is width-1 only:
// a width-2 grapheme is refused with GEORDI_E_BIJOU_UNSUPPORTED_WIDE_GLYPH,
// and mountBijouCanvas() refuses a Surface without packed storage. These
// cases paint what the showcase mounts and look for either.
export const COLS = 120;
export const ROWS = 36;

/** How many files share the Components library slides. */
export const PART_COUNT = 4;

export function refusals(frames: readonly Surface[], where: string): string[] {
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

/** Part `part` (0-based) of PART_COUNT takes every PART_COUNT-th slide of SEQUENCE. */
export function slidesOfPart(part: number): string[] {
  return SEQUENCE.filter((_key, index) => index % PART_COUNT === part);
}

/** Records each slide, with its info, in each of the four output modes, and returns what the canvas would refuse. */
export async function refusalsOfSlides(slides: readonly string[]): Promise<string[]> {
  const found: string[] = [];
  for (const key of slides) {
    const clip = createClipContext(COLS, ROWS);
    const keys = ['1', '2', '3', '4'].map((mode, index) => [0.2 + index * 0.2, mode] as const);
    const frames = await recordClip(createLibraryApp(clip.ctx, startOf(key)), clip, { seconds: 1, fps: 5, css: LIBRARY_CSS, keys });
    found.push(...refusals(frames, key));
  }
  return found;
}

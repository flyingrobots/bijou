import { createClipContext, recordClip } from '../hero/clip.js';
import { openRecording, writeStills } from '../hero/encode.js';
import { COMPONENT_STORIES } from '../docs/stories.js';
import type { LibraryStart } from './library-cli.js';
import { createLibraryApp, LIBRARY_CSS } from './library.js';
import { SEQUENCE } from './library-nav.js';

/*
 * A walkthrough of the Components Library: every slide in deck order, from the title to the end slide, with every
 * component variant shown in all four output modes. Each slide is recorded on its own (the Library opens on any
 * slide) and streamed into the output, so the whole deck never sits in memory. The codec follows the extension.
 * Usage: node --import tsx examples/components/record.ts [--out=path.mp4|.webp|.gif] [--stills=slide:seconds,...]
 */
const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const FPS = 25;
const DELAY_CS = 4;
const COLS = 120;
const ROWS = 36;
const OUT = arg('out') ?? new URL('./components.webp', import.meta.url).pathname;
// Seconds each slide holds. A component slide instead shows every variant in each of the four output modes.
// The opening and closing slides hold 3 s, like the hero reel's logo and end card.
const HOLD = { title: 3.0, family: 2.0, mode: 0.9, end: 3.0 };
const MODES = ['1', '2', '3', '4'];

interface SlidePlan { readonly start: LibraryStart; readonly keys: [number, string][]; readonly seconds: number }

/** Where a slide opens and what is pressed on it. */
function plan(key: string): SlidePlan {
  if (key === 'title' || key === 'end') return { start: { slide: key }, keys: [], seconds: HOLD[key] };
  if (key.startsWith('family:')) {
    const first = COMPONENT_STORIES.find((story) => story.family === key.slice('family:'.length));
    return { start: { component: first?.id ?? '', slide: 'family' }, keys: [], seconds: HOLD.family };
  }
  const story = COMPONENT_STORIES[Number(key.slice('component:'.length))];
  const keys: [number, string][] = [];
  let t = 0;
  // Tab wraps, so `variants` steps visit every variant whichever one the slide opens on.
  const variants = story?.variants.length ?? 1;
  for (let v = 0; v < variants; v++) {
    for (const mode of MODES) { keys.push([t, mode]); t += HOLD.mode; }
    if (v < variants - 1) keys.push([t, '\t']);
  }
  return { start: { component: story?.id ?? '', slide: 'component' }, keys, seconds: t };
}

const recording = openRecording(OUT, DELAY_CS, COLS, ROWS);
// --stills=family:Overlays and interruption:1.5,component:12:3 → a still of that slide at that second.
const stills = new Map((arg('stills') ?? '').split(',').filter(Boolean).flatMap((spec) => {
  const at = spec.lastIndexOf(':');
  return at > 0 ? [[spec.slice(0, at), spec.slice(at + 1)] as const] : [];
}));
let frames = 0;
for (const key of SEQUENCE) {
  const { start, keys, seconds } = plan(key);
  const clip = createClipContext(COLS, ROWS);
  const slide = await recordClip(createLibraryApp(clip.ctx, start), clip, { seconds, fps: FPS, css: LIBRARY_CSS, keys });
  for (const frame of slide) await recording.add(frame);
  frames += slide.length;
  const still = stills.get(key);
  if (still !== undefined) writeStills(slide, OUT.replace(/(\.\w+)$/, `-${key.replace(':', '-')}$1`), FPS, [Number(still)]);
}
await recording.close();
process.stderr.write(`wrote ${OUT}: ${String(SEQUENCE.length)} slides, ${String(frames)} frames, ${(frames / FPS).toFixed(1)} s\n`);

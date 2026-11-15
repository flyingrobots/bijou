import { createClipContext, recordClip } from '../hero/clip.js';
import { writeAnimation, writeStills } from '../hero/encode.js';
import { createLibraryApp, LIBRARY_CSS } from './library.js';
import { SEQUENCE } from './library-nav.js';

/*
 * A walkthrough of the Components Library: every slide in deck order, from the title to the end slide,
 * one `l` press at a time on a mock clock, encoded as a full-colour animated WebP (or a GIF for a .gif path).
 * Usage: node --import tsx examples/components/record.ts [--out=path.webp] [--stills=1,6.5]
 */
const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const FPS = 25;
const DELAY_CS = 4;
const OUT = arg('out') ?? new URL('./components.webp', import.meta.url).pathname;
// Seconds each slide holds: the title, family, and end slides carry more to read than a component.
const HOLD = { title: 2.4, family: 2.0, component: 1.3, end: 3.0 };

const holdFor = (key: string): number =>
  key === 'title' ? HOLD.title : key === 'end' ? HOLD.end : key.startsWith('family:') ? HOLD.family : HOLD.component;

// Press `l` after each slide's hold; the last slide holds without a press.
const keys: [number, string][] = [];
let t = 0;
for (const key of SEQUENCE.slice(0, -1)) {
  t += holdFor(key);
  keys.push([t, 'l']);
}
const seconds = t + HOLD.end;

const clip = createClipContext(120, 36);
const frames = await recordClip(createLibraryApp(clip.ctx), clip, { seconds, fps: FPS, css: LIBRARY_CSS, keys });
await writeAnimation(frames, OUT, DELAY_CS);
writeStills(frames, OUT, FPS, (arg('stills') ?? '').split(',').filter(Boolean).map(Number));
process.stderr.write(`wrote ${OUT}: ${String(SEQUENCE.length)} slides, ${String(frames.length)} frames, ${seconds.toFixed(1)} s\n`);

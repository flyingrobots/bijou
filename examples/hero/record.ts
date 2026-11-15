import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createSurface, type Surface } from '../../packages/bijou/src/index.js';
import { rasterizeSurface } from '../../packages/bijou-node/src/index.js';
import { applyGifPalette, createGifEncoder, quantizeColors } from '../../packages/bijou-node/src/gifenc-runtime.js';
import { diamond, matrixShader, meltShader, wipe, type TransitionShaderFn } from '../../packages/bijou-tui/src/index.js';
import { createLibraryApp } from '../components/library.js';
import { createDocsApp } from '../docs/app.js';
import { createBlockLabFrameApp } from '../docs/storybook-app.js';
import { createHeroApp } from './app.js';
import { createClipContext, KEY, recordClip } from './clip.js';
import { createPerfTracker } from './perf.js';
import { encodePng } from './png.js';
import { applyTransition } from './transition.js';

/*
 * The hero reel: real Bijou apps, each driven by scripted keys on a mock clock, cut together
 * with Bijou's own transition shaders and encoded by its GIF recorder.
 *
 * GIF frame delays are whole centiseconds, so the honest frame rates are 50 (2 cs),
 * 33.3 (3 cs) or 25 (4 cs) fps; 60 fps is not representable in a GIF.
 * Usage: node --import tsx examples/hero/record.ts [--fps=25|33|50] [--out=path.gif] [--stills=1,6.5]
 */
const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const DELAYS_CS: Readonly<Record<string, number>> = { '50': 2, '33': 3, '25': 4 };
const DELAY_CS = DELAYS_CS[arg('fps') ?? '25'] ?? 4;
const FPS = 100 / DELAY_CS;
const COLS = 120;
const ROWS = 36;
const CELL = { cellWidth: 8, cellHeight: 16, foreground: '#e5e7eb', background: '#000000' };
const OUT = arg('out') ?? new URL('./hero.gif', import.meta.url).pathname;
const TRANSITION_SEC = 0.6;

interface Segment {
  readonly name: string;
  readonly frames: readonly Surface[];
  /** How this segment enters over the previous one. */
  readonly enter: TransitionShaderFn;
}

const started = performance.now();
const at = (frames: readonly Surface[], from: number, to: number): Surface[] =>
  frames.slice(Math.round(from * FPS), Math.round(to * FPS));

// 1. Block Lab: walk the story catalog to modal(), then step it through its four mode profiles.
const labCtx = createClipContext(COLS, ROWS);
const blocklab = await recordClip(createBlockLabFrameApp(labCtx.ctx, {}), labCtx, {
  seconds: 5, fps: FPS,
  keys: [[0.7, KEY.down], [1.3, KEY.down], [2.1, '2'], [2.8, '3'], [3.5, '4'], [4.3, '1']],
});

// 2. DOGFOOD: the animated title, Enter, then the component docs.
const dogfoodCtx = createClipContext(COLS, ROWS);
const dogfood = await recordClip(createDocsApp(dogfoodCtx.ctx, { initialRoute: 'landing' }), dogfoodCtx, {
  seconds: 7, fps: FPS,
  keys: [[2.8, KEY.enter], [3.8, ']'], [4.8, KEY.enter], [5.6, KEY.down], [6.1, KEY.enter]],
});

// 3. Components Library (`npm run components`): title, a family intro, Tab through variants, 1–4 modes, i for info.
const libraryCtx = createClipContext(COLS, ROWS);
const library = await recordClip(createLibraryApp(libraryCtx.ctx), libraryCtx, {
  seconds: 9, fps: FPS,
  keys: [[1.2, KEY.enter], [2.9, KEY.enter], [4.0, '\t'], [4.6, '3'], [5.1, '4'], [5.6, '1'], [6.0, 'i'], [7.4, 'l']],
});

// 4. The hero app's own scenes: DAG/heatmap/flamegraph, plot grammar, render lab.
const heroCtx = createClipContext(COLS, ROWS);
const perf = createPerfTracker();
const heroBase = createHeroApp({ ctx: heroCtx.ctx, perf: perf.sample }, { cols: COLS, rows: ROWS });
const hero = await recordClip({ ...heroBase, view: (model) => perf.measure(() => heroBase.view(model)) }, heroCtx, {
  seconds: 18, fps: FPS,
  keys: [
    [4.6, 'n'], [5.6, 'n'], [6.6, 'n'],
    ...Array.from({ length: 6 }, (_, i) => [12.4 + i * 0.15, ']'] as const),
    [13.6, 'b'],
    [14.4, KEY.ctrlP], [14.8, 'a'], [15.0, 'u'], [15.2, 'r'], [15.6, KEY.enter],
    [16.2, KEY.ctrlP], [16.5, 'e'], [16.7, 'm'], [16.9, 'b'], [17.2, KEY.enter],
  ],
});

const segments: readonly Segment[] = [
  { name: 'dogfood', frames: dogfood, enter: meltShader },
  { name: 'blocklab', frames: blocklab, enter: matrixShader },
  { name: 'components', frames: library, enter: wipe('right') },
  { name: 'dashboard', frames: at(hero, 4.0, 7.6), enter: diamond(0.5, 0.5) },
  { name: 'plot', frames: at(hero, 8.4, 11.2), enter: wipe('down') },
  { name: 'render-lab', frames: at(hero, 12.0, 18.0), enter: diamond(0.5, 0.5) },
];

// Cut the segments together: each one enters through its shader over the previous segment's last frame.
const black = createSurface(COLS, ROWS);
black.fill({ char: ' ', bg: '#000000', empty: false });
const transitionFrames = Math.round(TRANSITION_SEC * FPS);
const frames: Surface[] = [];
const cuts: string[] = [];
for (const segment of segments) {
  const from = frames.at(-1) ?? black;
  cuts.push(`${segment.name}@${(frames.length / FPS).toFixed(1)}s`);
  segment.frames.forEach((frame, i) => {
    frames.push(i < transitionFrames
      ? applyTransition(from, frame, segment.enter, (i + 1) / transitionFrames, frames.length, heroCtx.ctx)
      : frame);
  });
}
process.stderr.write(`rendered ${String(frames.length)} frames in ${((performance.now() - started) / 1000).toFixed(1)} s: ${cuts.join(' ')}\n`);

// Stream encode: a global palette from sampled frames, then one rasterized frame at a time.
const sampleEvery = Math.max(1, Math.floor(frames.length / 32));
const samples = frames.filter((_, i) => i % sampleEvery === 0).map((f) => rasterizeSurface(f, CELL));
const joined = new Uint8Array(samples.reduce((n, s) => n + s.length, 0));
samples.reduce((offset, s) => { joined.set(s, offset); return offset + s.length; }, 0);
const palette = quantizeColors(joined, 256, { format: 'rgb565' });

const gif = createGifEncoder();
for (const frame of frames) {
  gif.writeFrame(applyGifPalette(rasterizeSurface(frame, CELL), palette), COLS * CELL.cellWidth, ROWS * CELL.cellHeight, { palette, delay: DELAY_CS * 10 });
}
gif.finish();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, Buffer.from(gif.bytes()));

// Optional PNG stills (`--stills=1.2,6,14.5`) for a poster frame or a quick visual check.
for (const t of (arg('stills') ?? '').split(',').filter(Boolean).map(Number)) {
  const frame = frames.at(Math.min(frames.length - 1, Math.round(t * FPS)));
  if (frame === undefined) continue;
  writeFileSync(OUT.replace(/\.gif$/, `-${t.toFixed(1)}s.png`), encodePng(rasterizeSurface(frame, CELL), COLS * CELL.cellWidth, ROWS * CELL.cellHeight));
}
process.stderr.write(`wrote ${OUT}: ${String(frames.length)} frames, ${String(FPS)} fps, ${String(COLS * CELL.cellWidth)}x${String(ROWS * CELL.cellHeight)} px\n`);

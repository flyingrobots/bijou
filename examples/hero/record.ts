import { cloneContextWithTheme, createSurface, type Surface } from '../../packages/bijou/src/index.js';
import { dissolveShader, wipe, type TransitionShaderFn } from '../../packages/bijou-tui/src/index.js';
import { resolveStartTheme } from '../components/library-cli.js';
import { createLibraryApp, LIBRARY_CSS } from '../components/library.js';
import { createDocsApp } from '../docs/app.js';
import { createBlockLabFrameApp } from '../docs/storybook-app.js';
import { createHeroApp } from './app.js';
import { createClipContext, KEY, recordClip } from './clip.js';
import { createPerfTracker } from './perf.js';
import { captioned, endCard } from './reel-cards.js';
import { CELL, writeAnimation, writeStills } from './encode.js';
import { applyTransition } from './transition.js';

/*
 * The hero reel: real Bijou apps, each driven by scripted keys on a mock clock, cut together
 * with Bijou's own transition shaders, encoded as a full-colour animated WebP (or a GIF for a .gif path).
 *
 * GIF frame delays are whole centiseconds, so the honest frame rates are 50 (2 cs),
 * 33.3 (3 cs) or 25 (4 cs) fps; 60 fps is not representable in a GIF.
 * Usage: node --import tsx examples/hero/record.ts [--fps=25|33|50] [--out=path.webp] [--stills=1,6.5]
 */
const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const DELAYS_CS: Readonly<Record<string, number>> = { '50': 2, '33': 3, '25': 4 };
const DELAY_CS = DELAYS_CS[arg('fps') ?? '25'] ?? 4;
const FPS = 100 / DELAY_CS;
const COLS = 120;
const ROWS = 36;
const OUT = arg('out') ?? new URL('./hero.webp', import.meta.url).pathname;
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

// 1. Block Lab: walk the story catalog to modal(), then hold it in each of its four output modes.
const labCtx = createClipContext(COLS, ROWS);
const blocklab = await recordClip(createBlockLabFrameApp(labCtx.ctx, {}), labCtx, {
  seconds: 8.2, fps: FPS,
  keys: [[0.7, KEY.down], [1.3, KEY.down], [2.4, '2'], [3.9, '3'], [5.4, '4'], [6.9, '1']],
});

// 2. DOGFOOD: the animated Bijou title (the opening logo), then the docs, F2 settings, and the language cycled
//    English → French → Spanish → German while the shell translates around it.
const dogfoodCtx = createClipContext(COLS, ROWS);
const dogfood = await recordClip(createDocsApp(dogfoodCtx.ctx, { initialRoute: 'landing' }), dogfoodCtx, {
  seconds: 9.8, fps: FPS,
  keys: [[2.8, KEY.enter], [3.6, KEY.f2], [4.0, KEY.down], [4.3, KEY.down], [5.0, KEY.enter], [6.3, KEY.enter], [7.6, KEY.enter], [8.8, KEY.escape]],
});

// 3. Components Library (`npm run components`): guidedFlow(), then explainability(), components that carry evidence.
const libraryCtx = createClipContext(COLS, ROWS);
const library = await recordClip(createLibraryApp(libraryCtx.ctx, { component: 'guidedFlow' }), libraryCtx, {
  seconds: 7.4, fps: FPS, css: LIBRARY_CSS, keys: [[3.6, 'l']],
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

// Logo, then the strongest application footage, then how the pieces work, back to the application, and the end card.
// Captions and the end card use the Library's shell theme (book, dark), the coral of Bijou's own pages.
const bookTheme = resolveStartTheme(undefined, 'dark');
const brand = bookTheme === undefined ? libraryCtx.ctx : cloneContextWithTheme(libraryCtx.ctx, bookTheme);
const accent = brand.semantic('accent').hex;
const modes = at(blocklab, 1.8, 8.2).map((frame) => captioned(frame, 'One component. Multiple output modes.', accent));
const languages = at(dogfood, 3.2, 9.8).map((frame) => captioned(frame, 'One app. Every language.', accent, 12));
const segments: readonly Segment[] = [
  { name: 'logo', frames: at(dogfood, 0, 2.6), enter: dissolveShader },
  { name: 'render-lab', frames: at(hero, 12.0, 14.8), enter: dissolveShader },
  { name: 'dashboard', frames: at(hero, 4.0, 7.6), enter: wipe('right') },
  { name: 'modes', frames: modes, enter: dissolveShader },
  { name: 'languages', frames: languages, enter: wipe('right') },
  { name: 'components', frames: library, enter: dissolveShader },
  { name: 'plot', frames: at(hero, 8.4, 11.2), enter: dissolveShader },
  { name: 'render-lab-themes', frames: at(hero, 14.2, 18.0), enter: wipe('right') },
  { name: 'end', frames: Array.from({ length: Math.round(4 * FPS) }, () => endCard(COLS, ROWS, brand)), enter: dissolveShader },
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

await writeAnimation(frames, OUT, DELAY_CS);
writeStills(frames, OUT, FPS, (arg('stills') ?? '').split(',').filter(Boolean).map(Number));
process.stderr.write(`wrote ${OUT}: ${String(frames.length)} frames, ${String(FPS)} fps, ${String(COLS * CELL.cellWidth)}x${String(ROWS * CELL.cellHeight)} px\n`);

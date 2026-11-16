import { mkdirSync, writeFileSync } from 'node:fs';
import { createTestContext } from '../../packages/bijou/src/adapters/test/index.js';
import {
  alert,
  createSurface,
  dag,
  parseAnsiToSurface,
  progressBar,
  table,
  type BijouContext,
  type OutputMode,
  type Surface,
  wrapToWidth,
} from '../../packages/bijou/src/index.js';
import { lineY, plot } from '../../packages/bijou/src/core/viz/index.js';
import { chalkStyle, rasterizeSurface, writeSurfaceGif } from '../../packages/bijou-node/src/index.js';
import { encodePng } from './png.js';

/*
 * One UI, four output modes. Each component lowers itself through renderByMode:
 * the same calls produce a styled TTY view, a single static frame, plain pipe text,
 * and screen-reader prose. Usage: node --import tsx examples/hero/modes.ts [--out=dir]
 */
const COLS = 96;
const ROWS = 40;
const CELL = { cellWidth: 8, cellHeight: 16, foreground: '#e5e7eb', background: '#0b0d14' };
const outArg = process.argv.find((a) => a.startsWith('--out='))?.slice('--out='.length);
const OUT = outArg ?? new URL('./modes', import.meta.url).pathname;

const MODES: readonly { mode: OutputMode; caption: string }[] = [
  { mode: 'interactive', caption: 'interactive · a TTY: colour, borders, Braille' },
  { mode: 'static', caption: 'static · CI=true: one honest frame' },
  { mode: 'pipe', caption: 'pipe · | grep: plain, parseable text' },
  { mode: 'accessible', caption: 'accessible · BIJOU_ACCESSIBLE=1: screen-reader prose' },
];

const LATENCY = Array.from({ length: 40 }, (_, i) => 40 + 12 * Math.sin(i / 4) + (i > 30 ? (i - 30) * 3 : 0));

function releaseStatus(ctx: BijouContext): string {
  return [
    alert('Release v8.1.0 is waiting on one check.', { variant: 'warning', ctx }),
    table({
      columns: [{ header: 'Check' }, { header: 'Status' }, { header: 'Time' }],
      rows: [['typecheck', 'passed', '41 s'], ['vitest', 'passed', '2 m 10 s'], ['code-dojo', 'running', '1 m 02 s']],
      ctx,
    }),
    `Publishing  ${progressBar(72, { width: 30, ctx })}`,
    dag([
      { id: 'build', label: 'build', edges: ['test', 'lint'] },
      { id: 'test', label: 'test', edges: ['publish'] },
      { id: 'lint', label: 'lint', edges: ['publish'] },
      { id: 'publish', label: 'publish' },
    ], { ctx }),
    plot({ width: 60, height: 6, title: 'p99 latency (ms)', marks: [lineY(LATENCY, { label: 'p99' })], ctx }),
  ].join('\n\n');
}

function shot(mode: OutputMode, caption: string): Surface {
  const visual = mode === 'interactive' || mode === 'static';
  const ctx = createTestContext({ mode, runtime: { columns: COLS, rows: ROWS }, ...(visual ? { style: chalkStyle({ level: 3 }) } : {}) });
  const surface = createSurface(COLS, ROWS);
  surface.fill({ char: ' ', bg: CELL.background, empty: false });
  Array.from(` ${caption} `).forEach((char, i) => {
    surface.set(i, 0, { char, fg: '#0b0d14', bg: '#f0abfc', modifiers: ['bold'], empty: false });
  });
  // Wrap long lines the way a terminal would, instead of clipping them at the shot's edge.
  const text = releaseStatus(ctx).split('\n').flatMap((line) => wrapToWidth(line, COLS)).join('\n');
  surface.blit(parseAnsiToSurface(text, COLS, ROWS - 2), 0, 2);
  return surface;
}

mkdirSync(OUT, { recursive: true });
const shots = MODES.map(({ mode, caption }) => ({ mode, surface: shot(mode, caption) }));
for (const { mode, surface } of shots) {
  writeFileSync(`${OUT}/modes-${mode}.png`, encodePng(rasterizeSurface(surface, CELL), COLS * CELL.cellWidth, ROWS * CELL.cellHeight));
}

// 2×2 contact sheet with a one-cell gutter.
const sheet = createSurface(COLS * 2 + 1, ROWS * 2 + 1);
sheet.fill({ char: ' ', bg: '#000000', empty: false });
shots.forEach(({ surface }, i) => { sheet.blit(surface, (i % 2) * (COLS + 1), Math.floor(i / 2) * (ROWS + 1)); });
writeFileSync(`${OUT}/modes-sheet.png`, encodePng(rasterizeSurface(sheet, CELL), sheet.width * CELL.cellWidth, sheet.height * CELL.cellHeight));

writeSurfaceGif({ outputPath: `${OUT}/modes.gif`, frames: shots.map((s) => s.surface), frameDelayMs: 2500, ...CELL });
process.stderr.write(`wrote ${OUT}/modes-{${MODES.map((m) => m.mode).join(',')}}.png, modes-sheet.png, modes.gif\n`);

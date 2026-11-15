import { createSurface, type BijouContext, type Surface } from '../../packages/bijou/src/index.js';
import {
  blinds,
  curtain,
  diamond,
  dissolveShader,
  glitch,
  layoutRasterText,
  matrixShader,
  meltShader,
  pixelate,
  radial,
  rasterTextSurface,
  scrambleShader,
  spiral,
  tvStatic,
  typewriter,
  wipe,
  type TransitionShaderFn,
} from '../../packages/bijou-tui/src/index.js';
import type { ComponentStory } from '../_stories/protocol.js';
import { TITLE_FONT } from './library-font.js';
import { namesSurface } from './library-names.js';
import { familyMembers, familyStepper } from './library-progress.js';

/** One transition per family, cycled; a family enters with one shader and leaves with the next. */
export const FAMILY_TRANSITIONS: readonly { readonly name: string; readonly shader: TransitionShaderFn }[] = [
  { name: 'melt', shader: meltShader },
  { name: 'diamond', shader: diamond(0.5, 0.5) },
  { name: 'matrix', shader: matrixShader },
  { name: 'wipe', shader: wipe('right') },
  { name: 'spiral', shader: spiral() },
  { name: 'blinds', shader: blinds() },
  { name: 'radial', shader: radial(0.5, 0.5) },
  { name: 'dissolve', shader: dissolveShader },
  { name: 'curtain', shader: curtain() },
  { name: 'pixelate', shader: pixelate() },
  { name: 'glitch', shader: glitch() },
  { name: 'scramble', shader: scrambleShader },
  { name: 'typewriter', shader: typewriter() },
  { name: 'static', shader: tvStatic() },
];

/** Quad blocks (2×2 per cell) read best large and solid; Braille (2×4 dots) keeps detail when small. */
export type TitleRenderer = 'quad' | 'braille';

/** One line of DM Sans sized to its natural aspect, so lines sharing a left edge stay aligned. */
function wordSurface(text: string, rows: number, ctx: BijouContext, renderer: TitleRenderer = 'quad'): Surface {
  const layout = layoutRasterText(text, TITLE_FONT);
  // A terminal cell is about twice as tall as it is wide.
  const columns = Math.max(1, Math.ceil(rows * 2 * layout.width / layout.height));
  return rasterTextSurface(text, TITLE_FONT, { columns, rows, fit: 'stretch', renderer: { kind: renderer }, fg: ctx.semantic('accent').hex });
}

/** Break text into at most two lines at the space nearest the middle. */
function twoLines(text: string): string[] {
  const spaces = [...text.matchAll(/ /g)].map((m) => m.index);
  if (spaces.length === 0) return [text];
  const mid = text.length / 2;
  const cut = spaces.reduce((best, i) => (Math.abs(i - mid) < Math.abs(best - mid) ? i : best));
  return [text.slice(0, cut), text.slice(cut + 1)];
}

function putAt(surface: Surface, x: number, y: number, text: string, modifiers: string[]): void {
  Array.from(text).forEach((char, i) => { if (x + i < surface.width) surface.set(x + i, y, { char, modifiers, empty: false }); });
}

/** A text block's start edge: left in LTR, right in RTL, so slides mirror with the reading direction. */
interface Block { readonly x: number; readonly w: number; readonly rtl: boolean }
const startX = (b: Block, itemWidth: number): number => (b.rtl ? b.x + b.w - itemWidth : b.x);

function putStart(surface: Surface, b: Block, y: number, text: string, modifiers: string[]): void {
  putAt(surface, Math.max(0, startX(b, Array.from(text).length)), y, text, modifiers);
}

/** "Components / Library" in DM Sans, two lines aligned to the start edge, as a block in the middle of the screen. */
export function titleSlide(width: number, height: number, families: number, components: number, ctx: BijouContext, rtl = false): Surface {
  const surface = createSurface(width, height);
  let rows = Math.min(8, Math.max(3, Math.floor(height / 4)));
  let lines = [wordSurface('Components', rows, ctx), wordSurface('Library', rows, ctx)];
  while (rows > 2 && Math.max(...lines.map((l) => l.width)) > width - 8) {
    rows--;
    lines = [wordSurface('Components', rows, ctx), wordSurface('Library', rows, ctx)];
  }
  const blockW = Math.max(...lines.map((l) => l.width));
  const blockH = rows * 2 + 1 + 6;
  const b: Block = { x: Math.max(0, Math.floor((width - blockW) / 2)), w: blockW, rtl };
  let y = Math.max(0, Math.floor((height - blockH) / 2));
  for (const line of lines) {
    surface.blit(line, startX(b, line.width), y);
    y += rows + 1;
  }
  putStart(surface, b, y + 1, 'Bijou components, one at a time.', []);
  putStart(surface, b, y + 2, `${String(components)} components in ${String(families)} families`, ['dim']);
  putStart(surface, b, y + 4, 'Press Enter to start.', ['dim']);
  return surface;
}

/** A family's intro: its position, its name in DM Sans (Braille), and the components it holds. */
export function familySlide(
  width: number, height: number, family: string, index: number, total: number,
  stories: readonly ComponentStory[], ctx: BijouContext, rtl = false,
): Surface {
  const surface = createSurface(width, height);
  const rows = Math.min(5, Math.max(3, Math.floor(height / 7)));
  let lines = [wordSurface(family, rows, ctx, 'braille')];
  if ((lines[0]?.width ?? 0) > width - 8) lines = twoLines(family).map((t) => wordSurface(t, rows, ctx, 'braille'));
  const names = namesSurface(stories, width - 8, rtl);
  const blockW = Math.min(width, Math.max(names.width, ...lines.map((l) => l.width)));
  const b: Block = { x: Math.max(0, Math.floor((width - blockW) / 2)), w: blockW, rtl };
  const blockH = 2 + lines.length * (rows + 2) + names.height + 4;
  let y = Math.max(0, Math.floor((height - blockH) / 2));
  putStart(surface, b, y, `Family ${String(index + 1)} of ${String(total)}`, ['dim']);
  y += 2;
  // A spare row under each line keeps descenders clear of the next line.
  for (const line of lines) {
    surface.blit(line, startX(b, line.width), y);
    y += rows + 2;
  }
  // Function names are code and are not mirrored; only the column order and alignment follow the direction.
  surface.blit(names, startX(b, names.width), y);
  putStart(surface, b, y + names.height + 1, 'Press Enter to continue.', ['dim']);
  const progress = familyStepper(family, familyMembers(family)[0]?.index ?? 0, width - 8, ctx);
  surface.blit(progress, Math.max(0, Math.floor((width - progress.width) / 2)), Math.min(height - 1, y + names.height + 3));
  return surface;
}

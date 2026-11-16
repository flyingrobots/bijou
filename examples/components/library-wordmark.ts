import { createSurface, type BijouContext, type Surface } from '../../packages/bijou/src/index.js';
import { coveredFamilies } from './library-design.js';
import { COMPONENT_STORIES } from '../docs/stories.js';
import { layoutRasterText, rasterTextSurface } from '../../packages/bijou-tui/src/index.js';
import { CYLINDER_FONT } from '../docs/app-cylinder-font.js';

/** The Bijou wordmark in its own face, Jacquard 12 (the DOGFOOD title font), drawn in Braille. */
export function wordmark(rows: number, ctx: BijouContext): Surface {
  const layout = layoutRasterText('Bijou', CYLINDER_FONT);
  // A terminal cell is about twice as tall as it is wide.
  const columns = Math.max(1, Math.ceil(rows * 2 * layout.width / layout.height));
  return rasterTextSurface('Bijou', CYLINDER_FONT, {
    columns, rows, fit: 'stretch', renderer: { kind: 'braille' }, fg: ctx.semantic('accent').hex,
  });
}

function centred(surface: Surface, y: number, text: string, modifiers: string[]): void {
  const x = Math.max(0, Math.floor((surface.width - Array.from(text).length) / 2));
  Array.from(text).forEach((char, i) => { if (x + i < surface.width) surface.set(x + i, y, { char, modifiers, empty: false }); });
}

/** The last slide: the wordmark, what the reader has seen, and how to go back. */
export function endSlide(width: number, height: number, components: number, families: number, ctx: BijouContext): Surface {
  const surface = createSurface(width, height);
  let rows = Math.min(10, Math.max(3, Math.floor(height / 3)));
  let mark = wordmark(rows, ctx);
  while (rows > 2 && mark.width > width - 8) mark = wordmark(--rows, ctx);
  const top = Math.max(0, Math.floor((height - rows - 5) / 2));
  surface.blit(mark, Math.max(0, Math.floor((width - mark.width) / 2)), top);
  centred(surface, top + rows + 2, `That is the whole library: ${String(components)} components across ${String(coveredFamilies(COMPONENT_STORIES))} families, in ${String(families)} sections.`, []);
  centred(surface, top + rows + 4, 'Press h to go back, or q to quit.', ['dim']);
  return surface;
}

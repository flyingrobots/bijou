import type { BijouContext } from '@flyingrobots/bijou';
import { FontRasterizer } from './font-rasterizer.js';
import { loadFont } from './load-font.js';
import { MarkdownStyles, TEXT_ELEMENTS } from './markdown-styles.js';
import type { DemoOptions } from './options.js';

/** Load each distinct font once, even when several elements share it. */
export async function loadStyles(options: DemoOptions, styles: MarkdownStyles, ctx: BijouContext): Promise<ReadonlyMap<string, FontRasterizer>> {
  const fonts = new Map<string, FontRasterizer>();
  for (const element of TEXT_ELEMENTS) {
    const choice = styles.for(element).font;
    if (choice === 'terminal' || fonts.has(choice)) continue;
    if (choice === 'default') {
      fonts.set(choice, await loadFont({ ...options, offline: options.offline || options.configure === true || options.styles !== undefined }, ctx));
    } else {
      const specific: DemoOptions = { path: options.path, offline: false, raster: true,
        ...(choice.startsWith('file:') ? { fontPath: choice.slice(5) } : { googleFamily: choice.slice(7) }),
      };
      fonts.set(choice, await loadFont(specific, ctx));
    }
  }
  return fonts;
}

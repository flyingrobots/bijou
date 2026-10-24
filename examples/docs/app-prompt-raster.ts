import { createSurface, type Surface } from '../../packages/bijou/src/index.js';
import { layoutRasterText, rasterTextSurface } from '../../packages/bijou-tui/src/index.js';
import { PROMPT_FONT } from './app-prompt-font.js';
import { sampleColorRamp } from './app-landing-colors.js';
import type { LandingThemeTokens } from './app-landing-types.js';

const CACHE = new Map<string, Surface>();

/** Keep the localized text as the source of meaning; return undefined when it cannot fit. */
export function createRasterPrompt(text: string, tokens: LandingThemeTokens, timeMs: number, maxWidth: number, maxRows: number): Surface | undefined {
  const rows = maxRows >= 3 ? 3 : maxRows >= 2 ? 2 : 0;
  if (rows === 0 || text.trim() === '' || text.length > 100 || Array.from(text).some((char) => {
    const point = char.codePointAt(0) ?? 0;
    return point < 32 || point > 126;
  })) return undefined;
  const layout = layoutRasterText(text, PROMPT_FONT);
  const columns = Math.ceil(layout.width * (rows * 4) / layout.height / 2);
  if (columns > maxWidth) return undefined;
  const key = `${String(rows)}:${text}`;
  let coverage = CACHE.get(key);
  if (coverage === undefined) {
    coverage = rasterTextSurface(text, PROMPT_FONT, { columns, rows, renderer: { kind: 'braille' }, fit: 'contain' });
    if (CACHE.size >= 16) CACHE.clear();
    CACHE.set(key, coverage);
  }
  const surface = createSurface(columns, rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const wave = 0.5 + 0.5 * Math.sin(timeMs / 1000 * 2 + x / Math.max(1, columns - 1) * Math.PI);
      surface.set(x, y, { char: coverage.get(x, y).char,
        fg: sampleColorRamp(tokens.logoRamp, wave), bg: tokens.background, empty: false,
      });
    }
  }
  return surface;
}

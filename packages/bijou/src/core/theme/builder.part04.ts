import { dup } from './builder.part01.js';
import type { ResolveThemeColorRefOptions, ThemeColorRef, ThemeColorResolution } from './builder.part01.js';
import { normalizeColorInput } from './builder.part02.js';
import { isTokenRef } from './builder.part03.js';

export function resolveThemeColorRef(
  ref: ThemeColorRef,
  options: ResolveThemeColorRefOptions,
): ThemeColorResolution {
  const mode = options.theme.modes[options.mode];
  if (mode === undefined) {
    throw new Error(`Unknown theme mode "${options.mode}" for theme "${options.theme.id}".`);
  }

  if (!isTokenRef(ref)) {
    const color = normalizeColorInput(ref);
    return Object.freeze({
      source: 'raw-color' as const,
      themeId: options.theme.id,
      mode: options.mode,
      hex: color.hex,
      rgb: dup(color.rgb),
      fallback: false as const,
    });
  }

  const token = mode.tokens[ref.id];
  if (token !== undefined) {
    return Object.freeze({
      source: 'theme' as const,
      themeId: options.theme.id,
      mode: options.mode,
      tokenId: ref.id,
      hex: token.hex,
      rgb: dup(token.rgb),
      fallback: false as const,
    });
  }

  if (options.unresolved === 'fallback') {
    if (options.fallback === undefined) {
      throw new Error(`Fallback color is required for unresolved token "${ref.id}".`);
    }
    const fallback = normalizeColorInput(options.fallback);
    return Object.freeze({
      source: 'fallback' as const,
      themeId: options.theme.id,
      mode: options.mode,
      tokenId: ref.id,
      hex: fallback.hex,
      rgb: dup(fallback.rgb),
      fallback: true as const,
    });
  }

  throw new Error(`Unresolved theme token "${ref.id}" for mode "${options.mode}" in theme "${options.theme.id}".`);
}

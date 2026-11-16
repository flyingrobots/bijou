import type { BijouContext, ThemeMode } from '@flyingrobots/bijou';
import { parseBCSS } from './parser.js';
import { resolveStyles } from './resolver.js';
import type { BCSSSheet } from './types.js';

export function installBCSSResolver(
  ctx: BijouContext,
  css?: string,
): BCSSSheet | undefined {
  if (css == null || css.trim().length === 0) return undefined;

  const sheet = parseBCSS(css);
  const themeMode = detectThemeMode(ctx);

  // A method, not an arrow: contexts cloned for a theme change copy this function, and
  // `this` is then the clone, so var() resolves against the clone's token graph.
  ctx.resolveBCSS = function resolveBCSS(
    this: BijouContext | undefined,
    identity: { type: string; id?: string; classes?: string[] },
  ) {
    const owner = this ?? ctx;
    return resolveStyles(
      identity,
      sheet,
      {
        width: owner.runtime.columns,
        height: owner.runtime.rows,
      },
      owner.tokenGraph,
      themeMode,
    );
  };

  return sheet;
}

function detectThemeMode(ctx: BijouContext): ThemeMode {
  const colorFgBg = ctx.runtime.env('COLORFGBG')?.split(';').pop();
  if (colorFgBg === '15') return 'light';
  if (ctx.runtime.env('TERM_PROGRAM') === 'Apple_Terminal') return 'light';
  return 'dark';
}

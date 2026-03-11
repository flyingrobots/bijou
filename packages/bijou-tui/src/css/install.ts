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

  (ctx as any).resolveBCSS = (identity: { type: string; id?: string; classes?: string[] }) => {
    return resolveStyles(
      identity,
      sheet,
      {
        width: ctx.runtime.columns,
        height: ctx.runtime.rows,
      },
      ctx.tokenGraph,
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

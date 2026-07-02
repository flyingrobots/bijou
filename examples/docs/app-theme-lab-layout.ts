import {
  boxSurface,
  createSurface,
  separatorSurface,
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import {
  docsThemeBorderToken,
  docsThemeMutedBorderToken,
  docsThemeSurfaceToken,
} from './app-docs-theme-tokens.js';
import type { LandingThemeTokens } from './app-landing.js';

export function themeLabBox(
  content: Surface,
  title: string,
  paneWidth: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
): Surface {
  return boxSurface(content, {
    title,
    width: Math.max(28, paneWidth),
    borderToken: docsThemeMutedBorderToken(theme),
    bgToken: docsThemeSurfaceToken(theme),
    padding: { left: 1, right: 1 },
    ctx,
  });
}

export function themeLabSeparatorSurface(
  label: string,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
): Surface {
  return separatorSurface({ label, width, ctx, borderToken: docsThemeBorderToken(theme) });
}

export function themeLabPaneInnerWidth(width: number): number {
  const inset = width >= 3 ? 1 : 0;
  return Math.max(1, width - (inset * 2));
}

export function themeLabInsetPaneSurface(content: Surface, width: number): Surface {
  const safeWidth = Math.max(1, width);
  const inset = safeWidth >= 3 ? 1 : 0;
  const innerWidth = Math.max(1, safeWidth - (inset * 2));
  const result = createSurface(safeWidth, content.height);
  result.blit(content, inset, 0, 0, 0, innerWidth, content.height);
  return result;
}

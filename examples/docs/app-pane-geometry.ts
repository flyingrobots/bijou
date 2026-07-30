import {
  createSurface,
  separatorSurface,
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import type { LandingThemeTokens } from './app-landing.js';
import { docsThemeBorderToken } from './app-docs-theme-tokens.js';
import {
  COMPONENTS_PAGE_ID,
  DOCS_FAMILY_SEPARATOR_ROWS,
  DOCS_FRAME_CHROME_ROWS,
  DOCS_LAYOUT_VERTICAL_MARGIN_ROWS,
  DOCS_NARROW_NAV_WIDTH,
  DOCS_SIDEBAR_WIDTH,
  DOCS_STANDARD_NAV_WIDTH,
  type DocsLayoutVariant,
  type DocsPageId,
} from './app-ids.js';

export function themedSeparatorSurface(
  label: string,
  width: number,
  context: BijouContext,
  theme: LandingThemeTokens,
): Surface {
  return separatorSurface({
    label,
    width,
    ctx: context,
    borderToken: docsThemeBorderToken(theme),
  });
}

export const resolvePaneInset = (width: number): number =>
  width >= 3 ? 1 : 0;

export function resolvePaneInnerWidth(width: number): number {
  return Math.max(1, width - resolvePaneInset(width) * 2);
}

export const resolveFamilyPaneBodyHeight = (frameRows: number): number =>
  Math.max(
    1,
    frameRows -
      DOCS_FRAME_CHROME_ROWS -
      DOCS_LAYOUT_VERTICAL_MARGIN_ROWS -
      DOCS_FAMILY_SEPARATOR_ROWS,
  );

export function docsNavWidthForVariant(
  variant: DocsLayoutVariant,
): number {
  switch (variant) {
    case 'wide':
      return DOCS_SIDEBAR_WIDTH;
    case 'standard':
      return DOCS_STANDARD_NAV_WIDTH;
    case 'narrow':
      return DOCS_NARROW_NAV_WIDTH;
    case 'tiny':
      return 0;
  }
}

export function visiblePaneIdsForLayout(
  pageId: DocsPageId,
  variant: DocsLayoutVariant,
): readonly string[] {
  if (pageId === COMPONENTS_PAGE_ID) {
    switch (variant) {
      case 'wide':
        return ['family-nav', 'story-content', 'story-variants'];
      case 'standard':
      case 'narrow':
        return ['family-nav', 'story-content'];
      case 'tiny':
        return ['story-content'];
    }
  }
  switch (variant) {
    case 'wide':
      return ['guide-nav', 'guide-content', 'guide-meta'];
    case 'standard':
    case 'narrow':
      return ['guide-nav', 'guide-content'];
    case 'tiny':
      return ['guide-content'];
  }
}

export function insetPaneSurface(
  content: Surface,
  width: number,
): Surface {
  const safeWidth = Math.max(1, width);
  const inset = resolvePaneInset(safeWidth);
  const innerWidth = Math.max(1, safeWidth - inset * 2);
  const result = createSurface(safeWidth, content.height);
  result.blit(content, inset, 0, 0, 0, innerWidth, content.height);
  return result;
}

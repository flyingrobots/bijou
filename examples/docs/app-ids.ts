import { readFileSync } from 'node:fs';

export const BIJOU_VERSION = readBijouPackageVersion();
export const VERSION_TEXT = `v${BIJOU_VERSION}`;
export const GUIDES_PAGE_ID = 'guides';
export const COMPONENTS_PAGE_ID = 'components';
export const BLOCKS_PAGE_ID = 'blocks';
export const PACKAGES_PAGE_ID = 'packages';
export const PHILOSOPHY_PAGE_ID = 'philosophy';
export const THEME_LAB_PAGE_ID = 'themes';
export const RELEASE_PAGE_ID = 'release';
export const BLOCK_PREVIEW_GUIDE_ID = 'blocks-preview';
export const COUNTER_DEMO_BLOCK_GUIDE_ID =
  `${BLOCK_PREVIEW_GUIDE_ID}-counterdemoblock`;
export const THEME_LAB_GUIDE_ID = 'theme-lab';
export const DOCS_SIDEBAR_WIDTH = 32;
export const DOCS_STANDARD_NAV_WIDTH = 28;
export const DOCS_NARROW_NAV_WIDTH = 26;
export const DOCS_FRAME_CHROME_ROWS = 2;
export const DOCS_LAYOUT_VERTICAL_MARGIN_ROWS = 2;
export const DOCS_FAMILY_SEPARATOR_ROWS = 1;
export const DOCS_FLEX_TRACK = '1fr';

export type DocsLayoutVariant = 'wide' | 'standard' | 'narrow' | 'tiny';

export type DocsPageId =
  | typeof GUIDES_PAGE_ID
  | typeof COMPONENTS_PAGE_ID
  | typeof BLOCKS_PAGE_ID
  | typeof PACKAGES_PAGE_ID
  | typeof PHILOSOPHY_PAGE_ID
  | typeof THEME_LAB_PAGE_ID
  | typeof RELEASE_PAGE_ID;

export type GuideDocsPageId = Exclude<
  DocsPageId,
  typeof COMPONENTS_PAGE_ID
>;

export const DOCS_SITE_PAGES: readonly { readonly id: DocsPageId }[] =
  Object.freeze([
    { id: GUIDES_PAGE_ID },
    { id: COMPONENTS_PAGE_ID },
    { id: BLOCKS_PAGE_ID },
    { id: PACKAGES_PAGE_ID },
    { id: PHILOSOPHY_PAGE_ID },
    { id: THEME_LAB_PAGE_ID },
    { id: RELEASE_PAGE_ID },
  ]);

export function resolveDocsLayoutVariant(
  columns: number,
  rows: number,
): DocsLayoutVariant {
  const width = Math.max(0, Math.floor(columns));
  const height = Math.max(0, Math.floor(rows));
  if (width >= 120 && height >= 24) return 'wide';
  if (width >= 88 && height >= 20) return 'standard';
  if (width >= 64 && height >= 16) return 'narrow';
  return 'tiny';
}

export function isDocsPageId(value: string): value is DocsPageId {
  return DOCS_SITE_PAGES.some((page) => page.id === value);
}

function readBijouPackageVersion(): string {
  const packageJson: unknown = JSON.parse(
    readFileSync(
      new URL('../../packages/bijou/package.json', import.meta.url),
      'utf8',
    ),
  );
  const version: unknown =
    typeof packageJson === 'object' && packageJson !== null
      ? Object.getOwnPropertyDescriptor(packageJson, 'version')?.value
      : undefined;
  if (typeof version === 'string') return version;
  throw new Error('Bijou package version is missing');
}

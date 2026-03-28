import { readFileSync } from 'node:fs';
import {
  boxSurface,
  createSurface,
  lerp3,
  markdown,
  separatorSurface,
  wrapToWidth,
  type BijouContext,
  type Surface,
  type TokenValue,
} from '@flyingrobots/bijou';
import {
  browsableListSurface,
  compositeSurface,
  createBrowsableListState,
  createFramedApp,
  createKeyMap,
  isKeyMsg,
  isMouseMsg,
  isResizeMsg,
  isShellQuitConfirmAccept,
  isShellQuitConfirmDismiss,
  isShellQuitRequest,
  listFocusNext,
  listFocusPrev,
  listPageDown,
  listPageUp,
  mapCmds,
  placeSurface,
  quit,
  renderShellQuitOverlay,
  shouldUseShellQuitConfirm,
  toast,
  type App,
  type Cmd,
  type FrameModel,
  type KeyMsg,
  type MouseMsg,
  type ResizeMsg,
} from '../../packages/bijou-tui/src/index.js';
import {
  column,
  contentSurface,
  line,
  spacer,
  textSurface,
} from '../_shared/example-surfaces.js';
import {
  createStoryProfileContext,
  findStoryProfileIndex,
  resolveStoryProfilePreset,
  resolveStoryVariant,
  storyDocsMarkdown,
  storyPreviewSurface,
  type ComponentStory,
  type StoryMode,
} from '../_stories/protocol.js';
import { COMPONENT_STORIES, findComponentStory } from './stories.js';

const LOGO_TEXT = readFileSync(new URL('../../assets/bijou.txt', import.meta.url), 'utf8').trimEnd();
const LOGO_LINES = LOGO_TEXT.split(/\r?\n/);
const LOGO_WIDTH = Math.max(1, ...LOGO_LINES.map((lineText) => lineText.length));
const LOGO_HEIGHT = LOGO_LINES.length;
const LOGO_PADDED_LINES = LOGO_LINES.map((lineText) => lineText.padEnd(LOGO_WIDTH));
const FLYING_ROBOTS_WIDE_LARGE_TEXT = readFileSync(
  new URL('../../assets/flyingrobots-wide-large.txt', import.meta.url),
  'utf8',
).trimEnd();
const FLYING_ROBOTS_WIDE_SMALL_TEXT = readFileSync(
  new URL('../../assets/flyingrobots-wide-small.txt', import.meta.url),
  'utf8',
).trimEnd();
const BACKGROUND_TEXT = readFileSync(new URL('../../assets/background.txt', import.meta.url), 'utf8').trimEnd();
const BACKGROUND_LINES = BACKGROUND_TEXT.split(/\r?\n/);
const BACKGROUND_WIDTH = Math.max(1, ...BACKGROUND_LINES.map((lineText) => lineText.length));
const BACKGROUND_HEIGHT = BACKGROUND_LINES.length;
const BIJOU_PACKAGE_JSON = JSON.parse(
  readFileSync(new URL('../../packages/bijou/package.json', import.meta.url), 'utf8'),
) as { readonly version: string };
const BIJOU_VERSION = BIJOU_PACKAGE_JSON.version;
const FLYING_ROBOTS_LARGE_LINES = splitGlyphLines(FLYING_ROBOTS_WIDE_LARGE_TEXT);
const FLYING_ROBOTS_SMALL_LINES = splitGlyphLines(FLYING_ROBOTS_WIDE_SMALL_TEXT);
const ENTER_PROMPT_TEXT = 'Press [Enter]';
const LANDING_CONTROLS_TEXT = 'Esc/q quit • ↑/↓ quality • ←/→ theme • Enter continue';
const VERSION_TEXT = `v${BIJOU_VERSION}`;
const DOCS_PAGE_ID = 'dogfood';
const DOCS_SIDEBAR_WIDTH = 32;
const DOCS_SHELL_HINT = '? Help • / Search • F2 Settings • q Quit';
const DOCS_PANE_SWITCH_HINT = 'Tab next pane';

interface StoryFamily {
  readonly id: string;
  readonly label: string;
  readonly stories: readonly ComponentStory[];
}

interface RowDescriptor {
  readonly kind: 'family' | 'story';
  readonly id: string;
  readonly familyId: string;
  readonly storyId?: string;
}

interface DocsExplorerModel {
  readonly familyState: ReturnType<typeof createBrowsableListState<string>>;
  readonly expandedFamilies: Readonly<Record<string, boolean>>;
  readonly selectedStoryId?: string;
  readonly profileMode: StoryMode;
  readonly variantIndexByStory: Readonly<Record<string, number>>;
  readonly showHints: boolean;
  readonly landingThemeIndex: number;
  readonly landingQualityMode: LandingQualityMode;
}

type ExplorerMsg =
  | { type: 'family-next' }
  | { type: 'family-prev' }
  | { type: 'family-page-down' }
  | { type: 'family-page-up' }
  | { type: 'activate-row' }
  | { type: 'activate-row-index'; index: number }
  | { type: 'expand-row' }
  | { type: 'collapse-row' }
  | { type: 'select-story'; storyId: string }
  | { type: 'select-variant'; index: number }
  | { type: 'variant-next' }
  | { type: 'variant-prev' }
  | { type: 'set-profile'; mode: StoryMode }
  | { type: 'toggle-hints' }
  | { type: 'cycle-landing-theme' }
  | { type: 'cycle-landing-quality' };

interface RootModel {
  readonly route: 'landing' | 'docs';
  readonly columns: number;
  readonly rows: number;
  readonly landingTimeMs: number;
  readonly landingFps: number;
  readonly landingThemeIndex: number;
  readonly landingToast?: LandingToastState;
  readonly landingQuitConfirmOpen: boolean;
  readonly docsModel: FrameModel<DocsExplorerModel>;
}

type RootMsg = { type: 'docs'; msg: ExplorerMsg };
type PulseLikeMsg = { readonly type: 'pulse'; readonly dt: number };
type Rgb = [number, number, number];

interface LandingThemeSeed {
  readonly id: string;
  readonly label: string;
  readonly background: string;
  readonly waveGradient: readonly [string, string, string];
  readonly logoGradient: readonly [string, string, string];
}

interface LandingThemeTokens {
  readonly id: string;
  readonly label: string;
  readonly background: string;
  readonly waveRamp: readonly string[];
  readonly logoRamp: readonly string[];
  readonly promptBodyColor: string;
  readonly promptAccentColor: string;
  readonly footerMutedColor: string;
  readonly footerStrongColor: string;
  readonly fpsColor: string;
}

interface LandingToastState {
  readonly message: string;
  readonly expiresAtMs: number;
}

interface LandingQualityProfile {
  readonly id: string;
  readonly maxArea: number;
  readonly frameStepMs: number;
  readonly fpsStep: number;
  readonly backgroundTile: number;
  readonly logoTile: number;
}

type LandingQualityMode = 'auto' | 'quality' | 'balanced' | 'performance';

const STORY_FAMILIES = buildStoryFamilies(COMPONENT_STORIES);
const LANDING_FPS_ALPHA = 0.2;
const LANDING_COLOR_RAMP_SIZE = 256;
const DIM_MODIFIERS = ['dim'];
const BOLD_MODIFIERS = ['bold'];
const LANDING_STATIC_SURFACE_CACHE = new Map<string, {
  readonly promptLine: Surface;
  readonly footerControls: Surface;
  readonly footerVersion: Surface;
}>();
const LANDING_FPS_BADGE_CACHE = new Map<string, Surface>();
interface LandingFrameCache {
  key?: string;
  front?: Surface;
  back?: Surface;
}
const LANDING_THEME_SEEDS: readonly LandingThemeSeed[] = [
  {
    id: 'storybook-workstation',
    label: 'Storybook Workstation',
    background: '#18172b',
    waveGradient: ['#2f3f66', '#5f87c8', '#f2c96b'],
    logoGradient: ['#8ba8ff', '#f3b57a', '#ffd86d'],
  },
  {
    id: 'cabinet-of-curiosities',
    label: 'Cabinet of Curiosities',
    background: '#1d1720',
    waveGradient: ['#55413a', '#9f7754', '#d7ba7f'],
    logoGradient: ['#8eb489', '#d8b26e', '#d47a4f'],
  },
  {
    id: 'soft-arcade',
    label: 'Soft Arcade',
    background: '#161a26',
    waveGradient: ['#31557c', '#67a2d3', '#f4a57c'],
    logoGradient: ['#9bb6ff', '#f0a0bf', '#ffd76e'],
  },
  {
    id: 'moss-and-embers',
    label: 'Moss and Embers',
    background: '#171d1b',
    waveGradient: ['#40594b', '#84af86', '#ef9d51'],
    logoGradient: ['#6fa9a3', '#dfbf73', '#ee7c56'],
  },
  {
    id: 'paper-moon',
    label: 'Paper Moon',
    background: '#1f1d24',
    waveGradient: ['#52506f', '#8c8ab8', '#f3ceb0'],
    logoGradient: ['#8eb7d8', '#d9a7c7', '#f4d98b'],
  },
 ] as const;
const LANDING_THEMES: readonly LandingThemeTokens[] = LANDING_THEME_SEEDS.map(compileLandingTheme);
const LANDING_QUALITY_PROFILES: readonly LandingQualityProfile[] = [
  {
    id: 'full',
    maxArea: 14_000,
    frameStepMs: 16,
    fpsStep: 1,
    backgroundTile: 1,
    logoTile: 1,
  },
  {
    id: 'balanced',
    maxArea: 28_000,
    frameStepMs: 33,
    fpsStep: 2,
    backgroundTile: 2,
    logoTile: 1,
  },
  {
    id: 'ultra',
    maxArea: Number.POSITIVE_INFINITY,
    frameStepMs: 50,
    fpsStep: 5,
    backgroundTile: 3,
    logoTile: 1,
  },
] as const;
const BACKGROUND_DENSITY_ROWS = BACKGROUND_LINES.map((lineText) => {
  const row = new Float32Array(BACKGROUND_WIDTH);
  for (let x = 0; x < BACKGROUND_WIDTH; x++) {
    row[x] = densityFromChar(lineText[x] ?? ' ');
  }
  return row;
});

const familyPaneKeys = createKeyMap<ExplorerMsg>()
  .group('Families', (group) => group
    .bind('down', 'Next row', { type: 'family-next' })
    .bind('up', 'Previous row', { type: 'family-prev' })
    .bind('pagedown', 'Page down', { type: 'family-page-down' })
    .bind('pageup', 'Page up', { type: 'family-page-up' })
    .bind('enter', 'Expand or select', { type: 'activate-row' })
    .bind('space', 'Expand or select', { type: 'activate-row' })
    .bind('right', 'Expand family', { type: 'expand-row' })
    .bind('left', 'Collapse family', { type: 'collapse-row' }),
  );

const variantPaneKeys = createKeyMap<ExplorerMsg>()
  .group('Variants', (group) => group
    .bind('down', 'Next variant', { type: 'variant-next' })
    .bind('up', 'Previous variant', { type: 'variant-prev' })
    .bind('pagedown', 'Next variant', { type: 'variant-next' })
    .bind('pageup', 'Previous variant', { type: 'variant-prev' }),
  );

const explorerGlobalKeys = createKeyMap<ExplorerMsg>()
  .group('Profiles', (group) => group
    .bind('1', 'Rich profile', { type: 'set-profile', mode: 'interactive' })
    .bind('2', 'Static profile', { type: 'set-profile', mode: 'static' })
    .bind('3', 'Pipe profile', { type: 'set-profile', mode: 'pipe' })
    .bind('4', 'Accessible profile', { type: 'set-profile', mode: 'accessible' }),
  )
  .group('Variants', (group) => group
    .bind('.', 'Next variant', { type: 'variant-next' })
    .bind(',', 'Previous variant', { type: 'variant-prev' }),
  );

function buildStoryFamilies(stories: readonly ComponentStory[]): readonly StoryFamily[] {
  const families = new Map<string, { label: string; stories: ComponentStory[] }>();
  for (const story of stories) {
    const existing = families.get(story.family);
    if (existing == null) {
      families.set(story.family, { label: story.family, stories: [story] });
      continue;
    }
    existing.stories.push(story);
  }
  return Array.from(families.values()).map((family) => ({
    id: slugify(family.label),
    label: family.label,
    stories: family.stories,
  }));
}

function createInitialExplorerModel(ctx: BijouContext): DocsExplorerModel {
  const expandedFamilies = Object.fromEntries(STORY_FAMILIES.map((family) => [family.id, false]));
  return {
    familyState: createBrowsableListState({
      items: buildFamilyItems(expandedFamilies),
      height: 14,
    }),
    expandedFamilies,
    selectedStoryId: undefined,
    profileMode: ctx.mode,
    variantIndexByStory: Object.fromEntries(COMPONENT_STORIES.map((story) => [story.id, 0])),
    showHints: true,
    landingThemeIndex: 0,
    landingQualityMode: 'auto',
  };
}

function buildFamilyItems(
  expandedFamilies: Readonly<Record<string, boolean>>,
): readonly { label: string; value: string }[] {
  const items: { label: string; value: string }[] = [];
  for (const family of STORY_FAMILIES) {
    const expanded = expandedFamilies[family.id] ?? false;
    items.push({
      label: `${expanded ? 'v' : '>'} ${family.label}`,
      value: `family:${family.id}`,
    });
    if (!expanded) continue;
    for (const story of family.stories) {
      items.push({
        label: `  ${story.title}`,
        value: `story:${story.id}`,
      });
    }
  }
  return items;
}

function focusedRow(model: DocsExplorerModel): RowDescriptor | undefined {
  const value = model.familyState.items[model.familyState.focusIndex]?.value;
  return value == null ? undefined : parseRowValue(value);
}

function parseRowValue(value: string): RowDescriptor {
  if (value.startsWith('family:')) {
    const familyId = value.slice('family:'.length);
    return { kind: 'family', id: value, familyId };
  }
  const storyId = value.slice('story:'.length);
  const family = STORY_FAMILIES.find((candidate) => candidate.stories.some((story) => story.id === storyId));
  return {
    kind: 'story',
    id: value,
    storyId,
    familyId: family?.id ?? slugify(storyId),
  };
}

function rebuildFamilyState(
  current: DocsExplorerModel['familyState'],
  expandedFamilies: Readonly<Record<string, boolean>>,
  preferredValue?: string,
): DocsExplorerModel['familyState'] {
  const items = buildFamilyItems(expandedFamilies);
  const next = createBrowsableListState({
    items,
    height: current.height,
  });
  const targetValue = preferredValue ?? current.items[current.focusIndex]?.value ?? items[0]?.value;
  const focusIndex = Math.max(0, items.findIndex((item) => item.value === targetValue));
  return {
    ...next,
    focusIndex,
    scrollY: adjustScroll(focusIndex, current.scrollY, current.height, items.length),
  };
}

function adjustScroll(focusIndex: number, scrollY: number, height: number, totalItems: number): number {
  let nextScrollY = scrollY;
  if (focusIndex < nextScrollY) {
    nextScrollY = focusIndex;
  } else if (focusIndex >= nextScrollY + height) {
    nextScrollY = focusIndex - height + 1;
  }
  const maxScroll = Math.max(0, totalItems - height);
  return Math.min(nextScrollY, maxScroll);
}

function focusFamilyRow(model: DocsExplorerModel, index: number): DocsExplorerModel {
  const itemCount = model.familyState.items.length;
  if (itemCount === 0) return model;
  const focusIndex = Math.max(0, Math.min(index, itemCount - 1));
  return {
    ...model,
    familyState: {
      ...model.familyState,
      focusIndex,
      scrollY: adjustScroll(
        focusIndex,
        model.familyState.scrollY,
        model.familyState.height,
        itemCount,
      ),
    },
  };
}

function selectedStory(model: DocsExplorerModel): ComponentStory | undefined {
  return model.selectedStoryId == null ? undefined : findComponentStory(model.selectedStoryId);
}

function selectedVariantIndex(model: DocsExplorerModel, storyId: string): number {
  return model.variantIndexByStory[storyId] ?? 0;
}

function cycleVariantIndex(model: DocsExplorerModel, delta: number): DocsExplorerModel {
  const story = selectedStory(model);
  if (story == null || story.variants.length === 0) return model;
  const current = selectedVariantIndex(model, story.id);
  const count = story.variants.length;
  const next = ((current + delta) % count + count) % count;
  return {
    ...model,
    variantIndexByStory: {
      ...model.variantIndexByStory,
      [story.id]: next,
    },
  };
}

function familyContainsStory(familyId: string, storyId: string): boolean {
  return STORY_FAMILIES.some((family) =>
    family.id === familyId && family.stories.some((story) => story.id === storyId));
}

function toggleFamily(model: DocsExplorerModel, familyId: string): DocsExplorerModel {
  const expanded = model.expandedFamilies[familyId] ?? false;
  const nextExpandedFamilies = {
    ...model.expandedFamilies,
    [familyId]: !expanded,
  };
  const nextSelectedStoryId = expanded && model.selectedStoryId != null && familyContainsStory(familyId, model.selectedStoryId)
    ? undefined
    : model.selectedStoryId;
  return {
    ...model,
    expandedFamilies: nextExpandedFamilies,
    selectedStoryId: nextSelectedStoryId,
    familyState: rebuildFamilyState(model.familyState, nextExpandedFamilies, `family:${familyId}`),
  };
}

function expandFocusedFamily(model: DocsExplorerModel): DocsExplorerModel {
  const row = focusedRow(model);
  if (row?.kind !== 'family') return model;
  if (model.expandedFamilies[row.familyId]) return model;
  return toggleFamily(model, row.familyId);
}

function collapseFocusedFamily(model: DocsExplorerModel): DocsExplorerModel {
  const row = focusedRow(model);
  if (row == null) return model;
  if (row.kind === 'family') {
    if (!(model.expandedFamilies[row.familyId] ?? false)) return model;
    return toggleFamily(model, row.familyId);
  }

  const family = STORY_FAMILIES.find((candidate) => candidate.id === row.familyId);
  if (family == null) return model;
  return {
    ...model,
    selectedStoryId: model.selectedStoryId === row.storyId ? undefined : model.selectedStoryId,
    expandedFamilies: {
      ...model.expandedFamilies,
      [row.familyId]: false,
    },
    familyState: rebuildFamilyState(
      model.familyState,
      {
        ...model.expandedFamilies,
        [row.familyId]: false,
      },
      `family:${row.familyId}`,
    ),
  };
}

function activateFocusedRow(model: DocsExplorerModel): DocsExplorerModel {
  const row = focusedRow(model);
  if (row == null) return model;
  if (row.kind === 'family') {
    return toggleFamily(model, row.familyId);
  }
  return selectStory(model, row.storyId);
}

function activateFamilyRowIndex(model: DocsExplorerModel, index: number): DocsExplorerModel {
  return activateFocusedRow(focusFamilyRow(model, index));
}

function selectStory(model: DocsExplorerModel, storyId?: string): DocsExplorerModel {
  if (storyId == null) return model;
  const story = findComponentStory(storyId);
  if (story == null) return model;
  const family = STORY_FAMILIES.find((candidate) => candidate.stories.some((entry) => entry.id === storyId));
  if (family == null) return model;
  const nextExpandedFamilies = {
    ...model.expandedFamilies,
    [family.id]: true,
  };
  return {
    ...model,
    expandedFamilies: nextExpandedFamilies,
    selectedStoryId: storyId,
    familyState: rebuildFamilyState(model.familyState, nextExpandedFamilies, `story:${storyId}`),
  };
}

function selectVariantIndex(model: DocsExplorerModel, index: number): DocsExplorerModel {
  const story = selectedStory(model);
  if (story == null || story.variants.length === 0) return model;
  const nextIndex = Math.max(0, Math.min(index, story.variants.length - 1));
  return {
    ...model,
    variantIndexByStory: {
      ...model.variantIndexByStory,
      [story.id]: nextIndex,
    },
  };
}

function createLandingRenderer(ctx: BijouContext): (model: RootModel) => Surface {
  const cache: LandingFrameCache = {};

  return (model: RootModel): Surface => {
    const width = Math.max(1, model.columns);
    const height = Math.max(1, model.rows);
    const tokens = resolveLandingTheme(model.landingThemeIndex);
    const qualityMode = resolveLandingQualityMode(model);
    const quality = resolveLandingQuality(width, height, qualityMode);
    const quantizedTimeMs = Math.floor(model.landingTimeMs / quality.frameStepMs) * quality.frameStepMs;
    const fpsBadgeValue = quantizeLandingFps(quality, model.landingFps);
    const hasToast = model.landingToast != null && model.landingTimeMs < model.landingToast.expiresAtMs;
    const cacheKey = [
      width,
      height,
      tokens.id,
      qualityMode,
      quality.id,
      quantizedTimeMs,
      fpsBadgeValue,
      hasToast ? model.landingToast?.message ?? '' : '',
    ].join(':');

    if (cache.key === cacheKey && cache.front != null) {
      return cache.front;
    }

    const surface = prepareLandingSurface(cache.back, width, height, tokens.background);
    paintLandingBackground(surface, quantizedTimeMs, tokens, quality);

    const logoWidth = Math.max(1, Math.min(LOGO_WIDTH, width - Math.min(12, Math.max(4, Math.floor(width * 0.08)))));
    const logoHeight = Math.max(1, Math.min(LOGO_HEIGHT, height - Math.min(8, Math.max(3, Math.floor(height * 0.12)))));
    const logoX = Math.floor((width - logoWidth) / 2);
    const logoY = Math.floor((height - logoHeight) / 2);
    paintLogoInto(surface, logoX, logoY, logoWidth, logoHeight, quantizedTimeMs, tokens, quality);

    const wordmarkGlyphs = width >= 110 && height >= 30
      ? FLYING_ROBOTS_LARGE_LINES
      : FLYING_ROBOTS_SMALL_LINES;
    const wordmark = createWordmarkSurface(wordmarkGlyphs, quantizedTimeMs, tokens);
    const staticSurfaces = getLandingStaticSurfaces(tokens);
    const fpsBadge = getLandingFpsBadge(tokens, fpsBadgeValue, quality, qualityMode);

    const footerY = Math.max(0, height - 1);
    const wordmarkY = Math.max(0, footerY - wordmark.height - 2);
    const promptMinY = Math.min(height - 1, logoY + logoHeight + 1);
    const promptMaxY = Math.max(0, wordmarkY - staticSurfaces.promptLine.height - 2);
    const promptY = promptMaxY >= promptMinY
      ? Math.max(promptMinY, Math.min(Math.floor(height * 0.72), promptMaxY))
      : Math.max(0, Math.min(height - staticSurfaces.promptLine.height - 1, promptMinY));

    blitCentered(surface, staticSurfaces.promptLine, promptY);
    blitCentered(surface, wordmark, wordmarkY);
    surface.blit(staticSurfaces.footerControls, 0, footerY);
    const footerVersionX = Math.max(0, width - staticSurfaces.footerVersion.width);
    const footerBadgeX = Math.floor((width - fpsBadge.width) / 2);
    const footerBadgeMinX = staticSurfaces.footerControls.width + 2;
    const footerBadgeMaxX = footerVersionX - fpsBadge.width - 2;
    if (footerBadgeMinX <= footerBadgeMaxX) {
      surface.blit(fpsBadge, Math.max(footerBadgeMinX, Math.min(footerBadgeX, footerBadgeMaxX)), footerY);
    }
    surface.blit(staticSurfaces.footerVersion, footerVersionX, footerY);

    const output = hasToast
      ? compositeSurface(surface, [toast({
          message: model.landingToast!.message,
          variant: 'info',
          anchor: 'top-right',
          screenWidth: width,
          screenHeight: height,
          ctx,
        })])
      : surface;

    cache.key = cacheKey;
    cache.back = cache.front;
    cache.front = output;
    return output;
  };
}

function prepareLandingSurface(
  scratch: Surface | undefined,
  width: number,
  height: number,
  background: string,
): Surface {
  const surface = scratch != null && scratch.width === width && scratch.height === height
    ? scratch
    : createSurface(width, height, {
        char: ' ',
        bg: background,
        empty: false,
      });
  surface.fill({
    char: ' ',
    bg: background,
    empty: false,
    fg: undefined,
    modifiers: undefined,
    opacity: 1,
  });
  return surface;
}

function paintLandingBackground(
  surface: Surface,
  timeMs: number,
  tokens: LandingThemeTokens,
  quality: LandingQualityProfile,
): void {
  const width = surface.width;
  const height = surface.height;
  const time = timeMs / 1000;
  const baseX = Math.floor((BACKGROUND_WIDTH - width) / 2);
  const baseY = Math.floor((BACKGROUND_HEIGHT - height) / 2);
  const widthDenominator = width - 1 || 1;
  const heightDenominator = height - 1 || 1;

  const cells = surface.cells;
  const tile = quality.backgroundTile;

  for (let tileY = 0; tileY < height; tileY += tile) {
    const sampleY = Math.min(height - 1, tileY + Math.floor(tile / 2));
    const v = sampleY / heightDenominator;
    const rowShift = Math.round(
      (Math.sin((sampleY * 0.075) + (time * 0.7)) * 18)
      + (Math.cos((sampleY * 0.03) - (time * 0.35)) * 7),
    );
    for (let tileX = 0; tileX < width; tileX += tile) {
      const sampleX = Math.min(width - 1, tileX + Math.floor(tile / 2));
      const u = sampleX / widthDenominator;
      const columnShift = Math.round(Math.sin((sampleX * 0.028) + (time * 0.42)) * 2);
      const sourceX = mod(baseX + sampleX + rowShift, BACKGROUND_WIDTH);
      const sourceY = mod(baseY + sampleY + columnShift, BACKGROUND_HEIGHT);
      const density = BACKGROUND_DENSITY_ROWS[sourceY]?.[sourceX] ?? 0;
      if (density === 0) {
        continue;
      }

      const wave = 0.54
        + (Math.sin((sampleX * 0.042) + (sampleY * 0.016) + (time * 1.45)) * 0.24)
        + (Math.cos((sampleX * 0.012) - (sampleY * 0.085) + (time * 0.95)) * 0.22);
      const level = clamp01(density * wave);
      const char = densityGlyph(level, { airy: true });
      if (char === ' ') {
        continue;
      }

      const colorT = clamp01(
        (u * 0.66)
        + (0.22 * (0.5 + (Math.sin((time * 0.3) + (v * 5.2)) * 0.5)))
        + (0.08 * Math.sin((time * 0.55) + (sampleX * 0.02))),
      );
      const fg = sampleColorRamp(tokens.waveRamp, colorT);
      const modifiers = level < 0.52 ? DIM_MODIFIERS : undefined;
      const maxY = Math.min(height, tileY + tile);
      const maxX = Math.min(width, tileX + tile);

      for (let y = tileY; y < maxY; y++) {
        const rowOffset = y * width;
        for (let x = tileX; x < maxX; x++) {
          applyOpaqueCell(cells[rowOffset + x]!, char, fg, modifiers);
        }
      }
    }
  }
}

function paintLogoInto(
  target: Surface,
  dx: number,
  dy: number,
  width: number,
  height: number,
  timeMs: number,
  tokens: LandingThemeTokens,
  quality: LandingQualityProfile,
): void {
  const srcX = LOGO_WIDTH > width
    ? Math.floor((LOGO_WIDTH - width) / 2)
    : 0;
  const srcY = LOGO_HEIGHT > height
    ? Math.floor((LOGO_HEIGHT - height) / 2)
    : 0;
  const drawWidth = Math.min(width, LOGO_WIDTH);
  const drawHeight = Math.min(height, LOGO_HEIGHT);
  const destX = dx + (LOGO_WIDTH < width ? Math.floor((width - LOGO_WIDTH) / 2) : 0);
  const destY = dy + (LOGO_HEIGHT < height ? Math.floor((height - LOGO_HEIGHT) / 2) : 0);
  const time = timeMs / 1000;
  const widthDenominator = LOGO_WIDTH - 1 || 1;
  const heightDenominator = LOGO_HEIGHT - 1 || 1;

  const cells = target.cells;
  const tile = quality.logoTile;

  for (let tileY = 0; tileY < drawHeight; tileY += tile) {
    const sourceY = srcY + Math.min(drawHeight - 1, tileY + Math.floor(tile / 2));
    const lineText = LOGO_PADDED_LINES[sourceY]!;
    const v = sourceY / heightDenominator;
    const maxY = Math.min(drawHeight, tileY + tile);
    for (let tileX = 0; tileX < drawWidth; tileX += tile) {
      const sourceX = srcX + Math.min(drawWidth - 1, tileX + Math.floor(tile / 2));
      const sourceChar = lineText[sourceX]!;
      if (sourceChar === ' ') continue;

      const u = sourceX / widthDenominator;
      const shimmer = 0.46
        + (Math.sin((u * 7.8) - (v * 5.6) + (time * 2.3)) * 0.24)
        + (Math.cos((u * 3.4) + (v * 9.1) - (time * 1.6)) * 0.18)
        + (Math.sin((u * 18.0) + (time * 5.5)) * 0.12);
      const level = clamp01(shimmer);
      const shaderChar = densityGlyph(level, { airy: false });
      const colorT = clamp01(
        (u * 0.78)
        + ((1 - v) * 0.14)
        + (0.08 * Math.sin((time * 0.9) + (u * 5.2))),
      );
      const glyph = reinforceGlyph(sourceChar, shaderChar);
      const fg = sampleColorRamp(tokens.logoRamp, colorT);
      const modifiers = level > 0.7 ? BOLD_MODIFIERS : undefined;
      const maxX = Math.min(drawWidth, tileX + tile);

      for (let y = tileY; y < maxY; y++) {
        const targetY = destY + y;
        if (targetY < 0 || targetY >= target.height) continue;
        const rowOffset = targetY * target.width;
        for (let x = tileX; x < maxX; x++) {
          const targetX = destX + x;
          if (targetX < 0 || targetX >= target.width) continue;
          applyOpaqueCell(cells[rowOffset + targetX]!, glyph, fg, modifiers);
        }
      }
    }
  }
}

function createWordmarkSurface(
  lines: readonly (readonly string[])[],
  timeMs: number,
  tokens: LandingThemeTokens,
): Surface {
  return createTransparentTextSurface(lines, {
    fg: (x, y, char, totalWidth) => {
      if (char === ' ') return undefined;
      const xRatio = totalWidth <= 1 ? 0 : x / (totalWidth - 1);
      const shimmer = 0.08 * Math.sin((timeMs / 1000) * 1.4 + (y * 0.55) + (x * 0.12));
      const colorT = clamp01((xRatio * 0.82) + 0.1 + shimmer);
      return sampleColorRamp(tokens.logoRamp, colorT);
    },
    modifiers: (_x, _y, char) => char === ' ' ? undefined : BOLD_MODIFIERS,
  });
}

function paragraphSurface(text: string, width: number): Surface {
  const wrapped = wrapToWidth(text, Math.max(1, width));
  return textSurface(wrapped.join('\n'), Math.max(1, width), Math.max(1, wrapped.length));
}

function densityFromChar(char: string): number {
  switch (char) {
    case '█':
      return 1;
    case '▓':
      return 0.78;
    case '▒':
      return 0.56;
    case '░':
      return 0.32;
    case '·':
    case '.':
      return 0.14;
    default:
      return 0;
  }
}

function densityGlyph(level: number, options: { readonly airy: boolean }): string {
  if (level <= 0.08) return ' ';
  if (options.airy) {
    if (level > 0.82) return '▓';
    if (level > 0.58) return '▒';
    if (level > 0.34) return '░';
    return '·';
  }
  if (level > 0.84) return '█';
  if (level > 0.66) return '▓';
  if (level > 0.44) return '▒';
  return '░';
}

function reinforceGlyph(source: string, shaderChar: string): string {
  const sourceDensity = densityFromChar(source);
  const shaderDensity = densityFromChar(shaderChar);
  return shaderDensity >= sourceDensity ? shaderChar : densityGlyph(sourceDensity, { airy: false });
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function resolveLandingQuality(width: number, height: number, mode: LandingQualityMode = 'auto'): LandingQualityProfile {
  if (mode !== 'auto') {
    const forced = LANDING_QUALITY_PROFILES.find((profile) => (
      (mode === 'quality' && profile.id === 'full')
      || (mode === 'balanced' && profile.id === 'balanced')
      || (mode === 'performance' && profile.id === 'ultra')
    ));
    if (forced != null) return forced;
  }
  const area = width * height;
  return LANDING_QUALITY_PROFILES.find((profile) => area <= profile.maxArea) ?? LANDING_QUALITY_PROFILES[LANDING_QUALITY_PROFILES.length - 1]!;
}

function quantizeLandingFps(quality: LandingQualityProfile, fps: number): number {
  if (quality.fpsStep <= 1) return fps;
  return Math.max(1, Math.round(fps / quality.fpsStep) * quality.fpsStep);
}

function landingQualityProfileLabel(quality: LandingQualityProfile): string {
  switch (quality.id) {
    case 'full':
      return 'full';
    case 'balanced':
      return 'balanced';
    case 'ultra':
      return 'performance';
    default:
      return quality.id;
  }
}

function landingQualityModeLabel(mode: LandingQualityMode): string {
  switch (mode) {
    case 'auto':
      return 'Auto';
    case 'quality':
      return 'Quality';
    case 'balanced':
      return 'Balanced';
    case 'performance':
      return 'Performance';
  }
}

function landingQualityBadgeLabel(
  quality: LandingQualityProfile,
  mode: LandingQualityMode,
): string {
  if (mode === 'auto') {
    return `auto/${landingQualityProfileLabel(quality)}`;
  }
  return landingQualityModeLabel(mode).toLowerCase();
}

function nextLandingQualityMode(mode: LandingQualityMode): LandingQualityMode {
  switch (mode) {
    case 'auto':
      return 'quality';
    case 'quality':
      return 'balanced';
    case 'balanced':
      return 'performance';
    case 'performance':
      return 'auto';
  }
}

function previousLandingQualityMode(mode: LandingQualityMode): LandingQualityMode {
  switch (mode) {
    case 'auto':
      return 'performance';
    case 'quality':
      return 'auto';
    case 'balanced':
      return 'quality';
    case 'performance':
      return 'balanced';
  }
}

function landingQualitySettingValue(
  width: number,
  height: number,
  mode: LandingQualityMode,
): string {
  if (mode !== 'auto') return landingQualityModeLabel(mode);
  return `${landingQualityModeLabel(mode)} (${landingQualityProfileLabel(resolveLandingQuality(width, height, mode))})`;
}

function landingQualitySettingDescription(
  width: number,
  height: number,
  mode: LandingQualityMode,
): string {
  const currentProfile = landingQualityProfileLabel(resolveLandingQuality(width, height, mode));
  switch (mode) {
    case 'auto':
      return `Adapts render cost to terminal size. Current auto profile: ${currentProfile}. Options: Auto, Quality, Balanced, Performance.`;
    case 'quality':
      return 'Prioritizes the richest title treatment even on larger terminals. Options: Auto, Quality, Balanced, Performance.';
    case 'balanced':
      return 'Keeps the title screen expressive while reducing render work on larger terminals. Options: Auto, Quality, Balanced, Performance.';
    case 'performance':
      return 'Minimizes title-screen work for giant terminals and slower emulators. Options: Auto, Quality, Balanced, Performance.';
  }
}

function landingThemeSettingValue(index: number): string {
  return resolveLandingTheme(index).label;
}

function landingThemeSettingDescription(index: number): string {
  const theme = resolveLandingTheme(index);
  return `Sets the DOGFOOD title screen and docs accent palette. Current theme: ${theme.label}. Options: ${LANDING_THEMES.map((entry) => entry.label).join(', ')}.`;
}

function resolveLandingQualityMode(model: RootModel): LandingQualityMode {
  return model.docsModel.pageModels[DOCS_PAGE_ID]?.landingQualityMode ?? 'auto';
}

function applyOpaqueCell(
  target: { char: string; fg?: string; modifiers?: string[]; empty?: boolean; opacity?: number },
  char: string,
  fg: string,
  modifiers?: readonly string[],
): void {
  target.char = char;
  target.fg = fg;
  target.modifiers = modifiers as string[] | undefined;
  target.empty = false;
  target.opacity = 1;
}

function resolveLandingTheme(index: number): LandingThemeTokens {
  return LANDING_THEMES[mod(index, LANDING_THEMES.length)]!;
}

function nextLandingThemeIndex(current: number, delta: number): number {
  return mod(current + delta, LANDING_THEMES.length);
}

function updateLandingFps(current: number, dtSeconds: number): number {
  if (!(dtSeconds > 0)) return current;
  const instantFps = Math.max(1, Math.round(1 / dtSeconds));
  if (current <= 0) return instantFps;
  return Math.max(1, Math.round((current * (1 - LANDING_FPS_ALPHA)) + (instantFps * LANDING_FPS_ALPHA)));
}

function getLandingStaticSurfaces(tokens: LandingThemeTokens): {
  readonly promptLine: Surface;
  readonly footerControls: Surface;
  readonly footerVersion: Surface;
} {
  const cached = LANDING_STATIC_SURFACE_CACHE.get(tokens.id);
  if (cached) return cached;

  const surfaces = {
    promptLine: createTransparentTextSurface(ENTER_PROMPT_TEXT, {
      bg: tokens.background,
      transparentSpaces: false,
      fg: (x) => {
        const char = ENTER_PROMPT_TEXT[x] ?? ' ';
        if (char === '[' || char === ']' || (x >= 7 && x <= 11)) {
          return tokens.promptAccentColor;
        }
        return tokens.promptBodyColor;
      },
      modifiers: (x) => {
        const char = ENTER_PROMPT_TEXT[x] ?? ' ';
        return char === '[' || char === ']' || (x >= 7 && x <= 11) ? BOLD_MODIFIERS : DIM_MODIFIERS;
      },
    }),
    footerControls: createTransparentTextSurface(LANDING_CONTROLS_TEXT, {
      bg: tokens.background,
      transparentSpaces: false,
      fg: tokens.footerMutedColor,
      modifiers: DIM_MODIFIERS,
    }),
    footerVersion: createTransparentTextSurface(VERSION_TEXT, {
      bg: tokens.background,
      transparentSpaces: false,
      fg: tokens.footerStrongColor,
      modifiers: BOLD_MODIFIERS,
    }),
  };
  LANDING_STATIC_SURFACE_CACHE.set(tokens.id, surfaces);
  return surfaces;
}

function getLandingFpsBadge(
  tokens: LandingThemeTokens,
  fps: number,
  quality: LandingQualityProfile,
  mode: LandingQualityMode,
): Surface {
  const qualityLabel = landingQualityBadgeLabel(quality, mode);
  const key = `${tokens.id}:${fps}:${quality.id}:${mode}`;
  const cached = LANDING_FPS_BADGE_CACHE.get(key);
  if (cached) return cached;

  const surface = createTransparentTextSurface(`${fps} fps • ${qualityLabel}`, {
    bg: tokens.background,
    transparentSpaces: false,
    fg: tokens.fpsColor,
    modifiers: DIM_MODIFIERS,
  });
  LANDING_FPS_BADGE_CACHE.set(key, surface);
  return surface;
}

function applyLandingThemeSelection(model: RootModel, index: number): RootModel {
  const pageModel = model.docsModel.pageModels[DOCS_PAGE_ID];
  const nextIndex = mod(index, LANDING_THEMES.length);
  if (nextIndex === model.landingThemeIndex) return model;
  const theme = resolveLandingTheme(nextIndex);
  return {
    ...model,
    landingThemeIndex: nextIndex,
    docsModel: pageModel == null ? model.docsModel : {
      ...model.docsModel,
      pageModels: {
        ...model.docsModel.pageModels,
        [DOCS_PAGE_ID]: {
          ...pageModel,
          landingThemeIndex: nextIndex,
        },
      },
    },
    landingToast: {
      message: theme.label,
      expiresAtMs: model.landingTimeMs + 1600,
    },
  };
}

function applyLandingQualitySelection(model: RootModel, mode: LandingQualityMode): RootModel {
  const pageModel = model.docsModel.pageModels[DOCS_PAGE_ID];
  if (pageModel == null || pageModel.landingQualityMode === mode) return model;

  return {
    ...model,
    docsModel: {
      ...model.docsModel,
      pageModels: {
        ...model.docsModel.pageModels,
        [DOCS_PAGE_ID]: {
          ...pageModel,
          landingQualityMode: mode,
        },
      },
    },
    landingToast: {
      message: `Landing quality: ${landingQualityModeLabel(mode)}`,
      expiresAtMs: model.landingTimeMs + 1600,
    },
  };
}

function compileLandingTheme(seed: LandingThemeSeed): LandingThemeTokens {
  const waveStops = createGradientStops(seed.waveGradient);
  const logoStops = createGradientStops(seed.logoGradient);
  const waveRamp = buildColorRamp(waveStops);
  const logoRamp = buildColorRamp(logoStops);

  return {
    id: seed.id,
    label: seed.label,
    background: seed.background,
    waveRamp,
    logoRamp,
    promptBodyColor: sampleColorRamp(waveRamp, 0.58),
    promptAccentColor: sampleColorRamp(logoRamp, 0.92),
    footerMutedColor: sampleColorRamp(waveRamp, 0.52),
    footerStrongColor: sampleColorRamp(logoRamp, 0.88),
    fpsColor: sampleColorRamp(waveRamp, 0.62),
  };
}

function createGradientStops(gradient: readonly [string, string, string]): Array<{ pos: number; color: Rgb }> {
  return [
    { pos: 0, color: hexToRgb(gradient[0]) },
    { pos: 0.5, color: hexToRgb(gradient[1]) },
    { pos: 1, color: hexToRgb(gradient[2]) },
  ];
}

function buildColorRamp(stops: Array<{ pos: number; color: Rgb }>): readonly string[] {
  const ramp = new Array<string>(LANDING_COLOR_RAMP_SIZE);
  for (let index = 0; index < LANDING_COLOR_RAMP_SIZE; index++) {
    const t = index / (LANDING_COLOR_RAMP_SIZE - 1 || 1);
    ramp[index] = rgbHex(...lerp3(stops, t));
  }
  return ramp;
}

function sampleColorRamp(ramp: readonly string[], t: number): string {
  const index = Math.max(0, Math.min(ramp.length - 1, Math.round(clamp01(t) * (ramp.length - 1))));
  return ramp[index]!;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace(/^#/, '');
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function rgbHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function splitGlyphLines(text: string): readonly (readonly string[])[] {
  return text.split(/\r?\n/).map((lineText) => Array.from(lineText));
}

function createTransparentTextSurface(
  text: string | readonly (readonly string[])[],
  options: {
    readonly bg?: string;
    readonly fg?: string | ((x: number, y: number, char: string, width: number) => string | undefined);
    readonly modifiers?: readonly string[] | ((x: number, y: number, char: string, width: number) => readonly string[] | undefined);
    readonly transparentSpaces?: boolean;
  } = {},
): Surface {
  const lines: readonly (readonly string[])[] = typeof text === 'string'
    ? splitGlyphLines(text)
    : text;
  const width = Math.max(1, ...lines.map((lineText) => lineText.length));
  const height = Math.max(1, lines.length);
  const surface = createSurface(width, height);
  const transparentSpaces = options.transparentSpaces ?? true;

  for (let y = 0; y < height; y++) {
    const lineText = lines[y] ?? [];
    for (let x = 0; x < width; x++) {
      const char = lineText[x] ?? ' ';
      if (char === ' ' && transparentSpaces) {
        surface.set(x, y, { char: ' ', empty: true });
        continue;
      }
      const fg = typeof options.fg === 'function'
        ? options.fg(x, y, char, width)
        : options.fg;
      const modifiers = typeof options.modifiers === 'function'
        ? options.modifiers(x, y, char, width)
        : options.modifiers;
      surface.set(x, y, {
        char,
        bg: options.bg,
        fg,
        modifiers: modifiers as string[] | undefined,
        empty: false,
      });
    }
  }

  return surface;
}

function docsThemeAccentToken(theme: LandingThemeTokens): TokenValue {
  return { hex: sampleColorRamp(theme.logoRamp, 0.78), modifiers: ['bold'] };
}

function docsThemeBorderToken(theme: LandingThemeTokens): TokenValue {
  return { hex: sampleColorRamp(theme.waveRamp, 0.58) };
}

function docsThemeMutedBorderToken(theme: LandingThemeTokens): TokenValue {
  return { hex: sampleColorRamp(theme.waveRamp, 0.36), modifiers: ['dim'] };
}

function themedSeparatorSurface(
  label: string,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
): Surface {
  return separatorSurface({
    label,
    width,
    ctx,
    borderToken: docsThemeBorderToken(theme),
  });
}

function themeCaptionSurface(theme: LandingThemeTokens, width: number, ctx: BijouContext): Surface {
  return line(
    ctx.style.styled(docsThemeMutedBorderToken(theme) as any, `Theme: ${theme.label}`),
    width,
  );
}

function blitCentered(surface: Surface, content: Surface, y: number): void {
  surface.blit(content, Math.floor((surface.width - content.width) / 2), y);
}

function renderFamiliesPane(
  model: DocsExplorerModel,
  width: number,
  height: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
): Surface {
  const visibleHeight = Math.max(3, height - 2);
  const body = createSurface(Math.max(1, width), visibleHeight);
  const start = model.familyState.scrollY;
  const end = Math.min(model.familyState.items.length, start + visibleHeight);

  for (let index = start; index < end; index++) {
    const row = parseRowValue(model.familyState.items[index]!.value);
    body.blit(
      renderFamilyRow({
        row,
        width,
        focused: index === model.familyState.focusIndex,
        selectedStoryId: model.selectedStoryId,
        expandedFamilies: model.expandedFamilies,
        ctx,
        theme,
      }),
      0,
      index - start,
    );
  }

  return column([
    themedSeparatorSurface('component families', width, ctx, theme),
    body,
  ]);
}

function renderEmptyStoryPane(width: number, ctx: BijouContext, theme: LandingThemeTokens): Surface {
  const bodyWidth = Math.max(28, width - 6);
  const intro = boxSurface(column([
    paragraphSurface(
      'Bijou is a surface-native terminal UI framework for building styled, stateful, testable TUIs without dropping back into stringly view code.',
      Math.max(24, bodyWidth - 2),
    ),
    spacer(),
    paragraphSurface(
      'DOGFOOD is the living field guide for the framework. The docs, previews, shell, and teaching surfaces are built in Bijou itself so the documentation exercises the same runtime and design system it describes.',
      Math.max(24, bodyWidth - 2),
    ),
  ]), {
    title: 'What is Bijou?',
    width: Math.max(24, width - 1),
    borderToken: docsThemeBorderToken(theme),
    ctx,
  });

  const guide = boxSurface(column([
    line('1. Browse component families in the left lane.'),
    line('2. Press Enter to expand a family or open a component.'),
    line('3. Use Tab to move focus between families, docs, and variants.'),
    line('4. Press / to search by component name at any time.'),
    line('5. Press F2 for settings, ? for help, and q or Esc to quit.'),
  ]), {
    title: 'How to use these docs',
    width: Math.max(24, width - 1),
    borderToken: docsThemeMutedBorderToken(theme),
    ctx,
  });

  return column([
    themedSeparatorSurface('welcome to bijou', width, ctx, theme),
    spacer(1, 1),
    themeCaptionSurface(theme, width, ctx),
    spacer(1, 1),
    intro,
    spacer(1, 1),
    guide,
  ]);
}

function renderStoryPane(
  model: DocsExplorerModel,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
): Surface {
  const story = selectedStory(model);
  if (story == null) {
    return renderEmptyStoryPane(width, ctx, theme);
  }

  const profileIndex = findStoryProfileIndex(story, model.profileMode);
  const preset = resolveStoryProfilePreset(story, profileIndex);
  const variant = resolveStoryVariant(story, selectedVariantIndex(model, story.id));
  const previewWidth = Math.max(20, Math.min(Math.max(20, width - 6), preset.width));
  const previewCtx = createStoryProfileContext(ctx, preset, {
    width: previewWidth,
    height: 14,
  });
  const preview = storyPreviewSurface(variant.render({
    width: previewWidth,
    ctx: previewCtx,
    state: variant.initialState as never,
  }));
  const previewCard = boxSurface(placeSurface(preview, {
    width: Math.max(preview.width, previewWidth),
    height: preview.height,
    hAlign: 'center',
    vAlign: 'top',
  }), {
    title: `live preview • ${preset.label} • ${variant.label}`,
    width: Math.max(24, width - 1),
    borderToken: docsThemeMutedBorderToken(theme),
    ctx,
  });
  const docs = markdown(storyDocsMarkdown(story, variant, preset), {
    width: Math.max(24, width - 3),
    ctx,
  });

  return column([
    themedSeparatorSurface(`docs • ${story.title}`, width, ctx, theme),
    spacer(1, 1),
    themeCaptionSurface(theme, width, ctx),
    spacer(1, 1),
    previewCard,
    spacer(1, 1),
    contentSurface(docs),
  ]);
}

function renderVariantsPane(
  model: DocsExplorerModel,
  width: number,
  height: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
): Surface {
  const story = selectedStory(model);
  if (story == null) {
    return column([
      themedSeparatorSurface('variants', width, ctx, theme),
      spacer(1, 1),
      boxSurface(paragraphSurface(
        'Variants appear here once a component is selected.',
        Math.max(20, width - 6),
      ), {
        width: Math.max(22, width - 1),
        borderToken: docsThemeMutedBorderToken(theme),
        ctx,
      }),
    ]);
  }

  const currentVariantIndex = selectedVariantIndex(model, story.id);
  const items = story.variants.map((variant) => ({
    label: variant.label,
    value: variant.id,
  }));
  const list = browsableListSurface({
    items,
    focusIndex: currentVariantIndex,
    scrollY: adjustScroll(currentVariantIndex, 0, Math.max(3, height - 8), items.length),
    height: Math.max(3, height - 8),
  }, {
    width: Math.max(1, width),
    showScrollbar: items.length > Math.max(3, height - 8),
    ctx,
  });
  const variant = resolveStoryVariant(story, currentVariantIndex);
  const description = boxSurface(column([
    line(`Profile: ${resolveStoryProfilePreset(story, findStoryProfileIndex(story, model.profileMode)).label}`),
    spacer(),
    paragraphSurface(
      variant.description ?? 'No extra description for this variant.',
      Math.max(20, width - 6),
    ),
  ]), {
    title: 'active variant',
    width: Math.max(22, width - 1),
    borderToken: docsThemeMutedBorderToken(theme),
    ctx,
  });

  return column([
    themedSeparatorSurface(`variants • ${story.title}`, width, ctx, theme),
    list,
    spacer(1, 1),
    description,
  ]);
}

function buildDocsFooterHint(model: FrameModel<DocsExplorerModel>): string {
  const pageModel = model.pageModels[DOCS_PAGE_ID];
  if (pageModel == null || !pageModel.showHints) {
    return DOCS_SHELL_HINT;
  }

  const focusedPane = model.focusedPaneByPage[DOCS_PAGE_ID];
  const story = pageModel.selectedStoryId == null ? undefined : findComponentStory(pageModel.selectedStoryId);
  const activeHint = (() => {
    switch (focusedPane) {
      case 'family-nav':
        return `${DOCS_PANE_SWITCH_HINT} • ↑/↓ browse • Enter open • ←/→ collapse/expand`;
      case 'story-content':
        return `${DOCS_PANE_SWITCH_HINT} • j/k scroll • d/u page • g/G top/bottom`;
      case 'story-variants':
        return story == null
          ? DOCS_PANE_SWITCH_HINT
          : `${DOCS_PANE_SWITCH_HINT} • ↑/↓ variant • ,/. cycle • 1-4 profiles`;
      default:
        return undefined;
    }
  })();

  return activeHint == null ? DOCS_SHELL_HINT : `${DOCS_SHELL_HINT} • ${activeHint}`;
}

function familyRowIndexAtPosition(
  model: DocsExplorerModel,
  row: number,
  rect: { readonly row: number; readonly height: number },
): number | undefined {
  const visibleHeight = Math.max(3, rect.height - 2);
  const localRow = row - rect.row;
  const bodyRow = localRow - 1;
  if (bodyRow < 0 || bodyRow >= visibleHeight) return undefined;

  const index = model.familyState.scrollY + bodyRow;
  return index >= 0 && index < model.familyState.items.length ? index : undefined;
}

function variantRowIndexAtPosition(
  model: DocsExplorerModel,
  row: number,
  rect: { readonly row: number; readonly height: number },
): number | undefined {
  const story = selectedStory(model);
  if (story == null || story.variants.length === 0) return undefined;

  const listHeight = Math.max(3, rect.height - 8);
  const localRow = row - rect.row;
  const listRow = localRow - 1;
  if (listRow < 0 || listRow >= listHeight) return undefined;

  const currentVariantIndex = selectedVariantIndex(model, story.id);
  const scrollY = adjustScroll(currentVariantIndex, 0, listHeight, story.variants.length);
  const index = scrollY + listRow;
  return index >= 0 && index < story.variants.length ? index : undefined;
}

function resolveFamilyPaneMouse(
  msg: MouseMsg,
  model: DocsExplorerModel,
  rect: { readonly row: number; readonly height: number },
): ExplorerMsg | undefined {
  if (msg.action === 'scroll-down') return { type: 'family-next' };
  if (msg.action === 'scroll-up') return { type: 'family-prev' };
  if (msg.action !== 'press' || msg.button !== 'left') return undefined;

  const index = familyRowIndexAtPosition(model, msg.row, rect);
  return index == null ? undefined : { type: 'activate-row-index', index };
}

function resolveVariantPaneMouse(
  msg: MouseMsg,
  model: DocsExplorerModel,
  rect: { readonly row: number; readonly height: number },
): ExplorerMsg | undefined {
  if (msg.action === 'scroll-down') return { type: 'variant-next' };
  if (msg.action === 'scroll-up') return { type: 'variant-prev' };
  if (msg.action !== 'press' || msg.button !== 'left') return undefined;

  const index = variantRowIndexAtPosition(model, msg.row, rect);
  return index == null ? undefined : { type: 'select-variant', index };
}

function createDocsExplorerApp(ctx: BijouContext): App<FrameModel<DocsExplorerModel>, ExplorerMsg> {
  return createFramedApp<DocsExplorerModel, ExplorerMsg>({
    title: 'Bijou Docs',
    initialColumns: ctx.runtime.columns,
    initialRows: ctx.runtime.rows,
    globalKeys: explorerGlobalKeys,
    helpLineSource: ({ model }) => buildDocsFooterHint(model),
    pages: [{
      id: DOCS_PAGE_ID,
      title: 'DOGFOOD',
      init: () => [createInitialExplorerModel(ctx), []],
      update(msg, model) {
        switch (msg.type) {
          case 'family-next':
            return [{ ...model, familyState: listFocusNext(model.familyState) }, []];
          case 'family-prev':
            return [{ ...model, familyState: listFocusPrev(model.familyState) }, []];
          case 'family-page-down':
            return [{ ...model, familyState: listPageDown(model.familyState) }, []];
          case 'family-page-up':
            return [{ ...model, familyState: listPageUp(model.familyState) }, []];
          case 'activate-row':
            return [activateFocusedRow(model), []];
          case 'activate-row-index':
            return [activateFamilyRowIndex(model, msg.index), []];
          case 'expand-row':
            return [expandFocusedFamily(model), []];
          case 'collapse-row':
            return [collapseFocusedFamily(model), []];
          case 'select-story':
            return [selectStory(model, msg.storyId), []];
          case 'select-variant':
            return [selectVariantIndex(model, msg.index), []];
          case 'variant-next':
            return [cycleVariantIndex(model, 1), []];
          case 'variant-prev':
            return [cycleVariantIndex(model, -1), []];
          case 'set-profile':
            return [{ ...model, profileMode: msg.mode }, []];
          case 'toggle-hints':
            return [{ ...model, showHints: !model.showHints }, []];
          case 'cycle-landing-theme':
            return [{ ...model, landingThemeIndex: nextLandingThemeIndex(model.landingThemeIndex, 1) }, []];
          case 'cycle-landing-quality':
            return [{ ...model, landingQualityMode: nextLandingQualityMode(model.landingQualityMode) }, []];
        }
      },
      inputAreas(model) {
        return [
          {
            paneId: 'family-nav',
            keyMap: familyPaneKeys,
            helpSource: familyPaneKeys,
            mouse: ({ msg, rect }) => resolveFamilyPaneMouse(msg, model, rect),
          },
          {
            paneId: 'story-variants',
            keyMap: variantPaneKeys,
            helpSource: variantPaneKeys,
            mouse: ({ msg, rect }) => resolveVariantPaneMouse(msg, model, rect),
          },
        ];
      },
      searchTitle: 'Search components',
      searchItems(model) {
        return COMPONENT_STORIES.map((story) => ({
          id: story.id,
          label: story.title,
          description: `${story.family} • ${story.docs.summary}`,
          category: story.family,
          action: { type: 'select-story', storyId: story.id } satisfies ExplorerMsg,
        }));
      },
      layout(model) {
        const theme = resolveLandingTheme(model.landingThemeIndex);
        return {
          kind: 'grid',
          gridId: 'docs-shell',
          columns: [1, DOCS_SIDEBAR_WIDTH, 1, '1fr', 1, DOCS_SIDEBAR_WIDTH, 1],
          rows: [1, '1fr', 1],
          areas: [
            '. . . . . . .',
            '. family . main . variants .',
            '. . . . . . .',
          ],
          gap: 0,
          cells: {
            family: {
              kind: 'pane',
              paneId: 'family-nav',
              render: (width, height) => renderFamiliesPane(model, width, height, ctx, theme),
            },
            main: {
              kind: 'pane',
              paneId: 'story-content',
              render: (width) => renderStoryPane(model, width, ctx, theme),
            },
            variants: {
              kind: 'pane',
              paneId: 'story-variants',
              render: (width, height) => renderVariantsPane(model, width, height, ctx, theme),
            },
          },
        };
      },
    }],
    enableCommandPalette: true,
    settings: ({ model, pageModel }) => ({
      title: 'Settings',
      sections: [
        {
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            description: 'Show active-pane control cues in the footer. Turn this off for a quieter shell and use ? for the full key map.',
            valueLabel: pageModel.showHints ? 'On' : 'Off',
            checked: pageModel.showHints,
            kind: 'toggle',
            action: { type: 'toggle-hints' },
            feedback: {
              title: 'Settings',
              message: pageModel.showHints ? 'Show hints turned off.' : 'Show hints turned on.',
            },
          }],
        },
        {
          id: 'landing',
          title: 'Landing',
          rows: [
            {
              id: 'landing-theme',
              label: 'Landing theme',
              description: landingThemeSettingDescription(pageModel.landingThemeIndex),
              valueLabel: landingThemeSettingValue(pageModel.landingThemeIndex),
              kind: 'choice',
              action: { type: 'cycle-landing-theme' },
              feedback: {
                title: 'Settings',
                message: `Landing theme set to ${landingThemeSettingValue(nextLandingThemeIndex(pageModel.landingThemeIndex, 1))}.`,
              },
            },
            {
              id: 'landing-quality',
              label: 'Landing quality',
              description: landingQualitySettingDescription(model.columns, model.rows, pageModel.landingQualityMode),
              valueLabel: landingQualitySettingValue(model.columns, model.rows, pageModel.landingQualityMode),
              kind: 'choice',
              action: { type: 'cycle-landing-quality' },
              feedback: {
                title: 'Settings',
                message: `Landing quality set to ${landingQualityModeLabel(nextLandingQualityMode(pageModel.landingQualityMode))}.`,
              },
            },
          ],
        },
      ],
    }),
  });
}

export function createDocsApp(ctx: BijouContext): App<RootModel, RootMsg> {
  const explorer = createDocsExplorerApp(ctx);
  const renderLanding = createLandingRenderer(ctx);

  function mapExplorer(cmds: Cmd<ExplorerMsg>[]): Cmd<RootMsg>[] {
    return mapCmds(cmds, (msg) => ({ type: 'docs', msg }));
  }

  function updateExplorer(
    message: KeyMsg | ResizeMsg | MouseMsg | PulseLikeMsg | ExplorerMsg,
    model: RootModel,
  ): [RootModel, Cmd<RootMsg>[]] {
    const [docsModel, cmds] = explorer.update(message, model.docsModel);
    const pageModel = docsModel.pageModels[DOCS_PAGE_ID];
    return [{
      ...model,
      docsModel,
      landingThemeIndex: pageModel?.landingThemeIndex ?? model.landingThemeIndex,
    }, mapExplorer(cmds)];
  }

  return {
    init() {
      const [docsModel, cmds] = explorer.init();
      return [{
        route: 'landing',
        columns: Math.max(1, ctx.runtime.columns),
        rows: Math.max(1, ctx.runtime.rows),
        landingTimeMs: 0,
        landingFps: Math.max(1, Math.round(ctx.runtime.refreshRate)),
        landingThemeIndex: 0,
        landingToast: undefined,
        landingQuitConfirmOpen: false,
        docsModel,
      }, mapExplorer(cmds)];
    },

    update(msg, model) {
      if (msg.type === 'docs') {
        return updateExplorer(msg.msg, model);
      }

      if (isResizeMsg(msg)) {
        const resizedModel: RootModel = {
          ...model,
          columns: msg.columns,
          rows: msg.rows,
        };
        return updateExplorer(msg, resizedModel);
      }

      if (model.route === 'landing') {
        if (msg.type === 'pulse') {
          const landingTimeMs = model.landingTimeMs + Math.round(msg.dt * 1000);
          return [{
            ...model,
            landingTimeMs,
            landingFps: updateLandingFps(model.landingFps, msg.dt),
            landingToast: model.landingToast && landingTimeMs < model.landingToast.expiresAtMs
              ? model.landingToast
              : undefined,
          }, []];
        }
        if (isKeyMsg(msg)) {
          if (model.landingQuitConfirmOpen) {
            if (isShellQuitConfirmAccept(msg)) {
              return [{
                ...model,
                landingQuitConfirmOpen: false,
              }, [quit()]];
            }
            if (isShellQuitConfirmDismiss(msg)) {
              return [{
                ...model,
                landingQuitConfirmOpen: false,
              }, []];
            }
            return [model, []];
          }
          if (isShellQuitRequest(msg)) {
            if (!shouldUseShellQuitConfirm(ctx)) {
              return [model, [quit()]];
            }
            return [{
              ...model,
              landingQuitConfirmOpen: true,
            }, []];
          }
          if (msg.key === 'left') {
            return [applyLandingThemeSelection(model, nextLandingThemeIndex(model.landingThemeIndex, -1)), []];
          }
          if (msg.key === 'right') {
            return [applyLandingThemeSelection(model, nextLandingThemeIndex(model.landingThemeIndex, 1)), []];
          }
          if (msg.key === 'up') {
            return [applyLandingQualitySelection(model, previousLandingQualityMode(resolveLandingQualityMode(model))), []];
          }
          if (msg.key === 'down') {
            return [applyLandingQualitySelection(model, nextLandingQualityMode(resolveLandingQualityMode(model))), []];
          }
          if (!msg.ctrl && !msg.alt && /^[1-5]$/.test(msg.key)) {
            return [applyLandingThemeSelection(model, Number(msg.key) - 1), []];
          }
          if (!msg.ctrl && !msg.alt) {
            return [{ ...model, route: 'docs' }, []];
          }
        }
        return [model, []];
      }

      if (isKeyMsg(msg) || isMouseMsg(msg) || msg.type === 'pulse') {
        return updateExplorer(msg, model);
      }

      return [model, []];
    },

    view(model) {
      if (model.route === 'landing') {
        const landing = renderLanding(model);
        return model.landingQuitConfirmOpen
          ? compositeSurface(landing, [renderShellQuitOverlay(model.columns, model.rows)])
          : landing;
      }
      return explorer.view(model.docsModel);
    },

    routeRuntimeIssue(issue) {
      const routed = explorer.routeRuntimeIssue?.(issue);
      return routed === undefined ? undefined : { type: 'docs', msg: routed };
    },
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'family';
}

function renderFamilyRow(options: {
  readonly row: RowDescriptor;
  readonly width: number;
  readonly focused: boolean;
  readonly selectedStoryId?: string;
  readonly expandedFamilies: Readonly<Record<string, boolean>>;
  readonly ctx: BijouContext;
  readonly theme: LandingThemeTokens;
}): Surface {
  const { row, width, focused, selectedStoryId, expandedFamilies, ctx, theme } = options;
  const accentToken = docsThemeAccentToken(theme);
  const mutedToken = docsThemeMutedBorderToken(theme);
  if (row.kind === 'family') {
    const family = STORY_FAMILIES.find((candidate) => candidate.id === row.familyId);
    if (family == null) return line('', width);
    const expanded = expandedFamilies[row.familyId] ?? false;
    const focusPrefix = focused
      ? ctx.style.styled(accentToken as any, '›')
      : ' ';
    const arrow = ctx.style.styled(accentToken as any, expanded ? '▼' : '▶');
    const title = focused
      ? ctx.style.styled(accentToken as any, family.label)
      : family.label;
    return line(`${focusPrefix} ${arrow} ${title}`, width);
  }

  const story = row.storyId == null ? undefined : findComponentStory(row.storyId);
  if (story == null) return line('', width);
  const selected = selectedStoryId === story.id;
  const focusPrefix = focused
    ? ctx.style.styled(accentToken as any, '›')
    : ' ';
  const bullet = selected
    ? ctx.style.styled(accentToken as any, '•')
    : ctx.style.styled(mutedToken as any, '•');
  const title = selected
    ? ctx.style.styled(accentToken as any, story.title)
    : story.title;
  return line(`${focusPrefix}   ${bullet} ${title}`, width);
}

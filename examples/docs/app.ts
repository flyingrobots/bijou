import { readFileSync } from 'node:fs';
import {
  boxSurface,
  createSurface,
  inspector,
  lerp3,
  markdown,
  progressBar,
  type PreferenceListTheme,
  separatorSurface,
  wrapToWidth,
  type BijouContext,
  type Surface,
  type TokenValue,
} from '@flyingrobots/bijou';
import {
  FRAME_I18N_CATALOG,
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
  viewportSurface,
  type App,
  type Cmd,
  type FramePageMsg,
  type FrameModel,
  type FramedApp,
  type FramedAppMsg,
  type KeyMsg,
  type MouseMsg,
  type ResizeMsg,
} from '../../packages/bijou-tui/src/index.js';
import {
  createI18nRuntime,
  type I18nCatalog,
  type I18nDirection,
  type I18nRuntime,
} from '../../packages/bijou-i18n/src/index.js';
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
import { resolveDogfoodDocsCoverage, type DogfoodDocsCoverage } from './coverage.js';
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
const GUIDES_START_HERE_TEXT = readMarkdownDoc('./content/guides-start-here.md');
const GUIDES_NAVIGATE_DOGFOOD_TEXT = readMarkdownDoc('./content/guides-navigate-dogfood.md');
const PACKAGES_OVERVIEW_TEXT = readMarkdownDoc('./content/packages-overview.md');
const PHILOSOPHY_OVERVIEW_TEXT = readMarkdownDoc('./content/philosophy-overview.md');
const RELEASE_OVERVIEW_TEXT = readMarkdownDoc('./content/release-overview.md');
const FLYING_ROBOTS_LARGE_LINES = splitGlyphLines(FLYING_ROBOTS_WIDE_LARGE_TEXT);
const FLYING_ROBOTS_SMALL_LINES = splitGlyphLines(FLYING_ROBOTS_WIDE_SMALL_TEXT);
const ENTER_PROMPT_TEXT = 'Press [Enter]';
const LANDING_CONTROLS_TEXT = 'Esc/q quit • ↑/↓ quality • ←/→ theme • Enter continue';
const VERSION_TEXT = `v${BIJOU_VERSION}`;
const GUIDES_PAGE_ID = 'guides';
const COMPONENTS_PAGE_ID = 'components';
const PACKAGES_PAGE_ID = 'packages';
const PHILOSOPHY_PAGE_ID = 'philosophy';
const RELEASE_PAGE_ID = 'release';
const DOCS_SIDEBAR_WIDTH = 32;
const DOCS_SHELL_HINT = '? Help • / Search • F2 Settings • q Quit';
const DOCS_PANE_SWITCH_HINT = 'Tab next pane';
const DOGFOOD_I18N_NAMESPACE = 'bijou.dogfood';
const DOCS_FRAME_CHROME_ROWS = 2;
const DOCS_LAYOUT_VERTICAL_MARGIN_ROWS = 2;
const DOCS_FAMILY_SEPARATOR_ROWS = 1;

export { FRAME_I18N_CATALOG };

export const DOGFOOD_I18N_CATALOG: I18nCatalog = {
  namespace: DOGFOOD_I18N_NAMESPACE,
  entries: [
    dogfoodMessage('landing.prompt.enter', 'Press [Enter]'),
    dogfoodMessage('landing.footer.controls', 'Esc/q quit • ↑/↓ quality • ←/→ theme • Enter continue'),
    dogfoodMessage('landing.dogfood.title', 'DOGFOOD'),
    dogfoodMessage('landing.dogfood.expansion', 'Documentation Of Good Foundational Onboarding and Discovery'),
    dogfoodMessage('landing.quality.auto', 'Auto'),
    dogfoodMessage('landing.quality.quality', 'Quality'),
    dogfoodMessage('landing.quality.balanced', 'Balanced'),
    dogfoodMessage('landing.quality.performance', 'Performance'),
    dogfoodMessage('landing.quality.profile.full', 'full'),
    dogfoodMessage('landing.quality.profile.balanced', 'balanced'),
    dogfoodMessage('landing.quality.profile.performance', 'performance'),
    dogfoodMessage('landing.toast.quality', 'Landing quality: {quality}'),
    dogfoodMessage('docs.footer.shell', '? Help • / Search • F2 Settings • q Quit'),
    dogfoodMessage('docs.footer.paneSwitch', 'Tab next pane'),
    dogfoodMessage('docs.footer.family', '{paneSwitch} • ↑/↓ browse • Enter open • ←/→ collapse/expand'),
    dogfoodMessage('docs.footer.story', '{paneSwitch} • j/k scroll • d/u page • g/G top/bottom'),
    dogfoodMessage('docs.footer.variants', '{paneSwitch} • ↑/↓ variant • ,/. cycle • 1-4 profiles'),
    dogfoodMessage('docs.footer.guideNav', '{paneSwitch} • ↑/↓ browse • Enter open'),
    dogfoodMessage('docs.footer.guide', '{paneSwitch} • j/k scroll • d/u page • g/G top/bottom'),
    dogfoodMessage('docs.footer.guideMeta', '{paneSwitch} • section overview'),
    dogfoodMessage('docs.page.guides', 'Guides'),
    dogfoodMessage('docs.page.components', 'Components'),
    dogfoodMessage('docs.page.packages', 'Packages'),
    dogfoodMessage('docs.page.philosophy', 'Philosophy'),
    dogfoodMessage('docs.page.release', 'Release'),
    dogfoodMessage('docs.search.title', 'Search components'),
    dogfoodMessage('docs.empty.intro.title', 'What is Bijou?'),
    dogfoodMessage('docs.empty.intro.body', 'Bijou is a surface-native terminal UI framework for building styled, stateful, testable TUIs without dropping back into stringly view code.'),
    dogfoodMessage('docs.empty.intro.body2', 'DOGFOOD is the living field guide for the framework. The docs, previews, shell, and teaching surfaces are built in Bijou itself so the documentation exercises the same runtime and design system it describes.'),
    dogfoodMessage('docs.empty.guide.title', 'How to use these docs'),
    dogfoodMessage('docs.empty.coverage.title', 'Documentation coverage'),
    dogfoodMessage('docs.empty.coverage.body', 'DOGFOOD currently documents {documented} of {total} canonical component families. This field guide is honest about current coverage and will keep expanding over time.'),
    dogfoodMessage('docs.empty.coverage.status', '{documented}/{total} families • {percent}%'),
    dogfoodMessage('docs.empty.guide.step1', '1. Browse component families in the left lane.'),
    dogfoodMessage('docs.empty.guide.step2', '2. Press Enter to expand a family or open a component.'),
    dogfoodMessage('docs.empty.guide.step3', '3. Use Tab to move focus between families, docs, and variants.'),
    dogfoodMessage('docs.empty.guide.step4', '4. Press / to search by component name at any time.'),
    dogfoodMessage('docs.empty.guide.step5', '5. Press F2 for settings, ? for help, and q or Esc to quit.'),
    dogfoodMessage('docs.separator.welcome', 'welcome to bijou'),
    dogfoodMessage('settings.section.shell', 'Shell'),
    dogfoodMessage('settings.section.appearance', 'Appearance'),
    dogfoodMessage('settings.section.landing', 'Landing'),
    dogfoodMessage('settings.showHints.label', 'Show hints'),
    dogfoodMessage('settings.showHints.description', 'Show active-pane control cues in the footer. Turn this off for a quieter shell and use ? for the full key map.'),
    dogfoodMessage('settings.showHints.on', 'On'),
    dogfoodMessage('settings.showHints.off', 'Off'),
    dogfoodMessage('settings.showHints.feedback.on', 'Show hints turned on.'),
    dogfoodMessage('settings.showHints.feedback.off', 'Show hints turned off.'),
    dogfoodMessage('settings.landingTheme.label', 'Landing theme'),
    dogfoodMessage('settings.landingTheme.description', 'Sets the DOGFOOD title screen and docs accent palette. Current theme: {theme}. Options: {options}.'),
    dogfoodMessage('settings.landingTheme.feedback', 'Landing theme set to {theme}.'),
    dogfoodMessage('settings.landingQuality.label', 'Landing quality'),
    dogfoodMessage('settings.landingQuality.description.auto', 'Adapts render cost to terminal size. Current auto profile: {profile}. Options: {options}.'),
    dogfoodMessage('settings.landingQuality.description.quality', 'Prioritizes the richest title treatment even on larger terminals. Options: {options}.'),
    dogfoodMessage('settings.landingQuality.description.balanced', 'Keeps the title screen expressive while reducing render work on larger terminals. Options: {options}.'),
    dogfoodMessage('settings.landingQuality.description.performance', 'Minimizes title-screen work for giant terminals and slower emulators. Options: {options}.'),
    dogfoodMessage('settings.landingQuality.feedback', 'Landing quality set to {quality}.'),
  ],
};

function dogfoodMessage(id: string, value: string) {
  return {
    key: { namespace: DOGFOOD_I18N_NAMESPACE, id },
    kind: 'message' as const,
    sourceLocale: 'en',
    values: { en: value },
  };
}

interface StoryFamily {
  readonly id: string;
  readonly label: string;
  readonly stories: readonly ComponentStory[];
}

type DocsPageId =
  | typeof GUIDES_PAGE_ID
  | typeof COMPONENTS_PAGE_ID
  | typeof PACKAGES_PAGE_ID
  | typeof PHILOSOPHY_PAGE_ID
  | typeof RELEASE_PAGE_ID;

type GuideDocsPageId = Exclude<DocsPageId, typeof COMPONENTS_PAGE_ID>;

interface GuideDoc {
  readonly id: string;
  readonly pageId: GuideDocsPageId;
  readonly title: string;
  readonly summary: string;
  readonly body: string;
}

interface DocsPageSpec {
  readonly id: DocsPageId;
  readonly title: string;
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
  readonly previewTimeMs: number;
  readonly guideState: ReturnType<typeof createBrowsableListState<string>>;
  readonly selectedGuideId?: string;
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
  | { type: 'guide-next' }
  | { type: 'guide-prev' }
  | { type: 'guide-page-down' }
  | { type: 'guide-page-up' }
  | { type: 'activate-guide' }
  | { type: 'activate-guide-index'; index: number }
  | { type: 'select-guide'; guideId: string }
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

type RootMsg = { type: 'docs'; msg: FramedAppMsg<DocsMsg> };
type PulseLikeMsg = { readonly type: 'pulse'; readonly dt: number };
type DocsMsg = ExplorerMsg | PulseLikeMsg;
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
const DOGFOOD_DOCS_COVERAGE = resolveDogfoodDocsCoverage(COMPONENT_STORIES);
const DOCS_SITE_PAGES: readonly DocsPageSpec[] = Object.freeze([
  { id: GUIDES_PAGE_ID, title: 'Guides' },
  { id: COMPONENTS_PAGE_ID, title: 'Components' },
  { id: PACKAGES_PAGE_ID, title: 'Packages' },
  { id: PHILOSOPHY_PAGE_ID, title: 'Philosophy' },
  { id: RELEASE_PAGE_ID, title: 'Release' },
]);
const GUIDE_DOCS: readonly GuideDoc[] = Object.freeze([
  {
    id: 'start-here',
    pageId: GUIDES_PAGE_ID,
    title: 'Start Here',
    summary: 'What Bijou is, what DOGFOOD is for, and how the docs map is now shaped.',
    body: GUIDES_START_HERE_TEXT,
  },
  {
    id: 'navigate-dogfood',
    pageId: GUIDES_PAGE_ID,
    title: 'Navigate DOGFOOD',
    summary: 'How to move between sections, panes, search, settings, and component stories.',
    body: GUIDES_NAVIGATE_DOGFOOD_TEXT,
  },
  {
    id: 'packages-overview',
    pageId: PACKAGES_PAGE_ID,
    title: 'Packages Overview',
    summary: 'The visible home for package-level docs before the detailed package corpus lands.',
    body: PACKAGES_OVERVIEW_TEXT,
  },
  {
    id: 'philosophy-overview',
    pageId: PHILOSOPHY_PAGE_ID,
    title: 'Philosophy and Architecture',
    summary: 'The visible home for doctrine and architecture material before the full corpus lands.',
    body: PHILOSOPHY_OVERVIEW_TEXT,
  },
  {
    id: 'release-overview',
    pageId: RELEASE_PAGE_ID,
    title: 'Release and Migration',
    summary: 'The visible home for current-line release notes and migration guidance inside DOGFOOD.',
    body: RELEASE_OVERVIEW_TEXT,
  },
]);
const LANDING_FPS_ALPHA = 0.2;
const LANDING_COLOR_RAMP_SIZE = 256;
const DIM_MODIFIERS = ['dim'];
const BOLD_MODIFIERS = ['bold'];
const LANDING_STATIC_SURFACE_CACHE = new Map<string, {
  readonly footerControls: Surface;
  readonly footerVersion: Surface;
}>();
const LANDING_FPS_BADGE_CACHE = new Map<string, Surface>();
const LANDING_DOGFOOD_PANEL_CACHE = new Map<string, Surface>();
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

const guidePaneKeys = createKeyMap<ExplorerMsg>()
  .group('Guides', (group) => group
    .bind('down', 'Next guide', { type: 'guide-next' })
    .bind('up', 'Previous guide', { type: 'guide-prev' })
    .bind('pagedown', 'Page down', { type: 'guide-page-down' })
    .bind('pageup', 'Page up', { type: 'guide-page-up' })
    .bind('enter', 'Open guide', { type: 'activate-guide' })
    .bind('space', 'Open guide', { type: 'activate-guide' }),
  );

const componentsPageKeys = createKeyMap<ExplorerMsg>()
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

interface DocsAppOptions {
  readonly locale?: string;
  readonly direction?: I18nDirection;
  readonly extraI18nCatalogs?: readonly I18nCatalog[];
  readonly initialRoute?: RootModel['route'];
}

function dogfoodText(
  i18n: I18nRuntime | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  if (i18n == null) return fallback.replace(/\{([^}]+)\}/g, (_match, rawKey: string) => String(values[rawKey] ?? `{${rawKey}}`));
  try {
    return i18n.t({ namespace: DOGFOOD_I18N_NAMESPACE, id }, values);
  } catch {
    return fallback.replace(/\{([^}]+)\}/g, (_match, rawKey: string) => String(values[rawKey] ?? `{${rawKey}}`));
  }
}

function shellText(
  i18n: I18nRuntime | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  if (i18n == null) return fallback.replace(/\{([^}]+)\}/g, (_match, rawKey: string) => String(values[rawKey] ?? `{${rawKey}}`));
  try {
    return i18n.t({ namespace: FRAME_I18N_CATALOG.namespace, id }, values);
  } catch {
    return fallback.replace(/\{([^}]+)\}/g, (_match, rawKey: string) => String(values[rawKey] ?? `{${rawKey}}`));
  }
}

function formatI18nList(i18n: I18nRuntime | undefined, values: readonly string[]): string {
  if (i18n == null) return values.join(', ');
  return i18n.formatList(values, i18n.locale);
}

function shouldRouteLandingKeyIntoShell(msg: KeyMsg): boolean {
  if (msg.alt) return false;
  if (msg.ctrl) {
    return msg.key === ',' || msg.key === 'p';
  }
  return msg.key === 'f2'
    || msg.key === '?'
    || msg.key === '/'
    || msg.key === ':'
    || (msg.key === 'n' && msg.shift);
}

function readMarkdownDoc(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8').trim();
}

function guideDocsForPage(pageId: DocsPageId): readonly GuideDoc[] {
  return GUIDE_DOCS.filter((doc) => doc.pageId === pageId);
}

function guideItemsForPage(pageId: DocsPageId): readonly { label: string; value: string; description?: string }[] {
  return guideDocsForPage(pageId).map((doc) => ({
    label: doc.title,
    value: doc.id,
    description: doc.summary,
  }));
}

function pageTitle(pageId: DocsPageId, i18n?: I18nRuntime): string {
  switch (pageId) {
    case GUIDES_PAGE_ID:
      return dogfoodText(i18n, 'docs.page.guides', 'Guides');
    case COMPONENTS_PAGE_ID:
      return dogfoodText(i18n, 'docs.page.components', 'Components');
    case PACKAGES_PAGE_ID:
      return dogfoodText(i18n, 'docs.page.packages', 'Packages');
    case PHILOSOPHY_PAGE_ID:
      return dogfoodText(i18n, 'docs.page.philosophy', 'Philosophy');
    case RELEASE_PAGE_ID:
      return dogfoodText(i18n, 'docs.page.release', 'Release');
  }
}

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

function createInitialExplorerModel(ctx: BijouContext, pageId: DocsPageId): DocsExplorerModel {
  const expandedFamilies = Object.fromEntries(STORY_FAMILIES.map((family) => [family.id, false]));
  const guideItems = guideItemsForPage(pageId);
  return {
    familyState: createBrowsableListState({
      items: buildFamilyItems(expandedFamilies),
      height: 14,
    }),
    expandedFamilies,
    selectedStoryId: undefined,
    profileMode: ctx.mode,
    variantIndexByStory: Object.fromEntries(COMPONENT_STORIES.map((story) => [story.id, 0])),
    previewTimeMs: 0,
    guideState: createBrowsableListState({
      items: guideItems,
      height: 14,
    }),
    selectedGuideId: guideItems[0]?.value,
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
    previewTimeMs: 0,
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
    previewTimeMs: 0,
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
    previewTimeMs: 0,
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
    previewTimeMs: 0,
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
    previewTimeMs: 0,
  };
}

function focusGuideRow(model: DocsExplorerModel, index: number): DocsExplorerModel {
  const itemCount = model.guideState.items.length;
  if (itemCount === 0) return model;
  const focusIndex = Math.max(0, Math.min(index, itemCount - 1));
  return {
    ...model,
    guideState: {
      ...model.guideState,
      focusIndex,
      scrollY: adjustScroll(
        focusIndex,
        model.guideState.scrollY,
        model.guideState.height,
        itemCount,
      ),
    },
  };
}

function selectedGuide(pageId: DocsPageId, model: DocsExplorerModel): GuideDoc | undefined {
  const docs = guideDocsForPage(pageId);
  const selected = docs.find((doc) => doc.id === model.selectedGuideId);
  return selected ?? docs[0];
}

function selectGuide(pageId: DocsPageId, model: DocsExplorerModel, guideId?: string): DocsExplorerModel {
  if (guideId == null) return model;
  const docs = guideDocsForPage(pageId);
  const index = docs.findIndex((doc) => doc.id === guideId);
  if (index < 0) return model;
  return {
    ...model,
    selectedGuideId: guideId,
    guideState: {
      ...model.guideState,
      focusIndex: index,
      scrollY: adjustScroll(index, model.guideState.scrollY, model.guideState.height, model.guideState.items.length),
    },
  };
}

function activateGuideRow(model: DocsExplorerModel, pageId: DocsPageId): DocsExplorerModel {
  const guideId = model.guideState.items[model.guideState.focusIndex]?.value;
  return selectGuide(pageId, model, guideId);
}

function activateGuideRowIndex(model: DocsExplorerModel, pageId: DocsPageId, index: number): DocsExplorerModel {
  return activateGuideRow(focusGuideRow(model, index), pageId);
}

function createLandingRenderer(ctx: BijouContext, i18n: I18nRuntime): (model: RootModel) => Surface {
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
    const staticSurfaces = getLandingStaticSurfaces(tokens, i18n);
    const promptLine = createLandingPromptSurface(tokens, quantizedTimeMs, i18n);
    const fpsBadge = getLandingFpsBadge(tokens, fpsBadgeValue, quality, qualityMode, i18n);
    const dogfoodPanel = getLandingDogfoodPanel(
      Math.max(28, Math.min(width - 6, 88)),
      ctx,
      tokens,
      i18n,
    );
    const panelPromptGap = 1;
    const promptWordmarkGap = 1;
    const footerY = Math.max(0, height - 1);
    const contentTop = Math.min(height - 1, logoY + logoHeight + 1);
    const contentBottom = Math.max(contentTop, footerY - 2);
    const availableHeight = Math.max(0, contentBottom - contentTop + 1);
    const fullClusterHeight = dogfoodPanel.height + panelPromptGap + promptLine.height + promptWordmarkGap + wordmark.height;
    const compactClusterHeight = dogfoodPanel.height + panelPromptGap + promptLine.height;

    if (availableHeight >= fullClusterHeight) {
      const startY = contentTop + Math.max(0, Math.floor((availableHeight - fullClusterHeight) / 2));
      blitCentered(surface, dogfoodPanel, startY);
      blitCentered(surface, promptLine, startY + dogfoodPanel.height + panelPromptGap);
      blitCentered(surface, wordmark, startY + dogfoodPanel.height + panelPromptGap + promptLine.height + promptWordmarkGap);
    } else if (availableHeight >= compactClusterHeight) {
      const startY = contentTop + Math.max(0, Math.floor((availableHeight - compactClusterHeight) / 2));
      blitCentered(surface, dogfoodPanel, startY);
      blitCentered(surface, promptLine, startY + dogfoodPanel.height + panelPromptGap);
    } else {
      const promptY = Math.max(0, Math.min(contentBottom - promptLine.height + 1, contentTop));
      blitCentered(surface, promptLine, promptY);
      if (availableHeight >= dogfoodPanel.height) {
        blitCentered(surface, dogfoodPanel, contentTop);
      }
    }
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

function landingQualityProfileLabel(quality: LandingQualityProfile, i18n?: I18nRuntime): string {
  switch (quality.id) {
    case 'full':
      return dogfoodText(i18n, 'landing.quality.profile.full', 'full');
    case 'balanced':
      return dogfoodText(i18n, 'landing.quality.profile.balanced', 'balanced');
    case 'ultra':
      return dogfoodText(i18n, 'landing.quality.profile.performance', 'performance');
    default:
      return quality.id;
  }
}

function landingQualityModeLabel(mode: LandingQualityMode, i18n?: I18nRuntime): string {
  switch (mode) {
    case 'auto':
      return dogfoodText(i18n, 'landing.quality.auto', 'Auto');
    case 'quality':
      return dogfoodText(i18n, 'landing.quality.quality', 'Quality');
    case 'balanced':
      return dogfoodText(i18n, 'landing.quality.balanced', 'Balanced');
    case 'performance':
      return dogfoodText(i18n, 'landing.quality.performance', 'Performance');
  }
}

function landingQualityBadgeLabel(
  quality: LandingQualityProfile,
  mode: LandingQualityMode,
  i18n?: I18nRuntime,
): string {
  if (mode === 'auto') {
    return `auto/${landingQualityProfileLabel(quality, i18n)}`;
  }
  return landingQualityModeLabel(mode, i18n).toLowerCase();
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
  i18n?: I18nRuntime,
): string {
  if (mode !== 'auto') return landingQualityModeLabel(mode, i18n);
  return `${landingQualityModeLabel(mode, i18n)} (${landingQualityProfileLabel(resolveLandingQuality(width, height, mode), i18n)})`;
}

function landingQualitySettingDescription(
  width: number,
  height: number,
  mode: LandingQualityMode,
  i18n?: I18nRuntime,
): string {
  const currentProfile = landingQualityProfileLabel(resolveLandingQuality(width, height, mode), i18n);
  const options = formatI18nList(i18n, [
    landingQualityModeLabel('auto', i18n),
    landingQualityModeLabel('quality', i18n),
    landingQualityModeLabel('balanced', i18n),
    landingQualityModeLabel('performance', i18n),
  ]);
  switch (mode) {
    case 'auto':
      return dogfoodText(
        i18n,
        'settings.landingQuality.description.auto',
        'Adapts render cost to terminal size. Current auto profile: {profile}. Options: {options}.',
        { profile: currentProfile, options },
      );
    case 'quality':
      return dogfoodText(
        i18n,
        'settings.landingQuality.description.quality',
        'Prioritizes the richest title treatment even on larger terminals. Options: {options}.',
        { options },
      );
    case 'balanced':
      return dogfoodText(
        i18n,
        'settings.landingQuality.description.balanced',
        'Keeps the title screen expressive while reducing render work on larger terminals. Options: {options}.',
        { options },
      );
    case 'performance':
      return dogfoodText(
        i18n,
        'settings.landingQuality.description.performance',
        'Minimizes title-screen work for giant terminals and slower emulators. Options: {options}.',
        { options },
      );
  }
}

function landingThemeSettingValue(index: number): string {
  return resolveLandingTheme(index).label;
}

function landingThemeSettingDescription(index: number, i18n?: I18nRuntime): string {
  const theme = resolveLandingTheme(index);
  return dogfoodText(
    i18n,
    'settings.landingTheme.description',
    'Sets the DOGFOOD title screen and docs accent palette. Current theme: {theme}. Options: {options}.',
    {
      theme: theme.label,
      options: formatI18nList(i18n, LANDING_THEMES.map((entry) => entry.label)),
    },
  );
}

function resolveLandingQualityMode(model: RootModel): LandingQualityMode {
  return model.docsModel.pageModels[model.docsModel.activePageId]?.landingQualityMode ?? 'auto';
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

function getLandingStaticSurfaces(tokens: LandingThemeTokens, i18n: I18nRuntime): {
  readonly footerControls: Surface;
  readonly footerVersion: Surface;
} {
  const controlsText = dogfoodText(i18n, 'landing.footer.controls', LANDING_CONTROLS_TEXT);
  const cacheKey = `${tokens.id}:${controlsText}`;
  const cached = LANDING_STATIC_SURFACE_CACHE.get(cacheKey);
  if (cached) return cached;

  const surfaces = {
    footerControls: createTransparentTextSurface(controlsText, {
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
  LANDING_STATIC_SURFACE_CACHE.set(cacheKey, surfaces);
  return surfaces;
}

function createLandingPromptSurface(
  tokens: LandingThemeTokens,
  timeMs: number,
  i18n?: I18nRuntime,
): Surface {
  const promptText = dogfoodText(i18n, 'landing.prompt.enter', ENTER_PROMPT_TEXT);
  const highlightStart = promptText.indexOf('[');
  const highlightEnd = promptText.indexOf(']');
  const time = timeMs / 1000;

  return createTransparentTextSurface(promptText, {
    bg: tokens.background,
    transparentSpaces: false,
    fg: (x) => {
      const inHighlight = highlightStart >= 0
        && highlightEnd >= highlightStart
        && x >= highlightStart
        && x <= highlightEnd;
      if (!inHighlight) {
        return tokens.promptBodyColor;
      }

      const span = Math.max(1, highlightEnd - highlightStart);
      const local = (x - highlightStart) / span;
      const shimmer = 0.5 + (Math.sin((time * 4.2) + (local * Math.PI * 2.2)) * 0.5);
      return sampleColorRamp(tokens.logoRamp, clamp01(0.56 + (shimmer * 0.38)));
    },
    modifiers: (x) => {
      const inHighlight = highlightStart >= 0
        && highlightEnd >= highlightStart
        && x >= highlightStart
        && x <= highlightEnd;
      return inHighlight ? BOLD_MODIFIERS : DIM_MODIFIERS;
    },
  });
}

function getLandingFpsBadge(
  tokens: LandingThemeTokens,
  fps: number,
  quality: LandingQualityProfile,
  mode: LandingQualityMode,
  i18n?: I18nRuntime,
): Surface {
  const qualityLabel = landingQualityBadgeLabel(quality, mode, i18n);
  const key = `${tokens.id}:${fps}:${quality.id}:${mode}:${qualityLabel}`;
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

function getLandingDogfoodPanel(
  width: number,
  ctx: BijouContext,
  tokens: LandingThemeTokens,
  i18n?: I18nRuntime,
): Surface {
  const title = dogfoodText(i18n, 'landing.dogfood.title', 'DOGFOOD');
  const expansion = dogfoodText(
    i18n,
    'landing.dogfood.expansion',
    'Documentation Of Good Foundational Onboarding and Discovery',
  );
  const key = `${tokens.id}:${width}:${title}:${expansion}`;
  const cached = LANDING_DOGFOOD_PANEL_CACHE.get(key);
  if (cached) return cached;

  const bodyWidth = Math.max(18, width - 4);
  const body = centerSurfaceHorizontally(createTransparentTextSurface(
    wrapToWidth(expansion, bodyWidth).join('\n'),
    {
      bg: tokens.background,
      transparentSpaces: false,
      fg: tokens.footerStrongColor,
      modifiers: BOLD_MODIFIERS,
    },
  ), bodyWidth);
  const surface = boxSurface(body, {
    title,
    width,
    borderToken: landingDogfoodPanelBorderToken(tokens),
    padding: { left: 1, right: 1 },
    ctx,
  });
  LANDING_DOGFOOD_PANEL_CACHE.set(key, surface);
  return surface;
}

function mapDocsPageModels(
  docsModel: FrameModel<DocsExplorerModel>,
  transform: (pageModel: DocsExplorerModel, pageId: DocsPageId) => DocsExplorerModel,
): FrameModel<DocsExplorerModel> {
  let changed = false;
  const nextPageModels: Record<string, DocsExplorerModel> = {};

  for (const [pageId, pageModel] of Object.entries(docsModel.pageModels)) {
    const nextPageModel = transform(pageModel, pageId as DocsPageId);
    nextPageModels[pageId] = nextPageModel;
    if (nextPageModel !== pageModel) {
      changed = true;
    }
  }

  return changed
    ? {
        ...docsModel,
        pageModels: nextPageModels,
      }
    : docsModel;
}

function syncDocsSharedSettings(
  docsModel: FrameModel<DocsExplorerModel>,
): FrameModel<DocsExplorerModel> {
  const activePageModel = docsModel.pageModels[docsModel.activePageId];
  if (activePageModel == null) return docsModel;
  return mapDocsPageModels(docsModel, (pageModel) => {
    if (
      pageModel.showHints === activePageModel.showHints
      && pageModel.landingThemeIndex === activePageModel.landingThemeIndex
      && pageModel.landingQualityMode === activePageModel.landingQualityMode
    ) {
      return pageModel;
    }
    return {
      ...pageModel,
      showHints: activePageModel.showHints,
      landingThemeIndex: activePageModel.landingThemeIndex,
      landingQualityMode: activePageModel.landingQualityMode,
    };
  });
}

function applyLandingThemeSelection(model: RootModel, index: number): RootModel {
  const nextIndex = mod(index, LANDING_THEMES.length);
  if (nextIndex === model.landingThemeIndex) return model;
  const theme = resolveLandingTheme(nextIndex);
  return {
    ...model,
    landingThemeIndex: nextIndex,
    docsModel: mapDocsPageModels(model.docsModel, (pageModel) => (
      pageModel.landingThemeIndex === nextIndex
        ? pageModel
        : { ...pageModel, landingThemeIndex: nextIndex }
    )),
    landingToast: {
      message: theme.label,
      expiresAtMs: model.landingTimeMs + 1600,
    },
  };
}

function applyLandingQualitySelection(model: RootModel, mode: LandingQualityMode, i18n?: I18nRuntime): RootModel {
  const activePageModel = model.docsModel.pageModels[model.docsModel.activePageId];
  if (activePageModel == null || activePageModel.landingQualityMode === mode) return model;

  return {
    ...model,
    docsModel: mapDocsPageModels(model.docsModel, (pageModel) => (
      pageModel.landingQualityMode === mode
        ? pageModel
        : { ...pageModel, landingQualityMode: mode }
    )),
    landingToast: {
      message: dogfoodText(
        i18n,
        'landing.toast.quality',
        'Landing quality: {quality}',
        { quality: landingQualityModeLabel(mode, i18n) },
      ),
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

function srgbChannelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * srgbChannelToLinear(r))
    + (0.7152 * srgbChannelToLinear(g))
    + (0.0722 * srgbChannelToLinear(b));
}

function contrastRatio(a: string, b: string): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

function colorDistance(a: string, b: string): number {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
}

function pickStandoutColor(background: string, base: string, candidates: readonly string[]): string {
  let best = candidates[0] ?? base;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of candidates) {
    const contrast = contrastRatio(candidate, background);
    const distance = colorDistance(candidate, base) / Math.sqrt(3 * 255 * 255);
    const score = contrast * 3 + distance;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
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

function centerSurfaceHorizontally(content: Surface, width: number): Surface {
  const centered = createSurface(Math.max(1, width), Math.max(1, content.height));
  centered.blit(content, Math.max(0, Math.floor((centered.width - content.width) / 2)), 0);
  return centered;
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

function docsThemeSurfaceToken(theme: LandingThemeTokens): TokenValue {
  return {
    hex: sampleColorRamp(theme.waveRamp, 0.44),
    bg: sampleColorRamp(theme.waveRamp, 0.06),
  };
}

function docsThemeSelectedRowBgToken(theme: LandingThemeTokens): TokenValue {
  return {
    hex: sampleColorRamp(theme.waveRamp, 0.62),
    bg: sampleColorRamp(theme.waveRamp, 0.12),
  };
}

function docsThemeDescriptionToken(theme: LandingThemeTokens): TokenValue {
  return {
    hex: sampleColorRamp(theme.waveRamp, 0.58),
    modifiers: ['dim'],
  };
}

function docsThemeActiveHeaderTabToken(theme: LandingThemeTokens): TokenValue {
  const surface = docsThemeSurfaceToken(theme);
  const background = surface.bg ?? theme.background;
  const base = surface.hex;
  return {
    hex: pickStandoutColor(background, base, [
      sampleColorRamp(theme.logoRamp, 0.98),
      sampleColorRamp(theme.logoRamp, 0.84),
      sampleColorRamp(theme.waveRamp, 0.88),
      sampleColorRamp(theme.logoRamp, 0.62),
    ]),
    bg: sampleColorRamp(theme.waveRamp, 0.14),
    modifiers: ['bold'],
  };
}

function docsThemeProgressTokens(theme: LandingThemeTokens): {
  readonly filledToken: TokenValue;
  readonly filledEndToken: TokenValue;
  readonly emptyToken: TokenValue;
  readonly labelToken: TokenValue;
} {
  const surface = docsThemeSurfaceToken(theme);
  const background = surface.bg ?? theme.background;
  const base = surface.hex;
  const filledStart = pickStandoutColor(background, base, [
    sampleColorRamp(theme.waveRamp, 0.58),
    sampleColorRamp(theme.logoRamp, 0.34),
    sampleColorRamp(theme.waveRamp, 0.74),
  ]);
  const filledEnd = pickStandoutColor(background, filledStart, [
    sampleColorRamp(theme.logoRamp, 0.78),
    sampleColorRamp(theme.logoRamp, 0.96),
    sampleColorRamp(theme.waveRamp, 0.9),
  ]);
  return {
    filledToken: { hex: filledStart, modifiers: ['bold'] },
    filledEndToken: { hex: filledEnd, modifiers: ['bold'] },
    emptyToken: { hex: sampleColorRamp(theme.waveRamp, 0.22), modifiers: ['dim'] },
    labelToken: {
      hex: pickStandoutColor(background, base, [
        sampleColorRamp(theme.logoRamp, 0.9),
        sampleColorRamp(theme.waveRamp, 0.84),
        sampleColorRamp(theme.logoRamp, 0.7),
      ]),
      modifiers: ['bold'],
    },
  };
}

function landingDogfoodPanelBorderToken(theme: LandingThemeTokens): TokenValue {
  return {
    hex: pickStandoutColor(theme.background, theme.footerMutedColor, [
      theme.footerStrongColor,
      sampleColorRamp(theme.logoRamp, 0.84),
      sampleColorRamp(theme.waveRamp, 0.78),
    ]),
  };
}

function docsThemePreferenceListTheme(theme: LandingThemeTokens): PreferenceListTheme {
  return {
    sectionTitleToken: docsThemeAccentToken(theme),
    selectedRowBgToken: docsThemeSelectedRowBgToken(theme),
    toggleOnToken: docsThemeAccentToken(theme),
    toggleOffToken: docsThemeMutedBorderToken(theme),
    choiceToken: docsThemeAccentToken(theme),
    infoToken: { hex: sampleColorRamp(theme.waveRamp, 0.82) },
    descriptionToken: docsThemeDescriptionToken(theme),
  };
}

function docsThemeFocusedGutterToken(theme: LandingThemeTokens): TokenValue {
  return { hex: sampleColorRamp(theme.logoRamp, 0.82), bg: sampleColorRamp(theme.waveRamp, 0.12), modifiers: ['bold'] };
}

function docsThemeUnfocusedGutterToken(theme: LandingThemeTokens): TokenValue {
  return { hex: sampleColorRamp(theme.waveRamp, 0.38), bg: sampleColorRamp(theme.waveRamp, 0.08), modifiers: ['dim'] };
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

function resolvePaneInset(width: number): number {
  return width >= 3 ? 1 : 0;
}

function resolvePaneInnerWidth(width: number): number {
  const inset = resolvePaneInset(width);
  return Math.max(1, width - (inset * 2));
}

function resolveFamilyPaneBodyHeight(frameRows: number): number {
  return Math.max(
    1,
    frameRows - DOCS_FRAME_CHROME_ROWS - DOCS_LAYOUT_VERTICAL_MARGIN_ROWS - DOCS_FAMILY_SEPARATOR_ROWS,
  );
}

function insetPaneSurface(content: Surface, width: number): Surface {
  const safeWidth = Math.max(1, width);
  const inset = resolvePaneInset(safeWidth);
  const innerWidth = Math.max(1, safeWidth - (inset * 2));
  const result = createSurface(safeWidth, content.height);
  result.blit(content, inset, 0, 0, 0, innerWidth, content.height);
  return result;
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
  const paneWidth = resolvePaneInnerWidth(width);
  const bodyHeight = Math.max(1, height - DOCS_FAMILY_SEPARATOR_ROWS);
  const content = createSurface(Math.max(1, paneWidth), Math.max(1, model.familyState.items.length));

  for (let index = 0; index < model.familyState.items.length; index++) {
    const row = parseRowValue(model.familyState.items[index]!.value);
    content.blit(
      renderFamilyRow({
        row,
        width: paneWidth,
        focused: index === model.familyState.focusIndex,
        selectedStoryId: model.selectedStoryId,
        expandedFamilies: model.expandedFamilies,
        ctx,
        theme,
      }),
      0,
      index,
    );
  }

  const body = viewportSurface({
    width: Math.max(1, paneWidth),
    height: bodyHeight,
    content,
    scrollY: model.familyState.scrollY,
    showScrollbar: true,
  });

  return insetPaneSurface(column([
    themedSeparatorSurface('component families', paneWidth, ctx, theme),
    body,
  ]), width);
}

function renderEmptyStoryPane(
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  i18n: I18nRuntime,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const bodyWidth = Math.max(28, paneWidth - 6);
  const coverageBarWidth = Math.max(16, Math.min(40, bodyWidth - 8));
  const intro = boxSurface(column([
    paragraphSurface(
      dogfoodText(
        i18n,
        'docs.empty.intro.body',
        'Bijou is a surface-native terminal UI framework for building styled, stateful, testable TUIs without dropping back into stringly view code.',
      ),
      Math.max(24, bodyWidth - 2),
    ),
    spacer(),
    paragraphSurface(
      dogfoodText(
        i18n,
        'docs.empty.intro.body2',
        'DOGFOOD is the living field guide for the framework. The docs, previews, shell, and teaching surfaces are built in Bijou itself so the documentation exercises the same runtime and design system it describes.',
      ),
      Math.max(24, bodyWidth - 2),
    ),
  ]), {
    title: dogfoodText(i18n, 'docs.empty.intro.title', 'What is Bijou?'),
    width: Math.max(24, paneWidth),
    borderToken: docsThemeBorderToken(theme),
    padding: { left: 1, right: 1 },
    ctx,
  });

  const coverage = boxSurface(column([
    paragraphSurface(
      dogfoodText(
        i18n,
        'docs.empty.coverage.body',
        'DOGFOOD currently documents {documented} of {total} canonical component families. This field guide is honest about current coverage and will keep expanding over time.',
        {
          documented: DOGFOOD_DOCS_COVERAGE.documentedFamilies,
          total: DOGFOOD_DOCS_COVERAGE.totalFamilies,
        },
      ),
      Math.max(24, bodyWidth - 2),
    ),
    spacer(),
    contentSurface(progressBar(DOGFOOD_DOCS_COVERAGE.percent, {
      width: coverageBarWidth,
      showPercent: true,
      ...docsThemeProgressTokens(theme),
      ctx,
    })),
    spacer(),
    line(dogfoodText(
      i18n,
      'docs.empty.coverage.status',
      '{documented}/{total} families • {percent}%',
      {
        documented: DOGFOOD_DOCS_COVERAGE.documentedFamilies,
        total: DOGFOOD_DOCS_COVERAGE.totalFamilies,
        percent: DOGFOOD_DOCS_COVERAGE.percent,
      },
    )),
  ]), {
    title: dogfoodText(i18n, 'docs.empty.coverage.title', 'Documentation coverage'),
    width: Math.max(24, paneWidth),
    borderToken: docsThemeBorderToken(theme),
    padding: { left: 1, right: 1 },
    ctx,
  });

  const guide = boxSurface(column([
    line(dogfoodText(i18n, 'docs.empty.guide.step1', '1. Browse component families in the left lane.')),
    line(dogfoodText(i18n, 'docs.empty.guide.step2', '2. Press Enter to expand a family or open a component.')),
    line(dogfoodText(i18n, 'docs.empty.guide.step3', '3. Use Tab to move focus between families, docs, and variants.')),
    line(dogfoodText(i18n, 'docs.empty.guide.step4', '4. Press / to search by component name at any time.')),
    line(dogfoodText(i18n, 'docs.empty.guide.step5', '5. Press F2 for settings, ? for help, and q or Esc to quit.')),
  ]), {
    title: dogfoodText(i18n, 'docs.empty.guide.title', 'How to use these docs'),
    width: Math.max(24, paneWidth),
    borderToken: docsThemeMutedBorderToken(theme),
    padding: { left: 1, right: 1 },
    ctx,
  });

  return insetPaneSurface(column([
    themedSeparatorSurface(dogfoodText(i18n, 'docs.separator.welcome', 'welcome to bijou'), paneWidth, ctx, theme),
    spacer(1, 1),
    intro,
    spacer(1, 1),
    coverage,
    spacer(1, 1),
    guide,
  ]), width);
}

function renderStoryPane(
  model: DocsExplorerModel,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  i18n: I18nRuntime,
): Surface {
  const story = selectedStory(model);
  if (story == null) {
    return renderEmptyStoryPane(width, ctx, theme, i18n);
  }

  const paneWidth = resolvePaneInnerWidth(width);
  const profileIndex = findStoryProfileIndex(story, model.profileMode);
  const preset = resolveStoryProfilePreset(story, profileIndex);
  const variant = resolveStoryVariant(story, selectedVariantIndex(model, story.id));
  const previewWidth = Math.max(20, Math.min(Math.max(20, paneWidth - 6), preset.width));
  const previewCtx = createStoryProfileContext(ctx, preset, {
    width: previewWidth,
    height: 14,
  });
  const preview = storyPreviewSurface(variant.render({
    width: previewWidth,
    ctx: previewCtx,
    state: variant.initialState as never,
    timeMs: model.previewTimeMs,
  }));
  const previewTitle = `live preview • ${preset.label} • ${variant.label}`;
  const previewCard = boxSurface(preview, {
    title: previewTitle,
    width: Math.min(paneWidth, Math.max(28, preview.width + 4, previewTitle.length + 4)),
    borderToken: docsThemeMutedBorderToken(theme),
    padding: { left: 1, right: 1 },
    ctx,
  });
  const docs = markdown(storyDocsMarkdown(story, variant, preset), {
    width: Math.max(24, paneWidth - 2),
    ctx,
  });

  return insetPaneSurface(column([
    themedSeparatorSurface(`docs • ${story.title}`, paneWidth, ctx, theme),
    spacer(1, 1),
    placeSurface(previewCard, {
      width: paneWidth,
      height: previewCard.height,
      hAlign: 'center',
      vAlign: 'top',
    }),
    spacer(1, 1),
    contentSurface(docs),
  ]), width);
}

function renderVariantsPane(
  model: DocsExplorerModel,
  width: number,
  height: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const story = selectedStory(model);
  if (story == null) {
    return insetPaneSurface(column([
      themedSeparatorSurface('variants', paneWidth, ctx, theme),
      spacer(1, 1),
      boxSurface(paragraphSurface(
        'Variants appear here once a component is selected.',
        Math.max(20, paneWidth - 6),
      ), {
        width: Math.max(22, paneWidth),
        borderToken: docsThemeMutedBorderToken(theme),
        padding: { left: 1, right: 1 },
        ctx,
      }),
    ]), width);
  }

  const currentVariantIndex = selectedVariantIndex(model, story.id);
  const items = story.variants.map((variant) => ({
    label: variant.label,
    value: variant.id,
  }));
  const listHeight = Math.max(3, Math.min(items.length, Math.max(3, height - 12)));
  const list = browsableListSurface({
    items,
    focusIndex: currentVariantIndex,
    scrollY: adjustScroll(currentVariantIndex, 0, listHeight, items.length),
    height: listHeight,
  }, {
    width: Math.max(1, paneWidth),
    showScrollbar: items.length > listHeight,
    ctx,
  });
  const variant = resolveStoryVariant(story, currentVariantIndex);
  const description = contentSurface(inspector({
    title: 'active variant',
    currentValue: variant.label,
    sections: [
      {
        title: 'Profile',
        content: resolveStoryProfilePreset(story, findStoryProfileIndex(story, model.profileMode)).label,
      },
      {
        title: 'Description',
        content: variant.description ?? 'No extra description for this variant.',
        tone: 'muted',
      },
    ],
    width: Math.max(22, paneWidth),
    borderToken: docsThemeMutedBorderToken(theme),
    bgToken: docsThemeSurfaceToken(theme),
    ctx,
  }));

  return insetPaneSurface(column([
    themedSeparatorSurface(`variants • ${story.title}`, paneWidth, ctx, theme),
    spacer(1, 1),
    list,
    spacer(1, 1),
    description,
  ]), width);
}

function renderGuideNavPane(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  width: number,
  height: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  i18n: I18nRuntime,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const bodyHeight = Math.max(1, height - DOCS_FAMILY_SEPARATOR_ROWS);
  const content = createSurface(Math.max(1, paneWidth), Math.max(1, model.guideState.items.length));

  for (let index = 0; index < model.guideState.items.length; index++) {
    content.blit(
      renderGuideRow({
        item: model.guideState.items[index]!,
        width: paneWidth,
        focused: index === model.guideState.focusIndex,
        selectedGuideId: model.selectedGuideId,
        ctx,
        theme,
      }),
      0,
      index,
    );
  }

  const body = viewportSurface({
    width: Math.max(1, paneWidth),
    height: bodyHeight,
    content,
    scrollY: model.guideState.scrollY,
    showScrollbar: true,
  });

  return insetPaneSurface(column([
    themedSeparatorSurface(pageTitle(pageId, i18n).toLowerCase(), paneWidth, ctx, theme),
    body,
  ]), width);
}

function renderGuideReaderPane(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const doc = selectedGuide(pageId, model);
  if (doc == null) {
    return insetPaneSurface(column([
      themedSeparatorSurface('docs', paneWidth, ctx, theme),
      spacer(1, 1),
      boxSurface(paragraphSurface(
        'This section does not have published docs yet.',
        Math.max(20, paneWidth - 6),
      ), {
        width: Math.max(22, paneWidth),
        borderToken: docsThemeMutedBorderToken(theme),
        padding: { left: 1, right: 1 },
        ctx,
      }),
    ]), width);
  }

  return insetPaneSurface(column([
    themedSeparatorSurface(`docs • ${doc.title}`, paneWidth, ctx, theme),
    spacer(1, 1),
    contentSurface(markdown(doc.body, {
      width: Math.max(24, paneWidth - 2),
      ctx,
    })),
  ]), width);
}

function renderGuideInfoPane(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  i18n: I18nRuntime,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const doc = selectedGuide(pageId, model);
  const description = doc?.summary ?? 'This section is still being expanded.';

  return insetPaneSurface(column([
    themedSeparatorSurface(`section • ${pageTitle(pageId, i18n).toLowerCase()}`, paneWidth, ctx, theme),
    spacer(1, 1),
    contentSurface(inspector({
      title: 'guide info',
      currentValue: doc?.title ?? pageTitle(pageId, i18n),
      sections: [
        {
          title: 'Summary',
          content: description,
          tone: 'muted',
        },
        {
          title: 'Current posture',
          content: pageId === GUIDES_PAGE_ID
            ? 'This is the starter docs reader and top-level shell foundation for DOGFOOD.'
            : 'This section now has a visible home in DOGFOOD, but its full corpus is still part of the active 4.1.0 blocker work.',
          tone: 'muted',
        },
      ],
      width: Math.max(22, paneWidth),
      borderToken: docsThemeMutedBorderToken(theme),
      bgToken: docsThemeSurfaceToken(theme),
      ctx,
    })),
  ]), width);
}

function buildDocsFooterHint(model: FrameModel<DocsExplorerModel>, i18n: I18nRuntime): string {
  const pageId = (model.activePageId as DocsPageId | undefined) ?? GUIDES_PAGE_ID;
  const pageModel = model.pageModels[pageId];
  if (pageModel == null || !pageModel.showHints) {
    return dogfoodText(i18n, 'docs.footer.shell', DOCS_SHELL_HINT);
  }

  const focusedPane = model.focusedPaneByPage[pageId];
  const story = pageModel.selectedStoryId == null ? undefined : findComponentStory(pageModel.selectedStoryId);
  const paneSwitch = dogfoodText(i18n, 'docs.footer.paneSwitch', DOCS_PANE_SWITCH_HINT);
  const activeHint = (() => {
    if (pageId !== COMPONENTS_PAGE_ID) {
      switch (focusedPane) {
        case 'guide-nav':
          return dogfoodText(
            i18n,
            'docs.footer.guideNav',
            '{paneSwitch} • ↑/↓ browse • Enter open',
            { paneSwitch },
          );
        case 'guide-content':
          return dogfoodText(
            i18n,
            'docs.footer.guide',
            '{paneSwitch} • j/k scroll • d/u page • g/G top/bottom',
            { paneSwitch },
          );
        case 'guide-meta':
          return dogfoodText(
            i18n,
            'docs.footer.guideMeta',
            '{paneSwitch} • section overview',
            { paneSwitch },
          );
        default:
          return undefined;
      }
    }

    switch (focusedPane) {
      case 'family-nav':
        return dogfoodText(
          i18n,
          'docs.footer.family',
          '{paneSwitch} • ↑/↓ browse • Enter open • ←/→ collapse/expand',
          { paneSwitch },
        );
      case 'story-content':
        return dogfoodText(
          i18n,
          'docs.footer.story',
          '{paneSwitch} • j/k scroll • d/u page • g/G top/bottom',
          { paneSwitch },
        );
      case 'story-variants':
        return story == null
          ? paneSwitch
          : dogfoodText(
            i18n,
            'docs.footer.variants',
            '{paneSwitch} • ↑/↓ variant • ,/. cycle • 1-4 profiles',
            { paneSwitch },
          );
      default:
        return undefined;
    }
  })();

  const shellHint = dogfoodText(i18n, 'docs.footer.shell', DOCS_SHELL_HINT);
  return activeHint == null ? shellHint : `${shellHint} • ${activeHint}`;
}

function familyRowIndexAtPosition(
  model: DocsExplorerModel,
  row: number,
  rect: { readonly row: number; readonly height: number },
): number | undefined {
  const visibleHeight = Math.max(1, rect.height - DOCS_FAMILY_SEPARATOR_ROWS);
  const localRow = row - rect.row;
  const bodyRow = localRow - 1;
  if (bodyRow < 0 || bodyRow >= visibleHeight) return undefined;

  const index = model.familyState.scrollY + bodyRow;
  return index >= 0 && index < model.familyState.items.length ? index : undefined;
}

function guideRowIndexAtPosition(
  model: DocsExplorerModel,
  row: number,
  rect: { readonly row: number; readonly height: number },
): number | undefined {
  const visibleHeight = Math.max(1, rect.height - DOCS_FAMILY_SEPARATOR_ROWS);
  const localRow = row - rect.row;
  const bodyRow = localRow - 1;
  if (bodyRow < 0 || bodyRow >= visibleHeight) return undefined;

  const index = model.guideState.scrollY + bodyRow;
  return index >= 0 && index < model.guideState.items.length ? index : undefined;
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

function resolveGuidePaneMouse(
  msg: MouseMsg,
  model: DocsExplorerModel,
  rect: { readonly row: number; readonly height: number },
): ExplorerMsg | undefined {
  if (msg.action === 'scroll-down') return { type: 'guide-next' };
  if (msg.action === 'scroll-up') return { type: 'guide-prev' };
  if (msg.action !== 'press' || msg.button !== 'left') return undefined;

  const index = guideRowIndexAtPosition(model, msg.row, rect);
  return index == null ? undefined : { type: 'activate-guide-index', index };
}

function createDocsExplorerApp(ctx: BijouContext, i18n: I18nRuntime): FramedApp<DocsExplorerModel, DocsMsg> {
  return createFramedApp<DocsExplorerModel, DocsMsg>({
    i18n,
    title: 'Bijou Docs',
    headerStyle: ({ pageModel }) => ({
      activeTabToken: docsThemeActiveHeaderTabToken(resolveLandingTheme(pageModel.landingThemeIndex)),
    }),
    initialColumns: ctx.runtime.columns,
    initialRows: ctx.runtime.rows,
    helpLineSource: ({ model }) => buildDocsFooterHint(model, i18n),
    pages: DOCS_SITE_PAGES.map((spec) => {
      if (spec.id === COMPONENTS_PAGE_ID) {
        return {
          id: spec.id,
          title: pageTitle(spec.id, i18n),
          keyMap: componentsPageKeys,
          init: () => [createInitialExplorerModel(ctx, spec.id), []],
          update(msg: FramePageMsg<DocsMsg>, model) {
            if (msg.type === 'mouse') {
              return [model, []];
            }
            if (msg.type === 'pulse') {
              return [{
                ...model,
                previewTimeMs: model.previewTimeMs + Math.round(Math.max(0, msg.dt) * 1000),
              }, []];
            }
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
              default:
                return [model, []];
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
          searchTitle: dogfoodText(i18n, 'docs.search.title', 'Search components'),
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
                  focusedGutterToken: docsThemeFocusedGutterToken(theme),
                  unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
                  render: (width, height) => renderFamiliesPane(model, width, height, ctx, theme),
                },
                main: {
                  kind: 'pane',
                  paneId: 'story-content',
                  focusedGutterToken: docsThemeFocusedGutterToken(theme),
                  unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
                  render: (width) => renderStoryPane(model, width, ctx, theme, i18n),
                },
                variants: {
                  kind: 'pane',
                  paneId: 'story-variants',
                  focusedGutterToken: docsThemeFocusedGutterToken(theme),
                  unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
                  render: (width, height) => renderVariantsPane(model, width, height, ctx, theme),
                },
              },
            };
          },
        };
      }

      return {
        id: spec.id,
        title: pageTitle(spec.id, i18n),
        init: () => [createInitialExplorerModel(ctx, spec.id), []],
        update(msg: FramePageMsg<DocsMsg>, model) {
          if (msg.type === 'mouse' || msg.type === 'pulse') {
            return [model, []];
          }
          switch (msg.type) {
            case 'guide-next':
              return [{ ...model, guideState: listFocusNext(model.guideState) }, []];
            case 'guide-prev':
              return [{ ...model, guideState: listFocusPrev(model.guideState) }, []];
            case 'guide-page-down':
              return [{ ...model, guideState: listPageDown(model.guideState) }, []];
            case 'guide-page-up':
              return [{ ...model, guideState: listPageUp(model.guideState) }, []];
            case 'activate-guide':
              return [activateGuideRow(model, spec.id), []];
            case 'activate-guide-index':
              return [activateGuideRowIndex(model, spec.id, msg.index), []];
            case 'select-guide':
              return [selectGuide(spec.id, model, msg.guideId), []];
            case 'toggle-hints':
              return [{ ...model, showHints: !model.showHints }, []];
            case 'cycle-landing-theme':
              return [{ ...model, landingThemeIndex: nextLandingThemeIndex(model.landingThemeIndex, 1) }, []];
            case 'cycle-landing-quality':
              return [{ ...model, landingQualityMode: nextLandingQualityMode(model.landingQualityMode) }, []];
            default:
              return [model, []];
          }
        },
        inputAreas(model) {
          return [{
            paneId: 'guide-nav',
            keyMap: guidePaneKeys,
            helpSource: guidePaneKeys,
            mouse: ({ msg, rect }) => resolveGuidePaneMouse(msg, model, rect),
          }];
        },
        searchTitle: `Search ${pageTitle(spec.id, i18n).toLowerCase()}`,
        searchItems() {
          return guideDocsForPage(spec.id).map((doc) => ({
            id: doc.id,
            label: doc.title,
            description: doc.summary,
            category: pageTitle(spec.id, i18n),
            action: { type: 'select-guide', guideId: doc.id } satisfies ExplorerMsg,
          }));
        },
        layout(model) {
          const theme = resolveLandingTheme(model.landingThemeIndex);
          return {
            kind: 'grid',
            gridId: `docs-${spec.id}`,
            columns: [1, DOCS_SIDEBAR_WIDTH, 1, '1fr', 1, DOCS_SIDEBAR_WIDTH, 1],
            rows: [1, '1fr', 1],
            areas: [
              '. . . . . . .',
              '. nav . main . meta .',
              '. . . . . . .',
            ],
            gap: 0,
            cells: {
              nav: {
                kind: 'pane',
                paneId: 'guide-nav',
                focusedGutterToken: docsThemeFocusedGutterToken(theme),
                unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
                render: (width, height) => renderGuideNavPane(spec.id, model, width, height, ctx, theme, i18n),
              },
              main: {
                kind: 'pane',
                paneId: 'guide-content',
                focusedGutterToken: docsThemeFocusedGutterToken(theme),
                unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
                render: (width) => renderGuideReaderPane(spec.id, model, width, ctx, theme),
              },
              meta: {
                kind: 'pane',
                paneId: 'guide-meta',
                focusedGutterToken: docsThemeFocusedGutterToken(theme),
                unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
                render: (width) => renderGuideInfoPane(spec.id, model, width, ctx, theme, i18n),
              },
            },
          };
        },
      };
    }),
    enableCommandPalette: true,
    settings: ({ model, pageModel }) => {
      const theme = resolveLandingTheme(pageModel.landingThemeIndex);
      return {
        borderToken: docsThemeBorderToken(theme),
        bgToken: docsThemeSurfaceToken(theme),
        listTheme: docsThemePreferenceListTheme(theme),
        sections: [
        {
          id: 'shell',
          title: dogfoodText(i18n, 'settings.section.shell', 'Shell'),
          rows: [{
            id: 'show-hints',
            label: dogfoodText(i18n, 'settings.showHints.label', 'Show hints'),
            description: dogfoodText(i18n, 'settings.showHints.description', 'Show active-pane control cues in the footer. Turn this off for a quieter shell and use ? for the full key map.'),
            valueLabel: pageModel.showHints
              ? dogfoodText(i18n, 'settings.showHints.on', 'On')
              : dogfoodText(i18n, 'settings.showHints.off', 'Off'),
            checked: pageModel.showHints,
            kind: 'toggle',
            action: { type: 'toggle-hints' },
            feedback: {
              title: shellText(i18n, 'settings.title', 'Settings'),
              message: pageModel.showHints
                ? dogfoodText(i18n, 'settings.showHints.feedback.off', 'Show hints turned off.')
                : dogfoodText(i18n, 'settings.showHints.feedback.on', 'Show hints turned on.'),
            },
          }],
        },
        {
          id: 'appearance',
          title: dogfoodText(i18n, 'settings.section.appearance', 'Appearance'),
          rows: [
            {
              id: 'landing-theme',
              label: dogfoodText(i18n, 'settings.landingTheme.label', 'Landing theme'),
              description: landingThemeSettingDescription(pageModel.landingThemeIndex, i18n),
              valueLabel: landingThemeSettingValue(pageModel.landingThemeIndex),
              kind: 'choice',
              action: { type: 'cycle-landing-theme' },
              feedback: {
                title: shellText(i18n, 'settings.title', 'Settings'),
                message: dogfoodText(
                  i18n,
                  'settings.landingTheme.feedback',
                  'Landing theme set to {theme}.',
                  { theme: landingThemeSettingValue(nextLandingThemeIndex(pageModel.landingThemeIndex, 1)) },
                ),
              },
            },
          ],
        },
        {
          id: 'landing',
          title: dogfoodText(i18n, 'settings.section.landing', 'Landing'),
          rows: [
            {
              id: 'landing-quality',
              label: dogfoodText(i18n, 'settings.landingQuality.label', 'Landing quality'),
              description: landingQualitySettingDescription(model.columns, model.rows, pageModel.landingQualityMode, i18n),
              valueLabel: landingQualitySettingValue(model.columns, model.rows, pageModel.landingQualityMode, i18n),
              kind: 'choice',
              action: { type: 'cycle-landing-quality' },
              feedback: {
                title: shellText(i18n, 'settings.title', 'Settings'),
                message: dogfoodText(
                  i18n,
                  'settings.landingQuality.feedback',
                  'Landing quality set to {quality}.',
                  { quality: landingQualityModeLabel(nextLandingQualityMode(pageModel.landingQualityMode), i18n) },
                ),
              },
            },
          ],
        },
        ],
      };
    },
  });
}

function syncDocsExplorerViewportLayout(
  docsModel: FrameModel<DocsExplorerModel>,
): FrameModel<DocsExplorerModel> {
  const nextHeight = resolveFamilyPaneBodyHeight(docsModel.rows);
  let changed = false;
  const nextPageModels: Record<string, DocsExplorerModel> = {};

  for (const [pageId, pageModel] of Object.entries(docsModel.pageModels)) {
    let nextPageModel = pageModel;
    if (pageId === COMPONENTS_PAGE_ID) {
      if (pageModel.familyState.height !== nextHeight) {
        nextPageModel = {
          ...nextPageModel,
          familyState: {
            ...pageModel.familyState,
            height: nextHeight,
            scrollY: adjustScroll(
              pageModel.familyState.focusIndex,
              pageModel.familyState.scrollY,
              nextHeight,
              pageModel.familyState.items.length,
            ),
          },
        };
      }
    } else if (pageModel.guideState.height !== nextHeight) {
      nextPageModel = {
        ...nextPageModel,
        guideState: {
          ...pageModel.guideState,
          height: nextHeight,
          scrollY: adjustScroll(
            pageModel.guideState.focusIndex,
            pageModel.guideState.scrollY,
            nextHeight,
            pageModel.guideState.items.length,
          ),
        },
      };
    }

    nextPageModels[pageId] = nextPageModel;
    if (nextPageModel !== pageModel) {
      changed = true;
    }
  }

  return changed
    ? {
        ...docsModel,
        pageModels: nextPageModels,
      }
    : docsModel;
}

function createDocsI18nRuntime(options: DocsAppOptions = {}): I18nRuntime {
  const runtime = createI18nRuntime({
    locale: options.locale ?? 'en',
    direction: options.direction ?? 'ltr',
    fallbackLocale: 'en',
  });
  runtime.loadCatalog(FRAME_I18N_CATALOG);
  runtime.loadCatalog(DOGFOOD_I18N_CATALOG);
  for (const catalog of options.extraI18nCatalogs ?? []) {
    runtime.loadCatalog(catalog);
  }
  return runtime;
}

export function createDocsApp(ctx: BijouContext, options: DocsAppOptions = {}): App<RootModel, RootMsg> {
  const i18n = createDocsI18nRuntime(options);
  const explorer = createDocsExplorerApp(ctx, i18n);
  const renderLanding = createLandingRenderer(ctx, i18n);
  const initialRoute = options.initialRoute ?? 'landing';

  function mapExplorer(cmds: Cmd<FramedAppMsg<DocsMsg>>[]): Cmd<RootMsg>[] {
    return mapCmds(cmds, (msg) => ({ type: 'docs', msg }));
  }

  function updateExplorer(
    message: KeyMsg | ResizeMsg | MouseMsg | PulseLikeMsg | FramedAppMsg<DocsMsg>,
    model: RootModel,
  ): [RootModel, Cmd<RootMsg>[]] {
    const [docsModel, cmds] = explorer.update(message, model.docsModel);
    const syncedDocsModel = syncDocsSharedSettings(syncDocsExplorerViewportLayout(docsModel));
    const pageModel = syncedDocsModel.pageModels[syncedDocsModel.activePageId];
    return [{
      ...model,
      docsModel: syncedDocsModel,
      landingThemeIndex: pageModel?.landingThemeIndex ?? model.landingThemeIndex,
    }, mapExplorer(cmds)];
  }

  return {
    init() {
      const [docsModel, cmds] = explorer.init();
      const syncedDocsModel = syncDocsSharedSettings(syncDocsExplorerViewportLayout(docsModel));
      const activePageModel = syncedDocsModel.pageModels[syncedDocsModel.activePageId];
      return [{
        route: initialRoute,
        columns: Math.max(1, ctx.runtime.columns),
        rows: Math.max(1, ctx.runtime.rows),
        landingTimeMs: 0,
        landingFps: Math.max(1, Math.round(ctx.runtime.refreshRate)),
        landingThemeIndex: activePageModel?.landingThemeIndex ?? 0,
        landingToast: undefined,
        landingQuitConfirmOpen: false,
        docsModel: syncedDocsModel,
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
          if (shouldRouteLandingKeyIntoShell(msg)) {
            return updateExplorer(msg, {
              ...model,
              route: 'docs',
            });
          }
          if (msg.key === 'left') {
            return [applyLandingThemeSelection(model, nextLandingThemeIndex(model.landingThemeIndex, -1)), []];
          }
          if (msg.key === 'right') {
            return [applyLandingThemeSelection(model, nextLandingThemeIndex(model.landingThemeIndex, 1)), []];
          }
          if (msg.key === 'up') {
            return [applyLandingQualitySelection(model, previousLandingQualityMode(resolveLandingQualityMode(model)), i18n), []];
          }
          if (msg.key === 'down') {
            return [applyLandingQualitySelection(model, nextLandingQualityMode(resolveLandingQualityMode(model)), i18n), []];
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
      return routed === undefined ? undefined : { type: 'docs', msg: routed as ExplorerMsg };
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

function renderGuideRow(options: {
  readonly item: { readonly label: string; readonly value: string; readonly description?: string };
  readonly width: number;
  readonly focused: boolean;
  readonly selectedGuideId?: string;
  readonly ctx: BijouContext;
  readonly theme: LandingThemeTokens;
}): Surface {
  const { item, width, focused, selectedGuideId, ctx, theme } = options;
  const accentToken = docsThemeAccentToken(theme);
  const mutedToken = docsThemeMutedBorderToken(theme);
  const selected = selectedGuideId === item.value;
  const focusPrefix = focused
    ? ctx.style.styled(accentToken as any, '›')
    : ' ';
  const bullet = selected
    ? ctx.style.styled(accentToken as any, '•')
    : ctx.style.styled(mutedToken as any, '•');
  const title = selected || focused
    ? ctx.style.styled(accentToken as any, item.label)
    : item.label;
  return line(`${focusPrefix} ${bullet} ${title}`, width);
}

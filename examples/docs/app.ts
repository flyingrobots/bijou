import { readFileSync } from 'node:fs';
import {
  BIJOU_DARK,
  BIJOU_LIGHT,
  boxSurface,
  blockRenderNode,
  cloneContextWithTheme,
  createSurface,
  CYAN_MAGENTA,
  colorHex,
  doctorTheme,
  inspector,
  inspectorPanelBlock,
  lerp3,
  markdown,
  progressBar,
  readerSurfaceBlock,
  separatorSurface,
  standardBlocks,
  standardBlockStories,
  renderBlockTree,
  tv,
  wrapToWidth,
  type BijouContext,
  type BlockDefinition,
  type Cell,
  type OutputMode,
  type PreferenceListTheme,
  type Surface,
  type StandardBlockStory,
  type Theme,
  type TextModifier,
  type TokenValue,
} from '../../packages/bijou/src/index.js';
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
  rasterToGlyphSurface,
  renderShellQuitOverlay,
  renderFramePerfHudOverlay,
  shouldUseShellQuitConfirm,
  summarizeFrameTimings,
  toast,
  viewportSurface,
  type App,
  type Cmd,
  type FrameTimingSnapshot,
  type FrameCommandItem,
  type FramePageMsg,
  type FrameInputArea,
  type FrameModel,
  type FrameLayoutNode,
  type FramedApp,
  type FramedAppMsg,
  type FrameShellThemeSpec,
  type KeyMapGroup,
  type KeyMsg,
  type MouseMsg,
  type RenderStageTiming,
  type ResizeMsg,
  type RunOptions,
} from '../../packages/bijou-tui/src/index.js';
import { runWithLifecycleHooks } from '../../packages/bijou-tui/src/runtime.js';
import { normalizeViewOutput } from '../../packages/bijou-tui/src/view-output.js';
import {
  createI18nRuntime,
  createRuntimeLocalizationPort,
  type I18nCatalog,
  type I18nDirection,
  type I18nRuntime,
  type LocalizationPort,
} from '../../packages/bijou-i18n/src/index.js';
import {
  column,
  contentSurface,
  line,
  proseSurface,
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
import {
  DEFAULT_LOCALE,
  dogfoodLocaleLabel,
  dogfoodLocaleOptionsText,
  nextDogfoodLocale,
  resolveDogfoodInitialLocale,
  resolveDogfoodLocale,
  resolveDogfoodRuntimeLocale,
  type DogfoodLocalePort,
} from './locale.js';
import {
  DOGFOOD_I18N_CATALOG,
  DOGFOOD_I18N_NAMESPACE,
  dogfoodI18nCatalogsForLocale,
} from './i18n/dogfood-catalog.js';
import { dogfoodMissingLocalizationMessage } from './i18n/missing-localization.js';
import {
  dogfoodLocalizedText,
  formatLocalizedList,
  localizedText,
} from './localization.js';
import {
  applyCounterDemoIntent,
  counterDemoBlock,
  counterDemoBlockConfig,
  counterDemoBlockSurface,
  counterDemoDocumentationText,
  counterDemoIntentForAction,
  counterDemoLoweringPreviewText,
  createCounterDemoModel,
  tickCounterDemoModel,
  type CounterDemoIntentAction,
  type CounterDemoModel,
} from './counter-block-demo.js';
import {
  CURRENT_DOGFOOD_RELEASE_TITLE,
  DOGFOOD_RELEASE_TITLE_GALLERY,
  type DogfoodReleaseTitle,
  dogfoodReleaseTitleMarkdown,
  renderDogfoodReleaseTitleText,
} from './release-title.js';
import { rasterizeSvgToRgba, svgViewBoxAspectRatio } from './svg-raster.js';
import { COMPONENT_STORIES, findComponentStory } from './stories.js';
import {
  defaultDogfoodBlockRegistry,
  documentationArticleBlock,
  dogfoodDocsSurfacePreviewOutput,
  footerHintBlock,
  guideInspectorBlock,
  navigationListBlock,
  searchPanelBlock,
  titleScreenBlock,
  type DogfoodBlockRegistryEntry,
} from './dogfood-blocks.js';
import { DOGFOOD_SHELL_THEMES, DOGFOOD_THEME_SAFE_PAIRS } from './dogfood-shell-themes.js';
export { DOGFOOD_THEME_SAFE_PAIRS } from './dogfood-shell-themes.js';

const FLYING_ROBOTS_LOGO_TEXT = readFileSync(
  new URL('../../assets/flyingrobotslogo.txt', import.meta.url),
  'utf8',
).trimEnd();
const LANDING_BIJOU_SVG_TEXT = readFileSync(new URL('../../assets/Bijou.svg', import.meta.url), 'utf8');
const BIJOU_PACKAGE_JSON = JSON.parse(
  readFileSync(new URL('../../packages/bijou/package.json', import.meta.url), 'utf8'),
) as { readonly version: string };
const BIJOU_VERSION = BIJOU_PACKAGE_JSON.version;
const GUIDES_START_HERE_TEXT = readMarkdownDoc('./content/guides-start-here.md');
const GUIDES_NAVIGATE_DOGFOOD_TEXT = readMarkdownDoc('./content/guides-navigate-dogfood.md');
const GUIDES_I18N_WORKFLOW_TEXT = readMarkdownDoc('./content/guides-i18n-workflow.md');
const GUIDES_DOCUMENTATION_MAP_TEXT = readMarkdownDoc('../../docs/README.md');
const GUIDES_SECONDARY_EXAMPLES_TEXT = readMarkdownDoc('../../docs/EXAMPLES.md');
const BLOCKS_WHAT_ARE_BLOCKS_TEXT = readMarkdownDoc('../../docs/design-system/blocks.md');
const BLOCKS_MAKE_YOUR_OWN_TEXT = readMarkdownDoc('./content/blocks-make-your-own.md');
const BLOCKS_PRE_MADE_TEXT = standardBlockInventoryMarkdown();
const BLOCKS_PREVIEW_TEXT = standardBlockPreviewMarkdown();
const BLOCKS_LOWERING_TEXT = standardBlockLoweringMarkdown();
const PACKAGES_OVERVIEW_TEXT = readMarkdownDoc('./content/packages-overview.md');
const PACKAGE_BIJOU_TEXT = readMarkdownDocExcerpt('../../packages/bijou/README.md', ['## Install']);
const PACKAGE_BIJOU_NODE_TEXT = readMarkdownDocExcerpt('../../packages/bijou-node/README.md', ['## Install']);
const PACKAGE_BIJOU_TUI_TEXT = readMarkdownDocExcerpt('../../packages/bijou-tui/README.md', ['## Installation']);
const PACKAGE_BIJOU_TUI_APP_TEXT = readMarkdownDocExcerpt('../../packages/bijou-tui-app/README.md', ['## Quick Scaffold']);
const PACKAGE_CREATE_TUI_APP_TEXT = readMarkdownDocExcerpt('../../packages/create-bijou-tui-app/README.md', ['## Flags']);
const PACKAGE_BIJOU_I18N_TEXT = readMarkdownDoc('../../packages/bijou-i18n/README.md');
const PACKAGE_BIJOU_I18N_TOOLS_TEXT = readMarkdownDoc('../../packages/bijou-i18n-tools/README.md');
const PACKAGE_BIJOU_I18N_TOOLS_NODE_TEXT = readMarkdownDoc('../../packages/bijou-i18n-tools-node/README.md');
const PACKAGE_BIJOU_I18N_TOOLS_XLSX_TEXT = readMarkdownDoc('../../packages/bijou-i18n-tools-xlsx/README.md');
const PHILOSOPHY_OVERVIEW_TEXT = readMarkdownDoc('./content/philosophy-overview.md');
const PHILOSOPHY_SYSTEM_STYLE_TEXT = readMarkdownDoc('../../docs/system-style-javascript.md');
const PHILOSOPHY_ARCHITECTURE_TEXT = readMarkdownDoc('../../docs/ARCHITECTURE.md');
const PHILOSOPHY_UX_DOCTRINE_TEXT = readMarkdownDoc('../../docs/strategy/bijou-ux-doctrine.md');
const PHILOSOPHY_INVARIANTS_TEXT = readMarkdownDoc('../../docs/invariants/README.md');
const PHILOSOPHY_DESIGN_SYSTEM_TEXT = readMarkdownDoc('../../docs/design-system/README.md');
const RELEASE_OVERVIEW_TEXT = readMarkdownDoc('./content/release-overview.md');
const RELEASE_WHATS_NEW_TEXT = readMarkdownDoc(`../../docs/releases/${BIJOU_VERSION}/whats-new.md`);
const RELEASE_MIGRATION_GUIDE_TEXT = readMarkdownDoc(`../../docs/releases/${BIJOU_VERSION}/migration-guide.md`);
const FLYING_ROBOTS_LOGO_LINES = splitGlyphLines(FLYING_ROBOTS_LOGO_TEXT);
const ENTER_PROMPT_TEXT = 'Press [Enter]';
const LANDING_CONTROLS_TEXT = 'Esc/q quit • ↑/↓ quality • ←/→ theme • Enter continue';
const VERSION_TEXT = `v${BIJOU_VERSION}`;
const GUIDES_PAGE_ID = 'guides';
const COMPONENTS_PAGE_ID = 'components';
const BLOCKS_PAGE_ID = 'blocks';
const PACKAGES_PAGE_ID = 'packages';
const PHILOSOPHY_PAGE_ID = 'philosophy';
const THEME_LAB_PAGE_ID = 'themes';
const RELEASE_PAGE_ID = 'release';
const BLOCK_PREVIEW_GUIDE_ID = 'blocks-preview';
const COUNTER_DEMO_BLOCK_GUIDE_ID = `${BLOCK_PREVIEW_GUIDE_ID}-counterdemoblock`;
const THEME_LAB_GUIDE_ID = 'theme-lab';
const DOCS_SIDEBAR_WIDTH = 32;
const DOCS_STANDARD_NAV_WIDTH = 28;
const DOCS_NARROW_NAV_WIDTH = 26;
const DOCS_SHELL_HINT = '? Help • / Search • F2 Settings • F10 Theme Inspector • q Quit';
const DOCS_PANE_SWITCH_HINT = 'Tab next pane';
const DOCS_FRAME_CHROME_ROWS = 2;
const DOCS_LAYOUT_VERTICAL_MARGIN_ROWS = 2;
const DOCS_FAMILY_SEPARATOR_ROWS = 1;

export { DOGFOOD_I18N_CATALOG, FRAME_I18N_CATALOG };

export type DocsLayoutVariant = 'wide' | 'standard' | 'narrow' | 'tiny';

export function resolveDocsLayoutVariant(columns: number, rows: number): DocsLayoutVariant {
  const width = Math.max(0, Math.floor(columns));
  const height = Math.max(0, Math.floor(rows));
  if (width >= 120 && height >= 24) return 'wide';
  if (width >= 88 && height >= 20) return 'standard';
  if (width >= 64 && height >= 16) return 'narrow';
  return 'tiny';
}

interface StoryFamily {
  readonly id: string;
  readonly label: string;
  readonly stories: readonly ComponentStory[];
}

type DocsPageId =
  | typeof GUIDES_PAGE_ID
  | typeof COMPONENTS_PAGE_ID
  | typeof BLOCKS_PAGE_ID
  | typeof PACKAGES_PAGE_ID
  | typeof PHILOSOPHY_PAGE_ID
  | typeof THEME_LAB_PAGE_ID
  | typeof RELEASE_PAGE_ID;

type GuideDocsPageId = Exclude<DocsPageId, typeof COMPONENTS_PAGE_ID>;

interface GuideDoc {
  readonly id: string;
  readonly pageId: GuideDocsPageId;
  readonly title: string;
  readonly summary: string;
  readonly body: string;
  readonly localizedTitle?: (localization: LocalizationPort | undefined) => string;
  readonly localizedSummary?: (localization: LocalizationPort | undefined) => string;
  readonly localizedBody?: (localization: LocalizationPort | undefined) => string;
}

function releaseTitleGuide(release: DogfoodReleaseTitle): GuideDoc {
  return {
    id: `release-title-${release.id}`,
    pageId: RELEASE_PAGE_ID,
    title: release.title,
    summary: release.summary,
    body: dogfoodReleaseTitleMarkdown(undefined, release),
    localizedTitle: (localization) => dogfoodText(
      localization,
      release.titleKey,
      release.title,
    ),
    localizedSummary: (localization) => dogfoodText(
      localization,
      release.summaryKey,
      release.summary,
    ),
    localizedBody: (localization) => dogfoodReleaseTitleMarkdown(localization, release),
  };
}

const RELEASE_TITLE_GUIDES = DOGFOOD_RELEASE_TITLE_GALLERY.map(releaseTitleGuide);

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
  readonly layoutVariant: DocsLayoutVariant;
  readonly familyState: ReturnType<typeof createBrowsableListState<string>>;
  readonly expandedFamilies: Readonly<Record<string, boolean>>;
  readonly selectedStoryId?: string;
  readonly profileMode: StoryMode;
  readonly variantIndexByStory: Readonly<Record<string, number>>;
  readonly previewTimeMs: number;
  readonly guideState: ReturnType<typeof createBrowsableListState<string>>;
  readonly selectedGuideId?: string;
  readonly showHints: boolean;
  readonly locale: string;
  readonly landingThemeIndex: number;
  readonly activeShellThemeId?: string;
  readonly landingQualityMode: LandingQualityMode;
  readonly counterBlockDemo: CounterDemoModel;
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
  | { type: 'cycle-locale' }
  | { type: 'locale-activated'; locale: string }
  | { type: 'cycle-landing-quality' }
  | { type: 'counter-block-intent'; action: CounterDemoIntentAction };

interface RootModel {
  readonly route: 'landing' | 'docs';
  readonly columns: number;
  readonly rows: number;
  readonly landingTimeMs: number;
  readonly landingFps: number;
  readonly landingThemeIndex: number;
  readonly landingToast?: LandingToastState;
  readonly landingQuitConfirmOpen: boolean;
  readonly themeInspectorOpen: boolean;
  readonly themeInspectorScrollY: number;
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
  { id: BLOCKS_PAGE_ID, title: 'Blocks' },
  { id: PACKAGES_PAGE_ID, title: 'Packages' },
  { id: PHILOSOPHY_PAGE_ID, title: 'Philosophy' },
  { id: THEME_LAB_PAGE_ID, title: THEME_LAB_PAGE_ID },
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
    id: 'documentation-map',
    pageId: GUIDES_PAGE_ID,
    title: 'Documentation Map',
    summary: 'Repo orientation and the current-truth documentation lanes inside Bijou.',
    body: GUIDES_DOCUMENTATION_MAP_TEXT,
  },
  {
    id: 'guides-i18n-workflow',
    pageId: GUIDES_PAGE_ID,
    title: '@flyingrobots/bijou-i18n workflow',
    summary: '@flyingrobots/bijou-i18n-tools + @flyingrobots/bijou-i18n-tools-node',
    body: GUIDES_I18N_WORKFLOW_TEXT,
  },
  {
    id: 'secondary-example-map',
    pageId: GUIDES_PAGE_ID,
    title: 'Secondary Example Map',
    summary: 'Why examples are now secondary/internal and what reference value they still keep.',
    body: GUIDES_SECONDARY_EXAMPLES_TEXT,
  },
  {
    id: 'blocks-what-are-blocks',
    pageId: BLOCKS_PAGE_ID,
    title: 'What are Blocks',
    summary: 'The design-system posture for larger, opinionated Bijou assemblies.',
    body: BLOCKS_WHAT_ARE_BLOCKS_TEXT,
  },
  {
    id: 'blocks-make-your-own',
    pageId: BLOCKS_PAGE_ID,
    title: 'How to Make Your Own Blocks',
    summary: 'The block authoring contract: metadata first, schema adapters at boundaries, and commands as intent.',
    body: BLOCKS_MAKE_YOUR_OWN_TEXT,
  },
  {
    id: 'blocks-pre-made',
    pageId: BLOCKS_PAGE_ID,
    title: 'Pre-made Blocks',
    summary: 'The first-party standard blocks exported by @flyingrobots/bijou.',
    body: BLOCKS_PRE_MADE_TEXT,
    localizedBody: (localization) => standardBlockInventoryMarkdown(localization),
  },
  {
    id: 'blocks-dogfood-surfaces',
    pageId: BLOCKS_PAGE_ID,
    title: 'blocks-dogfood-surfaces',
    summary: '',
    body: '',
    localizedTitle: (localization) => dogfoodText(
      localization,
      'blocks.surfaceInventory.title',
      'DOGFOOD Surface Blocks',
    ),
    localizedSummary: (localization) => dogfoodText(
      localization,
      'blocks.surfaceInventory.summary',
      'The semantic Blocks DOGFOOD uses for its own visible product surfaces.',
    ),
    localizedBody: (localization) => dogfoodSurfaceBlockInventoryMarkdown(localization),
  },
  {
    id: BLOCK_PREVIEW_GUIDE_ID,
    pageId: BLOCKS_PAGE_ID,
    title: 'Block Preview',
    summary: 'A code-backed preview index for standard blocks, variants, and declared stories.',
    body: BLOCKS_PREVIEW_TEXT,
  },
  ...standardBlocks.map(blockPreviewGuideDoc),
  counterDemoBlockPreviewGuideDoc(),
  {
    id: 'blocks-lowering',
    pageId: BLOCKS_PAGE_ID,
    title: 'How Blocks Lower',
    summary: 'How standard block declarations carry mode and semantic facts before rendered block output lands.',
    body: BLOCKS_LOWERING_TEXT,
    localizedBody: (localization) => standardBlockLoweringMarkdown(localization),
  },
  {
    id: 'packages-overview',
    pageId: PACKAGES_PAGE_ID,
    title: 'Packages Overview',
    summary: 'How the public workspace packages fit together in the Bijou stack.',
    body: PACKAGES_OVERVIEW_TEXT,
  },
  {
    id: 'package-bijou',
    pageId: PACKAGES_PAGE_ID,
    title: '@flyingrobots/bijou',
    summary: 'The pure core toolkit: prompts, components, themes, ports, and surface primitives.',
    body: PACKAGE_BIJOU_TEXT,
  },
  {
    id: 'package-bijou-node',
    pageId: PACKAGES_PAGE_ID,
    title: '@flyingrobots/bijou-node',
    summary: 'Node runtime, IO, style, worker, and recorder adapters for Bijou apps.',
    body: PACKAGE_BIJOU_NODE_TEXT,
  },
  {
    id: 'package-bijou-tui',
    pageId: PACKAGES_PAGE_ID,
    title: '@flyingrobots/bijou-tui',
    summary: 'The fullscreen runtime: TEA loop, layout, motion, overlays, and shell infrastructure.',
    body: PACKAGE_BIJOU_TUI_TEXT,
  },
  {
    id: 'package-bijou-tui-app',
    pageId: PACKAGES_PAGE_ID,
    title: '@flyingrobots/bijou-tui-app',
    summary: 'The opinionated framed-shell starter for tabbed fullscreen Bijou apps.',
    body: PACKAGE_BIJOU_TUI_APP_TEXT,
  },
  {
    id: 'package-create-bijou-tui-app',
    pageId: PACKAGES_PAGE_ID,
    title: 'create-bijou-tui-app',
    summary: 'The scaffolder for bootstrapping a runnable Bijou TUI app project.',
    body: PACKAGE_CREATE_TUI_APP_TEXT,
  },
  {
    id: 'package-bijou-i18n',
    pageId: PACKAGES_PAGE_ID,
    title: '@flyingrobots/bijou-i18n',
    summary: 'The in-memory localization runtime for catalogs, direction, and runtime-safe lookups.',
    body: PACKAGE_BIJOU_I18N_TEXT,
  },
  {
    id: 'package-bijou-i18n-tools',
    pageId: PACKAGES_PAGE_ID,
    title: 'bijou-i18n-tools',
    summary: 'Provider-neutral localization tooling for exchange, stale detection, and catalog compilation.',
    body: PACKAGE_BIJOU_I18N_TOOLS_TEXT,
  },
  {
    id: 'package-bijou-i18n-tools-node',
    pageId: PACKAGES_PAGE_ID,
    title: 'bijou-i18n-tools-node',
    summary: 'Node filesystem adapters for localization exchange workflows and bundle files.',
    body: PACKAGE_BIJOU_I18N_TOOLS_NODE_TEXT,
  },
  {
    id: 'package-bijou-i18n-tools-xlsx',
    pageId: PACKAGES_PAGE_ID,
    title: 'bijou-i18n-tools-xlsx',
    summary: 'XLSX workbook adapters for spreadsheet-driven localization exchange.',
    body: PACKAGE_BIJOU_I18N_TOOLS_XLSX_TEXT,
  },
  {
    id: 'philosophy-overview',
    pageId: PHILOSOPHY_PAGE_ID,
    title: 'Philosophy and Architecture',
    summary: 'How the doctrine, architecture, and design stance pages fit together in DOGFOOD.',
    body: PHILOSOPHY_OVERVIEW_TEXT,
  },
  {
    id: 'philosophy-system-style-javascript',
    pageId: PHILOSOPHY_PAGE_ID,
    title: 'System-Style JavaScript',
    summary: 'Runtime truth, boundaries, adapters, codecs, and the repo-wide infrastructure doctrine.',
    body: PHILOSOPHY_SYSTEM_STYLE_TEXT,
  },
  {
    id: 'philosophy-architecture',
    pageId: PHILOSOPHY_PAGE_ID,
    title: 'Architecture',
    summary: 'The structural reference for the nine-package workspace and its core/runtime/i18n lanes.',
    body: PHILOSOPHY_ARCHITECTURE_TEXT,
  },
  {
    id: 'philosophy-ux-doctrine',
    pageId: PHILOSOPHY_PAGE_ID,
    title: 'Bijou UX Doctrine',
    summary: 'The product doctrine for calm, explicit, humane terminal UX.',
    body: PHILOSOPHY_UX_DOCTRINE_TEXT,
  },
  {
    id: 'philosophy-invariants',
    pageId: PHILOSOPHY_PAGE_ID,
    title: 'Invariants',
    summary: 'The non-negotiable project truths and the legends that protect them.',
    body: PHILOSOPHY_INVARIANTS_TEXT,
  },
  {
    id: 'philosophy-design-system',
    pageId: PHILOSOPHY_PAGE_ID,
    title: 'Design System Overview',
    summary: 'The foundations, patterns, blocks, and component-family doctrine behind Bijou UI.',
    body: PHILOSOPHY_DESIGN_SYSTEM_TEXT,
  },
  {
    id: THEME_LAB_GUIDE_ID,
    pageId: THEME_LAB_PAGE_ID,
    title: THEME_LAB_GUIDE_ID,
    summary: '',
    body: '',
    localizedTitle: (localization) => dogfoodText(localization, 'themeLab.title', 'Theme Lab'),
    localizedSummary: (localization) => dogfoodText(
      localization,
      'themeLab.summary',
      'Inspect first-party default themes, DOGFOOD shell palettes, token roles, and safe-pair diagnostics.',
    ),
    localizedBody: (localization) => [
      `# ${dogfoodText(localization, 'themeLab.title', 'Theme Lab')}`,
      '',
      dogfoodText(
        localization,
        'themeLab.body.summary',
        'DOGFOOD exposes Bijou theme facts as a runnable product surface: default dark/light presets, shell theme gallery, token swatches, and contrast diagnostics.',
      ),
      '',
      dogfoodText(
        localization,
        'themeLab.body.inspectorHint',
        'Press F10 from the docs shell for the quick Theme Inspector drawer.',
      ),
    ].join('\n'),
  },
  ...RELEASE_TITLE_GUIDES,
  {
    id: 'release-overview',
    pageId: RELEASE_PAGE_ID,
    title: 'Release Overview',
    summary: `How the current release line is shaped and where to read the detailed ${BIJOU_VERSION} release docs.`,
    body: RELEASE_OVERVIEW_TEXT,
  },
  {
    id: `release-whats-new-${BIJOU_VERSION.replaceAll('.', '-')}`,
    pageId: RELEASE_PAGE_ID,
    title: `What's New in v${BIJOU_VERSION}`,
    summary: `The long-form release story for the ${BIJOU_VERSION} line.`,
    body: RELEASE_WHATS_NEW_TEXT,
  },
  {
    id: `release-migration-${BIJOU_VERSION.replaceAll('.', '-')}`,
    pageId: RELEASE_PAGE_ID,
    title: `Migration Guide v${BIJOU_VERSION}`,
    summary: `Migration guidance for the ${BIJOU_VERSION} upgrade.`,
    body: RELEASE_MIGRATION_GUIDE_TEXT,
  },
]);
const LANDING_FPS_ALPHA = 0.2;
const LANDING_COLOR_RAMP_SIZE = 256;
const LANDING_WAKE_CHARS = ['█', '▓', '▒', '░', ' '] as const;
const LANDING_WAKE_WAVES = [
  { seeds: [0.15, 0.13, 0.37], amps: [10, 8, 5], scale: 0.9 },
  { seeds: [0.12, 0.14, 0.27], amps: [3, 6, 5], scale: 0.8 },
  { seeds: [0.089, 0.023, 0.217], amps: [2, 4, 2], scale: 0.3 },
  { seeds: [0.167, 0.054, 0.147], amps: [4, 6, 7], scale: 0.4 },
] as const;
const LANDING_BIJOU_SVG_CHARSET = ' ░▒▓█';
const LANDING_TITLE_CELL_ASPECT_RATIO = 0.5;
const LANDING_BIJOU_SVG_ASPECT_RATIO = svgViewBoxAspectRatio(LANDING_BIJOU_SVG_TEXT);
const LANDING_FLYING_ROBOTS_FADE_DELAY_MS = 3000;
const LANDING_FLYING_ROBOTS_FADE_DURATION_MS = 1000;
const LANDING_BIJOU_LOGO_LETTER_COUNT = 5;
const LANDING_BIJOU_LOGO_WAVE_AMPLITUDE_ROWS = 1.35;
const DIM_MODIFIERS: TextModifier[] = ['dim'];
const BOLD_MODIFIERS: TextModifier[] = ['bold'];
const BRAILLE_BLANK = '\u2800';
const LANDING_LOGO_OVERLAY_MASK = { char: true, fg: true, modifiers: true } as const;
const LANDING_BIJOU_SVG_OVERLAY_CACHE = new Map<string, Surface>();
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

interface BijouSvgOverlayMetrics {
  readonly left: number;
  readonly top: number;
  readonly columns: number;
  readonly rows: number;
}

interface LandingLogoOverlayOptions {
  readonly foregroundSample?: 'visible-cell' | 'background-cell';
  readonly opacity?: number;
  readonly yOffset?: (x: number, y: number, char: string, width: number, height: number) => number;
  readonly foreground?: (input: LandingLogoForegroundInput) => string;
}

interface LandingLogoForegroundInput {
  readonly x: number;
  readonly y: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly char: string;
  readonly width: number;
  readonly height: number;
  readonly targetCell: Cell;
  readonly baseForeground: string;
  readonly sampledColor: string;
}

const LANDING_THEME_SEEDS: readonly LandingThemeSeed[] = [
  {
    id: 'blocklab-workstation',
    label: 'BlockLab Workstation',
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
  {
    id: 'verdant-plum',
    label: 'Verdant Plum',
    background: '#043015',
    waveGradient: ['#265408', '#968425', '#b96862'],
    logoGradient: ['#968425', '#b96862', '#c281af'],
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

const DOCS_SHELL_THEMES: readonly FrameShellThemeSpec[] = [
  ...DOGFOOD_SHELL_THEMES,
  ...LANDING_THEMES.map((theme) => ({
    id: theme.id,
    label: theme.label,
    theme: landingTokensToShellTheme(theme),
  })),
];

export function docsShellThemesForTesting(): readonly FrameShellThemeSpec[] {
  return DOCS_SHELL_THEMES;
}

interface DocsShellThemeChoice {
  readonly id: string;
  readonly label: string;
  readonly shellThemeId: string;
  readonly shellThemeLabel: string;
  readonly modeId?: string;
  readonly modeLabel?: string;
  readonly theme: Theme;
}

function docsShellThemeChoiceId(shellThemeId: string, modeId?: string): string {
  return modeId === undefined ? shellThemeId : `${shellThemeId}:${modeId}`;
}

function flattenDocsShellThemeChoices(shellThemes: readonly FrameShellThemeSpec[]): readonly DocsShellThemeChoice[] {
  return shellThemes.flatMap((shellTheme) => {
    if (shellTheme.theme !== undefined) {
      return [{
        id: docsShellThemeChoiceId(shellTheme.id),
        label: shellTheme.label,
        shellThemeId: shellTheme.id,
        shellThemeLabel: shellTheme.label,
        theme: shellTheme.theme,
      }];
    }
    return (shellTheme.modes ?? []).map((mode) => ({
      id: docsShellThemeChoiceId(shellTheme.id, mode.id),
      label: `${shellTheme.label} / ${mode.label}`,
      shellThemeId: shellTheme.id,
      shellThemeLabel: shellTheme.label,
      modeId: mode.id,
      modeLabel: mode.label,
      theme: mode.theme,
    }));
  });
}

const DOCS_SHELL_THEME_CHOICES = flattenDocsShellThemeChoices(DOCS_SHELL_THEMES);
const LANDING_THEME_INDEX_BY_ID = new Map(LANDING_THEMES.map((theme, index) => [theme.id, index] as const));
const DOCS_VISUAL_THEME_BY_SHELL_ID = new Map<string, LandingThemeTokens>([
  ...LANDING_THEMES.map((theme) => [theme.id, theme] as const),
  ...DOCS_SHELL_THEME_CHOICES
    .filter((choice) => !LANDING_THEME_INDEX_BY_ID.has(choice.id))
    .map((choice) => [choice.id, docsVisualThemeFromShellThemeChoice(choice)] as const),
]);
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

function addGuidePaneBindings(group: KeyMapGroup<ExplorerMsg>): KeyMapGroup<ExplorerMsg> {
  return group
    .bind('down', 'Next guide', { type: 'guide-next' })
    .bind('up', 'Previous guide', { type: 'guide-prev' })
    .bind('pagedown', 'Page down', { type: 'guide-page-down' })
    .bind('pageup', 'Page up', { type: 'guide-page-up' })
    .bind('enter', 'Open guide', { type: 'activate-guide' })
    .bind('space', 'Open guide', { type: 'activate-guide' });
}

const guidePaneKeys = createKeyMap<ExplorerMsg>()
  .group('Guides', addGuidePaneBindings);

const counterBlockGuidePaneKeys = createKeyMap<ExplorerMsg>()
  .group('Guides', addGuidePaneBindings)
  .group('Counter fixture', (group) => group
    .bind('-', 'Decrease counter', { type: 'counter-block-intent', action: 'decrement' })
    .bind('+', 'Increase counter', { type: 'counter-block-intent', action: 'increment' })
    .bind('=', 'Increase counter', { type: 'counter-block-intent', action: 'increment' }),
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

const counterBlockPreviewPaneKeys = createKeyMap<ExplorerMsg>()
  .group('Counter fixture', (group) => group
    .bind('-', 'Decrease counter', { type: 'counter-block-intent', action: 'decrement' })
    .bind('+', 'Increase counter', { type: 'counter-block-intent', action: 'increment' })
    .bind('=', 'Increase counter', { type: 'counter-block-intent', action: 'increment' }),
  );

interface DocsAppOptions {
  readonly locale?: string;
  readonly localePort?: DogfoodLocalePort;
  readonly direction?: I18nDirection;
  readonly showMissingLocalizationMarkers?: boolean;
  readonly extraI18nCatalogs?: readonly I18nCatalog[];
  readonly initialRoute?: RootModel['route'];
  readonly initialPageId?: DocsPageId;
  readonly initialSelectedStoryId?: string;
}

function shellText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return localizedText(localization, FRAME_I18N_CATALOG.namespace, id, fallback, values);
}

function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

function applyDogfoodLocale(
  i18n: I18nRuntime,
  options: Pick<DocsAppOptions, 'direction' | 'extraI18nCatalogs'>,
  locale: string,
): Promise<string> {
  const option = resolveDogfoodLocale(locale);
  loadDogfoodRuntimeCatalogs(i18n, option.id, options.extraI18nCatalogs ?? []);
  return i18n
    .setLocale(option.id, options.direction ?? option.direction)
    .then(() => option.id);
}

function activateDogfoodLocale(
  i18n: I18nRuntime,
  options: Pick<DocsAppOptions, 'direction' | 'extraI18nCatalogs' | 'localePort'>,
  locale: string,
): Cmd<ExplorerMsg> {
  return async () => {
    const activatedLocale = await applyDogfoodLocale(i18n, options, locale);
    try {
      await options.localePort?.savePreferredLocale?.(activatedLocale);
    } catch {
      // Preference persistence is best-effort; the activated runtime locale wins.
    }
    return {
      type: 'locale-activated',
      locale: activatedLocale,
    };
  };
}

function loadDogfoodRuntimeCatalogs(
  i18n: I18nRuntime,
  locale: string,
  extraCatalogs: readonly I18nCatalog[] = [],
): void {
  i18n.unloadCatalog(DOGFOOD_I18N_NAMESPACE);
  if (locale !== DEFAULT_LOCALE.id) {
    for (const catalog of dogfoodI18nCatalogsForLocale(locale)) {
      i18n.loadCatalog(catalog);
    }
  }
  for (const catalog of extraCatalogs) {
    i18n.loadCatalog(catalog);
  }
}

function shouldShowMissingLocalizationMarkers(
  options: Pick<DocsAppOptions, 'showMissingLocalizationMarkers'>,
): boolean {
  return options.showMissingLocalizationMarkers ?? process.env.NODE_ENV !== 'production';
}

function dogfoodLocaleSettingDescription(currentLocale: string, localization?: LocalizationPort): string {
  return dogfoodText(
    localization,
    'settings.language.description',
    'Current language: {language}. Options: {options}.',
    {
      language: dogfoodLocaleLabel(currentLocale, localization),
      options: dogfoodLocaleOptionsText(localization),
    },
  );
}

function shouldToggleLandingPerfHud(msg: KeyMsg): boolean {
  return !msg.ctrl && !msg.alt && msg.key === '`';
}

function shouldContinueFromLanding(msg: KeyMsg): boolean {
  return !msg.ctrl && !msg.alt && !msg.shift && msg.key === 'enter';
}

function shouldToggleThemeInspector(msg: KeyMsg): boolean {
  return !msg.ctrl && !msg.alt && !msg.shift && msg.key === 'f10';
}

function shouldCloseThemeInspector(msg: KeyMsg): boolean {
  return !msg.ctrl && !msg.alt && !msg.shift && msg.key === 'escape';
}

function themeInspectorViewportHeight(model: RootModel): number {
  const drawerHeight = Math.max(8, model.rows - 4);
  return Math.max(1, drawerHeight - 2);
}

function themeInspectorContentHeight(theme: Theme): number {
  return themePaletteRows(theme).length + 6;
}

function themeInspectorMaxScroll(model: RootModel): number {
  const activeTheme = resolveDocsShellThemeById(model.docsModel.activeShellThemeId);
  return Math.max(0, themeInspectorContentHeight(activeTheme.theme) - themeInspectorViewportHeight(model));
}

function clampThemeInspectorScroll(model: RootModel, scrollY: number): number {
  if (!Number.isFinite(scrollY)) return 0;
  return Math.max(0, Math.min(Math.floor(scrollY), themeInspectorMaxScroll(model)));
}

function themeInspectorDrawerWidth(columns: number): number {
  const availableWidth = Math.max(1, columns - 2);
  const preferredWidth = Math.min(64, Math.max(34, Math.floor(columns * 0.42)));
  return Math.max(1, Math.min(availableWidth, preferredWidth));
}

function themeInspectorScrollTarget(msg: KeyMsg, viewportHeight: number): number | 'top' | 'bottom' | undefined {
  if (msg.ctrl || msg.alt) return undefined;
  if (!msg.shift && (msg.key === 'down' || msg.key === 'j')) return 1;
  if (!msg.shift && (msg.key === 'up' || msg.key === 'k')) return -1;
  if (!msg.shift && (msg.key === 'pagedown' || msg.key === 'd')) return Math.max(1, viewportHeight - 2);
  if (!msg.shift && (msg.key === 'pageup' || msg.key === 'u')) return -Math.max(1, viewportHeight - 2);
  if (!msg.shift && msg.key === 'g') return 'top';
  if (msg.key === 'G' || (msg.shift && msg.key === 'g')) return 'bottom';
  return undefined;
}

function readMarkdownDoc(path: string): string {
  return stripMarkdownFrontmatter(readFileSync(new URL(path, import.meta.url), 'utf8')).trim();
}

function readMarkdownDocExcerpt(path: string, stopAtHeadings: readonly string[]): string {
  const content = readMarkdownDoc(path);
  const lines = content.split('\n');
  const stopIndex = lines.findIndex((line) => stopAtHeadings.includes(line.trim()));
  return (stopIndex === -1 ? lines : lines.slice(0, stopIndex)).join('\n').trim();
}

export function stripMarkdownFrontmatter(markdownText: string): string {
  const withoutBom = markdownText.replace(/^\uFEFF/, '');
  const opening = withoutBom.match(/^---\r?\n/);
  if (opening == null) return markdownText;
  const bodyStart = opening[0].length;
  const body = withoutBom.slice(bodyStart);
  const closingMatch = body.match(/\r?\n---[ \t]*(?:\r?\n|$)/);
  if (closingMatch == null || closingMatch.index == null) return markdownText;
  return body.slice(closingMatch.index + closingMatch[0].length);
}

function countMarkdownHeadings(markdownText: string): number {
  return markdownText
    .split('\n')
    .filter((lineText) => /^#{1,6}\s+\S/.test(lineText.trim()))
    .length;
}

function standardBlockInventoryMarkdown(localization?: LocalizationPort): string {
  const blockIndex = standardBlockCatalogIndexMarkdown();
  const blockSections = standardBlocks
    .map((block) => {
      const metadata = block.metadata;
      const requiredSlots = metadata.slots
        .filter((slot) => slot.required === true)
        .map((slot) => slot.id);
      const optionalSlots = metadata.slots
        .filter((slot) => slot.required !== true)
        .map((slot) => slot.id);
      const dataNames = block.data?.names() ?? [];
      const commandIds = block.commands?.map((command) => command.id) ?? [];

      return [
        `## ${metadata.blockName}`,
        '',
        metadata.docs.summary,
        '',
        `- Family: ${metadata.family}`,
        `- Scale: ${metadata.scale}`,
        `- Modes: ${metadata.modes.join(', ')}`,
        `- Required slots: ${formatDocsList(requiredSlots)}`,
        `- Optional slots: ${formatDocsList(optionalSlots)}`,
        `- Data requirements: ${formatDocsList(dataNames)}`,
        `- Command intents: ${formatDocsList(commandIds)}`,
      ].join('\n');
    })
    .join('\n\n');

  return [
    '# Pre-made Blocks',
    '',
    `First-party standard blocks shipped by @flyingrobots/bijou: ${standardBlocks.length}.`,
    '',
    'These are public block authoring contracts with semantic slots, declared modes, data requirements, command intents, variants, and stories. Select a block under Block Preview for the live rendered example.',
    '',
    `## ${dogfoodText(localization, 'blocks.standard.catalogTitle', 'Catalog')}`,
    '',
    blockIndex,
    '',
    `## ${dogfoodText(localization, 'blocks.standard.detailsTitle', 'Details')}`,
    '',
    blockSections,
  ].join('\n');
}

function standardBlockCatalogIndexMarkdown(): string {
  const names = standardBlocks.map((block) => block.metadata.blockName);
  if (names.length <= 18) {
    return names.map((name) => `- ${name}`).join('\n');
  }

  const columns = 2;
  const rows = Math.ceil(names.length / columns);
  const leftColumnWidth = Math.max(...names.slice(0, rows).map((name) => name.length));
  return Array.from({ length: rows }, (_, row) => {
    const left = names[row];
    const right = names[row + rows];
    if (right === undefined) {
      return `- ${left}`;
    }

    return `- ${left.padEnd(leftColumnWidth)}    - ${right}`;
  }).join('\n');
}

function dogfoodSurfaceBlockInventoryMarkdown(localization?: LocalizationPort): string {
  const entries = defaultDogfoodBlockRegistry.entries();
  const surfaceIndex = entries
    .map((entry) => `- ${entry.blockName} -> ${entry.surfaceId} (${entry.role})`)
    .join('\n');
  const label = (id: string, fallback: string) => dogfoodText(
    localization,
    `blocks.surfaceInventory.label.${id}`,
    fallback,
  );
  const blockSections = entries
    .map((entry) => {
      const metadata = entry.block.metadata;
      const dataNames = entry.block.data?.names() ?? [];
      const commandIds = entry.block.commands?.map((command) => command.id) ?? [];

      return [
        `## ${metadata.blockName}`,
        '',
        dogfoodSurfaceBlockDescription(entry, localization),
        '',
        `- ${label('surface', 'Surface')}: ${entry.surfaceId}`,
        `- ${label('role', 'Role')}: ${entry.role}`,
        `- ${label('family', 'Family')}: ${metadata.family}`,
        `- ${label('scale', 'Scale')}: ${metadata.scale}`,
        `- ${label('modes', 'Modes')}: ${metadata.modes.join(', ')}`,
        `- ${label('dataRequirements', 'Data requirements')}: ${formatDocsList(dataNames)}`,
        `- ${label('commandIntents', 'Command intents')}: ${formatDocsList(commandIds)}`,
        `- ${label('tags', 'Tags')}: ${formatDocsList(entry.tags)}`,
        ...dogfoodSurfaceBlockPreviewMarkdown(entry, localization),
      ].join('\n');
    })
    .join('\n\n');

  return [
    `# ${dogfoodText(localization, 'blocks.surfaceInventory.title', 'DOGFOOD Surface Blocks')}`,
    '',
    dogfoodText(
      localization,
      'blocks.surfaceInventory.count',
      'DOGFOOD currently registers {count} semantic product surface Blocks.',
      { count: entries.length },
    ),
    '',
    dogfoodText(
      localization,
      'blocks.surfaceInventory.description',
      'These Blocks describe visible DOGFOOD app surfaces. They are local DOGFOOD contracts, not automatically promoted first-party standard Blocks.',
    ),
    '',
    `## ${dogfoodText(localization, 'blocks.surfaceInventory.surfaceIndexTitle', 'Surface index')}`,
    '',
    surfaceIndex,
    '',
    `## ${dogfoodText(localization, 'blocks.surfaceInventory.surfaceDetailsTitle', 'Surface details')}`,
    '',
    blockSections,
  ].join('\n');
}

function dogfoodSurfaceBlockPreviewMarkdown(
  entry: DogfoodBlockRegistryEntry,
  localization?: LocalizationPort,
): readonly string[] {
  if (entry.surfaceId !== 'docs.surface') {
    return [];
  }

  return [
    '',
    `### ${dogfoodText(localization, 'blocks.surfaceInventory.renderedPreview', 'Rendered preview')}`,
    '',
    '```text',
    dogfoodDocsSurfacePreviewOutput(),
    '```',
  ];
}

function dogfoodSurfaceBlockDescription(
  entry: DogfoodBlockRegistryEntry,
  localization?: LocalizationPort,
): string {
  const fallback = entry.description ?? entry.block.metadata.docs.summary;
  return dogfoodText(
    localization,
    `blocks.surfaceInventory.entry.${entry.surfaceId}.description`,
    fallback,
  );
}

function standardBlockPreviewMarkdown(): string {
  const storiesByBlock = new Map<string, StandardBlockStory[]>();
  for (const story of standardBlockStories) {
    const existing = storiesByBlock.get(story.blockName) ?? [];
    storiesByBlock.set(story.blockName, [...existing, story]);
  }

  const blockSections = standardBlocks
    .map((block) => {
      const metadata = block.metadata;
      const variants = metadata.variants ?? [];
      const stories = storiesByBlock.get(metadata.blockName) ?? [];

      return [
        `## ${metadata.blockName}`,
        '',
        metadata.docs.summary,
        '',
        `Variants: ${formatDocsList(variants.map((variant) => `${variant.id} (${variant.label})`))}`,
        '',
        'Stories:',
        stories.map((story) => `- ${story.id} - ${story.label} - ${story.state}`).join('\n'),
      ].join('\n');
    })
    .join('\n\n');

  return [
    '# Block Preview',
    '',
    'Select a block in the side navigation to see its live TUI example, lowering preview, and documentation. The overview keeps the package inventory readable without rendering every block at once.',
    '',
    '## Available Blocks',
    '',
    blockSections,
  ].join('\n');
}

function standardBlockLoweringMarkdown(localization?: LocalizationPort): string {
  const declaredModes = Array.from(
    new Set(standardBlocks.flatMap((block) => block.metadata.modes)),
  ).sort();
  const blockIndex = standardBlocks
    .map((block) => `- ${block.metadata.blockName}`)
    .join('\n');
  const blockRows = standardBlocks
    .map((block) => {
      const metadata = block.metadata;
      const semanticFacts = (metadata.semanticFacts ?? [])
        .map((fact) => `${fact.kind}:${fact.key}=${fact.value}`);
      const variantFacts = (metadata.variants ?? [])
        .flatMap((variant) => variant.facts ?? [])
        .map((fact) => `${fact.kind}:${fact.key}=${fact.value}`);

      return [
        `## ${metadata.blockName}`,
        '',
        `- Modes: ${metadata.modes.join(', ')}`,
        `- Semantic facts: ${formatDocsList(semanticFacts)}`,
        `- Variant facts: ${formatDocsList(variantFacts)}`,
      ].join('\n');
    })
    .join('\n\n');

  return [
    '# How Blocks Lower',
    '',
    'Blocks lower by preserving declared modes, semantic facts, story states, data requirements, and command intents as inspectable contract data before rendered output exists.',
    '',
    `Declared modes: ${declaredModes.join(', ')}`,
    '',
    `## ${dogfoodText(localization, 'blocks.standard.catalogTitle', 'Catalog')}`,
    '',
    blockIndex,
    '',
    `## ${dogfoodText(localization, 'blocks.standard.detailsTitle', 'Details')}`,
    '',
    blockRows,
  ].join('\n');
}

function formatDocsList(values: readonly string[]): string {
  return values.length === 0 ? '-' : values.join(', ');
}

function blockPreviewGuideId(block: BlockDefinition): string {
  return `${BLOCK_PREVIEW_GUIDE_ID}-${slugify(block.metadata.blockName)}`;
}

function blockPreviewGuideDoc(block: BlockDefinition): GuideDoc {
  return {
    id: blockPreviewGuideId(block),
    pageId: BLOCKS_PAGE_ID,
    title: `  ${block.metadata.blockName}`,
    summary: block.metadata.docs.summary,
    body: standardBlockDocumentationText(block),
  };
}

function counterDemoBlockPreviewGuideDoc(): GuideDoc {
  return {
    id: COUNTER_DEMO_BLOCK_GUIDE_ID,
    pageId: BLOCKS_PAGE_ID,
    title: `  ${counterDemoBlock.metadata.blockName}`,
    summary: counterDemoBlock.metadata.docs.summary,
    body: counterDemoDocumentationText(),
  };
}

function standardBlockForPreviewGuide(doc: GuideDoc): BlockDefinition | undefined {
  if (doc.pageId !== BLOCKS_PAGE_ID) return undefined;
  return standardBlocks.find((block) => blockPreviewGuideId(block) === doc.id);
}

function renderBlocksPreviewPane(
  block: BlockDefinition,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const bodyWidth = Math.max(28, paneWidth - 6);

  return insetPaneSurface(column([
    themedSeparatorSurface(
      dogfoodText(localization, 'blocks.preview.separator', 'blocks • live preview'),
      paneWidth,
      ctx,
      theme,
    ),
    spacer(1, 1),
    standardBlockLivePreviewSurface(block, bodyWidth, ctx, theme, localization),
  ]), width);
}

function renderCounterDemoPreviewPane(
  model: DocsExplorerModel,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const bodyWidth = Math.max(28, paneWidth - 6);
  const pageWidth = Math.max(30, bodyWidth);
  const pageContentWidth = Math.max(24, pageWidth - 4);
  const cardWidth = Math.max(30, Math.min(78, pageContentWidth));

  return insetPaneSurface(column([
    themedSeparatorSurface(
      dogfoodText(localization, 'blocks.preview.separator', 'blocks • live preview'),
      paneWidth,
      ctx,
      theme,
    ),
    spacer(1, 1),
    boxSurface(column([
      counterDemoBlockSurface(counterDemoBlockConfig(model.counterBlockDemo, ctx, cardWidth)),
      spacer(1, 1),
      boxSurface(paragraphSurface(counterDemoLoweringPreviewText(model.counterBlockDemo, cardWidth, ctx), cardWidth - 4), {
        title: dogfoodText(localization, 'blocks.preview.modeLoweringTitle', 'lowering summary'),
        width: cardWidth,
        borderToken: docsThemeBorderToken(theme),
        padding: { left: 1, right: 1 },
        ctx,
      }),
      spacer(1, 1),
      boxSurface(paragraphSurface(counterDemoDocumentationText(), cardWidth - 4), {
        title: dogfoodText(localization, 'blocks.preview.documentationTitle', 'documentation'),
        width: cardWidth,
        borderToken: docsThemeBorderToken(theme),
        padding: { left: 1, right: 1 },
        ctx,
      }),
    ]), {
      title: dogfoodText(
        localization,
        'blocks.preview.pageTitle',
        '{blockName}',
        { blockName: counterDemoBlock.metadata.blockName },
      ),
      width: pageWidth,
      borderToken: docsThemeBorderToken(theme),
      padding: { left: 1, right: 1 },
      ctx,
    }),
  ]), width);
}

function standardBlockLivePreviewSurface(
  block: BlockDefinition,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  const safeWidth = Math.max(30, width);
  const contentWidth = Math.max(24, safeWidth - 4);

  return column([
    standardBlockExampleSurface(block, contentWidth, ctx, localization),
    spacer(1, 1),
    standardBlockLoweringPreviewSurface(block, contentWidth, ctx, theme, localization),
    spacer(1, 1),
    standardBlockDocumentationSurface(block, contentWidth, ctx, theme, localization),
  ]);
}

function standardBlockExampleSurface(
  block: BlockDefinition,
  width: number,
  ctx: BijouContext,
  localization: LocalizationPort,
): Surface {
  const cardWidth = Math.max(30, Math.min(78, width));
  const rendered = renderBlockTree(blockRenderNode(block, {
    mode: 'interactive',
    slots: standardBlockExampleSlots(block.metadata.blockName, localization),
    config: standardBlockExampleConfig(cardWidth, block.metadata.blockName),
  }));

  if (isSurfaceLike(rendered.output)) {
    return rendered.output;
  }

  return boxSurface(contentSurface(blockRenderOutputText(rendered.output)), {
    title: block.metadata.blockName,
    width: cardWidth,
    borderToken: ctx.border('primary'),
    padding: { left: 1, right: 1 },
    ctx,
  });
}

function standardBlockLoweringPreviewSurface(
  block: BlockDefinition,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  const safeWidth = Math.max(30, Math.min(78, width));
  const innerWidth = Math.max(24, safeWidth - 4);
  const slots = standardBlockExampleSlots(block.metadata.blockName, localization);
  const modeLines = block.metadata.modes.map((mode) => {
    const result = renderBlockTree(blockRenderNode(block, {
      mode: mode as OutputMode,
      slots,
      config: standardBlockExampleConfig(innerWidth, block.metadata.blockName),
    }));
    const outputSummary = blockRenderOutputText(result.output, Math.max(36, innerWidth - 22));
    const factsLine = dogfoodText(
      localization,
      'blocks.preview.loweringFacts',
      '{count} facts',
      { count: result.facts?.length ?? 0 },
    );
    const modeLabel = dogfoodText(
      localization,
      'blocks.preview.modeTitle',
      '{mode} mode',
      { mode },
    );

    return `${modeLabel}: ${outputSummary} (${factsLine})`;
  });

  return boxSurface(paragraphSurface(modeLines.join('\n'), innerWidth), {
    title: dogfoodText(localization, 'blocks.preview.modeLoweringTitle', 'lowering summary'),
    width: safeWidth,
    borderToken: docsThemeBorderToken(theme),
    padding: { left: 1, right: 1 },
    ctx,
  });
}

function standardBlockExampleConfig(width: number, blockName?: string): Readonly<Record<string, number>> {
  return {
    width,
    sectionHeight: blockName === 'AppShell' ? 8 : 5,
  };
}

function standardBlockExampleSlots(
  blockName: string,
  localization: LocalizationPort,
): Readonly<Record<string, unknown>> {
  switch (blockName) {
    case 'AppShell':
      return {
        navigation: 'Guides / Components / Blocks',
        content: blockRenderNode(readerSurfaceBlock, {
          config: { width: 58, sectionHeight: 4 },
          slots: {
            content: 'ReaderSurface live content from DOGFOOD Blocks.',
          },
        }),
        inspector: blockRenderNode(inspectorPanelBlock, {
          config: { width: 58, sectionHeight: 4 },
          slots: {
            selection: 'ReaderSurface',
            details: ['schema-bound', 'provider-ready', 'command-aware'],
          },
        }),
        status: 'ready',
        overlays: [],
      };
    case 'ReaderSurface':
      return {
        content: 'ReaderSurface live content from DOGFOOD Blocks.',
        navigation: 'Blocks navigation',
        outline: ['What are Blocks', 'How Blocks Lower'],
      };
    case 'InspectorPanel':
      return {
        selection: 'ReaderSurface',
        details: ['schema-bound', 'provider-ready', 'command-aware'],
        actions: ['Reveal selection', 'Focus source'],
      };
    case 'InlineStatusBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.inlineStatus.label', 'Docs inventory'),
        status: dogfoodText(localization, 'blocks.preview.inlineStatus.status', 'ready'),
        message: dogfoodText(localization, 'blocks.preview.inlineStatus.message', 'catalog synced'),
      };
    case 'InFlowStatusBlock':
      return {
        severity: dogfoodText(localization, 'blocks.preview.inFlowStatus.severity', 'warning'),
        source: dogfoodText(localization, 'blocks.preview.inFlowStatus.source', 'DOGFOOD Blocks'),
        message: dogfoodText(
          localization,
          'blocks.preview.inFlowStatus.message',
          'Preview data should stay explicit.',
        ),
        action: dogfoodText(localization, 'blocks.preview.inFlowStatus.action', 'Open story'),
      };
    case 'TransientOverlayBlock':
      return {
        priority: dogfoodText(localization, 'blocks.preview.transientOverlay.priority', 'normal'),
        message: dogfoodText(
          localization,
          'blocks.preview.transientOverlay.message',
          'Saved DOGFOOD route',
        ),
        dismiss: dogfoodText(
          localization,
          'blocks.preview.transientOverlay.dismiss',
          'Esc dismisses',
        ),
      };
    case 'ActivityStreamBlock':
      return {
        events: [
          dogfoodText(localization, 'blocks.preview.activityStream.event.testsPassed', '10:41 tests passed'),
          dogfoodText(localization, 'blocks.preview.activityStream.event.prOpened', '10:42 PR opened'),
        ],
        selected: dogfoodText(
          localization,
          'blocks.preview.activityStream.selected',
          '10:41 tests passed',
        ),
      };
    case 'ShortcutCueBlock':
      return {
        shortcuts: [
          dogfoodText(localization, 'blocks.preview.shortcutCue.search', '/ Search'),
          dogfoodText(localization, 'blocks.preview.shortcutCue.help', '? Help'),
          dogfoodText(localization, 'blocks.preview.shortcutCue.close', 'Esc Close'),
        ],
        scope: dogfoodText(localization, 'blocks.preview.shortcutCue.scope', 'Blocks page'),
      };
    case 'ProgressIndicatorBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.progressIndicator.label', 'Install packages'),
        value: '3',
        total: '5',
        percent: '60%',
      };
    case 'FramedGroupBlock':
      {
        const testsGreen = dogfoodText(
          localization,
          'blocks.preview.framedGroup.item.testsGreen',
          'tests green',
        );
        return {
          title: dogfoodText(localization, 'blocks.preview.framedGroup.title', 'Release Checks'),
          items: [
            testsGreen,
            dogfoodText(localization, 'blocks.preview.framedGroup.item.docsUpdated', 'docs updated'),
            dogfoodText(localization, 'blocks.preview.framedGroup.item.prLinked', 'PR linked'),
          ],
          selected: testsGreen,
          mode: dogfoodText(localization, 'blocks.preview.framedGroup.mode', 'review'),
        };
      }
    case 'ExplainabilityWalkthroughBlock':
      return {
        title: dogfoodText(
          localization,
          'blocks.preview.explainabilityWalkthrough.title',
          'Why this changed',
        ),
        steps: [
          dogfoodText(
            localization,
            'blocks.preview.explainabilityWalkthrough.step.inputChanged',
            'input changed',
          ),
          dogfoodText(
            localization,
            'blocks.preview.explainabilityWalkthrough.step.constraintTightened',
            'constraint tightened',
          ),
          dogfoodText(
            localization,
            'blocks.preview.explainabilityWalkthrough.step.previewRerendered',
            'preview re-rendered',
          ),
        ],
        evidence: dogfoodText(
          localization,
          'blocks.preview.explainabilityWalkthrough.evidence',
          'DF-040 playback',
        ),
        decision: dogfoodText(
          localization,
          'blocks.preview.explainabilityWalkthrough.decision',
          'keep grouped proof visible',
        ),
        nextStep: dogfoodText(
          localization,
          'blocks.preview.explainabilityWalkthrough.nextStep',
          'open lower-mode output',
        ),
      };
    case 'FormattedDocumentBlock':
      return {
        heading: dogfoodText(
          localization,
          'blocks.preview.formattedDocument.heading',
          'Blocks document',
        ),
        body: dogfoodText(
          localization,
          'blocks.preview.formattedDocument.body',
          'Use prose for persistent product truth.',
        ),
        callout: dogfoodText(
          localization,
          'blocks.preview.formattedDocument.callout',
          'Lower modes keep the same heading and body facts.',
        ),
        code: dogfoodText(
          localization,
          'blocks.preview.formattedDocument.code',
          'block: FormattedDocumentBlock',
        ),
      };
    case 'LinkDestinationBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.linkDestination.label', 'DOGFOOD.md'),
        destination: dogfoodText(
          localization,
          'blocks.preview.linkDestination.destination',
          'docs/DOGFOOD.md',
        ),
        kind: dogfoodText(localization, 'blocks.preview.linkDestination.kind', 'docs'),
        status: dogfoodText(localization, 'blocks.preview.linkDestination.status', 'available'),
      };
    case 'DividerBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.divider.label', 'Release Evidence'),
        style: dogfoodText(localization, 'blocks.preview.divider.style', 'rule'),
        density: dogfoodText(localization, 'blocks.preview.divider.density', 'compact'),
      };
    case 'TextEntryBlock':
      return {
        field: dogfoodText(localization, 'blocks.preview.textEntry.field', 'Search docs'),
        value: dogfoodText(localization, 'blocks.preview.textEntry.value', 'table'),
        placeholder: dogfoodText(
          localization,
          'blocks.preview.textEntry.placeholder',
          'type a query',
        ),
        validation: dogfoodText(localization, 'blocks.preview.textEntry.validation', '4 results'),
        results: 4,
      };
    case 'SingleChoiceBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.singleChoice.label', 'Output mode'),
        options: [
          dogfoodText(localization, 'blocks.preview.singleChoice.option.interactive', 'interactive'),
          dogfoodText(localization, 'blocks.preview.singleChoice.option.pipe', 'pipe'),
          dogfoodText(localization, 'blocks.preview.singleChoice.option.accessible', 'accessible'),
        ],
        selected: dogfoodText(localization, 'blocks.preview.singleChoice.selected', 'pipe'),
        mode: dogfoodText(localization, 'blocks.preview.singleChoice.mode', 'radio'),
        validation: dogfoodText(localization, 'blocks.preview.singleChoice.validation', 'available'),
      };
    case 'MultipleChoiceBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.multipleChoice.label', 'Release proof'),
        checked: [
          dogfoodText(localization, 'blocks.preview.multipleChoice.checked.lint', 'lint'),
          dogfoodText(localization, 'blocks.preview.multipleChoice.checked.tests', 'tests'),
        ],
        unchecked: [
          dogfoodText(localization, 'blocks.preview.multipleChoice.unchecked.screenshots', 'screenshots'),
        ],
        selected: dogfoodText(localization, 'blocks.preview.multipleChoice.selected', 'lint; tests'),
        validation: dogfoodText(localization, 'blocks.preview.multipleChoice.validation', '2 of 3 complete'),
      };
    case 'BinaryDecisionBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.binaryDecision.label', 'Merge gate'),
        selected: dogfoodText(localization, 'blocks.preview.binaryDecision.selected', 'yes'),
        consequence: dogfoodText(
          localization,
          'blocks.preview.binaryDecision.consequence',
          'admin merge',
        ),
        confirmation: dogfoodText(localization, 'blocks.preview.binaryDecision.confirmation', 'CI green'),
        disabledReason: dogfoodText(localization, 'blocks.preview.binaryDecision.disabledReason', 'none'),
      };
    case 'PeerNavigationBlock':
      return {
        previous: dogfoodText(localization, 'blocks.preview.peerNavigation.previous', 'Architecture'),
        current: dogfoodText(localization, 'blocks.preview.peerNavigation.current', 'Blocks'),
        next: dogfoodText(localization, 'blocks.preview.peerNavigation.next', 'Method'),
        route: dogfoodText(localization, 'blocks.preview.peerNavigation.route', 'docs/blocks'),
        status: dogfoodText(localization, 'blocks.preview.peerNavigation.status', 'available'),
      };
    case 'ProgressiveDisclosureBlock':
      return {
        label: dogfoodText(localization, 'blocks.preview.progressiveDisclosure.label', 'Advanced options'),
        state: dogfoodText(localization, 'blocks.preview.progressiveDisclosure.state', 'closed'),
        hiddenCount: 6,
        summary: dogfoodText(localization, 'blocks.preview.progressiveDisclosure.summary', '6 options hidden'),
        details: [
          dogfoodText(localization, 'blocks.preview.progressiveDisclosure.detail.debugTraces', 'debug traces'),
          dogfoodText(localization, 'blocks.preview.progressiveDisclosure.detail.layoutFacts', 'layout facts'),
        ],
      };
    case 'PathProgressBlock':
      return {
        path: [
          dogfoodText(localization, 'blocks.preview.pathProgress.path.setup', 'Setup'),
          dogfoodText(localization, 'blocks.preview.pathProgress.path.blocks', 'Blocks'),
          dogfoodText(localization, 'blocks.preview.pathProgress.path.preview', 'Preview'),
        ],
        current: dogfoodText(localization, 'blocks.preview.pathProgress.current', 'Blocks'),
        step: 2,
        total: 3,
        status: dogfoodText(localization, 'blocks.preview.pathProgress.status', 'current'),
      };
    case 'BrandEmphasisBlock':
      return {
        brand: dogfoodText(localization, 'blocks.preview.brandEmphasis.brand', 'BIJOU'),
        tagline: dogfoodText(
          localization,
          'blocks.preview.brandEmphasis.tagline',
          'Terminal-native app blocks',
        ),
        decoration: dogfoodText(localization, 'blocks.preview.brandEmphasis.decoration', 'accent rule'),
        role: dogfoodText(localization, 'blocks.preview.brandEmphasis.role', 'nonessential'),
        selected: dogfoodText(localization, 'blocks.preview.brandEmphasis.selected', 'BIJOU'),
      };
    case 'ModeAwarePrimitiveBlock':
      return {
        primitive: dogfoodText(localization, 'blocks.preview.modeAwarePrimitive.primitive', 'metric badge'),
        fact: dogfoodText(localization, 'blocks.preview.modeAwarePrimitive.fact', 'latency-ms'),
        value: 42,
        status: dogfoodText(localization, 'blocks.preview.modeAwarePrimitive.status', 'good'),
        modeContract: dogfoodText(
          localization,
          'blocks.preview.modeAwarePrimitive.modeContract',
          'visual and pipe',
        ),
        selected: dogfoodText(localization, 'blocks.preview.modeAwarePrimitive.selected', 'metric badge'),
      };
    case 'DenseComparisonBlock':
      return {
        title: dogfoodText(localization, 'blocks.preview.denseComparison.title', 'Compare packages'),
        metric: dogfoodText(localization, 'blocks.preview.denseComparison.metric', 'tests'),
        left: '1820',
        right: '640',
        delta: '+12',
        selected: dogfoodText(localization, 'blocks.preview.denseComparison.selected', 'tests'),
      };
    case 'HierarchyBlock':
      return {
        root: dogfoodText(localization, 'blocks.preview.hierarchy.root', 'docs/'),
        nodes: [
          dogfoodText(localization, 'blocks.preview.hierarchy.node.design', 'design/'),
          dogfoodText(localization, 'blocks.preview.hierarchy.node.dx031', 'DX-031.md'),
          dogfoodText(localization, 'blocks.preview.hierarchy.node.method', 'METHOD.md'),
        ],
        selected: dogfoodText(localization, 'blocks.preview.hierarchy.selected', 'design/'),
        parent: dogfoodText(localization, 'blocks.preview.hierarchy.parent', 'docs/'),
        depth: 1,
        expanded: dogfoodText(localization, 'blocks.preview.hierarchy.expanded', 'true'),
      };
    case 'ExplorationListBlock':
      return {
        title: dogfoodText(localization, 'blocks.preview.explorationList.title', 'Explore components'),
        facet: dogfoodText(localization, 'blocks.preview.explorationList.facet', 'input'),
        items: [
          dogfoodText(
            localization,
            'blocks.preview.explorationList.item.textEntry',
            'TextEntry field input',
          ),
          dogfoodText(
            localization,
            'blocks.preview.explorationList.item.singleChoice',
            'SingleChoice radio/select',
          ),
        ],
        selected: dogfoodText(localization, 'blocks.preview.explorationList.selected', 'TextEntry'),
        preview: dogfoodText(localization, 'blocks.preview.explorationList.preview', 'field input'),
      };
    case 'TemporalDependencyBlock':
      return {
        title: dogfoodText(localization, 'blocks.preview.temporalDependency.title', 'Timeline'),
        events: [
          dogfoodText(localization, 'blocks.preview.temporalDependency.event.build', '09:00 build'),
          dogfoodText(localization, 'blocks.preview.temporalDependency.event.test', '09:05 test'),
          dogfoodText(localization, 'blocks.preview.temporalDependency.event.publish', '09:10 publish'),
        ],
        dependency: dogfoodText(
          localization,
          'blocks.preview.temporalDependency.dependency',
          'publish waits for test',
        ),
        selected: dogfoodText(localization, 'blocks.preview.temporalDependency.selected', 'publish'),
        dependsOn: dogfoodText(localization, 'blocks.preview.temporalDependency.dependsOn', 'test'),
      };
    default:
      return {};
  }
}

function standardBlockDocumentationText(block: BlockDefinition): string {
  const metadata = block.metadata;
  const stories = standardBlockStories.filter((story) => story.blockName === metadata.blockName);
  const slots = metadata.slots.map((slot) => `${slot.id}${slot.required === true ? ' required' : ' optional'}`);
  const variants = (metadata.variants ?? []).map((variant) => `${variant.id} (${variant.label})`);
  const dataNames = block.data?.names() ?? [];
  const commands = block.commands?.map((command) => command.id) ?? [];

  return [
    metadata.docs.summary,
    `Family: ${metadata.family}`,
    `Scale: ${metadata.scale}`,
    `Modes: ${formatDocsList(metadata.modes)}`,
    `Slots: ${formatDocsList(slots)}`,
    `Variants: ${formatDocsList(variants)}`,
    `Data requirements: ${formatDocsList(dataNames)}`,
    `Command intents: ${formatDocsList(commands)}`,
    `Stories: ${formatDocsList(stories.map((story) => `${story.id} (${story.state})`))}`,
  ].join('\n');
}

function standardBlockDocumentationSurface(
  block: BlockDefinition,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  const cardWidth = Math.max(30, Math.min(78, width));
  const innerWidth = Math.max(24, cardWidth - 4);

  return boxSurface(paragraphSurface(standardBlockDocumentationText(block), innerWidth), {
    title: dogfoodText(localization, 'blocks.preview.documentationTitle', 'documentation'),
    width: cardWidth,
    borderToken: docsThemeBorderToken(theme),
    padding: { left: 1, right: 1 },
    ctx,
  });
}

function blockRenderOutputText(output: unknown, maxLength = 120): string {
  if (typeof output === 'string') {
    return compactPreviewText(output, maxLength);
  }
  if (isSurfaceLike(output)) {
    return `${output.width}x${output.height}`;
  }
  try {
    return compactPreviewText(JSON.stringify(output), maxLength);
  } catch {
    return String(output);
  }
}

function isSurfaceLike(value: unknown): value is Surface {
  return Boolean(
    value
      && typeof value === 'object'
      && typeof (value as Surface).width === 'number'
      && typeof (value as Surface).height === 'number'
      && typeof (value as Surface).get === 'function',
  );
}

function compactInlineText(value: string): string {
  return value.replace(/\s+/g, ' ').trim() || '-';
}

function compactPreviewText(value: string, maxLength = 120): string {
  const compacted = compactInlineText(value);
  return compacted.length <= maxLength
    ? compacted
    : `${compacted.slice(0, Math.max(0, maxLength - 1))}…`;
}

function guideDocsForPage(pageId: DocsPageId): readonly GuideDoc[] {
  return GUIDE_DOCS.filter((doc) => doc.pageId === pageId);
}

function guideDocTitle(doc: GuideDoc, localization?: LocalizationPort): string {
  return doc.localizedTitle?.(localization) ?? doc.title;
}

function guideDocSummary(doc: GuideDoc, localization?: LocalizationPort): string {
  return doc.localizedSummary?.(localization) ?? doc.summary;
}

function guideDocBody(doc: GuideDoc, localization?: LocalizationPort): string {
  return doc.localizedBody?.(localization) ?? doc.body;
}

function storySearchText(story: ComponentStory): string {
  return [
    story.id,
    story.family,
    story.title,
    story.docs.summary,
    ...story.docs.useWhen,
    ...story.docs.avoidWhen,
    ...story.docs.relatedFamilies,
    ...Object.values(story.docs.gracefulLowering),
    ...story.variants.flatMap((variant) => [
      variant.id,
      variant.label,
      variant.description ?? '',
    ]),
    story.source?.examplePath ?? '',
    story.source?.snippetLabel ?? '',
    ...(story.tags ?? []),
  ].join(' ');
}

function documentationSearchItems(
  localization: LocalizationPort,
): readonly FrameCommandItem<DocsMsg>[] {
  const componentItems = COMPONENT_STORIES.map((story): FrameCommandItem<DocsMsg> => ({
    id: `component:${story.id}`,
    label: story.title,
    description: `${story.family} • ${story.docs.summary}`,
    category: pageTitle(COMPONENTS_PAGE_ID, localization),
    searchText: storySearchText(story),
    action: { type: 'select-story', storyId: story.id },
    targetPageId: COMPONENTS_PAGE_ID,
  }));
  const guideItems = GUIDE_DOCS.map((doc): FrameCommandItem<DocsMsg> => ({
    id: `doc:${doc.pageId}:${doc.id}`,
    label: guideDocTitle(doc, localization),
    description: guideDocSummary(doc, localization),
    category: pageTitle(doc.pageId, localization),
    searchText: [
      doc.id,
      pageTitle(doc.pageId, localization),
      guideDocTitle(doc, localization),
      guideDocSummary(doc, localization),
      guideDocBody(doc, localization),
    ].join(' '),
    action: { type: 'select-guide', guideId: doc.id },
    targetPageId: doc.pageId,
  }));

  return [...componentItems, ...guideItems];
}

function guideItemsForPage(
  pageId: DocsPageId,
  localization?: LocalizationPort,
): readonly { label: string; value: string; description?: string }[] {
  return guideDocsForPage(pageId).map((doc) => ({
    label: guideDocTitle(doc, localization),
    value: doc.id,
    description: guideDocSummary(doc, localization),
  }));
}

function localizedGuideStateForPage(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  localization: LocalizationPort,
): DocsExplorerModel['guideState'] {
  return {
    ...model.guideState,
    items: guideItemsForPage(pageId, localization),
  };
}

function pageTitle(pageId: DocsPageId, localization?: LocalizationPort): string {
  switch (pageId) {
    case GUIDES_PAGE_ID:
      return dogfoodText(localization, 'docs.page.guides', 'Guides');
    case COMPONENTS_PAGE_ID:
      return dogfoodText(localization, 'docs.page.components', 'Components');
    case BLOCKS_PAGE_ID:
      return dogfoodText(localization, 'docs.page.blocks', 'Blocks');
    case PACKAGES_PAGE_ID:
      return dogfoodText(localization, 'docs.page.packages', 'Packages');
    case PHILOSOPHY_PAGE_ID:
      return dogfoodText(localization, 'docs.page.philosophy', 'Philosophy');
    case THEME_LAB_PAGE_ID:
      return dogfoodText(localization, 'docs.page.themes', 'Themes');
    case RELEASE_PAGE_ID:
      return dogfoodText(localization, 'docs.page.release', 'Release');
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

function createInitialExplorerModel(
  ctx: BijouContext,
  pageId: DocsPageId,
  locale: string,
): DocsExplorerModel {
  const expandedFamilies = Object.fromEntries(STORY_FAMILIES.map((family) => [family.id, false]));
  const guideItems = guideItemsForPage(pageId);
  return {
    layoutVariant: resolveDocsLayoutVariant(ctx.runtime.columns, ctx.runtime.rows),
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
    locale,
    landingThemeIndex: 0,
    activeShellThemeId: DOCS_SHELL_THEME_CHOICES[0]?.id,
    landingQualityMode: 'auto',
    counterBlockDemo: createCounterDemoModel(5),
  };
}

function createInitialComponentsExplorerModel(
  ctx: BijouContext,
  locale: string,
  initialSelectedStoryId?: string,
): DocsExplorerModel {
  const model = createInitialExplorerModel(ctx, COMPONENTS_PAGE_ID, locale);
  return initialSelectedStoryId == null ? model : selectStory(model, initialSelectedStoryId);
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

function focusedGuideDoc(pageId: DocsPageId, model: DocsExplorerModel): GuideDoc | undefined {
  const guideId = model.guideState.items[model.guideState.focusIndex]?.value;
  return guideId == null
    ? undefined
    : guideDocsForPage(pageId).find((doc) => doc.id === guideId);
}

function selectedGuide(pageId: DocsPageId, model: DocsExplorerModel): GuideDoc | undefined {
  const docs = guideDocsForPage(pageId);
  const selected = docs.find((doc) => doc.id === model.selectedGuideId);
  return selected ?? docs[0];
}

function resolveSelectableGuideId(pageId: DocsPageId, guideId: string): string {
  if (pageId === BLOCKS_PAGE_ID && guideId === BLOCK_PREVIEW_GUIDE_ID) {
    const firstBlock = standardBlocks[0];
    return firstBlock == null ? guideId : blockPreviewGuideId(firstBlock);
  }

  return guideId;
}

function selectGuide(pageId: DocsPageId, model: DocsExplorerModel, guideId?: string): DocsExplorerModel {
  if (guideId == null) return model;
  const selectableGuideId = resolveSelectableGuideId(pageId, guideId);
  const docs = guideDocsForPage(pageId);
  const index = docs.findIndex((doc) => doc.id === selectableGuideId);
  if (index < 0) return model;
  return {
    ...model,
    selectedGuideId: selectableGuideId,
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

function selectFocusedBlockPreviewGuide(pageId: DocsPageId, model: DocsExplorerModel): DocsExplorerModel {
  if (pageId !== BLOCKS_PAGE_ID) return model;
  const doc = focusedGuideDoc(pageId, model);
  if (doc == null) return model;
  if (
    doc.id !== BLOCK_PREVIEW_GUIDE_ID
    && doc.id !== COUNTER_DEMO_BLOCK_GUIDE_ID
    && standardBlockForPreviewGuide(doc) === undefined
  ) {
    return model;
  }
  return selectGuide(pageId, model, doc.id);
}

function createLandingRenderer(getCtx: () => BijouContext, localization: LocalizationPort): (model: RootModel) => Surface {
  const cache: LandingFrameCache = {};

  return (model: RootModel): Surface => {
    const ctx = getCtx();
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
    paintV7TitleArt(surface, tokens, quantizedTimeMs);

    const wordmarkGlyphs = transparentLogoGlyphs(fitGlyphLinesToWidth(FLYING_ROBOTS_LOGO_LINES, Math.max(1, width - 4)));
    const wordmark = createWordmarkSurface(wordmarkGlyphs);
    const staticSurfaces = getLandingStaticSurfaces(tokens, localization);
    const promptLine = createLandingPromptSurface(tokens, quantizedTimeMs, localization);
    const fpsBadge = getLandingFpsBadge(tokens, fpsBadgeValue, quality, qualityMode, localization);
    const dogfoodPanel = getLandingDogfoodPanel(
      Math.max(28, Math.min(width - 6, 88)),
      ctx,
      tokens,
      localization,
    );
    const panelPromptGap = 1;
    const promptWordmarkGap = 1;
    const footerY = Math.max(0, height - 1);
    const contentTop = Math.min(height - 1, Math.max(1, Math.floor(height * 0.68)));
    const contentBottom = Math.max(contentTop, footerY - 2);
    const availableHeight = Math.max(0, contentBottom - contentTop + 1);
    const fullClusterHeight = dogfoodPanel.height + panelPromptGap + promptLine.height + promptWordmarkGap + wordmark.height;
    const compactClusterHeight = dogfoodPanel.height + panelPromptGap + promptLine.height;

    if (availableHeight >= fullClusterHeight) {
      const startY = contentTop + Math.max(0, Math.floor((availableHeight - fullClusterHeight) / 2));
      blitCentered(surface, dogfoodPanel, startY);
      blitCentered(surface, promptLine, startY + dogfoodPanel.height + panelPromptGap);
      paintFlyingRobotsLogoOverlay(
        surface,
        wordmark,
        startY + dogfoodPanel.height + panelPromptGap + promptLine.height + promptWordmarkGap,
        tokens,
        quantizedTimeMs,
      );
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
  const time = timeMs * 0.002;
  const widthDenominator = width - 1 || 1;
  const heightDenominator = height - 1 || 1;

  const cells = surface.cells;
  const tile = quality.backgroundTile;
  const amplitudeScale = Math.max(0.35, Math.min(1.4, width / 120));

  for (let tileY = 0; tileY < height; tileY += tile) {
    const sampleY = Math.min(height - 1, tileY + Math.floor(tile / 2));
    const v = sampleY / heightDenominator;
    for (let tileX = 0; tileX < width; tileX += tile) {
      const sampleX = Math.min(width - 1, tileX + Math.floor(tile / 2));
      const u = sampleX / widthDenominator;
      const layer = landingWakeLayer(sampleX, sampleY, width, time, amplitudeScale);
      const char = LANDING_WAKE_CHARS[layer] ?? ' ';
      if (char === ' ') {
        continue;
      }

      const level = 1 - (layer / (LANDING_WAKE_CHARS.length - 1));
      const colorT = clamp01(
        0.1
        + (layer * 0.16)
        + (u * 0.26)
        + (0.18 * (0.5 + (Math.sin((time * 0.9) + (v * 5.2)) * 0.5)))
        + (0.06 * Math.sin((time * 0.7) + (sampleX * 0.035))),
      );
      const bg = sampleColorRamp(tokens.waveRamp, colorT);
      const fg = bg;
      const modifiers = level < 0.55 ? DIM_MODIFIERS : undefined;
      const maxY = Math.min(height, tileY + tile);
      const maxX = Math.min(width, tileX + tile);

      for (let y = tileY; y < maxY; y++) {
        for (let x = tileX; x < maxX; x++) {
          surface.set(x, y, {
            char,
            bg,
            fg,
            modifiers: modifiers as string[] | undefined,
            empty: false,
            opacity: 1,
          });
        }
      }
    }
  }
}

function landingWakeLayer(
  x: number,
  y: number,
  width: number,
  time: number,
  amplitudeScale: number,
): number {
  const edges: number[] = [];
  let edge = width / 4;

  for (const spec of LANDING_WAKE_WAVES) {
    edge += stackedWakeWave(time, y, spec.seeds, spec.amps) * spec.scale * amplitudeScale;
    edges.push(edge);
  }

  for (let index = edges.length - 1; index >= 0; index--) {
    if (x > edges[index]!) return index + 1;
  }

  return 0;
}

function stackedWakeWave(
  time: number,
  y: number,
  seeds: readonly [number, number, number],
  amps: readonly [number, number, number],
): number {
  return (
    ((Math.sin(time + (y * seeds[0])) + 1) * amps[0])
    + ((Math.sin(time + (y * seeds[1])) + 1) * amps[1])
    + (Math.sin(time + (y * seeds[2])) * amps[2])
  );
}

function paintV7TitleArt(
  surface: Surface,
  tokens: LandingThemeTokens,
  timeMs: number,
): void {
  const width = surface.width;
  const height = surface.height;
  if (width < 40 || height < 14) return;

  paintBijouSvgOverlay(surface, tokens, timeMs);
}

function paintBijouSvgOverlay(
  surface: Surface,
  tokens: LandingThemeTokens,
  timeMs: number,
): void {
  const metrics = bijouSvgOverlayMetrics(surface.width, surface.height);
  if (metrics == null) return;

  const mark = getBijouSvgOverlaySurface(metrics.columns, metrics.rows);
  paintLandingLogoOverlay(surface, mark, metrics.left, metrics.top, tokens, {
    yOffset: (x, _y, _char, width) => landingBijouLogoYOffset(x, width, timeMs),
    foreground: ({ x, width, baseForeground }) => landingBijouLogoFillColor(baseForeground, tokens, x, width, timeMs),
  });
}

function bijouSvgOverlayMetrics(width: number, height: number): BijouSvgOverlayMetrics | undefined {
  if (width < 40 || height < 14) return undefined;

  const maxColumns = Math.max(1, width - 4);
  const targetColumns = Math.max(20, Math.min(maxColumns, Math.floor(width * 0.84)));
  const maxRows = Math.max(3, Math.floor(height * 0.32));
  const rows = Math.max(
    3,
    Math.min(maxRows, Math.round((targetColumns * LANDING_TITLE_CELL_ASPECT_RATIO) / LANDING_BIJOU_SVG_ASPECT_RATIO)),
  );
  const columns = Math.max(
    12,
    Math.min(maxColumns, Math.round((rows * LANDING_BIJOU_SVG_ASPECT_RATIO) / LANDING_TITLE_CELL_ASPECT_RATIO)),
  );
  const centerY = Math.floor(height * 0.29);
  const topLimit = Math.max(0, height - rows - 2);

  return {
    columns,
    rows,
    left: Math.max(0, Math.floor((width - columns) / 2)),
    top: Math.max(1, Math.min(topLimit, centerY - Math.floor(rows / 2))),
  };
}

function getBijouSvgOverlaySurface(columns: number, rows: number): Surface {
  const key = `${columns}:${rows}`;
  const cached = LANDING_BIJOU_SVG_OVERLAY_CACHE.get(key);
  if (cached != null) return cached;

  const frame = rasterizeSvgToRgba(LANDING_BIJOU_SVG_TEXT, {
    width: Math.max(1, columns * 2),
    height: Math.max(1, rows * 4),
  });
  const surface = rasterToGlyphSurface(frame, {
    columns,
    rows,
    fit: 'stretch',
    colorMode: 'none',
    renderer: {
      kind: 'charset',
      chars: LANDING_BIJOU_SVG_CHARSET,
      order: 'light-to-dark',
    },
  });

  LANDING_BIJOU_SVG_OVERLAY_CACHE.set(key, surface);
  return surface;
}

function landingBackgroundCellColor(cell: Cell, tokens: LandingThemeTokens): string {
  if (cell.fgRGB != null) {
    return rgbHex(cell.fgRGB[0], cell.fgRGB[1], cell.fgRGB[2]);
  }

  return colorHex(cell.fg) ?? sampleColorRamp(tokens.waveRamp, 0.58);
}

function landingCellBackgroundColor(cell: Cell, tokens: LandingThemeTokens): string {
  if (cell.bgRGB != null) {
    return rgbHex(cell.bgRGB[0], cell.bgRGB[1], cell.bgRGB[2]);
  }

  return colorHex(cell.bg) ?? tokens.background;
}

function paintLandingLogoOverlay(
  surface: Surface,
  mark: Surface,
  left: number,
  top: number,
  tokens: LandingThemeTokens,
  options: LandingLogoOverlayOptions = {},
): void {
  const opacity = options.opacity ?? 1;
  if (opacity <= 0.02) return;

  for (let y = 0; y < mark.height; y++) {
    for (let x = 0; x < mark.width; x++) {
      const markChar = mark.get(x, y).char ?? ' ';
      if (markChar === ' ') continue;

      const targetX = left + x;
      const targetY = top + y + Math.round(options.yOffset?.(x, y, markChar, mark.width, mark.height) ?? 0);
      if (targetX < 0 || targetX >= surface.width || targetY < 0 || targetY >= surface.height) {
        continue;
      }

      const targetCell = surface.get(targetX, targetY);
      const foregroundSample = options.foregroundSample === 'background-cell'
        ? landingCellBackgroundColor(targetCell, tokens)
        : landingBackgroundCellColor(targetCell, tokens);

      const baseForeground = oppositeHexColor(foregroundSample);
      const animatedForeground = options.foreground?.({
        x,
        y,
        targetX,
        targetY,
        char: markChar,
        width: mark.width,
        height: mark.height,
        targetCell,
        baseForeground,
        sampledColor: foregroundSample,
      }) ?? baseForeground;
      const fg = opacity >= 0.995
        ? animatedForeground
        : mixHexColor(landingCellBackgroundColor(targetCell, tokens), animatedForeground, opacity);

      surface.set(targetX, targetY, {
        char: markChar,
        fg,
        modifiers: opacity < 0.38
          ? DIM_MODIFIERS as string[]
          : BOLD_MODIFIERS as string[],
        empty: false,
        opacity: 1,
      }, LANDING_LOGO_OVERLAY_MASK);
    }
  }
}

function landingFlyingRobotsOpacity(timeMs: number): number {
  if (timeMs <= LANDING_FLYING_ROBOTS_FADE_DELAY_MS) return 1;
  return 1 - clamp01((timeMs - LANDING_FLYING_ROBOTS_FADE_DELAY_MS) / LANDING_FLYING_ROBOTS_FADE_DURATION_MS);
}

function landingBijouLogoLetterIndex(x: number, width: number): number {
  const letterWidth = Math.max(1, width / LANDING_BIJOU_LOGO_LETTER_COUNT);
  return Math.max(0, Math.min(LANDING_BIJOU_LOGO_LETTER_COUNT - 1, Math.floor(x / letterWidth)));
}

function landingBijouLogoWavePhase(timeMs: number, letterIndex: number): number {
  return (timeMs * 0.004) + (letterIndex * 0.82);
}

function landingBijouLogoYOffset(x: number, width: number, timeMs: number): number {
  const phase = landingBijouLogoWavePhase(timeMs, landingBijouLogoLetterIndex(x, width));
  return Math.round(Math.sin(phase) * LANDING_BIJOU_LOGO_WAVE_AMPLITUDE_ROWS);
}

function landingBijouLogoFillColor(
  baseForeground: string,
  tokens: LandingThemeTokens,
  x: number,
  width: number,
  timeMs: number,
): string {
  const letterIndex = landingBijouLogoLetterIndex(x, width);
  const phase = landingBijouLogoWavePhase(timeMs, letterIndex);
  const local = width <= 1 ? 0 : x / (width - 1);
  const wave = 0.5 + (Math.sin(phase + (local * Math.PI * 1.4)) * 0.5);
  const logo = sampleColorRamp(tokens.logoRamp, clamp01(0.34 + (wave * 0.62)));
  const wake = sampleColorRamp(tokens.waveRamp, clamp01(0.42 + ((1 - wave) * 0.36)));
  return mixHexColor(baseForeground, mixHexColor(logo, wake, 0.22), 0.64);
}

function createWordmarkSurface(
  lines: readonly (readonly string[])[],
): Surface {
  return createTransparentTextSurface(lines, {
    modifiers: (_x, _y, char) => char === ' ' ? undefined : BOLD_MODIFIERS,
  });
}

function paintFlyingRobotsLogoOverlay(
  surface: Surface,
  mark: Surface,
  top: number,
  tokens: LandingThemeTokens,
  timeMs: number,
): void {
  const left = Math.floor((surface.width - mark.width) / 2);
  paintLandingLogoOverlay(surface, mark, left, top, tokens, {
    foregroundSample: 'background-cell',
    opacity: landingFlyingRobotsOpacity(timeMs),
  });
}

function renderLandingPerfHudOverlay(
  model: RootModel,
  ctx: BijouContext,
  i18n?: I18nRuntime,
) {
  return renderFramePerfHudOverlay({
    columns: model.columns,
    rows: model.rows,
    frameTimeMs: model.docsModel.frameTimeMs,
    viewTimeMs: model.docsModel.viewTimeMs,
    diffTimeMs: model.docsModel.diffTimeMs,
    refreshRate: ctx.runtime.refreshRate,
  }, {
    i18n,
    ctx,
  });
}

function paragraphSurface(text: string, width: number): Surface {
  const wrapped = wrapToWidth(text, Math.max(1, width));
  return textSurface(wrapped.join('\n'), Math.max(1, width), Math.max(1, wrapped.length));
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

function landingQualityProfileLabel(quality: LandingQualityProfile, localization?: LocalizationPort): string {
  switch (quality.id) {
    case 'full':
      return dogfoodText(localization, 'landing.quality.profile.full', 'full');
    case 'balanced':
      return dogfoodText(localization, 'landing.quality.profile.balanced', 'balanced');
    case 'ultra':
      return dogfoodText(localization, 'landing.quality.profile.performance', 'performance');
    default:
      return quality.id;
  }
}

function landingQualityModeLabel(mode: LandingQualityMode, localization?: LocalizationPort): string {
  switch (mode) {
    case 'auto':
      return dogfoodText(localization, 'landing.quality.auto', 'Auto');
    case 'quality':
      return dogfoodText(localization, 'landing.quality.quality', 'Quality');
    case 'balanced':
      return dogfoodText(localization, 'landing.quality.balanced', 'Balanced');
    case 'performance':
      return dogfoodText(localization, 'landing.quality.performance', 'Performance');
  }
}

function landingQualityBadgeLabel(
  quality: LandingQualityProfile,
  mode: LandingQualityMode,
  localization?: LocalizationPort,
): string {
  if (mode === 'auto') {
    return `auto/${landingQualityProfileLabel(quality, localization)}`;
  }
  return landingQualityModeLabel(mode, localization).toLowerCase();
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
  localization?: LocalizationPort,
): string {
  if (mode !== 'auto') return landingQualityModeLabel(mode, localization);
  return `${landingQualityModeLabel(mode, localization)} (${landingQualityProfileLabel(resolveLandingQuality(width, height, mode), localization)})`;
}

function landingQualitySettingDescription(
  width: number,
  height: number,
  mode: LandingQualityMode,
  localization?: LocalizationPort,
): string {
  const currentProfile = landingQualityProfileLabel(resolveLandingQuality(width, height, mode), localization);
  const options = formatLocalizedList(localization, [
    landingQualityModeLabel('auto', localization),
    landingQualityModeLabel('quality', localization),
    landingQualityModeLabel('balanced', localization),
    landingQualityModeLabel('performance', localization),
  ]);
  switch (mode) {
    case 'auto':
      return dogfoodText(
        localization,
        'settings.landingQuality.description.auto',
        'Adapts render cost to terminal size. Current auto profile: {profile}. Options: {options}.',
        { profile: currentProfile, options },
      );
    case 'quality':
      return dogfoodText(
        localization,
        'settings.landingQuality.description.quality',
        'Prioritizes the richest title treatment even on larger terminals. Options: {options}.',
        { options },
      );
    case 'balanced':
      return dogfoodText(
        localization,
        'settings.landingQuality.description.balanced',
        'Keeps the title screen expressive while reducing render work on larger terminals. Options: {options}.',
        { options },
      );
    case 'performance':
      return dogfoodText(
        localization,
        'settings.landingQuality.description.performance',
        'Minimizes title-screen work for giant terminals and slower emulators. Options: {options}.',
        { options },
      );
  }
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

function getLandingStaticSurfaces(tokens: LandingThemeTokens, localization: LocalizationPort): {
  readonly footerControls: Surface;
  readonly footerVersion: Surface;
} {
  const controlsText = dogfoodText(localization, 'landing.footer.controls', LANDING_CONTROLS_TEXT);
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
  localization?: LocalizationPort,
): Surface {
  const promptText = dogfoodText(localization, 'landing.prompt.enter', ENTER_PROMPT_TEXT);
  const highlightStart = promptText.indexOf('[');
  const highlightEnd = promptText.indexOf(']');
  const enterStart = highlightStart >= 0 && highlightEnd > highlightStart ? highlightStart + 1 : -1;
  const enterEnd = highlightEnd > enterStart ? highlightEnd - 1 : -1;
  const time = timeMs / 1000;

  return createTransparentTextSurface(promptText, {
    bg: tokens.background,
    transparentSpaces: false,
    fg: (x) => {
      const inEnter = enterStart >= 0 && enterEnd >= enterStart && x >= enterStart && x <= enterEnd;
      if (inEnter) {
        const span = Math.max(1, enterEnd - enterStart);
        const local = (x - enterStart) / span;
        const sweep = 0.5 + (Math.sin((time * 5.2) + (local * Math.PI * 2.6)) * 0.5);
        return sampleColorRamp(tokens.logoRamp, clamp01(0.42 + (local * 0.34) + (sweep * 0.22)));
      }

      if (x === highlightStart || x === highlightEnd) {
        return sampleColorRamp(tokens.waveRamp, 0.76);
      }

      if (highlightStart < 0 || highlightEnd < highlightStart || x < highlightStart || x > highlightEnd) {
        return tokens.promptBodyColor;
      }

      return tokens.promptAccentColor;
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
  localization?: LocalizationPort,
): Surface {
  const qualityLabel = landingQualityBadgeLabel(quality, mode, localization);
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
  localization?: LocalizationPort,
): Surface {
  const title = dogfoodText(localization, 'landing.dogfood.title', 'DOGFOOD');
  const expansion = dogfoodText(
    localization,
    'landing.dogfood.expansion',
    'Documentation Of Good Foundational Onboarding and Discovery',
  );
  const releaseTitle = dogfoodText(
    localization,
    CURRENT_DOGFOOD_RELEASE_TITLE.titleKey,
    CURRENT_DOGFOOD_RELEASE_TITLE.title,
  );
  const renderedTitle = titleScreenBlock.render({
    config: {
      title: `${title} / ${releaseTitle}`,
      subtitle: expansion,
    },
    mode: 'interactive',
  });
  const [panelTitle = title, panelBody = expansion] = String(renderedTitle.output).split('\n');
  const key = `${tokens.id}:${width}:${panelTitle}:${panelBody}`;
  const cached = LANDING_DOGFOOD_PANEL_CACHE.get(key);
  if (cached) return cached;

  const bodyWidth = Math.max(18, width - 4);
  const body = centerSurfaceHorizontally(createTransparentTextSurface(
    wrapToWidth(panelBody, bodyWidth).join('\n'),
    {
      bg: tokens.background,
      transparentSpaces: false,
      fg: tokens.footerStrongColor,
      modifiers: BOLD_MODIFIERS,
    },
  ), bodyWidth);
  const surface = boxSurface(body, {
    title: panelTitle,
    width,
    borderToken: landingDogfoodPanelBorderToken(tokens),
    bgToken: { hex: tokens.footerStrongColor, bg: tokens.background },
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
  const landingThemeIndex = resolveLandingThemeIndexForShellThemeId(docsModel.activeShellThemeId);
  const activeShellThemeId = resolveDocsShellThemeById(docsModel.activeShellThemeId).id;
  return mapDocsPageModels(docsModel, (pageModel) => {
    if (
      pageModel.showHints === activePageModel.showHints
      && pageModel.locale === activePageModel.locale
      && pageModel.landingThemeIndex === landingThemeIndex
      && pageModel.activeShellThemeId === activeShellThemeId
      && pageModel.landingQualityMode === activePageModel.landingQualityMode
    ) {
      return pageModel;
    }
    return {
      ...pageModel,
      showHints: activePageModel.showHints,
      locale: activePageModel.locale,
      landingThemeIndex,
      activeShellThemeId,
      landingQualityMode: activePageModel.landingQualityMode,
    };
  });
}

function applyLandingThemeSelection(
  syncShellThemeContext: (themeId: string | undefined) => void,
  model: RootModel,
  index: number,
): RootModel {
  const nextIndex = mod(index, LANDING_THEMES.length);
  const theme = resolveLandingTheme(nextIndex);
  if (nextIndex === model.landingThemeIndex && model.docsModel.activeShellThemeId === theme.id) return model;
  syncShellThemeContext(theme.id);
  return {
    ...model,
    landingThemeIndex: nextIndex,
    docsModel: syncDocsSharedSettings({
      ...model.docsModel,
      activeShellThemeId: theme.id,
    }),
    landingToast: {
      message: theme.label,
      expiresAtMs: model.landingTimeMs + 1600,
    },
  };
}

function applyLandingQualitySelection(model: RootModel, mode: LandingQualityMode, localization?: LocalizationPort): RootModel {
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
        localization,
        'landing.toast.quality',
        'Landing quality: {quality}',
        { quality: landingQualityModeLabel(mode, localization) },
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

function themeTokenHex(token: TokenValue | undefined, fallback: string): string {
  return token?.hex ?? fallback;
}

function themeTokenBg(token: TokenValue | undefined, fallback: string): string {
  return token?.bg ?? fallback;
}

function docsVisualThemeFromShellThemeChoice(shellTheme: DocsShellThemeChoice): LandingThemeTokens {
  const theme = shellTheme.theme;
  const background = themeTokenBg(theme.surface.primary, '#10131a');
  return compileLandingTheme({
    id: shellTheme.id,
    label: shellTheme.label,
    background,
    waveGradient: [
      themeTokenBg(theme.surface.muted, background),
      themeTokenBg(theme.surface.secondary, background),
      themeTokenHex(theme.border.primary, themeTokenHex(theme.semantic.info, '#6aa6ff')),
    ],
    logoGradient: [
      themeTokenHex(theme.semantic.info, '#6aa6ff'),
      themeTokenHex(theme.semantic.accent, '#d7a84f'),
      themeTokenHex(theme.semantic.primary, '#f5f2e8'),
    ],
  });
}

function createGradientStops(gradient: readonly [string, string, string]): Array<{ pos: number; color: Rgb }> {
  return [
    { pos: 0, color: hexToRgb(gradient[0]) },
    { pos: 0.5, color: hexToRgb(gradient[1]) },
    { pos: 1, color: hexToRgb(gradient[2]) },
  ];
}

function gradientStopsFromHexes(colors: readonly string[]): Array<{ pos: number; color: Rgb }> {
  if (colors.length === 0) return [];
  if (colors.length === 1) {
    return [{ pos: 0, color: hexToRgb(colors[0]!) }];
  }
  return colors.map((hex, index) => ({
    pos: index / (colors.length - 1),
    color: hexToRgb(hex),
  }));
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

function mixHexColor(from: string, to: string, t: number): string {
  const [fromR, fromG, fromB] = hexToRgb(from);
  const [toR, toG, toB] = hexToRgb(to);
  const mixT = clamp01(t);
  return rgbHex(
    Math.round(fromR + ((toR - fromR) * mixT)),
    Math.round(fromG + ((toG - fromG) * mixT)),
    Math.round(fromB + ((toB - fromB) * mixT)),
  );
}

function oppositeHexColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbHex(255 - r, 255 - g, 255 - b);
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

function fitGlyphLinesToWidth(
  lines: readonly (readonly string[])[],
  maxWidth: number,
): readonly (readonly string[])[] {
  const width = Math.max(0, ...lines.map((lineText) => lineText.length));
  const targetWidth = Math.max(1, Math.min(width, Math.floor(maxWidth)));
  if (width <= targetWidth) return lines;

  return lines.map((lineText) => {
    const fitted: string[] = [];
    for (let x = 0; x < targetWidth; x++) {
      const sourceX = Math.min(width - 1, Math.floor((x / targetWidth) * width));
      fitted.push(lineText[sourceX] ?? ' ');
    }
    return fitted;
  });
}

function transparentLogoGlyphs(lines: readonly (readonly string[])[]): readonly (readonly string[])[] {
  return lines.map((lineText) => lineText.map((char) => char === BRAILLE_BLANK ? ' ' : char));
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

export function resolveDocsThemeActiveHeaderTabToken(theme: LandingThemeTokens): TokenValue {
  const base = docsThemeSurfaceToken(theme).hex;
  const background = sampleColorRamp(theme.waveRamp, 0.14);
  return {
    hex: pickStandoutColor(background, base, [
      sampleColorRamp(theme.logoRamp, 0.98),
      sampleColorRamp(theme.logoRamp, 0.84),
      sampleColorRamp(theme.waveRamp, 0.88),
      sampleColorRamp(theme.logoRamp, 0.62),
    ]),
    bg: background,
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
    bg: theme.background,
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

function landingTokensToShellTheme(theme: LandingThemeTokens): Theme {
  return {
    ...CYAN_MAGENTA,
    name: `dogfood-${theme.id}`,
    status: {
      ...CYAN_MAGENTA.status,
      success: tv(sampleColorRamp(theme.waveRamp, 0.78)),
      error: tv(sampleColorRamp(theme.logoRamp, 0.7)),
      warning: tv(sampleColorRamp(theme.logoRamp, 0.92)),
      info: tv(sampleColorRamp(theme.waveRamp, 0.66)),
      active: tv(sampleColorRamp(theme.logoRamp, 0.84)),
      muted: tv(sampleColorRamp(theme.waveRamp, 0.44), ['dim', 'strikethrough']),
    },
    semantic: {
      ...CYAN_MAGENTA.semantic,
      success: tv(sampleColorRamp(theme.waveRamp, 0.78)),
      error: tv(sampleColorRamp(theme.logoRamp, 0.7)),
      warning: tv(sampleColorRamp(theme.logoRamp, 0.92)),
      info: tv(sampleColorRamp(theme.waveRamp, 0.66)),
      accent: tv(sampleColorRamp(theme.logoRamp, 0.84)),
      muted: tv(sampleColorRamp(theme.waveRamp, 0.58), ['dim']),
      primary: tv(sampleColorRamp(theme.logoRamp, 0.96), ['bold']),
    },
    gradient: {
      ...CYAN_MAGENTA.gradient,
      brand: gradientStopsFromHexes([
        sampleColorRamp(theme.waveRamp, 0.08),
        sampleColorRamp(theme.waveRamp, 0.52),
        sampleColorRamp(theme.logoRamp, 0.9),
      ]),
      progress: gradientStopsFromHexes([
        sampleColorRamp(theme.waveRamp, 0.24),
        sampleColorRamp(theme.waveRamp, 0.62),
        sampleColorRamp(theme.logoRamp, 0.76),
        sampleColorRamp(theme.logoRamp, 0.94),
      ]),
    },
    border: {
      ...CYAN_MAGENTA.border,
      primary: tv(sampleColorRamp(theme.waveRamp, 0.72)),
      secondary: tv(sampleColorRamp(theme.logoRamp, 0.74)),
      success: tv(sampleColorRamp(theme.waveRamp, 0.78)),
      warning: tv(sampleColorRamp(theme.logoRamp, 0.92)),
      error: tv(sampleColorRamp(theme.logoRamp, 0.7)),
      muted: tv(sampleColorRamp(theme.waveRamp, 0.38)),
    },
    ui: {
      ...CYAN_MAGENTA.ui,
      cursor: tv(sampleColorRamp(theme.logoRamp, 0.88)),
      focusGutter: docsThemeFocusedGutterToken(theme),
      scrollThumb: tv(sampleColorRamp(theme.logoRamp, 0.88)),
      scrollTrack: tv(sampleColorRamp(theme.waveRamp, 0.18)),
      sectionHeader: tv(sampleColorRamp(theme.waveRamp, 0.8), BOLD_MODIFIERS),
      logo: tv(sampleColorRamp(theme.logoRamp, 0.94)),
      tableHeader: tv(sampleColorRamp(theme.logoRamp, 0.9)),
      trackEmpty: tv(sampleColorRamp(theme.waveRamp, 0.26)),
    },
    surface: {
      primary: { hex: sampleColorRamp(theme.logoRamp, 0.96), bg: theme.background },
      secondary: { hex: sampleColorRamp(theme.waveRamp, 0.84), bg: sampleColorRamp(theme.waveRamp, 0.14) },
      elevated: { hex: sampleColorRamp(theme.logoRamp, 0.92), bg: sampleColorRamp(theme.waveRamp, 0.18) },
      overlay: { hex: sampleColorRamp(theme.logoRamp, 0.96), bg: theme.background },
      muted: { hex: sampleColorRamp(theme.waveRamp, 0.62), bg: sampleColorRamp(theme.waveRamp, 0.08) },
    },
  };
}

function resolveDocsShellThemeById(id: string | undefined): DocsShellThemeChoice {
  return DOCS_SHELL_THEME_CHOICES.find((theme) => theme.id === id) ?? DOCS_SHELL_THEME_CHOICES[0]!;
}

function resolveLandingThemeIndexForShellThemeId(id: string | undefined): number {
  return LANDING_THEME_INDEX_BY_ID.get(resolveDocsShellThemeById(id).id) ?? 0;
}

function resolveDocsVisualThemeByShellThemeId(id: string | undefined): LandingThemeTokens {
  const shellThemeId = resolveDocsShellThemeById(id).id;
  return DOCS_VISUAL_THEME_BY_SHELL_ID.get(shellThemeId) ?? DOCS_VISUAL_THEME_BY_SHELL_ID.get(DOCS_SHELL_THEME_CHOICES[0]!.id)!;
}

function applyDocsShellThemeToContext(ctx: BijouContext, themeId: string | undefined): BijouContext {
  const shellTheme = resolveDocsShellThemeById(themeId);
  return cloneContextWithTheme(ctx, shellTheme.theme);
}

type ThemeTokenFamily = 'semantic' | 'surface' | 'border' | 'ui' | 'status' | 'gradient';

interface ThemeTokenEntry {
  readonly family: ThemeTokenFamily;
  readonly path: string;
  readonly token?: TokenValue;
  readonly stops?: readonly string[];
}

type ThemePaletteRow =
  | { readonly kind: 'group'; readonly label: string }
  | { readonly kind: 'token'; readonly entry: ThemeTokenEntry };

function hexFromRgb([red, green, blue]: Rgb): string {
  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

function themeTokenRecordEntries(
  family: Exclude<ThemeTokenFamily, 'gradient'>,
  tokens: Record<string, TokenValue>,
): readonly ThemeTokenEntry[] {
  return Object.entries(tokens).map(([key, token]) => ({
    family,
    path: `${family}.${key}`,
    token,
  }));
}

function themeTokenEntries(theme: Theme): readonly ThemeTokenEntry[] {
  return [
    ...themeTokenRecordEntries('semantic', theme.semantic),
    ...themeTokenRecordEntries('surface', theme.surface),
    ...themeTokenRecordEntries('border', theme.border),
    ...themeTokenRecordEntries('ui', theme.ui),
    ...themeTokenRecordEntries('status', theme.status),
    ...Object.entries(theme.gradient).map(([key, stops]) => ({
      family: 'gradient' as const,
      path: `gradient.${key}`,
      stops: stops.map((stop) => hexFromRgb(stop.color)),
    })),
  ];
}

function themePaletteRows(theme: Theme): readonly ThemePaletteRow[] {
  const entries = themeTokenEntries(theme);
  const rows: ThemePaletteRow[] = [];
  for (const family of ['semantic', 'surface', 'border', 'ui', 'status', 'gradient'] as const) {
    rows.push({ kind: 'group', label: family });
    rows.push(...entries
      .filter((entry) => entry.family === family)
      .map((entry) => ({ kind: 'token' as const, entry })));
  }
  return rows;
}

function readableSwatchForeground(background: string): string {
  return relativeLuminance(background) > 0.46 ? '#111827' : '#f8fafc';
}

function writeSurfaceText(
  surface: Surface,
  x: number,
  y: number,
  text: string,
  token: TokenValue = { hex: '#f8fafc' },
): void {
  for (let index = 0; index < text.length && x + index < surface.width; index++) {
    surface.set(x + index, y, {
      char: text[index]!,
      fg: token.hex,
      bg: token.bg,
      modifiers: token.modifiers,
    });
  }
}

function renderSwatch(
  surface: Surface,
  entry: ThemeTokenEntry,
  x: number,
  y: number,
  width: number,
): void {
  if (entry.token !== undefined) {
    const background = entry.family === 'surface' && entry.token.bg !== undefined
      ? entry.token.bg
      : entry.token.hex;
    const foreground = entry.family === 'surface'
      ? entry.token.hex
      : readableSwatchForeground(background);
    for (let offset = 0; offset < width; offset++) {
      surface.set(x + offset, y, {
        char: ' ',
        fg: foreground,
        bg: background,
      });
    }
    return;
  }

  const stops = entry.stops ?? ['#808080'];
  for (let offset = 0; offset < width; offset++) {
    const stopIndex = Math.min(
      stops.length - 1,
      Math.floor((offset / Math.max(1, width)) * stops.length),
    );
    const background = stops[stopIndex] ?? '#808080';
    surface.set(x + offset, y, {
      char: ' ',
      fg: readableSwatchForeground(background),
      bg: background,
    });
  }
}

function describeThemeToken(entry: ThemeTokenEntry, localization: LocalizationPort | undefined): string {
  if (entry.token !== undefined) {
    return entry.token.bg === undefined
      ? entry.token.hex
      : dogfoodText(localization, 'themePalette.tokenWithBackground', '{foreground} on {background}', {
        foreground: entry.token.hex,
        background: entry.token.bg,
      });
  }
  return (entry.stops ?? []).join(' -> ');
}

function renderThemeTokenPalette(
  theme: Theme,
  width: number,
  localization: LocalizationPort | undefined,
  options: { readonly maxRows?: number } = {},
): Surface {
  const safeWidth = Math.max(24, width);
  const rows = themePaletteRows(theme);
  const visibleRows = options.maxRows === undefined
    ? rows
    : rows.slice(0, Math.max(1, options.maxRows));
  const truncatedCount = Math.max(0, rows.length - visibleRows.length);
  const surface = createSurface(safeWidth, Math.max(1, visibleRows.length + (truncatedCount > 0 ? 1 : 0)));
  const swatchWidth = Math.min(8, Math.max(4, Math.floor(safeWidth / 8)));
  const labelX = swatchWidth + 2;

  visibleRows.forEach((row, y) => {
    if (row.kind === 'group') {
      writeSurfaceText(surface, 0, y, row.label.toUpperCase(), { hex: '#f2c45d', modifiers: ['bold'] });
      return;
    }
    renderSwatch(surface, row.entry, 0, y, swatchWidth);
    writeSurfaceText(surface, labelX, y, row.entry.path, { hex: '#f4e8bf' });
    writeSurfaceText(
      surface,
      Math.min(safeWidth - 1, labelX + 26),
      y,
      describeThemeToken(row.entry, localization),
      { hex: '#a8b1c7', modifiers: ['dim'] },
    );
  });

  if (truncatedCount > 0) {
    writeSurfaceText(
      surface,
      0,
      surface.height - 1,
      dogfoodText(localization, 'themePalette.moreTokens', '... {count} more tokens', {
        count: truncatedCount,
      }),
      { hex: '#a8b1c7', modifiers: ['dim'] },
    );
  }

  return surface;
}

function dogfoodSafePairSummary(theme: Theme, localization: LocalizationPort | undefined): string {
  const report = doctorTheme(theme, { contrastPairs: DOGFOOD_THEME_SAFE_PAIRS });
  const passed = Math.max(0, DOGFOOD_THEME_SAFE_PAIRS.length - report.issues.length);
  return dogfoodText(localization, 'themeDiagnostics.safePairs', '{passed}/{total} safe pairs pass', {
    passed,
    total: DOGFOOD_THEME_SAFE_PAIRS.length,
  });
}

function themeColorReuseSummary(theme: Theme, localization: LocalizationPort | undefined): string {
  const uses = new Map<string, string[]>();
  for (const entry of themeTokenEntries(theme)) {
    if (entry.token !== undefined) {
      const values = entry.token.bg === undefined
        ? [entry.token.hex]
        : [entry.token.hex, entry.token.bg];
      for (const value of values) {
        uses.set(value, [...(uses.get(value) ?? []), entry.path]);
      }
      continue;
    }
    for (const stop of entry.stops ?? []) {
      uses.set(stop, [...(uses.get(stop) ?? []), entry.path]);
    }
  }
  const repeated = Array.from(uses.values()).filter((paths) => new Set(paths).size > 1);
  return dogfoodText(localization, 'themeDiagnostics.colorReuse', '{count} reused colors across {total} unique values', {
    count: repeated.length,
    total: uses.size,
  });
}

function renderThemeLabPane(
  width: number,
  ctx: BijouContext,
  landingTheme: LandingThemeTokens,
  localization: LocalizationPort | undefined,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const bodyWidth = Math.max(24, paneWidth - 2);
  const shellGallery = DOCS_SHELL_THEME_CHOICES
    .map((shellTheme, index) => `${index + 1}. ${shellTheme.label} -> ${shellTheme.theme.name}`)
    .join('\n');
  const defaultSummary = [
    dogfoodText(localization, 'themeLab.defaultDark', 'Default dark preset: {name} ({summary})', {
      name: BIJOU_DARK.name,
      summary: dogfoodSafePairSummary(BIJOU_DARK, localization),
    }),
    dogfoodText(localization, 'themeLab.defaultLight', 'Default light preset: {name} ({summary})', {
      name: BIJOU_LIGHT.name,
      summary: dogfoodSafePairSummary(BIJOU_LIGHT, localization),
    }),
    dogfoodText(localization, 'themeLab.colorReuseLine', 'Color reuse: dark {dark}; light {light}.', {
      dark: themeColorReuseSummary(BIJOU_DARK, localization),
      light: themeColorReuseSummary(BIJOU_LIGHT, localization),
    }),
    dogfoodText(
      localization,
      'themeLab.swatchCoverage',
      'Swatches include semantic.primary, surface.primary, and gradient.brand rows.',
    ),
    dogfoodText(
      localization,
      'themeLab.f10Hint',
      'F10 opens the Theme Inspector drawer from the docs shell.',
    ),
  ].join('\n');

  return insetPaneSurface(column([
    themedSeparatorSurface(dogfoodText(localization, 'themeLab.separator', 'docs • Theme Lab'), paneWidth, ctx, landingTheme),
    spacer(1, 1),
    boxSurface(proseSurface(defaultSummary, bodyWidth), {
      title: dogfoodText(localization, 'themeLab.postureTitle', 'theme posture'),
      width: Math.max(28, paneWidth),
      borderToken: docsThemeBorderToken(landingTheme),
      bgToken: docsThemeSurfaceToken(landingTheme),
      padding: { left: 1, right: 1 },
      ctx,
    }),
    spacer(1, 1),
    boxSurface(proseSurface(shellGallery, bodyWidth), {
      title: dogfoodText(localization, 'themeLab.galleryTitle', 'shell gallery'),
      width: Math.max(28, paneWidth),
      borderToken: docsThemeMutedBorderToken(landingTheme),
      bgToken: docsThemeSurfaceToken(landingTheme),
      padding: { left: 1, right: 1 },
      ctx,
    }),
    spacer(1, 1),
    boxSurface(renderThemeTokenPalette(BIJOU_DARK, bodyWidth, localization, { maxRows: 28 }), {
      title: dogfoodText(localization, 'themeLab.darkSwatchesTitle', 'bijou-dark token swatches'),
      width: Math.max(28, paneWidth),
      borderToken: docsThemeMutedBorderToken(landingTheme),
      bgToken: docsThemeSurfaceToken(landingTheme),
      padding: { left: 1, right: 1 },
      ctx,
    }),
    spacer(1, 1),
    boxSurface(renderThemeTokenPalette(BIJOU_LIGHT, bodyWidth, localization, { maxRows: 28 }), {
      title: dogfoodText(localization, 'themeLab.lightSwatchesTitle', 'bijou-light token swatches'),
      width: Math.max(28, paneWidth),
      borderToken: docsThemeMutedBorderToken(landingTheme),
      bgToken: docsThemeSurfaceToken(landingTheme),
      padding: { left: 1, right: 1 },
      ctx,
    }),
  ]), width);
}

function renderThemeInspectorDrawer(
  model: RootModel,
  ctx: BijouContext,
  localization: LocalizationPort | undefined,
) {
  const activeTheme = resolveDocsShellThemeById(model.docsModel.activeShellThemeId);
  const drawerWidth = themeInspectorDrawerWidth(model.columns);
  const drawerHeight = Math.max(8, model.rows - 4);
  const bodyWidth = Math.max(1, drawerWidth - 4);
  const viewportHeight = Math.max(1, drawerHeight - 2);
  const body = column([
    line(dogfoodText(localization, 'themeInspector.active', 'Active: {label}', {
      label: activeTheme.label,
    })),
    line(dogfoodText(localization, 'themeInspector.theme', 'Theme: {name}', {
      name: activeTheme.theme.name,
    })),
    line(dogfoodSafePairSummary(activeTheme.theme, localization)),
    spacer(1, 1),
    renderThemeTokenPalette(activeTheme.theme, bodyWidth, localization),
    spacer(1, 1),
    line(dogfoodText(localization, 'themeInspector.close', 'F10/Esc close • ↑/↓ scroll • q quit')),
  ]);
  const viewport = viewportSurface({
    width: bodyWidth,
    height: viewportHeight,
    content: body,
    scrollY: clampThemeInspectorScroll(model, model.themeInspectorScrollY),
    showScrollbar: true,
    scrollbarMode: 'overlay',
    scrollbarTrackCell: {
      char: '│',
      fg: activeTheme.theme.ui.scrollTrack.hex,
      bg: activeTheme.theme.surface.overlay.bg,
      modifiers: activeTheme.theme.ui.scrollTrack.modifiers,
    },
    scrollbarThumbCell: {
      char: '█',
      fg: activeTheme.theme.ui.scrollThumb.hex,
      bg: activeTheme.theme.surface.overlay.bg,
      modifiers: activeTheme.theme.ui.scrollThumb.modifiers,
    },
  });
  const surface = boxSurface(viewport, {
    title: dogfoodText(localization, 'themeInspector.title', 'Theme Inspector'),
    width: drawerWidth,
    borderToken: activeTheme.theme.border.primary,
    bgToken: activeTheme.theme.surface.overlay,
    padding: { left: 1, right: 1 },
    ctx,
  });

  return {
    content: '',
    surface,
    row: 1,
    col: Math.max(0, model.columns - drawerWidth - 1),
  };
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

function docsNavWidthForVariant(variant: DocsLayoutVariant): number {
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

function visiblePaneIdsForLayout(pageId: DocsPageId, variant: DocsLayoutVariant): readonly string[] {
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

function insetPaneSurface(content: Surface, width: number): Surface {
  const safeWidth = Math.max(1, width);
  const inset = resolvePaneInset(safeWidth);
  const innerWidth = Math.max(1, safeWidth - (inset * 2));
  const result = createSurface(safeWidth, content.height);
  result.blit(content, inset, 0, 0, 0, innerWidth, content.height);
  return result;
}

function blitCentered(
  surface: Surface,
  content: Surface,
  y: number,
  mask?: Parameters<Surface['blit']>[7],
): void {
  surface.blit(
    content,
    Math.floor((surface.width - content.width) / 2),
    y,
    undefined,
    undefined,
    undefined,
    undefined,
    mask,
  );
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
  const body = browsableListSurface(model.familyState, {
    width: Math.max(1, paneWidth),
    showScrollbar: true,
    ctx,
    focusedRowOverflow: { mode: 'marquee', elapsedMs: model.previewTimeMs },
    renderItem: ({ item, focused }) => formatFamilyRow({
      row: parseRowValue(item.value),
      focused,
      selectedStoryId: model.selectedStoryId,
      expandedFamilies: model.expandedFamilies,
      ctx,
      theme,
    }),
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
  localization: LocalizationPort,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const bodyWidth = Math.max(28, paneWidth - 6);
  const coverageBarWidth = Math.max(16, Math.min(40, bodyWidth - 8));
  const intro = boxSurface(column([
    paragraphSurface(
      dogfoodText(
        localization,
        'docs.empty.intro.body',
        'Bijou is a surface-native terminal UI framework for building styled, stateful, testable TUIs without dropping back into stringly view code.',
      ),
      Math.max(24, bodyWidth - 2),
    ),
    spacer(),
    paragraphSurface(
      dogfoodText(
        localization,
        'docs.empty.intro.body2',
        'DOGFOOD is the living field guide for the framework. The docs, previews, shell, and teaching surfaces are built in Bijou itself so the documentation exercises the same runtime and design system it describes.',
      ),
      Math.max(24, bodyWidth - 2),
    ),
  ]), {
    title: dogfoodText(localization, 'docs.empty.intro.title', 'What is Bijou?'),
    width: Math.max(24, paneWidth),
    borderToken: docsThemeBorderToken(theme),
    padding: { left: 1, right: 1 },
    ctx,
  });

  const coverage = boxSurface(column([
    paragraphSurface(
      dogfoodText(
        localization,
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
      localization,
      'docs.empty.coverage.status',
      '{documented}/{total} families • {percent}%',
      {
        documented: DOGFOOD_DOCS_COVERAGE.documentedFamilies,
        total: DOGFOOD_DOCS_COVERAGE.totalFamilies,
        percent: DOGFOOD_DOCS_COVERAGE.percent,
      },
    )),
  ]), {
    title: dogfoodText(localization, 'docs.empty.coverage.title', 'Documentation coverage'),
    width: Math.max(24, paneWidth),
    borderToken: docsThemeBorderToken(theme),
    padding: { left: 1, right: 1 },
    ctx,
  });

  const guide = boxSurface(column([
    line(dogfoodText(localization, 'docs.empty.guide.step1', '1. Browse component families in the left lane.')),
    line(dogfoodText(localization, 'docs.empty.guide.step2', '2. Press Enter to expand a family or open a component.')),
    line(dogfoodText(localization, 'docs.empty.guide.step3', '3. Use Tab to move focus between families, docs, and variants.')),
    line(dogfoodText(localization, 'docs.empty.guide.step4', '4. Press / to search documentation at any time.')),
    line(dogfoodText(localization, 'docs.empty.guide.step5', '5. Press F2 for settings, ? for help, and q or Esc to quit.')),
  ]), {
    title: dogfoodText(localization, 'docs.empty.guide.title', 'How to use these docs'),
    width: Math.max(24, paneWidth),
    borderToken: docsThemeMutedBorderToken(theme),
    padding: { left: 1, right: 1 },
    ctx,
  });

  return insetPaneSurface(column([
    themedSeparatorSurface(dogfoodText(localization, 'docs.separator.welcome', 'welcome to bijou'), paneWidth, ctx, theme),
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
  localization: LocalizationPort,
): Surface {
  const story = selectedStory(model);
  if (story == null) {
    return renderEmptyStoryPane(width, ctx, theme, localization);
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
  const docsWidth = Math.max(24, paneWidth - 2);
  const docs = markdown(storyDocsMarkdown(story, variant, preset), {
    width: docsWidth,
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
    proseSurface(docs, docsWidth),
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
  localization: LocalizationPort,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const bodyHeight = Math.max(1, height - DOCS_FAMILY_SEPARATOR_ROWS);
  const loweredMode = ctx.mode === 'pipe' || ctx.mode === 'accessible';
  const guideState = localizedGuideStateForPage(pageId, model, localization);
  const focusedGuideId = guideState.items[guideState.focusIndex]?.value;
  const navigationBlockResult = navigationListBlock.render({
    config: {
      activeItemId: loweredMode
        ? focusedGuideId ?? model.selectedGuideId
        : model.selectedGuideId,
      items: guideState.items.map((item) => ({
        id: item.value,
        label: item.label,
      })),
    },
    mode: ctx.mode,
  });
  const body = loweredMode
    ? proseSurface(String(navigationBlockResult.output), Math.max(1, paneWidth))
    : browsableListSurface(guideState, {
        width: Math.max(1, paneWidth),
        showScrollbar: true,
        ctx,
        focusedRowOverflow: { mode: 'marquee', elapsedMs: model.previewTimeMs },
        renderItem: ({ item, focused }) => formatGuideRow({
          item,
          focused,
          selectedGuideId: model.selectedGuideId,
          ctx,
          theme,
        }),
      });

  return insetPaneSurface(column([
    themedSeparatorSurface(pageTitle(pageId, localization).toLowerCase(), paneWidth, ctx, theme),
    body,
  ]), width);
}

function renderGuideReaderPane(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
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

  const standardBlock = standardBlockForPreviewGuide(doc);
  if (standardBlock !== undefined) {
    return renderBlocksPreviewPane(standardBlock, width, ctx, theme, localization);
  }
  if (doc.id === COUNTER_DEMO_BLOCK_GUIDE_ID) {
    return renderCounterDemoPreviewPane(model, width, ctx, theme, localization);
  }
  if (doc.id === THEME_LAB_GUIDE_ID) {
    return renderThemeLabPane(width, ctx, theme, localization);
  }

  const docsWidth = Math.max(24, paneWidth - 2);
  const docTitle = guideDocTitle(doc, localization);
  const docBody = guideDocBody(doc, localization);
  const renderedArticle = documentationArticleBlock.render({
    config: {
      title: docTitle,
      body: docBody,
      headingCount: countMarkdownHeadings(docBody),
    },
    mode: ctx.mode,
  });
  const articleBody = String(renderedArticle.output);

  return insetPaneSurface(column([
    themedSeparatorSurface(`docs • ${docTitle}`, paneWidth, ctx, theme),
    spacer(1, 1),
    proseSurface(markdown(articleBody, {
      width: docsWidth,
      ctx,
    }), docsWidth),
  ]), width);
}

function renderGuideInfoPane(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  width: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const doc = selectedGuide(pageId, model);
  const selectedTitle = doc == null ? pageTitle(pageId, localization) : guideDocTitle(doc, localization);
  const description = doc == null
    ? dogfoodText(localization, 'guide.info.defaultSummary', 'This section is still being expanded.')
    : guideDocSummary(doc, localization)
    ?? dogfoodText(localization, 'guide.info.defaultSummary', 'This section is still being expanded.');
  const currentPosture = (() => {
    switch (pageId) {
      case GUIDES_PAGE_ID:
        return dogfoodText(
          localization,
          'guide.info.posture.guides',
          'Reader-first orientation path for DOGFOOD with the repo documentation map.',
        );
      case BLOCKS_PAGE_ID:
        return dogfoodText(
          localization,
          'guide.info.posture.blocks',
          'Block authoring inventory preview and lowering path published directly inside DOGFOOD.',
        );
      case PACKAGES_PAGE_ID:
        return dogfoodText(
          localization,
          'guide.info.posture.packages',
          'Explainer pages for shipped workspace packages published inside DOGFOOD.',
        );
      case PHILOSOPHY_PAGE_ID:
        return dogfoodText(
          localization,
          'guide.info.posture.philosophy',
          'Key doctrine architecture invariants and design-system guidance published inside DOGFOOD.',
        );
      case THEME_LAB_PAGE_ID:
        return dogfoodText(
          localization,
          'guide.info.posture.themes',
          'Theme palettes, safe-pair diagnostics, and runtime token swatches published inside DOGFOOD.',
        );
      case RELEASE_PAGE_ID:
        return dogfoodText(
          localization,
          'guide.info.posture.release',
          '{version} release story and migration guidance published inside DOGFOOD.',
          { version: BIJOU_VERSION },
        );
      default:
        return dogfoodText(
          localization,
          'guide.info.defaultPosture',
          'This section now has a visible home in DOGFOOD.',
        );
    }
  })();
  const guideInspectorSections = [
    {
      title: dogfoodText(localization, 'guide.info.summaryTitle', 'Summary'),
      content: description,
      tone: 'muted' as const,
    },
    {
      title: dogfoodText(localization, 'guide.info.currentPostureTitle', 'Current posture'),
      content: currentPosture,
      tone: 'muted' as const,
    },
  ];
  const renderedInspector = guideInspectorBlock.render({
    config: {
      selectionLabel: selectedTitle,
      sections: guideInspectorSections,
    },
    mode: ctx.mode,
  });

  return insetPaneSurface(column([
    themedSeparatorSurface(`section • ${pageTitle(pageId, localization).toLowerCase()}`, paneWidth, ctx, theme),
    spacer(1, 1),
    contentSurface(inspector({
      title: dogfoodText(localization, 'guide.info.title', 'guide info'),
      currentValue: selectedTitle,
      sections: ctx.mode === 'interactive' || ctx.mode === 'static'
        ? guideInspectorSections
        : [{
          title: 'GuideInspectorBlock',
          content: String(renderedInspector.output),
          tone: 'muted',
        }],
      width: Math.max(22, paneWidth),
      borderToken: docsThemeMutedBorderToken(theme),
      bgToken: docsThemeSurfaceToken(theme),
      ctx,
    })),
  ]), width);
}

function buildDocsFooterHint(model: FrameModel<DocsExplorerModel>, localization: LocalizationPort): string {
  const pageId = (model.activePageId as DocsPageId | undefined) ?? GUIDES_PAGE_ID;
  const pageModel = model.pageModels[pageId];
  const shellHint = dogfoodText(localization, 'docs.footer.shell', DOCS_SHELL_HINT);
  if (pageModel == null || !pageModel.showHints) {
    return renderDocsFooterHint({
      controls: shellHint,
    });
  }

  const focusedPane = model.focusedPaneByPage[pageId];
  const story = pageModel.selectedStoryId == null ? undefined : findComponentStory(pageModel.selectedStoryId);
  const paneSwitch = dogfoodText(localization, 'docs.footer.paneSwitch', DOCS_PANE_SWITCH_HINT);
  const activeHint = (() => {
    if (pageId !== COMPONENTS_PAGE_ID) {
      switch (focusedPane) {
        case 'guide-nav':
          if (pageId === BLOCKS_PAGE_ID && pageModel.selectedGuideId === COUNTER_DEMO_BLOCK_GUIDE_ID) {
            return dogfoodText(
              localization,
              'docs.footer.counterBlockNav',
              '{paneSwitch} • ↑/↓ browse • Enter open • -/+ counter fixture',
              { paneSwitch },
            );
          }
          return dogfoodText(
            localization,
            'docs.footer.guideNav',
            '{paneSwitch} • ↑/↓ browse • Enter open',
            { paneSwitch },
          );
        case 'guide-content':
          if (pageId === BLOCKS_PAGE_ID && pageModel.selectedGuideId === COUNTER_DEMO_BLOCK_GUIDE_ID) {
            return dogfoodText(
              localization,
              'docs.footer.counterBlock',
              '{paneSwitch} • -/+ counter fixture • j/k scroll • d/u page • g/G top/bottom',
              { paneSwitch },
            );
          }
          return dogfoodText(
            localization,
            'docs.footer.guide',
            '{paneSwitch} • j/k scroll • d/u page • g/G top/bottom',
            { paneSwitch },
          );
        case 'guide-meta':
          return dogfoodText(
            localization,
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
          localization,
          'docs.footer.family',
          '{paneSwitch} • ↑/↓ browse • Enter open • ←/→ collapse/expand',
          { paneSwitch },
        );
      case 'story-content':
        return dogfoodText(
          localization,
          'docs.footer.story',
          '{paneSwitch} • j/k scroll • d/u page • g/G top/bottom',
          { paneSwitch },
        );
      case 'story-variants':
        return story == null
          ? paneSwitch
          : dogfoodText(
            localization,
            'docs.footer.variants',
            '{paneSwitch} • ↑/↓ variant • ,/. cycle • 1-4 profiles',
            { paneSwitch },
          );
      default:
        return undefined;
    }
  })();
  return renderDocsFooterHint({
    controls: shellHint,
    activeHint,
  });
}

function renderDocsFooterHint(config: {
  readonly controls: string;
  readonly activeHint?: string;
  readonly status?: string;
}): string {
  return String(footerHintBlock.render({
    config,
    mode: 'pipe',
  }).output);
}

function renderDocsSearchTitle(title: string): string {
  return String(searchPanelBlock.render({
    config: { title },
    mode: 'accessible',
  }).output);
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

function createComponentsPageLayout(
  model: DocsExplorerModel,
  theme: LandingThemeTokens,
  getCtx: () => BijouContext,
  localization: LocalizationPort,
): FrameLayoutNode {
  const family: FrameLayoutNode = {
    kind: 'pane',
    paneId: 'family-nav',
    unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
    render: (width, height) => renderFamiliesPane(model, width, height, getCtx(), theme),
  };
  const main: FrameLayoutNode = {
    kind: 'pane',
    paneId: 'story-content',
    unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
    render: (width) => renderStoryPane(model, width, getCtx(), theme, localization),
  };
  const variants: FrameLayoutNode = {
    kind: 'pane',
    paneId: 'story-variants',
    unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
    render: (width, height) => renderVariantsPane(model, width, height, getCtx(), theme),
  };

  switch (model.layoutVariant) {
    case 'tiny':
      return main;
    case 'narrow': {
      const navWidth = docsNavWidthForVariant(model.layoutVariant);
      return {
        kind: 'grid',
        gridId: 'docs-shell',
        columns: [1, navWidth, 1, '1fr'],
        rows: [1, '1fr', 1],
        areas: [
          '. . . .',
          '. family . main',
          '. . . .',
        ],
        gap: 0,
        cells: { family, main },
      };
    }
    case 'standard': {
      const navWidth = docsNavWidthForVariant(model.layoutVariant);
      return {
        kind: 'grid',
        gridId: 'docs-shell',
        columns: [1, navWidth, 1, '1fr', 1],
        rows: [1, '1fr', 1],
        areas: [
          '. . . . .',
          '. family . main .',
          '. . . . .',
        ],
        gap: 0,
        cells: { family, main },
      };
    }
    case 'wide':
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
        cells: { family, main, variants },
      };
  }
}

function createGuidePageLayout(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  theme: LandingThemeTokens,
  getCtx: () => BijouContext,
  localization: LocalizationPort,
): FrameLayoutNode {
  const nav: FrameLayoutNode = {
    kind: 'pane',
    paneId: 'guide-nav',
    unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
    render: (width, height) => renderGuideNavPane(pageId, model, width, height, getCtx(), theme, localization),
  };
  const main: FrameLayoutNode = {
    kind: 'pane',
    paneId: 'guide-content',
    unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
    render: (width) => renderGuideReaderPane(pageId, model, width, getCtx(), theme, localization),
  };
  const meta: FrameLayoutNode = {
    kind: 'pane',
    paneId: 'guide-meta',
    unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
    render: (width) => renderGuideInfoPane(pageId, model, width, getCtx(), theme, localization),
  };

  switch (model.layoutVariant) {
    case 'tiny':
      return main;
    case 'narrow': {
      const navWidth = docsNavWidthForVariant(model.layoutVariant);
      return {
        kind: 'grid',
        gridId: `docs-${pageId}`,
        columns: [1, navWidth, 1, '1fr'],
        rows: [1, '1fr', 1],
        areas: [
          '. . . .',
          '. nav . main',
          '. . . .',
        ],
        gap: 0,
        cells: { nav, main },
      };
    }
    case 'standard': {
      const navWidth = docsNavWidthForVariant(model.layoutVariant);
      return {
        kind: 'grid',
        gridId: `docs-${pageId}`,
        columns: [1, navWidth, 1, '1fr', 1],
        rows: [1, '1fr', 1],
        areas: [
          '. . . . .',
          '. nav . main .',
          '. . . . .',
        ],
        gap: 0,
        cells: { nav, main },
      };
    }
    case 'wide':
      return {
        kind: 'grid',
        gridId: `docs-${pageId}`,
        columns: [1, DOCS_SIDEBAR_WIDTH, 1, '1fr', 1, DOCS_SIDEBAR_WIDTH, 1],
        rows: [1, '1fr', 1],
        areas: [
          '. . . . . . .',
          '. nav . main . meta .',
          '. . . . . . .',
        ],
        gap: 0,
        cells: { nav, main, meta },
      };
  }
}

function createDocsExplorerApp(
  getCtx: () => BijouContext,
  onShellThemeChange: (ctx: BijouContext) => void,
  i18n: I18nRuntime,
  localization: LocalizationPort,
  options: Pick<DocsAppOptions, 'direction' | 'initialPageId' | 'initialSelectedStoryId'> = {},
  initialLocale = 'en',
): FramedApp<DocsExplorerModel, DocsMsg> {
  const ctx = getCtx();
  return createFramedApp<DocsExplorerModel, DocsMsg>({
    ctx,
    i18n,
    title: 'Bijou Docs',
    defaultPageId: options.initialPageId ?? GUIDES_PAGE_ID,
    headerStyle: ({ pageModel }) => ({
      activeTabToken: resolveDocsThemeActiveHeaderTabToken(resolveDocsVisualThemeByShellThemeId(pageModel.activeShellThemeId)),
    }),
    initialColumns: ctx.runtime.columns,
    initialRows: ctx.runtime.rows,
    helpLineSource: ({ model }) => buildDocsFooterHint(model, localization),
    shellThemes: DOCS_SHELL_THEMES,
    pages: DOCS_SITE_PAGES.map((spec) => {
      if (spec.id === COMPONENTS_PAGE_ID) {
        return {
          id: spec.id,
          title: () => pageTitle(spec.id, localization),
          keyMap: componentsPageKeys,
          init: () => [createInitialComponentsExplorerModel(ctx, initialLocale, options.initialSelectedStoryId), []],
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
                return [{ ...model, familyState: listFocusNext(model.familyState), previewTimeMs: 0 }, []];
              case 'family-prev':
                return [{ ...model, familyState: listFocusPrev(model.familyState), previewTimeMs: 0 }, []];
              case 'family-page-down':
                return [{ ...model, familyState: listPageDown(model.familyState), previewTimeMs: 0 }, []];
              case 'family-page-up':
                return [{ ...model, familyState: listPageUp(model.familyState), previewTimeMs: 0 }, []];
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
              case 'cycle-locale': {
                const nextLocale = nextDogfoodLocale(model.locale);
                return [model, [activateDogfoodLocale(i18n, options, nextLocale.id)]];
              }
              case 'locale-activated':
                return [{ ...model, locale: msg.locale }, []];
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
          searchTitle: () => renderDocsSearchTitle(
            dogfoodText(localization, 'docs.search.title', 'Search documentation'),
          ),
          searchItems() {
            return documentationSearchItems(localization);
          },
          layout(model) {
            const theme = resolveDocsVisualThemeByShellThemeId(model.activeShellThemeId);
            return createComponentsPageLayout(model, theme, getCtx, localization);
          },
        };
      }

      return {
        id: spec.id,
        title: () => pageTitle(spec.id, localization),
        init: () => [createInitialExplorerModel(ctx, spec.id, initialLocale), []],
        update(msg: FramePageMsg<DocsMsg>, model) {
          if (msg.type === 'mouse') {
            return [model, []];
          }
          if (msg.type === 'pulse') {
            const deltaMs = Math.round(Math.max(0, msg.dt) * 1000);
            const shouldTickCounterDemo = spec.id === BLOCKS_PAGE_ID
              && model.selectedGuideId === COUNTER_DEMO_BLOCK_GUIDE_ID;
            return [{
              ...model,
              previewTimeMs: model.previewTimeMs + deltaMs,
              counterBlockDemo: shouldTickCounterDemo
                ? tickCounterDemoModel(model.counterBlockDemo, deltaMs)
                : model.counterBlockDemo,
            }, []];
          }
          switch (msg.type) {
            case 'guide-next': {
              const focusedModel = { ...model, guideState: listFocusNext(model.guideState), previewTimeMs: 0 };
              return [selectFocusedBlockPreviewGuide(spec.id, focusedModel), []];
            }
            case 'guide-prev': {
              const focusedModel = { ...model, guideState: listFocusPrev(model.guideState), previewTimeMs: 0 };
              return [selectFocusedBlockPreviewGuide(spec.id, focusedModel), []];
            }
            case 'guide-page-down': {
              const focusedModel = { ...model, guideState: listPageDown(model.guideState), previewTimeMs: 0 };
              return [selectFocusedBlockPreviewGuide(spec.id, focusedModel), []];
            }
            case 'guide-page-up': {
              const focusedModel = { ...model, guideState: listPageUp(model.guideState), previewTimeMs: 0 };
              return [selectFocusedBlockPreviewGuide(spec.id, focusedModel), []];
            }
            case 'activate-guide':
              return [{ ...activateGuideRow(model, spec.id), previewTimeMs: 0 }, []];
            case 'activate-guide-index':
              return [{ ...activateGuideRowIndex(model, spec.id, msg.index), previewTimeMs: 0 }, []];
            case 'select-guide':
              return [{ ...selectGuide(spec.id, model, msg.guideId), previewTimeMs: 0 }, []];
            case 'toggle-hints':
              return [{ ...model, showHints: !model.showHints }, []];
            case 'cycle-locale': {
              const nextLocale = nextDogfoodLocale(model.locale);
              return [model, [activateDogfoodLocale(i18n, options, nextLocale.id)]];
            }
            case 'locale-activated':
              return [{ ...model, locale: msg.locale }, []];
            case 'cycle-landing-quality':
              return [{ ...model, landingQualityMode: nextLandingQualityMode(model.landingQualityMode) }, []];
            case 'counter-block-intent':
              if (spec.id !== BLOCKS_PAGE_ID || model.selectedGuideId !== COUNTER_DEMO_BLOCK_GUIDE_ID) {
                return [model, []];
              }
              return [{
                ...model,
                counterBlockDemo: applyCounterDemoIntent(
                  model.counterBlockDemo,
                  counterDemoIntentForAction(msg.action),
                ),
                previewTimeMs: 0,
              }, []];
            default:
              return [model, []];
          }
        },
        inputAreas(model) {
          const inputAreas: FrameInputArea<DocsExplorerModel, DocsMsg>[] = [{
            paneId: 'guide-nav',
            keyMap: guidePaneKeys,
            helpSource: guidePaneKeys,
            mouse: ({ msg, rect }) => resolveGuidePaneMouse(msg, model, rect),
          }];
          if (spec.id === BLOCKS_PAGE_ID && model.selectedGuideId === COUNTER_DEMO_BLOCK_GUIDE_ID) {
            return [
              {
                ...inputAreas[0]!,
                keyMap: counterBlockGuidePaneKeys,
                helpSource: counterBlockGuidePaneKeys,
              },
              {
                paneId: 'guide-content',
                keyMap: counterBlockPreviewPaneKeys,
                helpSource: counterBlockPreviewPaneKeys,
              },
            ];
          }
          return inputAreas;
        },
        searchTitle: () => renderDocsSearchTitle(
          dogfoodText(localization, 'docs.search.title', 'Search documentation'),
        ),
        searchItems() {
          return documentationSearchItems(localization);
        },
        layout(model) {
          const theme = resolveDocsVisualThemeByShellThemeId(model.activeShellThemeId);
          return createGuidePageLayout(spec.id, model, theme, getCtx, localization);
        },
      };
    }),
    enableCommandPalette: true,
    onShellThemeChange: ({ ctx: nextCtx }) => {
      onShellThemeChange(nextCtx);
    },
    settings: ({ model, pageModel }) => {
      const theme = resolveDocsVisualThemeByShellThemeId(pageModel.activeShellThemeId);
      const nextLocale = nextDogfoodLocale(pageModel.locale);
      return {
        borderToken: docsThemeBorderToken(theme),
        bgToken: docsThemeSurfaceToken(theme),
        listTheme: docsThemePreferenceListTheme(theme),
        sections: [
        {
          id: 'shell',
          title: dogfoodText(localization, 'settings.section.shell', 'Shell'),
          rows: [{
            id: 'show-hints',
            label: dogfoodText(localization, 'settings.showHints.label', 'Show hints'),
            description: dogfoodText(localization, 'settings.showHints.description', 'Show active-pane control cues in the footer. Turn this off for a quieter shell and use ? for the full key map.'),
            valueLabel: pageModel.showHints
              ? dogfoodText(localization, 'settings.showHints.on', 'On')
              : dogfoodText(localization, 'settings.showHints.off', 'Off'),
            checked: pageModel.showHints,
            kind: 'toggle',
            action: { type: 'toggle-hints' },
            feedback: {
              title: shellText(localization, 'settings.title', 'Settings'),
              message: pageModel.showHints
                ? dogfoodText(localization, 'settings.showHints.feedback.off', 'Show hints turned off.')
                : dogfoodText(localization, 'settings.showHints.feedback.on', 'Show hints turned on.'),
            },
          }],
        },
        {
          id: 'localization',
          title: dogfoodText(localization, 'settings.section.localization', 'Localization'),
          rows: [{
            id: 'preferred-language',
            label: dogfoodText(localization, 'settings.language.label', 'Preferred language'),
            description: dogfoodLocaleSettingDescription(pageModel.locale, localization),
            valueLabel: dogfoodLocaleLabel(pageModel.locale, localization),
            kind: 'choice',
            action: { type: 'cycle-locale' },
            feedback: {
              title: shellText(localization, 'settings.title', 'Settings'),
              message: dogfoodText(
                localization,
                'settings.language.feedback',
                'Language set to {language}.',
                { language: dogfoodLocaleLabel(nextLocale.id, localization) },
              ),
            },
          }],
        },
        {
          id: 'landing',
          title: dogfoodText(localization, 'settings.section.landing', 'Landing'),
          rows: [
            {
              id: 'landing-quality',
              label: dogfoodText(localization, 'settings.landingQuality.label', 'Landing quality'),
              description: landingQualitySettingDescription(model.columns, model.rows, pageModel.landingQualityMode, localization),
              valueLabel: landingQualitySettingValue(model.columns, model.rows, pageModel.landingQualityMode, localization),
              kind: 'choice',
              action: { type: 'cycle-landing-quality' },
              feedback: {
                title: shellText(localization, 'settings.title', 'Settings'),
                message: dogfoodText(
                  localization,
                  'settings.landingQuality.feedback',
                  'Landing quality set to {quality}.',
                  { quality: landingQualityModeLabel(nextLandingQualityMode(pageModel.landingQualityMode), localization) },
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
  const nextLayoutVariant = resolveDocsLayoutVariant(docsModel.columns, docsModel.rows);
  let changed = false;
  const nextPageModels: Record<string, DocsExplorerModel> = {};
  const nextFocusedPaneByPage: Record<string, string | undefined> = {};
  const nextScrollByPage: Record<string, Readonly<Record<string, { readonly x: number; readonly y: number }>>> = {};

  for (const [pageId, pageModel] of Object.entries(docsModel.pageModels)) {
    const docsPageId = pageId as DocsPageId;
    let nextPageModel: DocsExplorerModel = pageModel.layoutVariant === nextLayoutVariant
      ? pageModel
      : { ...pageModel, layoutVariant: nextLayoutVariant };
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

    const visiblePaneIds = visiblePaneIdsForLayout(docsPageId, nextLayoutVariant);
    const previousFocusedPane = docsModel.focusedPaneByPage[pageId];
    const nextFocusedPane = previousFocusedPane != null && visiblePaneIds.includes(previousFocusedPane)
      ? previousFocusedPane
      : visiblePaneIds[0];
    const previousScroll = docsModel.scrollByPage[pageId] ?? {};
    const nextScroll = Object.fromEntries(visiblePaneIds.map((paneId) => [
      paneId,
      previousScroll[paneId] ?? { x: 0, y: 0 },
    ]));

    nextPageModels[pageId] = nextPageModel;
    nextFocusedPaneByPage[pageId] = nextFocusedPane;
    nextScrollByPage[pageId] = nextScroll;
    if (nextPageModel !== pageModel) {
      changed = true;
    }
    if (nextFocusedPane !== previousFocusedPane) {
      changed = true;
    }
  }

  return changed
    ? {
        ...docsModel,
        pageModels: nextPageModels,
        focusedPaneByPage: {
          ...docsModel.focusedPaneByPage,
          ...nextFocusedPaneByPage,
        },
        scrollByPage: {
          ...docsModel.scrollByPage,
          ...nextScrollByPage,
        },
      }
    : docsModel;
}

function resetGuideContentScrollOnGuideSelection(
  previousDocsModel: FrameModel<DocsExplorerModel>,
  nextDocsModel: FrameModel<DocsExplorerModel>,
): FrameModel<DocsExplorerModel> {
  let nextScrollByPage = nextDocsModel.scrollByPage;
  let changed = false;

  for (const [pageId, nextPageModel] of Object.entries(nextDocsModel.pageModels)) {
    if (pageId === COMPONENTS_PAGE_ID) continue;
    const previousSelectedGuideId = previousDocsModel.pageModels[pageId]?.selectedGuideId;
    if (previousSelectedGuideId === nextPageModel.selectedGuideId) continue;

    const pageScroll = nextScrollByPage[pageId] ?? {};
    const guideContentScroll = pageScroll['guide-content'];
    if ((guideContentScroll?.x ?? 0) === 0 && (guideContentScroll?.y ?? 0) === 0) continue;

    nextScrollByPage = {
      ...nextScrollByPage,
      [pageId]: {
        ...pageScroll,
        'guide-content': { x: 0, y: 0 },
      },
    };
    changed = true;
  }

  return changed
    ? { ...nextDocsModel, scrollByPage: nextScrollByPage }
    : nextDocsModel;
}

function createDocsI18nRuntime(options: DocsAppOptions = {}): I18nRuntime {
  const initialLocale = resolveDogfoodInitialLocale(options);
  const showMissingLocalizationMarkers = shouldShowMissingLocalizationMarkers(options);
  const runtime = createI18nRuntime({
    locale: resolveDogfoodRuntimeLocale(options),
    direction: options.direction ?? initialLocale.direction,
    fallbackLocale: DEFAULT_LOCALE.id,
    fallbackCatalogs: dogfoodI18nCatalogsForLocale(DEFAULT_LOCALE.id),
    missingMessage: showMissingLocalizationMarkers ? dogfoodMissingLocalizationMessage : undefined,
  });
  runtime.loadCatalog(FRAME_I18N_CATALOG);
  loadDogfoodRuntimeCatalogs(runtime, initialLocale.id, options.extraI18nCatalogs ?? []);
  return runtime;
}

export function createDocsApp(ctx: BijouContext, options: DocsAppOptions = {}): App<RootModel, RootMsg> {
  let currentCtx = ctx;
  const syncShellThemeContext = (themeId: string | undefined) => {
    currentCtx = applyDocsShellThemeToContext(ctx, themeId);
  };
  const initialLocale = resolveDogfoodInitialLocale(options);
  const i18n = createDocsI18nRuntime(options);
  const localization = createRuntimeLocalizationPort(i18n);
  const explorer = createDocsExplorerApp(() => currentCtx, (nextCtx) => {
    currentCtx = nextCtx;
  }, i18n, localization, options, initialLocale.id);
  const renderLanding = createLandingRenderer(() => currentCtx, localization);
  const initialRoute = options.initialRoute ?? 'landing';

  function mapExplorer(cmds: Cmd<FramedAppMsg<DocsMsg>>[]): Cmd<RootMsg>[] {
    return mapCmds(cmds, (msg) => ({ type: 'docs', msg }));
  }

  function updateExplorer(
    message: KeyMsg | ResizeMsg | MouseMsg | PulseLikeMsg | FramedAppMsg<DocsMsg>,
    model: RootModel,
  ): [RootModel, Cmd<RootMsg>[]] {
    const [docsModel, cmds] = explorer.update(message, model.docsModel);
    const resetDocsModel = resetGuideContentScrollOnGuideSelection(model.docsModel, docsModel);
    const syncedDocsModel = syncDocsSharedSettings(syncDocsExplorerViewportLayout(resetDocsModel));
    return [{
      ...model,
      docsModel: syncedDocsModel,
      landingThemeIndex: resolveLandingThemeIndexForShellThemeId(syncedDocsModel.activeShellThemeId),
    }, mapExplorer(cmds)];
  }

  return {
    init() {
      const [docsModel, cmds] = explorer.init();
      const syncedDocsModel = syncDocsSharedSettings(syncDocsExplorerViewportLayout(docsModel));
      return [{
        route: initialRoute,
        columns: Math.max(1, ctx.runtime.columns),
        rows: Math.max(1, ctx.runtime.rows),
        landingTimeMs: 0,
        landingFps: Math.max(1, Math.round(ctx.runtime.refreshRate)),
        landingThemeIndex: resolveLandingThemeIndexForShellThemeId(syncedDocsModel.activeShellThemeId),
        landingToast: undefined,
        landingQuitConfirmOpen: false,
        themeInspectorOpen: false,
        themeInspectorScrollY: 0,
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
        return updateExplorer(msg, {
          ...resizedModel,
          themeInspectorScrollY: clampThemeInspectorScroll(resizedModel, resizedModel.themeInspectorScrollY),
        });
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
          if (shouldToggleLandingPerfHud(msg)) {
            return updateExplorer(msg, model);
          }
          if (msg.key === 'left') {
            return [applyLandingThemeSelection(syncShellThemeContext, model, nextLandingThemeIndex(model.landingThemeIndex, -1)), []];
          }
          if (msg.key === 'right') {
            return [applyLandingThemeSelection(syncShellThemeContext, model, nextLandingThemeIndex(model.landingThemeIndex, 1)), []];
          }
          if (msg.key === 'up') {
            return [applyLandingQualitySelection(model, previousLandingQualityMode(resolveLandingQualityMode(model)), localization), []];
          }
          if (msg.key === 'down') {
            return [applyLandingQualitySelection(model, nextLandingQualityMode(resolveLandingQualityMode(model)), localization), []];
          }
          if (!msg.ctrl && !msg.alt && /^[1-9]$/.test(msg.key)) {
            const themeIndex = Number(msg.key) - 1;
            if (themeIndex < LANDING_THEMES.length) {
              return [applyLandingThemeSelection(syncShellThemeContext, model, themeIndex), []];
            }
          }
          if (shouldContinueFromLanding(msg)) {
            return [{
              ...model,
              route: 'docs',
            }, []];
          }
        }
        return [model, []];
      }

      if (isKeyMsg(msg)) {
        if (model.themeInspectorOpen) {
          if (shouldToggleThemeInspector(msg) || shouldCloseThemeInspector(msg)) {
            return [{ ...model, themeInspectorOpen: false, themeInspectorScrollY: 0 }, []];
          }
          const scrollTarget = themeInspectorScrollTarget(msg, themeInspectorViewportHeight(model));
          if (scrollTarget !== undefined) {
            const nextScrollY = scrollTarget === 'top'
              ? 0
              : scrollTarget === 'bottom'
                ? themeInspectorMaxScroll(model)
                : model.themeInspectorScrollY + scrollTarget;
            return [{
              ...model,
              themeInspectorScrollY: clampThemeInspectorScroll(model, nextScrollY),
            }, []];
          }
          if (isShellQuitRequest(msg)) {
            return updateExplorer(msg, { ...model, themeInspectorOpen: false, themeInspectorScrollY: 0 });
          }
          return [model, []];
        }
        if (shouldToggleThemeInspector(msg)) {
          return [{ ...model, themeInspectorOpen: true, themeInspectorScrollY: 0 }, []];
        }
      }

      if (isKeyMsg(msg) || isMouseMsg(msg) || msg.type === 'pulse') {
        const [nextModel, cmds] = updateExplorer(msg, model);
        return [nextModel, cmds];
      }

      return [model, []];
    },

    view(model) {
      if (model.route === 'landing') {
        const landing = renderLanding(model);
        const overlays = [
          ...(model.landingQuitConfirmOpen ? [renderShellQuitOverlay(model.columns, model.rows)] : []),
          ...(model.docsModel.perfHudOpen ? [renderLandingPerfHudOverlay(model, currentCtx, i18n)] : []),
        ];
        return overlays.length === 0
          ? landing
          : compositeSurface(landing, overlays, { dim: model.landingQuitConfirmOpen });
      }
      const docs = explorer.view(model.docsModel);
      if (!model.themeInspectorOpen) return docs;
      const docsSurface = normalizeViewOutput(docs, {
        width: model.columns,
        height: model.rows,
      }).surface;
      return compositeSurface(docsSurface, [renderThemeInspectorDrawer(model, currentCtx, localization)]);
    },

    routeRuntimeIssue(issue) {
      const routed = explorer.routeRuntimeIssue?.(issue);
      return routed === undefined ? undefined : { type: 'docs', msg: routed as ExplorerMsg };
    },
  };
}

function applyRootFrameTimingSnapshot(
  model: RootModel,
  snapshot: FrameTimingSnapshot,
): RootModel {
  const docsModel = model.docsModel;
  if (
    docsModel.frameTimeMs === snapshot.frameTimeMs
    && docsModel.viewTimeMs === snapshot.viewTimeMs
    && docsModel.diffTimeMs === snapshot.diffTimeMs
    && docsModel.frameBudgetMs === snapshot.frameBudgetMs
    && docsModel.frameOverBudget === snapshot.frameOverBudget
  ) {
    return model;
  }

  return {
    ...model,
    docsModel: {
      ...docsModel,
      frameTimeMs: snapshot.frameTimeMs,
      viewTimeMs: snapshot.viewTimeMs,
      diffTimeMs: snapshot.diffTimeMs,
      frameBudgetMs: snapshot.frameBudgetMs,
      frameOverBudget: snapshot.frameOverBudget,
    },
  };
}

function resolveRootFrameBudgetMs(ctx: BijouContext): number | undefined {
  const refreshRate = ctx.runtime.refreshRate;
  if (!Number.isFinite(refreshRate) || refreshRate <= 0) return undefined;
  return 1_000 / refreshRate;
}

export async function runDocsApp(
  ctx: BijouContext,
  options: DocsAppOptions = {},
  runOptions: RunOptions<RootMsg> = {},
): Promise<void> {
  const app = createDocsApp(ctx, options);
  const runtimeCtx = runOptions.ctx ?? ctx;
  const frameBudgetMs = resolveRootFrameBudgetMs(runtimeCtx);
  let pendingTimingSnapshot: FrameTimingSnapshot | undefined;
  let needsTimingHydrationRender = true;

  await runWithLifecycleHooks(app, {
    ...runOptions,
    ctx: runtimeCtx,
  }, {
    beforeRender(model) {
      if (pendingTimingSnapshot == null) return model;
      return applyRootFrameTimingSnapshot(model, pendingTimingSnapshot);
    },
    afterRender({ timings }: { timings: readonly RenderStageTiming[] }) {
      pendingTimingSnapshot = summarizeFrameTimings(timings, frameBudgetMs);
      if (!needsTimingHydrationRender) return;
      needsTimingHydrationRender = false;
      return { requestRender: true };
    },
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'family';
}

function formatFamilyRow(options: {
  readonly row: RowDescriptor;
  readonly focused: boolean;
  readonly selectedStoryId?: string;
  readonly expandedFamilies: Readonly<Record<string, boolean>>;
  readonly ctx: BijouContext;
  readonly theme: LandingThemeTokens;
}): string {
  const { row, focused, selectedStoryId, expandedFamilies, ctx, theme } = options;
  const accentToken = docsThemeAccentToken(theme);
  const mutedToken = docsThemeMutedBorderToken(theme);
  if (row.kind === 'family') {
    const family = STORY_FAMILIES.find((candidate) => candidate.id === row.familyId);
    if (family == null) return '';
    const expanded = expandedFamilies[row.familyId] ?? false;
    const focusPrefix = focused
      ? ctx.style.styled(accentToken as any, '›')
      : ' ';
    const arrow = ctx.style.styled(accentToken as any, expanded ? '▼' : '▶');
    const title = focused
      ? ctx.style.styled(accentToken as any, family.label)
      : family.label;
    return `${focusPrefix} ${arrow} ${title}`;
  }

  const story = row.storyId == null ? undefined : findComponentStory(row.storyId);
  if (story == null) return '';
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
  return `${focusPrefix}   ${bullet} ${title}`;
}

function formatGuideRow(options: {
  readonly item: { readonly label: string; readonly value: string; readonly description?: string };
  readonly focused: boolean;
  readonly selectedGuideId?: string;
  readonly ctx: BijouContext;
  readonly theme: LandingThemeTokens;
}): string {
  const { item, focused, selectedGuideId, ctx, theme } = options;
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
  return `${focusPrefix} ${bullet} ${title}`;
}

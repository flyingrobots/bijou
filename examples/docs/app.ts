import { readFileSync } from 'node:fs';
import {
  boxSurface,
  createSurface,
  inspector,
  markdown,
  progressBar,
  separatorSurface,
  standardBlocks,
  wrapToWidth,
  type BijouContext,
  type BlockDefinition,
  type Surface,
  type TextModifier,
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
  renderShellQuitOverlay,
  shouldUseShellQuitConfirm,
  summarizeFrameTimings,
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
import { resolveDogfoodDocsCoverage } from './coverage.js';
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
  localizedText,
} from './localization.js';
import {
  applyCounterDemoIntent,
  counterDemoBlock,
  counterDemoDocumentationText,
  counterDemoIntentForAction,
  createCounterDemoModel,
  tickCounterDemoModel,
  type CounterDemoIntentAction,
  type CounterDemoModel,
} from './counter-block-demo.js';
import {
  DOGFOOD_RELEASE_TITLE_GALLERY,
  type DogfoodReleaseTitle,
  dogfoodReleaseTitleMarkdown,
} from './release-title.js';
import { COMPONENT_STORIES, findComponentStory } from './stories.js';
import {
  documentationArticleBlock,
  footerHintBlock,
  guideInspectorBlock,
  navigationListBlock,
  searchPanelBlock,
} from './dogfood-blocks.js';
import { formatFamilyRow, formatGuideRow } from './app-row-format.js';
import { countMarkdownHeadings, readMarkdownDoc, readMarkdownDocExcerpt } from './app-markdown.js';
import {
  createLandingRenderer,
  landingQualityModeLabel,
  landingQualitySettingDescription,
  landingQualitySettingValue,
  LANDING_THEME_COUNT,
  nextLandingQualityMode,
  nextLandingThemeIndex,
  normalizeLandingThemeIndex,
  previousLandingQualityMode,
  renderLandingPerfHudOverlay,
  resolveLandingQualityMode,
  resolveLandingTheme,
  updateLandingFps,
  type LandingQualityMode,
  type LandingTextModifiers,
  type LandingThemeTokens,
  type LandingToastState,
} from './app-landing.js';
import {
  applyDocsShellThemeToContext as applyShellThemeStateToContext,
  createDocsShellThemeState,
  resolveDocsShellThemeById as resolveShellThemeStateById,
  resolveDocsVisualThemeByShellThemeId as resolveVisualThemeByShellThemeStateId,
  resolveLandingThemeIndexForShellThemeId as resolveLandingThemeIndexForShellThemeStateId,
} from './app-docs-shell-theme.js';
import {
  renderBlocksPreviewPane,
  renderCounterDemoPreviewPane,
  type BlockPreviewPaneChrome,
} from './app-block-preview-panes.js';
import { dogfoodSurfaceBlockInventoryMarkdown } from './app-dogfood-surface-block-docs.js';
import {
  docsThemeAccentToken,
  docsThemeBorderToken,
  docsThemeMutedBorderToken,
  docsThemePreferenceListTheme,
  docsThemeProgressTokens,
  docsThemeSurfaceToken,
  docsThemeUnfocusedGutterToken,
  resolveDocsThemeActiveHeaderTabToken,
} from './app-docs-theme-tokens.js';
import {
  standardBlockDocumentationText,
  standardBlockInventoryMarkdown,
  standardBlockLoweringMarkdown,
  standardBlockPreviewMarkdown,
} from './app-standard-block-docs.js';
import { dogfoodSafePairSummary } from './app-theme-diagnostics.js';
import {
  clampThemeInspectorScroll,
  resolveThemeInspectorScrollY,
  shouldCloseThemeInspector,
  shouldToggleThemeInspector,
  themeInspectorDrawerWidth,
  themeInspectorScrollTarget,
  themeInspectorViewportHeight,
} from './app-theme-inspector-state.js';
import { themeInspectorChromeTokens } from './app-theme-inspector-chrome.js';
import {
  renderThemeInspectorLine,
  renderThemeInspectorSummary,
  renderThemeInspectorUsageProof,
  themeInspectorCloseHint,
  themeInspectorReferenceHeader,
  themeInspectorTitle,
} from './app-theme-inspector-usage.js';
import { renderThemeLabPane } from './app-theme-lab.js';
import { updateThemeLabEditorFromKey, type ThemeLabEditorState } from './app-theme-lab-key-handling.js';
import { renderThemeTokenPalette } from './app-theme-token-palette.js';
export { DOGFOOD_THEME_SAFE_PAIRS } from './dogfood-shell-themes.js';
export { stripMarkdownFrontmatter } from './app-markdown.js';
export { resolveDocsThemeActiveHeaderTabToken } from './app-docs-theme-tokens.js';

const BIJOU_VERSION = readBijouPackageVersion();
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
const DOCS_FRAME_CHROME_ROWS = 2;
const DOCS_LAYOUT_VERTICAL_MARGIN_ROWS = 2;
const DOCS_FAMILY_SEPARATOR_ROWS = 1;

export { DOGFOOD_I18N_CATALOG, FRAME_I18N_CATALOG };

function readBijouPackageVersion(): string {
  const packageJson: unknown = JSON.parse(
    readFileSync(new URL('../../packages/bijou/package.json', import.meta.url), 'utf8'),
  );
  const version: unknown = typeof packageJson === 'object' && packageJson !== null
    ? Object.getOwnPropertyDescriptor(packageJson, 'version')?.value
    : undefined;
  if (typeof version === 'string') return version;
  throw new Error();
}

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
  readonly themeLabEditor?: ThemeLabEditorState;
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

interface RootMsg {
  readonly type: 'docs';
  readonly msg: FramedAppMsg<DocsMsg>;
}

interface PulseLikeMsg {
  readonly type: 'pulse';
  readonly dt: number;
}
type DocsMsg = ExplorerMsg | PulseLikeMsg;

const STORY_FAMILIES = buildStoryFamilies(COMPONENT_STORIES);
const DOGFOOD_DOCS_COVERAGE = resolveDogfoodDocsCoverage(COMPONENT_STORIES);
const DOCS_SITE_PAGES: readonly DocsPageSpec[] = Object.freeze([
  { id: GUIDES_PAGE_ID },
  { id: COMPONENTS_PAGE_ID },
  { id: BLOCKS_PAGE_ID },
  { id: PACKAGES_PAGE_ID },
  { id: PHILOSOPHY_PAGE_ID },
  { id: THEME_LAB_PAGE_ID },
  { id: RELEASE_PAGE_ID },
]);

function isDocsPageId(value: string): value is DocsPageId {
  return value === GUIDES_PAGE_ID
    || value === COMPONENTS_PAGE_ID
    || value === BLOCKS_PAGE_ID
    || value === PACKAGES_PAGE_ID
    || value === PHILOSOPHY_PAGE_ID
    || value === THEME_LAB_PAGE_ID
    || value === RELEASE_PAGE_ID;
}

const GUIDE_DOCS: readonly GuideDoc[] = Object.freeze([
  {
    id: 'start-here',
    pageId: GUIDES_PAGE_ID,
    title: 'start-here',
    summary: '',
    body: GUIDES_START_HERE_TEXT,
    localizedTitle: (localization) => dogfoodText(localization, 'docs.guides.startHere.title', 'Start Here'),
    localizedSummary: (localization) => dogfoodText(
      localization,
      'docs.guides.startHere.summary',
      'What Bijou is, what DOGFOOD is for, and how the docs map is now shaped.',
    ),
  },
  {
    id: 'navigate-dogfood',
    pageId: GUIDES_PAGE_ID,
    title: '',
    summary: '',
    body: GUIDES_NAVIGATE_DOGFOOD_TEXT,
    localizedTitle: (localization) => dogfoodText(localization, 'docs.guides.navigate.title', 'Navigate DOGFOOD'),
    localizedSummary: (localization) => dogfoodText(localization, 'docs.guides.navigate.summary', 'How to move between sections, panes, search, settings, and component stories.'),
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
      'Edit DOGFOOD theme colors with a live token graph, shell palettes, and token swatches.',
    ),
    localizedBody: (localization) => [
      `# ${dogfoodText(localization, 'themeLab.title', 'Theme Lab')}`,
      '',
      dogfoodText(
        localization,
        'themeLab.body.summary',
        'DOGFOOD exposes Bijou theme facts as an editable product surface: draft colors, live token graph, first-party presets, shell theme gallery, token swatches, and contrast diagnostics.',
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
const DIM_MODIFIERS: TextModifier[] = ['dim'];
const BOLD_MODIFIERS: TextModifier[] = ['bold'];
const DIM_STRIKETHROUGH_MODIFIERS: TextModifier[] = ['dim', 'strikethrough'];
const LANDING_TEXT_MODIFIERS: LandingTextModifiers = {
  dim: DIM_MODIFIERS,
  bold: BOLD_MODIFIERS,
  dimStrikethrough: DIM_STRIKETHROUGH_MODIFIERS,
};

const DOCS_SHELL_THEME_STATE = createDocsShellThemeState(LANDING_TEXT_MODIFIERS);

export function docsShellThemesForTesting() {
  return DOCS_SHELL_THEME_STATE.shellThemes;
}

const DOCS_SHELL_THEME_CHOICES = DOCS_SHELL_THEME_STATE.choices;
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
  return options.showMissingLocalizationMarkers ?? false;
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

const BLOCK_PREVIEW_PANE_CHROME: BlockPreviewPaneChrome = {
  resolvePaneInnerWidth,
  insetPaneSurface,
  themedSeparatorSurface,
  paragraphSurface,
};

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
  const body = doc.localizedBody?.(localization) ?? doc.body;
  if (localization !== undefined && shouldLabelEnglishSourceBody(doc, localization)) {
    return `${englishSourceDocumentationNotice(localization)}\n\n---\n\n${body}`;
  }
  return body;
}

function shouldLabelEnglishSourceBody(doc: GuideDoc, localization: LocalizationPort): boolean {
  return localization.locale !== DEFAULT_LOCALE.id
    && doc.localizedBody === undefined
    && doc.body.trim().length > 0;
}

function englishSourceDocumentationNotice(localization: LocalizationPort): string {
  return dogfoodText(
    localization,
    'docs.englishSourceNotice',
    'English-source documentation. This article has not been translated yet.',
  );
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
    story.docs.gracefulLowering.interactive,
    story.docs.gracefulLowering.static,
    story.docs.gracefulLowering.pipe,
    story.docs.gracefulLowering.accessible,
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
  const model: DocsExplorerModel = {
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
  return pageId === BLOCKS_PAGE_ID
    ? selectGuide(pageId, model, COUNTER_DEMO_BLOCK_GUIDE_ID)
    : model;
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
    return COUNTER_DEMO_BLOCK_GUIDE_ID;
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
  if (doc.id === BLOCK_PREVIEW_GUIDE_ID) {
    return model;
  }
  if (
    doc.id !== COUNTER_DEMO_BLOCK_GUIDE_ID
    && standardBlockForPreviewGuide(doc) === undefined
  ) {
    return model;
  }
  return selectGuide(pageId, model, doc.id);
}

function paragraphSurface(text: string, width: number): Surface {
  const wrapped = wrapToWidth(text, Math.max(1, width));
  return textSurface(wrapped.join('\n'), Math.max(1, width), Math.max(1, wrapped.length));
}

function mapDocsPageModels(
  docsModel: FrameModel<DocsExplorerModel>,
  transform: (pageModel: DocsExplorerModel, pageId: DocsPageId) => DocsExplorerModel,
): FrameModel<DocsExplorerModel> {
  let changed = false;
  const nextPageModels: Record<string, DocsExplorerModel> = {};

  for (const [pageId, pageModel] of Object.entries(docsModel.pageModels)) {
    if (!isDocsPageId(pageId)) continue;
    const nextPageModel = transform(pageModel, pageId);
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
  const nextIndex = normalizeLandingThemeIndex(index);
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

function resolveDocsShellThemeById(id: string | undefined) {
  return resolveShellThemeStateById(DOCS_SHELL_THEME_STATE, id);
}

function resolveLandingThemeIndexForShellThemeId(id: string | undefined): number {
  return resolveLandingThemeIndexForShellThemeStateId(DOCS_SHELL_THEME_STATE, id);
}

function resolveDocsVisualThemeByShellThemeId(id: string | undefined): LandingThemeTokens {
  return resolveVisualThemeByShellThemeStateId(DOCS_SHELL_THEME_STATE, id);
}

function applyDocsShellThemeToContext(ctx: BijouContext, themeId: string | undefined): BijouContext {
  return applyShellThemeStateToContext(DOCS_SHELL_THEME_STATE, ctx, themeId);
}

function renderThemeInspectorDrawer(
  model: RootModel,
  ctx: BijouContext,
  localization: LocalizationPort | undefined,
) {
  const activeTheme = resolveDocsShellThemeById(model.docsModel.activeShellThemeId);
  const visualTheme = resolveDocsVisualThemeByShellThemeId(model.docsModel.activeShellThemeId);
  const chrome = themeInspectorChromeTokens(activeTheme.theme, visualTheme);
  const drawerWidth = themeInspectorDrawerWidth(model.columns);
  const drawerHeight = Math.max(8, model.rows - 4);
  const bodyWidth = Math.max(1, drawerWidth - 4);
  const viewportHeight = Math.max(1, drawerHeight - 2);
  const body = column([
    renderThemeInspectorSummary(
      activeTheme.label,
      activeTheme.theme.name,
      dogfoodSafePairSummary(activeTheme.theme, localization),
      bodyWidth,
      localization,
      chrome,
    ),
    spacer(1, 1),
    renderThemeInspectorUsageProof(bodyWidth, localization, chrome),
    spacer(1, 1),
    renderThemeInspectorLine(
      themeInspectorReferenceHeader(localization),
      bodyWidth,
      chrome.heading,
    ),
    spacer(1, 1),
    renderThemeTokenPalette(activeTheme.theme, bodyWidth, localization, {
      chromeTheme: activeTheme.theme,
      chromeTokens: {
        group: chrome.heading,
        label: chrome.body,
        value: chrome.muted,
      },
    }),
    spacer(1, 1),
    renderThemeInspectorLine(
      themeInspectorCloseHint(localization),
      bodyWidth,
      chrome.muted,
    ),
  ]);
  const viewport = viewportSurface({
    width: bodyWidth,
    height: viewportHeight,
    content: body,
    scrollY: clampThemeInspectorScroll(
      model.rows,
      activeTheme.theme,
      model.themeInspectorScrollY,
    ),
    showScrollbar: true,
    scrollbarMode: 'overlay',
    scrollbarTrackCell: {
      char: '│',
      fg: chrome.scrollTrack.hex,
      bg: chrome.scrollTrack.bg,
      modifiers: chrome.scrollTrack.modifiers,
    },
    scrollbarThumbCell: {
      char: '█',
      fg: chrome.scrollThumb.hex,
      bg: chrome.scrollThumb.bg,
      modifiers: chrome.scrollThumb.modifiers,
    },
  });
  const surface = boxSurface(viewport, {
    title: themeInspectorTitle(localization),
    width: drawerWidth,
    borderToken: chrome.border,
    bgToken: chrome.surface,
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

function renderFamiliesPane(
  model: DocsExplorerModel,
  width: number,
  _height: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const body = browsableListSurface(model.familyState, {
    width: Math.max(1, paneWidth),
    showScrollbar: true,
    ctx,
    focusedRowOverflow: { mode: 'marquee', elapsedMs: model.previewTimeMs },
    renderItem: ({ item, focused }) => {
      const rowValue = typeof item.value === 'string' ? item.value : '';
      return formatFamilyRow({
        row: parseRowValue(rowValue),
        focused,
        selectedStoryId: model.selectedStoryId,
        expandedFamilies: model.expandedFamilies,
        ctx,
        tokens: {
          accent: docsThemeAccentToken(theme),
          muted: docsThemeMutedBorderToken(theme),
        },
        findFamily: (familyId) => STORY_FAMILIES.find((candidate) => candidate.id === familyId),
        findStory: findComponentStory,
      });
    },
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
    state: variant.initialState,
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
  _height: number,
  ctx: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
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
    ? proseSurface(navigationBlockResult.output, Math.max(1, paneWidth))
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
          tokens: {
            accent: docsThemeAccentToken(theme),
            muted: docsThemeMutedBorderToken(theme),
          },
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
      themedSeparatorSurface(
        dogfoodText(localization, 'docs.reader.separator', 'docs'),
        paneWidth,
        ctx,
        theme,
      ),
      spacer(1, 1),
      boxSurface(paragraphSurface(
        dogfoodText(
          localization,
          'docs.reader.unpublished',
          'This section does not have published docs yet.',
        ),
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
    return renderBlocksPreviewPane(standardBlock, width, ctx, theme, localization, BLOCK_PREVIEW_PANE_CHROME);
  }
  if (doc.id === COUNTER_DEMO_BLOCK_GUIDE_ID) {
    return renderCounterDemoPreviewPane(
      model.counterBlockDemo,
      width,
      ctx,
      theme,
      localization,
      BLOCK_PREVIEW_PANE_CHROME,
    );
  }
  if (doc.id === THEME_LAB_GUIDE_ID) {
    return renderThemeLabPane({
      width,
      ctx,
      landingTheme: theme,
      activeTheme: resolveDocsShellThemeById(model.activeShellThemeId),
      shellThemes: DOCS_SHELL_THEME_CHOICES,
      editorState: model.themeLabEditor,
      localization,
    });
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
  const articleBody = renderedArticle.output;

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
    : guideDocSummary(doc, localization);
  const currentPosture = (() => {
    switch (pageId) {
      case GUIDES_PAGE_ID:
        return dogfoodText(
          localization,
          'guide.info.posture.guides',
          'Reader-first orientation path for DOGFOOD with the repo documentation map.',
        );
      case COMPONENTS_PAGE_ID:
        return dogfoodText(
          localization,
          'guide.info.posture.components',
          'Component story exploration path for DOGFOOD.',
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
          content: renderedInspector.output,
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
  const pageId = isDocsPageId(model.activePageId) ? model.activePageId : GUIDES_PAGE_ID;
  const pageModel = model.pageModels[pageId];
  const shellHint = dogfoodText(
    localization,
    'docs.footer.shell',
    '? Help • / Search • F2 Settings • F10 Theme Inspector • q Quit',
  );
  if (!pageModel?.showHints) {
    return renderDocsFooterHint({
      controls: shellHint,
    });
  }

  const focusedPane = model.focusedPaneByPage[pageId];
  const story = pageModel.selectedStoryId == null ? undefined : findComponentStory(pageModel.selectedStoryId);
  const paneSwitch = dogfoodText(localization, 'docs.footer.paneSwitch', 'Tab next pane');
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
          if (pageId === THEME_LAB_PAGE_ID && pageModel.selectedGuideId === THEME_LAB_GUIDE_ID) {
            return dogfoodText(
              localization,
              'docs.footer.themeLabEditor',
              '{paneSwitch} • [/] color • r/g/b channel • -/+ nudge • 0 reset',
              { paneSwitch },
            );
          }
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
        case undefined:
          return undefined;
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
      case undefined:
        return undefined;
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
  return footerHintBlock.render({
    config,
    mode: 'pipe',
  }).output;
}

function renderDocsSearchTitle(title: string): string {
  return searchPanelBlock.render({
    config: { title },
    mode: 'accessible',
  }).output;
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
    title: dogfoodText(localization, 'docs.title', 'Bijou Docs'),
    defaultPageId: options.initialPageId ?? GUIDES_PAGE_ID,
    headerStyle: ({ pageModel }) => ({
      activeTabToken: resolveDocsThemeActiveHeaderTabToken(resolveDocsVisualThemeByShellThemeId(pageModel.activeShellThemeId)),
    }),
    initialColumns: ctx.runtime.columns,
    initialRows: ctx.runtime.rows,
    helpLineSource: ({ model }) => buildDocsFooterHint(model, localization),
    shellThemes: DOCS_SHELL_THEME_STATE.shellThemes,
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
              case 'guide-next':
              case 'guide-prev':
              case 'guide-page-down':
              case 'guide-page-up':
              case 'activate-guide':
              case 'activate-guide-index':
              case 'select-guide':
              case 'counter-block-intent':
                return [model, []];
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
            case 'family-next':
            case 'family-prev':
            case 'family-page-down':
            case 'family-page-up':
            case 'activate-row':
            case 'activate-row-index':
            case 'expand-row':
            case 'collapse-row':
            case 'select-story':
            case 'select-variant':
            case 'variant-next':
            case 'variant-prev':
            case 'set-profile':
              return [model, []];
            default:
              return [model, []];
          }
        },
        inputAreas(model) {
          const guideInputArea: FrameInputArea<DocsExplorerModel, DocsMsg> = {
            paneId: 'guide-nav',
            keyMap: guidePaneKeys,
            helpSource: guidePaneKeys,
            mouse: ({ msg, rect }) => resolveGuidePaneMouse(msg, model, rect),
          };
          if (spec.id === BLOCKS_PAGE_ID && model.selectedGuideId === COUNTER_DEMO_BLOCK_GUIDE_ID) {
            return [
              {
                ...guideInputArea,
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
          return [guideInputArea];
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
    if (!isDocsPageId(pageId)) continue;
    const docsPageId = pageId;
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
    const fallbackFocusedPane = visiblePaneIds[0];
    const nextFocusedPane = previousFocusedPane != null && visiblePaneIds.includes(previousFocusedPane)
      ? previousFocusedPane
      : fallbackFocusedPane;
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
  const renderLanding = createLandingRenderer({
    getCtx: () => currentCtx,
    localization,
    textModifiers: LANDING_TEXT_MODIFIERS,
    versionText: VERSION_TEXT,
  });
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
          themeInspectorScrollY: clampThemeInspectorScroll(
            resizedModel.rows,
            resolveDocsShellThemeById(resizedModel.docsModel.activeShellThemeId).theme,
            resizedModel.themeInspectorScrollY,
          ),
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
            if (themeIndex < LANDING_THEME_COUNT) {
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
          const scrollTarget = themeInspectorScrollTarget(msg, themeInspectorViewportHeight(model.rows));
          if (scrollTarget !== undefined) {
            const nextScrollY = resolveThemeInspectorScrollY(
              model.themeInspectorScrollY,
              scrollTarget,
              model.rows,
              resolveDocsShellThemeById(model.docsModel.activeShellThemeId).theme,
            );
            return [{
              ...model,
              themeInspectorScrollY: clampThemeInspectorScroll(
                model.rows,
                resolveDocsShellThemeById(model.docsModel.activeShellThemeId).theme,
                nextScrollY,
              ),
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
        const themeLabEditDocsModel = updateThemeLabEditorFromKey(model.docsModel, msg, {
          pageId: THEME_LAB_PAGE_ID,
          guideId: THEME_LAB_GUIDE_ID,
          resolveShellThemeById: resolveDocsShellThemeById,
        });
        if (themeLabEditDocsModel !== undefined) {
          return [{ ...model, docsModel: themeLabEditDocsModel }, []];
        }
      }

      if (isKeyMsg(msg) || isMouseMsg(msg)) {
        const [nextModel, cmds] = updateExplorer(msg, model);
        return [nextModel, cmds];
      }

      const [nextModel, cmds] = updateExplorer(msg, model);
      return [nextModel, cmds];
    },

    view(model) {
      if (model.route === 'landing') {
        const landing = renderLanding(model);
        const overlays = [
          ...(model.landingQuitConfirmOpen ? [renderShellQuitOverlay(model.columns, model.rows)] : []),
          ...(model.docsModel.perfHudOpen ? [renderLandingPerfHudOverlay(model, { ctx: currentCtx, i18n })] : []),
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
      return routed === undefined ? undefined : { type: 'docs', msg: routed };
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

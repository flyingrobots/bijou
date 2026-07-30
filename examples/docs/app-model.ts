import type {
  FrameModel,
  FramedAppMsg,
} from '../../packages/bijou-tui/src/index.js';
import { createBrowsableListState } from '../../packages/bijou-tui/src/index.js';
import type {
  I18nCatalog,
  I18nDirection,
} from '../../packages/bijou-i18n/src/index.js';
import type {
  ComponentStory,
  StoryMode,
} from '../_stories/protocol.js';
import type { DogfoodLocalePort } from './locale.js';
import type {
  LandingQualityMode,
  LandingToastState,
} from './app-landing.js';
import type {
  CounterDemoIntentAction,
  CounterDemoModel,
} from './counter-block-demo.js';
import type { ThemeLabEditorState } from './app-theme-lab-key-handling.js';
import type { DocsLayoutVariant, DocsPageId } from './app-ids.js';

export interface StoryFamily {
  readonly id: string;
  readonly label: string;
  readonly stories: readonly ComponentStory[];
}

export interface RowDescriptor {
  readonly kind: 'family' | 'story';
  readonly id: string;
  readonly familyId: string;
  readonly storyId?: string;
}

export interface DocsExplorerModel {
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

export type ExplorerMsg =
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

export interface PulseLikeMsg {
  readonly type: 'pulse';
  readonly dt: number;
}

export type DocsMsg = ExplorerMsg | PulseLikeMsg;

export interface RootModel {
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

export interface RootMsg {
  readonly type: 'docs';
  readonly msg: FramedAppMsg<DocsMsg>;
}

export interface DocsAppOptions {
  readonly locale?: string;
  readonly localePort?: DogfoodLocalePort;
  readonly direction?: I18nDirection;
  readonly showMissingLocalizationMarkers?: boolean;
  readonly extraI18nCatalogs?: readonly I18nCatalog[];
  readonly initialRoute?: RootModel['route'];
  readonly initialPageId?: DocsPageId;
  readonly initialSelectedStoryId?: string;
}

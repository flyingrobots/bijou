import type {
  BijouContext,
  TokenValue,
} from '@flyingrobots/bijou';
import type { KeyMap } from '@flyingrobots/bijou-tui';
import type { SkeletonMsg } from './skeleton-contract.js';
import type {
  SkeletonStatusContext,
  SkeletonTab,
} from './skeleton-tab-contract.js';

/** Optional token overrides for shell chrome regions. */
export interface SkeletonThemeTokens {
  /** Header background token for non-tab space. */
  readonly headerBgToken?: TokenValue;
  /** Active tab token. */
  readonly activeTabToken?: TokenValue;
  /** Inactive tab token. */
  readonly inactiveTabToken?: TokenValue;
  /** Footer status-line token. */
  readonly footerStatusToken?: TokenValue;
  /** Footer controls-line token. */
  readonly footerControlsToken?: TokenValue;
  /** Separator row token. */
  readonly separatorToken?: TokenValue;
  /** Drawer border token. */
  readonly drawerBorderToken?: TokenValue;
  /** Drawer background token. */
  readonly drawerBgToken?: TokenValue;
  /** Quit modal border token. */
  readonly modalBorderToken?: TokenValue;
  /** Quit modal background token. */
  readonly modalBgToken?: TokenValue;
}

/**
 * Options for creating a batteries-included design-system shell starter.
 *
 * The scaffold is intentionally opinionated: tabs model peer destinations, the
 * drawer models supplemental work, the modal confirms quit, and footer rows
 * carry shell status and shortcut chrome.
 */
export interface CreateTuiAppSkeletonOptions {
  /** Bijou context for theme and style rendering. */
  readonly ctx: BijouContext;
  /** App title shown in the header line below tabs. */
  readonly title?: string;
  /** Tabs shown on the top row. Defaults to drawer and split pages. */
  readonly tabs?: readonly SkeletonTab[];
  /** Default tab id. Falls back to the first tab. */
  readonly defaultTabId?: string;
  /** Footer key legend for the controls row. */
  readonly keyLegend?: string;
  /** Footer status message, static or derived from the active tab. */
  readonly statusMessage?: string | ((ctx: SkeletonStatusContext) => string);
  /** Optional shell token overrides. */
  readonly themeTokens?: SkeletonThemeTokens;
  /** Extra global key bindings merged into skeleton defaults. */
  readonly globalKeys?: KeyMap<SkeletonMsg>;
}

import type { BijouContext } from '@flyingrobots/bijou';
import type { FrameOverlayContext } from '@flyingrobots/bijou-tui';
import type { SkeletonPageModel } from './skeleton-state-contract.js';
import type {
  SkeletonStatusContext,
  SkeletonTab,
} from './skeleton-tab-contract.js';
import type { SkeletonThemeTokens } from './skeleton-theme-contract.js';

/** Per-page configuration derived from the page spec. */
export interface SkeletonPageConfig {
  readonly hasDrawer: boolean;
  readonly drawerPaneId?: string;
}

/** A tab and its resolved built-in layout kind. */
export interface SkeletonPageSpec {
  readonly tab: SkeletonTab;
  readonly kind: 'drawer' | 'split' | 'empty' | 'custom';
}

/** Dependencies needed to assemble shell overlays. */
export interface SkeletonOverlayOptions {
  readonly frame: FrameOverlayContext<SkeletonPageModel>;
  readonly tabsById: ReadonlyMap<string, SkeletonTab>;
  readonly allTabs: readonly SkeletonTab[];
  readonly pageConfigs: ReadonlyMap<string, SkeletonPageConfig>;
  readonly title: string;
  readonly keyLegend: string;
  readonly statusMessage?: string | ((ctx: SkeletonStatusContext) => string);
  readonly tokens?: SkeletonThemeTokens;
  readonly ctx: BijouContext;
}

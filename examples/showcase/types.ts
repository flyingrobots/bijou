import type { BijouContext } from '@flyingrobots/bijou';
import type { BrowsableListState } from '@flyingrobots/bijou-tui';

/** A single component entry in the showcase registry. */
export interface ComponentEntry {
  /** Unique identifier (e.g. 'box', 'badge'). */
  readonly id: string;
  /** Display name (e.g. 'box() / headerBox()'). */
  readonly name: string;
  /** Short one-line description for the sidebar. */
  readonly subtitle: string;
  /** Longer markdown description for the detail pane. */
  readonly description: string;
  /** Demoing difficulty: 1=static, 2=embeddable interactive, 3=blocking/standalone. */
  readonly tier: 1 | 2 | 3;
  /** Package the component lives in. */
  readonly pkg: 'bijou' | 'bijou-tui' | 'bijou-tui-app';
  /** Render a demo of this component. Returns styled string output. */
  readonly render: (width: number, ctx: BijouContext) => string;
}

/** Shared page model used by all showcase category pages. */
export interface ShowcasePageModel {
  readonly listState: BrowsableListState<string>;
  readonly quitConfirmOpen: boolean;
  readonly drawerOpen: boolean;
  readonly drawerProgress: number;
}

/** Messages dispatched by the showcase app. */
export type ShowcaseMsg =
  | { type: 'nav-next' }
  | { type: 'nav-prev' }
  | { type: 'nav-page-down' }
  | { type: 'nav-page-up' }
  | { type: 'request-quit' }
  | { type: 'confirm-quit' }
  | { type: 'cancel-quit' }
  | { type: 'force-quit' }
  | { type: 'toggle-drawer' }
  | { type: 'drawer-progress'; value: number };

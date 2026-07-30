import type { BijouContext, TokenValue } from '@flyingrobots/bijou';
import type {
  CommandPaletteItem,
  CommandPaletteState,
} from './command-palette.js';
import type { FrameAction } from './app-frame-action-types.js';
import type { PanelDockState } from './panel-dock.js';
import type { PanelVisibilityState } from './panel-state.js';
import type { PageTransition } from './app-frame-transition-contract.js';

export type PaletteKind = 'command' | 'search';

export interface FramePaneScroll {
  readonly x: number;
  readonly y: number;
}

/** Runtime model owned by the frame. */
export interface FrameModel<PageModel> {
  readonly activePageId: string;
  readonly activeShellThemeId?: string;
  readonly pageOrder: readonly string[];
  readonly pageModels: Readonly<Record<string, PageModel>>;
  readonly focusedPaneByPage: Readonly<Record<string, string | undefined>>;
  readonly scrollByPage: Readonly<
    Record<string, Readonly<Record<string, FramePaneScroll>>>
  >;
  readonly columns: number;
  readonly rows: number;
  readonly frameTimeMs: number;
  readonly viewTimeMs: number;
  readonly diffTimeMs: number;
  readonly frameBudgetMs?: number;
  readonly frameOverBudget: boolean;
  readonly perfHudOpen: boolean;
  readonly helpOpen: boolean;
  readonly footerVisible?: boolean;
  readonly footerTranslateY?: number;
  readonly footerAnimationGeneration?: number;
  readonly commandPalette?: CommandPaletteState;
  readonly commandPaletteKind?: 'command' | 'search';
  readonly settingsOpen: boolean;
  readonly notificationCenterOpen: boolean;
  readonly quitConfirmOpen: boolean;
  readonly settingsFocusIndex: number;
  readonly settingsScrollY: number;
  readonly notificationCenterScrollY: number;
  readonly previousPageId?: string;
  readonly transitionProgress: number;
  readonly transitionGeneration: number;
  readonly activeTransition?: PageTransition;
  readonly transitionStartMs?: number;
  readonly transitionTimeline?: import('./timeline.js').Timeline;
  readonly transitionTimelineState?: import('./timeline.js').TimelineState;
  readonly transitionFrame: number;
  readonly minimizedByPage: Readonly<
    Record<string, import('./panel-state.js').PanelVisibilityState>
  >;
  readonly maximizedPaneByPage: Readonly<
    Record<string, import('./panel-state.js').PanelMaximizeState>
  >;
  readonly dockStateByPage: Readonly<
    Record<string, import('./panel-dock.js').PanelDockState>
  >;
  readonly splitRatioOverrides: Readonly<
    Record<string, Readonly<Record<string, number>>>
  >;
  readonly runtimeNotifications: import('./notification.js').NotificationState<never>;
  readonly runtimeNotificationHistoryFilter: import('./notification.js').NotificationHistoryFilter;
  readonly runtimeNotificationLoopActive: boolean;
}

export interface InternalFrameModel<
  PageModel,
  Msg,
> extends FrameModel<PageModel> {
  readonly commandPaletteEntries?: readonly PaletteEntry<Msg>[];
  readonly commandPaletteTitle?: string;
  readonly commandPaletteKind?: PaletteKind;
  readonly helpScrollY: number;
  readonly warnedFrameKeyCollisionPages: Readonly<Record<string, true>>;
}

export interface PaletteEntry<Msg> {
  readonly id: string;
  readonly item: CommandPaletteItem;
  readonly msgAction?: Msg;
  readonly targetPageId?: string;
  readonly frameAction?: FrameAction;
}

export interface RenderContext<PageModel, Msg> {
  readonly model: InternalFrameModel<PageModel, Msg>;
  readonly pageId: string;
  readonly focusedPaneId: string | undefined;
  readonly scrollByPane: Readonly<
    Record<string, { readonly x: number; readonly y: number }>
  >;
  readonly visibility: PanelVisibilityState;
  readonly dockState: PanelDockState;
  readonly frameBackgroundToken: TokenValue | undefined;
  readonly ctx?: BijouContext;
}

export interface RenderResult {
  readonly surface: import('@flyingrobots/bijou').Surface;
  readonly paneRects: ReadonlyMap<
    string,
    import('./layout-rect.js').LayoutRect
  >;
  readonly paneOrder: readonly string[];
}

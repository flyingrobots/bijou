/**
 * Shared types and message utilities for `app-frame.ts`.
 *
 * This module contains the public framed-app message wrappers plus the
 * internal wiring used by `createFramedApp`.
 */

import type { CommandPaletteItem } from './command-palette.js';
import type { App, Cmd, KeyMsg, MouseMsg, PulseMsg } from './types.js';
import { QUIT, isCmdCleanup } from './types.js';
import type { BindingInfo } from './keybindings.js';
import type { PanelVisibilityState } from './panel-state.js';
import type { PanelDockState } from './panel-dock.js';
import type { FrameModel } from './app-frame.js';
import type { BijouContext, TokenValue } from '@flyingrobots/bijou';

// ---------------------------------------------------------------------------
// Symbols
// ---------------------------------------------------------------------------

export const PAGE_MSG_TOKEN = Symbol('app-frame-page-msg');
export const FRAME_MSG_TOKEN = Symbol('app-frame-frame-msg');

export type PaletteKind = 'command' | 'search';

// ---------------------------------------------------------------------------
// Public message contracts
// ---------------------------------------------------------------------------

/** Message type delivered to a framed page update. */
export type FramePageMsg<Msg> = Msg | MouseMsg | PulseMsg;

/** Typed tuple returned by framed pages from `init()` and `update()`. */
export type FramePageUpdateResult<PageModel, Msg> = [PageModel, Cmd<Msg>[]];

/** Wrapper that tags a user message with its originating page ID. */
export interface PageScopedMsg<Msg> {
  readonly [PAGE_MSG_TOKEN]: true;
  readonly pageId: string;
  readonly msg: FramePageMsg<Msg>;
}

/** Wrapper that tags a frame-internal action for the update loop. */
export interface FrameScopedMsg {
  readonly [FRAME_MSG_TOKEN]: true;
  readonly action: FrameAction;
}

/** Public custom-message type carried by a framed app. */
export type FramedAppMsg<Msg> = Msg | PageScopedMsg<Msg> | FrameScopedMsg;

/** Typed update tuple returned by a framed app. */
export type FramedAppUpdateResult<PageModel, Msg> = [FrameModel<PageModel>, Cmd<FramedAppMsg<Msg>>[]];

/** Fully typed `App` contract returned by `createFramedApp()`. */
export type FramedApp<PageModel, Msg> = App<FrameModel<PageModel>, FramedAppMsg<Msg>>;

// ---------------------------------------------------------------------------
// Internal model
// ---------------------------------------------------------------------------

/** Internal model extending the public FrameModel with palette entries. */
export interface InternalFrameModel<PageModel, Msg> extends FrameModel<PageModel> {
  readonly commandPaletteEntries?: readonly PaletteEntry<Msg>[];
  readonly commandPaletteTitle?: string;
  readonly commandPaletteKind?: PaletteKind;
  readonly helpScrollY: number;
}

/** A command palette entry linking a UI item to an action or message. */
export interface PaletteEntry<Msg> {
  readonly id: string;
  readonly item: CommandPaletteItem;
  readonly msgAction?: Msg;
  readonly targetPageId?: string;
  readonly frameAction?: FrameAction;
}

/** Per-call context passed through the recursive layout renderer. */
export interface RenderContext<PageModel, Msg> {
  readonly model: InternalFrameModel<PageModel, Msg>;
  readonly pageId: string;
  readonly focusedPaneId: string | undefined;
  readonly scrollByPane: Readonly<Record<string, { readonly x: number; readonly y: number }>>;
  readonly visibility: PanelVisibilityState;
  readonly dockState: PanelDockState;
  readonly frameBackgroundToken: TokenValue | undefined;
  readonly ctx?: BijouContext;
}

/** Output of a layout node render pass. */
export interface RenderResult {
  readonly surface: import('@flyingrobots/bijou').Surface;
  readonly paneRects: ReadonlyMap<string, import('./layout-rect.js').LayoutRect>;
  readonly paneOrder: readonly string[];
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** Discriminated union of all frame-level actions (tabs, panes, scroll, palette, help, transitions). */
export type FrameAction =
  | { type: 'toggle-help' }
  | { type: 'toggle-settings' }
  | { type: 'toggle-notifications' }
  | { type: 'prev-tab' }
  | { type: 'next-tab' }
  | { type: 'next-pane' }
  | { type: 'prev-pane' }
  | { type: 'scroll-up' }
  | { type: 'scroll-down' }
  | { type: 'page-up' }
  | { type: 'page-down' }
  | { type: 'top' }
  | { type: 'bottom' }
  | { type: 'scroll-left' }
  | { type: 'scroll-right' }
  | { type: 'open-search' }
  | { type: 'open-palette' }
  | { type: 'toggle-minimize' }
  | { type: 'toggle-maximize' }
  | { type: 'dock-up' }
  | { type: 'dock-down' }
  | { type: 'dock-left' }
  | { type: 'dock-right' }
  | { type: 'runtime-issue'; issue: RuntimeIssue }
  | { type: 'notification-tick'; atMs: number }
  | { type: 'transition'; progress: number; generation: number; dt: number; elapsedMs: number }
  | { type: 'transition-complete'; generation: number };

// ---------------------------------------------------------------------------
// Shell commands — plain facts emitted by routing handlers, interpreted
// inside createFramedApp via a handler table.  The buffer holds data,
// not code.
// ---------------------------------------------------------------------------

/** Route label for the key-observation callback. */
export type ObservedKeyRoute =
  | 'palette'
  | 'help'
  | 'frame'
  | 'page'
  | 'global'
  | 'unhandled';

/**
 * Discriminated union of every shell mutation or command emission that
 * routing handlers can produce.  Each variant is a plain fact describing
 * WHAT should happen, not HOW.
 */
export type FrameShellCommand<Msg> =
  // --- overlay lifecycle ---
  | { readonly type: 'close-help' }
  | { readonly type: 'close-settings' }
  | { readonly type: 'close-notification-center' }
  | { readonly type: 'close-palette' }
  | { readonly type: 'close-quit-confirm' }
  | { readonly type: 'open-help' }
  | { readonly type: 'open-quit-confirm' }
  | { readonly type: 'open-search-palette' }
  | { readonly type: 'open-command-palette' }
  // --- settings ---
  | { readonly type: 'settings-focus-move'; readonly delta: number }
  | { readonly type: 'settings-scroll'; readonly delta: number }
  | { readonly type: 'settings-scroll-to'; readonly position: 'top' | 'bottom' }
  | { readonly type: 'activate-settings-row'; readonly rowIndex: number }
  // --- notification center ---
  | { readonly type: 'notification-center-scroll'; readonly delta: number }
  | { readonly type: 'notification-center-scroll-to'; readonly position: 'top' | 'bottom' }
  | { readonly type: 'cycle-notification-filter' }
  // --- help ---
  | { readonly type: 'help-scroll'; readonly action: 'up' | 'down' | 'page-up' | 'page-down' | 'top' | 'bottom' }
  // --- workspace ---
  | { readonly type: 'focus-pane'; readonly paneId: string }
  | { readonly type: 'scroll-focused-pane'; readonly direction: 'up' | 'down' }
  | { readonly type: 'switch-tab'; readonly delta: number }
  // --- delegation to existing reducers ---
  | { readonly type: 'apply-frame-action'; readonly action: FrameAction }
  | { readonly type: 'palette-key'; readonly msg: KeyMsg }
  // --- TEA command emissions ---
  | { readonly type: 'emit-page-msg'; readonly pageId: string; readonly msg: Msg | MouseMsg }
  | { readonly type: 'emit-global-msg'; readonly msg: Msg }
  | { readonly type: 'quit' }
  | { readonly type: 'dismiss-notification'; readonly notificationId: number }
  // --- observation ---
  | { readonly type: 'observed-key'; readonly msg: KeyMsg; readonly route: ObservedKeyRoute };

/** Discriminated union of command palette navigation/selection actions. */
export type PaletteAction =
  | { type: 'cp-next' }
  | { type: 'cp-prev' }
  | { type: 'cp-page-down' }
  | { type: 'cp-page-up' }
  | { type: 'cp-select' }
  | { type: 'cp-close' };

// ---------------------------------------------------------------------------
// Message wrappers
// ---------------------------------------------------------------------------

/** Type guard: is this message a frame-internal action wrapper? */
export function isFrameScopedMsg(value: unknown): value is FrameScopedMsg {
  return typeof value === 'object'
    && value !== null
    && FRAME_MSG_TOKEN in value
    && (value as FrameScopedMsg)[FRAME_MSG_TOKEN] === true;
}

/** Wrap a frame action into a FrameScopedMsg for the update loop. */
export function wrapFrameMsg(action: FrameAction): FrameScopedMsg {
  return {
    [FRAME_MSG_TOKEN]: true,
    action,
  };
}

/** Type guard: is this message a page-scoped wrapper? */
export function isPageScopedMsg<Msg>(value: unknown): value is PageScopedMsg<Msg> {
  return typeof value === 'object'
    && value !== null
    && PAGE_MSG_TOKEN in value
    && (value as PageScopedMsg<Msg>)[PAGE_MSG_TOKEN] === true;
}

/** Tag a page-bound message with its originating page ID. */
export function wrapPageMsg<Msg>(pageId: string, msg: FramePageMsg<Msg>): PageScopedMsg<Msg> {
  return {
    [PAGE_MSG_TOKEN]: true,
    pageId,
    msg,
  };
}

/** Create a command that immediately resolves with the given message. */
export function emitMsg<Msg>(msg: Msg): Cmd<FramedAppMsg<Msg>> {
  return async (_emit, _caps) => msg;
}

/** Create a command that emits a page-scoped message. */
export function emitMsgForPage<Msg>(pageId: string, msg: FramePageMsg<Msg>): Cmd<FramedAppMsg<Msg>> {
  return async (_emit, _caps) => wrapPageMsg(pageId, msg);
}

/** Wrap a page-level command so its emitted messages are tagged with the page ID. */
export function wrapCmdForPage<Msg>(pageId: string, cmd: Cmd<Msg>): Cmd<FramedAppMsg<Msg>> {
  return async (emit, caps) => {
    const result = await cmd((msg) => emit(wrapPageMsg(pageId, msg)), caps);
    if (result === undefined || result === QUIT) return result;
    if (isCmdCleanup(result)) return result;
    return wrapPageMsg(pageId, result);
  };
}

/** Convert a binding's key combo into a synthetic KeyMsg for dispatch. */
export function comboToMsg(binding: BindingInfo): KeyMsg {
  return {
    type: 'key',
    key: binding.combo.key,
    ctrl: binding.combo.ctrl,
    alt: binding.combo.alt,
    shift: binding.combo.shift,
  };
}
import type { RuntimeIssue } from './types.js';

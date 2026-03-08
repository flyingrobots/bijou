/**
 * Internal types and message utilities for `app-frame.ts`.
 *
 * These types are NOT part of the public API surface — they support
 * the internal wiring of `createFramedApp`.
 */

import type { CommandPaletteItem } from './command-palette.js';
import type { KeyMsg, Cmd } from './types.js';
import { QUIT } from './types.js';
import type { BindingInfo } from './keybindings.js';
import type { PanelVisibilityState } from './panel-state.js';
import type { PanelDockState } from './panel-dock.js';
import type { FrameModel } from './app-frame.js';

// ---------------------------------------------------------------------------
// Symbols
// ---------------------------------------------------------------------------

export const PAGE_MSG_TOKEN = Symbol('app-frame-page-msg');
export const FRAME_MSG_TOKEN = Symbol('app-frame-frame-msg');

// ---------------------------------------------------------------------------
// Internal model
// ---------------------------------------------------------------------------

/** Internal model extending the public FrameModel with palette entries. */
export interface InternalFrameModel<PageModel, Msg> extends FrameModel<PageModel> {
  readonly commandPaletteEntries?: readonly PaletteEntry<Msg>[];
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
}

/** Output of a layout node render pass. */
export interface RenderResult {
  readonly output: string;
  readonly paneRects: ReadonlyMap<string, import('./layout-rect.js').LayoutRect>;
  readonly paneOrder: readonly string[];
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** Discriminated union of all frame-level actions (tabs, panes, scroll, palette, help, transitions). */
export type FrameAction =
  | { type: 'toggle-help' }
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
  | { type: 'open-palette' }
  | { type: 'toggle-minimize' }
  | { type: 'toggle-maximize' }
  | { type: 'dock-up' }
  | { type: 'dock-down' }
  | { type: 'dock-left' }
  | { type: 'dock-right' }
  | { type: 'transition'; progress: number; generation: number }
  | { type: 'transition-complete'; generation: number };

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

/** Wrapper that tags a user message with its originating page ID. */
export interface PageScopedMsg<Msg> {
  readonly [PAGE_MSG_TOKEN]: true;
  readonly pageId: string;
  readonly msg: Msg;
}

/** Wrapper that tags a frame-internal action for the update loop. */
export interface FrameScopedMsg {
  readonly [FRAME_MSG_TOKEN]: true;
  readonly action: FrameAction;
}

// ---------------------------------------------------------------------------
// Message utility functions
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

/** Tag a user message with its originating page ID. */
export function wrapPageMsg<Msg>(pageId: string, msg: Msg): Msg {
  return {
    [PAGE_MSG_TOKEN]: true,
    pageId,
    msg,
  } as unknown as Msg;
}

/** Create a command that immediately resolves with the given message. */
export function emitMsg<Msg>(msg: Msg): Cmd<Msg> {
  return () => Promise.resolve(msg);
}

/** Create a command that emits a page-scoped message. */
export function emitMsgForPage<Msg>(pageId: string, msg: Msg): Cmd<Msg> {
  return async () => wrapPageMsg(pageId, msg);
}

/** Wrap a page-level command so its emitted messages are tagged with the page ID. */
export function wrapCmdForPage<Msg>(pageId: string, cmd: Cmd<Msg>): Cmd<Msg> {
  return async (emit) => {
    const result = await cmd((msg) => emit(wrapPageMsg(pageId, msg) as unknown as Msg));
    if (result === undefined || result === QUIT) return result;
    return wrapPageMsg(pageId, result as Msg);
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

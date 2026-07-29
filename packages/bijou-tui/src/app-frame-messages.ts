/**
 * Message utilities and compatibility exports for `app-frame.ts`.
 *
 * This module contains the public framed-app message wrappers plus the
 * internal wiring used by `createFramedApp`.
 */

import type { Cmd, KeyMsg } from './types.js';
import { QUIT, isCmdCleanup } from './types.js';
import type { BindingInfo } from './keybindings.js';
import type {
  FrameAction,
  FrameNotificationSpec,
} from './app-frame-action-types.js';
import {
  FRAME_MSG_TOKEN,
  PAGE_MSG_TOKEN,
  type FramePageMsg,
  type FrameScopedMsg,
  type FramedAppMsg,
  type PageScopedMsg,
} from './app-frame-contracts.js';

// ---------------------------------------------------------------------------
// Message wrappers
// ---------------------------------------------------------------------------

/** Type guard: is this message a frame-internal action wrapper? */
export function isFrameScopedMsg(value: unknown): value is FrameScopedMsg {
  return (
    typeof value === 'object' &&
    value !== null &&
    FRAME_MSG_TOKEN in value &&
    Reflect.get(value, FRAME_MSG_TOKEN) === true
  );
}

/** Wrap a frame action into a FrameScopedMsg for the update loop. */
export function wrapFrameMsg(action: FrameAction): FrameScopedMsg {
  return {
    [FRAME_MSG_TOKEN]: true,
    action,
  };
}

/** Create a page command that emits a frame-scoped action back to the shell. */
export function emitFrameAction<Msg>(
  action: FrameAction,
): Cmd<Msg | FrameScopedMsg> {
  return () => wrapFrameMsg(action);
}

/** Create a page command that pushes a frame-managed transient notification. */
export function notify<Msg>(
  notification: FrameNotificationSpec,
): Cmd<Msg | FrameScopedMsg> {
  return emitFrameAction<Msg>({ type: 'push-notification', notification });
}

/** Type guard: is this message a page-scoped wrapper? */
export function isPageScopedMsg<Msg>(
  value: unknown,
): value is PageScopedMsg<Msg> {
  return (
    typeof value === 'object' &&
    value !== null &&
    PAGE_MSG_TOKEN in value &&
    Reflect.get(value, PAGE_MSG_TOKEN) === true
  );
}

/** Tag a page-bound message with its originating page ID. */
export function wrapPageMsg<Msg>(
  pageId: string,
  msg: FramePageMsg<Msg>,
): PageScopedMsg<Msg> {
  return {
    [PAGE_MSG_TOKEN]: true,
    pageId,
    msg,
  };
}

/** Create a command that immediately resolves with the given message. */
export function emitMsg<Msg>(msg: Msg): Cmd<FramedAppMsg<Msg>> {
  return () => msg;
}

/** Create a command that emits a page-scoped message. */
export function emitMsgForPage<Msg>(
  pageId: string,
  msg: FramePageMsg<Msg>,
): Cmd<FramedAppMsg<Msg>> {
  return () => wrapPageMsg(pageId, msg);
}

/** Wrap a page-level command so its emitted messages are tagged with the page ID. */
export function wrapCmdForPage<Msg>(
  pageId: string,
  cmd: Cmd<Msg | FrameScopedMsg>,
): Cmd<FramedAppMsg<Msg>> {
  return async (emit, caps) => {
    const result = await cmd((msg) => {
      if (isFrameScopedMsg(msg)) {
        emit(msg);
        return;
      }
      emit(wrapPageMsg(pageId, msg));
    }, caps);
    if (result === undefined || result === QUIT) return result;
    if (isCmdCleanup(result)) return result;
    if (isFrameScopedMsg(result)) return result;
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

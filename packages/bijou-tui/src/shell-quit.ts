import { resolveSafeCtx, stringToSurface, type BijouContext } from '@flyingrobots/bijou';
import { modal, type Overlay } from './overlay.js';
import type { KeyMsg } from './types.js';
import type { I18nRuntime } from '@flyingrobots/bijou-i18n';
import { frameMessage } from './app-frame-i18n.js';

export type ShellQuitPolicy = 'confirm' | 'immediate';

export function resolveShellQuitPolicy(ctx?: Pick<BijouContext, 'mode'>): ShellQuitPolicy {
  return (ctx ?? resolveSafeCtx())?.mode === 'pipe' ? 'immediate' : 'confirm';
}

export function shouldUseShellQuitConfirm(ctx?: Pick<BijouContext, 'mode'>): boolean {
  return resolveShellQuitPolicy(ctx) === 'confirm';
}

export function isShellQuitRequest(msg: KeyMsg): boolean {
  if (msg.alt) return false;
  if (msg.ctrl) return msg.key === 'c';
  return !msg.shift && (msg.key === 'q' || msg.key === 'escape');
}

export function isShellQuitConfirmAccept(msg: KeyMsg): boolean {
  return !msg.ctrl && !msg.alt && !msg.shift && (msg.key === 'y' || msg.key === 'enter');
}

export function isShellQuitConfirmDismiss(msg: KeyMsg): boolean {
  return !msg.ctrl && !msg.alt && !msg.shift && (msg.key === 'n' || msg.key === 'escape' || msg.key === 'q');
}

export function renderShellQuitOverlay(
  screenWidth: number,
  screenHeight: number,
  i18n?: I18nRuntime,
): Overlay {
  const title = frameMessage(i18n, 'quit.title', 'Quit?');
  const bodyText = frameMessage(i18n, 'quit.body', 'Quit this app?\n\nY quit • N stay');
  const hint = frameMessage(i18n, 'quit.footer', 'Y quit • N stay');
  return modal({
    title,
    body: stringToSurface(bodyText, 20, 3),
    hint,
    width: 24,
    screenWidth,
    screenHeight,
  });
}

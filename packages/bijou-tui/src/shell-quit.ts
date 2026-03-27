import { resolveSafeCtx, stringToSurface, type BijouContext } from '@flyingrobots/bijou';
import { modal, type Overlay } from './overlay.js';
import type { KeyMsg } from './types.js';

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

export function renderShellQuitOverlay(screenWidth: number, screenHeight: number): Overlay {
  return modal({
    title: 'Quit?',
    body: stringToSurface('Quit this app?\n\nY quit • N stay', 20, 3),
    hint: 'Y quit • N stay',
    width: 24,
    screenWidth,
    screenHeight,
  });
}

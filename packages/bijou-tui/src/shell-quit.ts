import {
  createSurface,
  graphemeClusterWidth,
  resolveSafeCtx,
  segmentGraphemes,
  stringToSurface,
  type BijouContext,
  type Cell,
  type Surface,
} from '@flyingrobots/bijou';
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
  if (msg.ctrl || msg.alt) return false;
  if (msg.key === 'y' || msg.key === 'Y') return true;
  return !msg.shift && msg.key === 'enter';
}

export function isShellQuitConfirmDismiss(msg: KeyMsg): boolean {
  if (msg.ctrl || msg.alt) return false;
  if (msg.key === 'n' || msg.key === 'N') return true;
  return !msg.shift && (msg.key === 'escape' || msg.key === 'q');
}

function textWidth(text: string): number {
  return segmentGraphemes(text).reduce(
    (width, grapheme) => width + Math.max(1, graphemeClusterWidth(grapheme)),
    0,
  );
}

function writeHintText(surface: Surface, x: number, text: string, style: Partial<Cell>): number {
  let cursor = x;
  for (const grapheme of segmentGraphemes(text)) {
    const width = Math.max(1, graphemeClusterWidth(grapheme));
    surface.set(cursor, 0, { char: grapheme, ...style, empty: false });
    for (let offset = 1; offset < width; offset++) {
      surface.set(cursor + offset, 0, { char: '', ...style, empty: false });
    }
    cursor += width;
  }
  return cursor;
}

function renderQuitHintSurface(i18n?: I18nRuntime, ctx?: BijouContext) {
  const quitLabel = frameMessage(i18n, 'help.key.quit', 'Quit');
  const stayLabel = frameMessage(i18n, 'help.key.stay', 'Stay');
  const text = `Y ${quitLabel} • N ${stayLabel}`;
  const surface = createSurface(textWidth(text), 1);
  const keyStyle: Partial<Cell> = {
    fg: ctx?.semantic('accent').hex,
    fgRGB: ctx?.semantic('accent').fgRGB,
    modifiers: ['bold'],
  };
  const actionStyle: Partial<Cell> = {
    fg: ctx?.semantic('primary').hex,
    fgRGB: ctx?.semantic('primary').fgRGB,
    modifiers: ['bold'],
  };
  const mutedStyle: Partial<Cell> = {
    fg: ctx?.semantic('muted').hex,
    fgRGB: ctx?.semantic('muted').fgRGB,
  };

  let x = 0;
  x = writeHintText(surface, x, 'Y', keyStyle);
  x = writeHintText(surface, x, ` ${quitLabel}`, actionStyle);
  x = writeHintText(surface, x, ' • ', mutedStyle);
  x = writeHintText(surface, x, 'N', keyStyle);
  writeHintText(surface, x, ` ${stayLabel}`, actionStyle);
  return surface;
}

export function renderShellQuitOverlay(
  screenWidth: number,
  screenHeight: number,
  i18n?: I18nRuntime,
  ctx?: BijouContext,
): Overlay {
  const title = frameMessage(i18n, 'quit.title', 'Quit?');
  const bodyText = frameMessage(i18n, 'quit.body', 'Quit this app?');
  const modalWidth = Math.min(40, Math.max(8, screenWidth - 4));
  const bodyWidth = Math.max(0, modalWidth - 4);
  return modal({
    title,
    body: stringToSurface(bodyText, bodyWidth, 1),
    hint: renderQuitHintSurface(i18n, ctx),
    borderToken: ctx?.border('primary'),
    bgToken: ctx?.surface('elevated'),
    ctx,
    width: modalWidth,
    screenWidth,
    screenHeight,
  });
}

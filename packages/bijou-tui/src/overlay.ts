/**
 * Overlay compositing primitives for TUI apps.
 *
 * - `composite()` — paint overlays onto a background string (ANSI-safe)
 * - `modal()` — centered dialog overlay with title, body, hint
 * - `toast()` — anchored notification overlay with variant icons
 */

import type { BijouContext, TokenValue } from '@flyingrobots/bijou';
import { sliceAnsi, visibleLength } from './viewport.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Overlay {
  readonly content: string;
  readonly row: number;
  readonly col: number;
}

export interface CompositeOptions {
  /** Wrap background lines in dim (ANSI 2m). */
  readonly dim?: boolean;
}

export interface ModalOptions {
  readonly title?: string;
  readonly body: string;
  readonly hint?: string;
  readonly screenWidth: number;
  readonly screenHeight: number;
  /** Override box width (default: auto from content). */
  readonly width?: number;
  readonly borderToken?: TokenValue;
  readonly ctx?: BijouContext;
}

export type ToastVariant = 'success' | 'error' | 'info';
export type ToastAnchor = 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';

export interface ToastOptions {
  readonly message: string;
  readonly variant?: ToastVariant;
  readonly anchor?: ToastAnchor;
  readonly screenWidth: number;
  readonly screenHeight: number;
  /** Rows/cols from edge. Default: 1. */
  readonly margin?: number;
  readonly ctx?: BijouContext;
}

// ---------------------------------------------------------------------------
// Border characters (same as core box.ts)
// ---------------------------------------------------------------------------

const BORDER = {
  tl: '\u250c', // ┌
  tr: '\u2510', // ┐
  bl: '\u2514', // └
  br: '\u2518', // ┘
  h: '\u2500',  // ─
  v: '\u2502',  // │
};

// ---------------------------------------------------------------------------
// spliceLine (internal)
// ---------------------------------------------------------------------------

function spliceLine(bgLine: string, overlayLine: string, col: number): string {
  const overlayVis = visibleLength(overlayLine);
  const bgVis = visibleLength(bgLine);

  const left = bgVis <= col
    ? bgLine + ' '.repeat(col - bgVis)
    : sliceAnsi(bgLine, 0, col);

  const right = sliceAnsi(bgLine, col + overlayVis, bgVis);

  return left + '\x1b[0m' + overlayLine + '\x1b[0m' + right;
}

// ---------------------------------------------------------------------------
// composite()
// ---------------------------------------------------------------------------

export function composite(
  background: string,
  overlays: readonly Overlay[],
  options?: CompositeOptions,
): string {
  const bgLines = background.split('\n');

  if (options?.dim) {
    for (let i = 0; i < bgLines.length; i++) {
      if (bgLines[i]!.length > 0) {
        bgLines[i] = '\x1b[2m' + bgLines[i] + '\x1b[0m';
      }
    }
  }

  for (const overlay of overlays) {
    const oLines = overlay.content.split('\n');
    for (let i = 0; i < oLines.length; i++) {
      const targetRow = overlay.row + i;
      if (targetRow < 0 || targetRow >= bgLines.length) continue;
      bgLines[targetRow] = spliceLine(bgLines[targetRow]!, oLines[i]!, overlay.col);
    }
  }

  return bgLines.join('\n');
}

// ---------------------------------------------------------------------------
// renderBox (shared between modal and toast)
// ---------------------------------------------------------------------------

function renderBox(
  lines: string[],
  borderColor: (s: string) => string,
): string {
  const innerWidth = lines.reduce((max, l) => Math.max(max, visibleLength(l)), 0);
  const top = borderColor(BORDER.tl + BORDER.h.repeat(innerWidth + 2) + BORDER.tr);
  const bottom = borderColor(BORDER.bl + BORDER.h.repeat(innerWidth + 2) + BORDER.br);
  const body = lines.map((l) => {
    const pad = innerWidth - visibleLength(l);
    return borderColor(BORDER.v) + ' ' + l + ' '.repeat(pad) + ' ' + borderColor(BORDER.v);
  });
  return [top, ...body, bottom].join('\n');
}

// ---------------------------------------------------------------------------
// modal()
// ---------------------------------------------------------------------------

export function modal(options: ModalOptions): Overlay {
  const { title, body, hint, screenWidth, screenHeight, ctx } = options;

  const contentLines: string[] = [];

  if (title != null) {
    const titleText = ctx ? ctx.style.bold(title) : title;
    contentLines.push(titleText, '');
  }

  contentLines.push(...body.split('\n'));

  if (hint != null) {
    contentLines.push('');
    const hintText = ctx
      ? ctx.style.styled(ctx.theme.theme.semantic.muted, hint)
      : hint;
    contentLines.push(hintText);
  }

  // If width override, constrain inner width
  if (options.width != null) {
    const targetInner = options.width - 4; // border + padding
    // Pad short lines, but don't truncate (user controls width)
    for (let i = 0; i < contentLines.length; i++) {
      const vis = visibleLength(contentLines[i]!);
      if (vis < targetInner) {
        contentLines[i] = contentLines[i]! + ' '.repeat(targetInner - vis);
      }
    }
  }

  const borderColor = ctx && options.borderToken
    ? (s: string) => ctx.style.styled(options.borderToken!, s)
    : (s: string) => s;

  const boxStr = renderBox(contentLines, borderColor);
  const boxLines = boxStr.split('\n');
  const boxHeight = boxLines.length;
  const boxWidth = visibleLength(boxLines[0]!);

  const row = Math.max(0, Math.floor((screenHeight - boxHeight) / 2));
  const col = Math.max(0, Math.floor((screenWidth - boxWidth) / 2));

  return { content: boxStr, row, col };
}

// ---------------------------------------------------------------------------
// toast()
// ---------------------------------------------------------------------------

const TOAST_ICONS: Record<ToastVariant, string> = {
  success: '\u2714', // ✔
  error: '\u2718',   // ✘
  info: '\u2139',    // ℹ
};

const TOAST_SEMANTIC: Record<ToastVariant, 'success' | 'error' | 'info'> = {
  success: 'success',
  error: 'error',
  info: 'info',
};

const TOAST_BORDER: Record<ToastVariant, 'success' | 'error' | 'primary'> = {
  success: 'success',
  error: 'error',
  info: 'primary',
};

export function toast(options: ToastOptions): Overlay {
  const {
    message,
    variant = 'info',
    anchor = 'bottom-right',
    screenWidth,
    screenHeight,
    margin = 1,
    ctx,
  } = options;

  const icon = TOAST_ICONS[variant];
  let line = icon + ' ' + message;

  const semanticKey = TOAST_SEMANTIC[variant];
  if (ctx) {
    const token = ctx.theme.theme.semantic[semanticKey];
    line = ctx.style.styled(token, line);
  }

  const borderKey = TOAST_BORDER[variant];
  const borderColor = ctx
    ? (s: string) => ctx.style.styled(ctx.theme.theme.border[borderKey], s)
    : (s: string) => s;

  const boxStr = renderBox([line], borderColor);
  const boxLines = boxStr.split('\n');
  const boxHeight = boxLines.length;
  const boxWidth = visibleLength(boxLines[0]!);

  let row: number;
  let col: number;

  switch (anchor) {
    case 'top-right':
      row = margin;
      col = screenWidth - boxWidth - margin;
      break;
    case 'bottom-right':
      row = screenHeight - boxHeight - margin;
      col = screenWidth - boxWidth - margin;
      break;
    case 'bottom-left':
      row = screenHeight - boxHeight - margin;
      col = margin;
      break;
    case 'top-left':
      row = margin;
      col = margin;
      break;
  }

  row = Math.max(0, row);
  col = Math.max(0, col);

  return { content: boxStr, row, col };
}

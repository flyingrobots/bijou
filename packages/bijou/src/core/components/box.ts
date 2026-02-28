import type { BijouContext } from '../../ports/context.js';
import type { TokenValue } from '../theme/tokens.js';
import { getDefaultContext } from '../../context.js';
import { graphemeWidth } from '../text/grapheme.js';
import { clipToWidth } from '../text/clip.js';

export interface BoxOptions {
  borderToken?: TokenValue;
  padding?: { top?: number; bottom?: number; left?: number; right?: number };
  /** Lock outer width (including borders). Content is clipped/padded to fit. */
  width?: number;
  ctx?: BijouContext;
}

const BORDER = { tl: '\u250c', tr: '\u2510', bl: '\u2514', br: '\u2518', h: '\u2500', v: '\u2502' };

function drawBox(
  content: string,
  borderColor: (s: string) => string,
  padding: { top: number; bottom: number; left: number; right: number },
  fixedWidth?: number,
): string {
  const contentLines = content.split('\n');

  let innerWidth: number;
  let contentWidth: number;

  if (fixedWidth !== undefined) {
    // Fixed outer width: outer = border(1) + inner + border(1)
    innerWidth = Math.max(0, fixedWidth - 2);
    contentWidth = Math.max(0, innerWidth - padding.left - padding.right);
  } else {
    // Auto width: measure content
    const maxWidth = contentLines.reduce((max, line) => Math.max(max, graphemeWidth(line)), 0);
    contentWidth = maxWidth;
    innerWidth = maxWidth + padding.left + padding.right;
  }

  // When fixed width, padding may exceed innerWidth — clamp to fit
  const effectiveLeft = fixedWidth !== undefined ? Math.min(padding.left, innerWidth) : padding.left;
  const effectiveRight = fixedWidth !== undefined ? Math.min(padding.right, Math.max(0, innerWidth - effectiveLeft)) : padding.right;

  const pad = (line: string): string => {
    const visible = graphemeWidth(line);
    let processed = line;
    if (visible > contentWidth) {
      processed = clipToWidth(line, contentWidth);
    }
    const processedVisible = graphemeWidth(processed);
    const leftPad = ' '.repeat(effectiveLeft);
    const rightPad = ' '.repeat(effectiveRight + Math.max(0, contentWidth - processedVisible));
    return leftPad + processed + rightPad;
  };

  const top = borderColor(BORDER.tl + BORDER.h.repeat(innerWidth) + BORDER.tr);
  const bottom = borderColor(BORDER.bl + BORDER.h.repeat(innerWidth) + BORDER.br);
  const emptyLine = borderColor(BORDER.v) + ' '.repeat(innerWidth) + borderColor(BORDER.v);

  const lines: string[] = [top];
  for (let i = 0; i < padding.top; i++) lines.push(emptyLine);
  for (const line of contentLines) {
    lines.push(borderColor(BORDER.v) + pad(line) + borderColor(BORDER.v));
  }
  for (let i = 0; i < padding.bottom; i++) lines.push(emptyLine);
  lines.push(bottom);

  return lines.join('\n');
}

function resolveCtx(ctx?: BijouContext): BijouContext {
  if (ctx) return ctx;
  return getDefaultContext();
}

export function box(content: string, options: BoxOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;

  if (mode === 'pipe' || mode === 'accessible') {
    return content;
  }

  const borderToken = options.borderToken ?? ctx.theme.theme.border.primary;
  const padding = {
    top: options.padding?.top ?? 0,
    bottom: options.padding?.bottom ?? 0,
    left: options.padding?.left ?? 1,
    right: options.padding?.right ?? 1,
  };

  const colorize = (s: string): string => ctx.style.styled(borderToken, s);

  return drawBox(content, colorize, padding, options.width);
}

export interface HeaderBoxOptions extends BoxOptions {
  detail?: string;
  labelToken?: TokenValue;
}

export function headerBox(label: string, options: HeaderBoxOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  const mode = ctx.mode;
  const detail = options.detail ?? '';

  if (mode === 'pipe') {
    return detail ? `${label}  ${detail}` : label;
  }
  if (mode === 'accessible') {
    return detail ? `${label}: ${detail}` : label;
  }

  const labelToken = options.labelToken ?? ctx.theme.theme.semantic.primary;
  const content = detail
    ? ctx.style.styled(labelToken, label) + ctx.style.styled(ctx.theme.theme.semantic.muted, `  ${detail}`)
    : ctx.style.styled(labelToken, label);

  return box(content, options);
}

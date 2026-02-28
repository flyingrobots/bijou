import type { BijouContext } from '../../ports/context.js';
import { getDefaultContext } from '../../context.js';

export type BulletStyle = 'arabic' | 'alpha' | 'roman' | 'bullet' | 'dash' | 'none';

export interface EnumeratedListOptions {
  readonly style?: BulletStyle;     // default: 'arabic'
  readonly indent?: number;         // default: 2
  readonly start?: number;          // default: 1
  readonly ctx?: BijouContext;
}

function resolveCtx(ctx?: BijouContext): BijouContext | undefined {
  if (ctx) return ctx;
  try {
    return getDefaultContext();
  } catch {
    return undefined;
  }
}

function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]!) {
      result += syms[i]!;
      n -= vals[i]!;
    }
  }
  return result;
}

function toAlpha(n: number): string {
  let result = '';
  while (n > 0) {
    n--;
    result = String.fromCharCode(97 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

function generatePrefix(style: BulletStyle, index: number): string {
  switch (style) {
    case 'arabic':
      return `${index}.`;
    case 'alpha':
      return `${toAlpha(index)}.`;
    case 'roman':
      return `${toRoman(index)}.`;
    case 'bullet':
      return '\u2022';
    case 'dash':
      return '\u2013';
    case 'none':
      return '';
  }
}

function generatePipePrefix(style: BulletStyle, index: number): string {
  switch (style) {
    case 'arabic':
      return `${index}.`;
    case 'alpha':
      return `${toAlpha(index)}.`;
    case 'roman':
      return `${toRoman(index)}.`;
    case 'bullet':
      return '*';
    case 'dash':
      return '-';
    case 'none':
      return '';
  }
}

function isOrderedStyle(style: BulletStyle): boolean {
  return style === 'arabic' || style === 'alpha' || style === 'roman';
}

export function enumeratedList(items: readonly string[], options?: EnumeratedListOptions): string {
  if (items.length === 0) return '';

  const style = options?.style ?? 'arabic';
  const indent = options?.indent ?? 2;
  const start = options?.start ?? 1;
  const ctx = resolveCtx(options?.ctx);
  const mode = ctx?.mode;

  const indentStr = ' '.repeat(indent);

  // Accessible mode: simple numbering regardless of style
  if (mode === 'accessible') {
    return items
      .map((item, i) => {
        const num = start + i;
        const prefix = `${num}.`;
        const lines = item.split('\n');
        const firstLine = `${indentStr}${prefix} ${lines[0]}`;
        if (lines.length === 1) return firstLine;
        const contIndent = ' '.repeat(indent + prefix.length + 1);
        return [firstLine, ...lines.slice(1).map(l => `${contIndent}${l}`)].join('\n');
      })
      .join('\n');
  }

  // Pipe mode: ASCII fallbacks
  if (mode === 'pipe') {
    const prefixes = items.map((_, i) => generatePipePrefix(style, start + i));
    const maxPrefixLen = isOrderedStyle(style)
      ? Math.max(...prefixes.map(p => p.length))
      : 0;

    return items
      .map((item, i) => {
        const prefix = prefixes[i]!;
        const lines = item.split('\n');

        if (style === 'none') {
          const firstLine = `${indentStr}${lines[0]}`;
          if (lines.length === 1) return firstLine;
          const contIndent = indentStr;
          return [firstLine, ...lines.slice(1).map(l => `${contIndent}${l}`)].join('\n');
        }

        const paddedPrefix = isOrderedStyle(style)
          ? prefix.padStart(maxPrefixLen)
          : prefix;
        const firstLine = `${indentStr}${paddedPrefix} ${lines[0]}`;
        if (lines.length === 1) return firstLine;
        const contIndent = ' '.repeat(indent + paddedPrefix.length + 1);
        return [firstLine, ...lines.slice(1).map(l => `${contIndent}${l}`)].join('\n');
      })
      .join('\n');
  }

  // Interactive / static mode (or no context): full rendering
  const prefixes = items.map((_, i) => generatePrefix(style, start + i));
  const maxPrefixLen = isOrderedStyle(style)
    ? Math.max(...prefixes.map(p => p.length))
    : 0;

  return items
    .map((item, i) => {
      const prefix = prefixes[i]!;
      const lines = item.split('\n');

      if (style === 'none') {
        const firstLine = `${indentStr}${lines[0]}`;
        if (lines.length === 1) return firstLine;
        const contIndent = indentStr;
        return [firstLine, ...lines.slice(1).map(l => `${contIndent}${l}`)].join('\n');
      }

      const paddedPrefix = isOrderedStyle(style)
        ? prefix.padStart(maxPrefixLen)
        : prefix;
      const firstLine = `${indentStr}${paddedPrefix} ${lines[0]}`;
      if (lines.length === 1) return firstLine;
      const contIndent = ' '.repeat(indent + paddedPrefix.length + 1);
      return [firstLine, ...lines.slice(1).map(l => `${contIndent}${l}`)].join('\n');
    })
    .join('\n');
}

import type { BulletStyle } from './enumerated-list.js';

function toRoman(value: number): string {
  let result = '';
  for (const [number, symbol] of [
    [1000, 'm'],
    [900, 'cm'],
    [500, 'd'],
    [400, 'cd'],
    [100, 'c'],
    [90, 'xc'],
    [50, 'l'],
    [40, 'xl'],
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ] as const) {
    while (value >= number) {
      result += symbol;
      value -= number;
    }
  }
  return result;
}

function toAlpha(value: number): string {
  let result = '';
  while (value > 0) {
    value--;
    result = String.fromCharCode(97 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

export function generateListPrefix(style: BulletStyle, index: number): string {
  switch (style) {
    case 'arabic':
      return `${String(index)}.`;
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

export function generatePipeListPrefix(
  style: BulletStyle,
  index: number,
): string {
  if (style === 'bullet') return '*';
  if (style === 'dash') return '-';
  return generateListPrefix(style, index);
}

function isOrderedStyle(style: BulletStyle): boolean {
  return style === 'arabic' || style === 'alpha' || style === 'roman';
}

export function renderEnumeratedItems(
  items: readonly string[],
  style: BulletStyle,
  start: number,
  indent: number,
  indentString: string,
  prefix: (style: BulletStyle, index: number) => string,
): string {
  const prefixes = items.map((_, index) => prefix(style, start + index));
  const maxPrefixLength = isOrderedStyle(style)
    ? Math.max(...prefixes.map((value) => value.length))
    : 0;

  return items
    .map((item, index) => {
      const rawPrefix = prefixes[index] ?? '';
      const lines = item.split('\n');
      const first = lines[0] ?? '';
      if (style === 'none') {
        const firstLine = `${indentString}${first}`;
        return lines.length === 1
          ? firstLine
          : [
              firstLine,
              ...lines.slice(1).map((line) => `${indentString}${line}`),
            ].join('\n');
      }

      const paddedPrefix = isOrderedStyle(style)
        ? rawPrefix.padStart(maxPrefixLength)
        : rawPrefix;
      const firstLine = `${indentString}${paddedPrefix} ${first}`;
      if (lines.length === 1) return firstLine;
      const continuationIndent = ' '.repeat(indent + paddedPrefix.length + 1);
      return [
        firstLine,
        ...lines.slice(1).map((line) => `${continuationIndent}${line}`),
      ].join('\n');
    })
    .join('\n');
}

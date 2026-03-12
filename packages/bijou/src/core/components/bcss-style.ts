import type { Cell } from '../../ports/surface.js';

type BCSSStyles = Record<string, string>;

export function mergeBCSSModifiers(
  base: readonly string[] | undefined,
  styles: BCSSStyles,
): string[] | undefined {
  const modifiers = new Set(base ?? []);

  const fontWeight = styles['font-weight']?.trim().toLowerCase();
  if (fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900') {
    modifiers.add('bold');
  } else if (fontWeight === 'normal' || fontWeight === '400') {
    modifiers.delete('bold');
  }

  const fontStyle = styles['font-style']?.trim().toLowerCase();
  if (fontStyle === 'italic') {
    modifiers.add('italic');
  } else if (fontStyle === 'normal') {
    modifiers.delete('italic');
  }

  const decoration = styles['text-decoration']?.trim().toLowerCase();
  if (decoration === 'none') {
    modifiers.delete('underline');
    modifiers.delete('curly-underline');
    modifiers.delete('dotted-underline');
    modifiers.delete('dashed-underline');
    modifiers.delete('strikethrough');
    modifiers.delete('strike');
  } else if (decoration) {
    if (decoration.includes('underline')) {
      modifiers.add('underline');
    }
    if (decoration.includes('line-through')) {
      modifiers.add('strikethrough');
      modifiers.delete('strike');
    }
  }

  return modifiers.size > 0 ? Array.from(modifiers) : undefined;
}

export function applyBCSSCellTextStyles(
  base: Pick<Cell, 'fg' | 'bg' | 'modifiers'>,
  styles: BCSSStyles,
): Pick<Cell, 'fg' | 'bg' | 'modifiers'> {
  return {
    fg: styles['color'] ?? base.fg,
    bg: styles['background'] ?? base.bg,
    modifiers: mergeBCSSModifiers(base.modifiers, styles),
  };
}

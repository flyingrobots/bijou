import type { ColorRef } from '../core/theme/color.js';

export interface Cell {
  /** The grapheme to display. */
  char: string;
  /** Foreground color reference. Undefined uses the terminal default. */
  fg?: ColorRef;
  /** Background color reference. Undefined uses the terminal default. */
  bg?: ColorRef;
  /** Pre-parsed foreground channels. These take precedence over `fg`. */
  fgRGB?: readonly [number, number, number];
  /** Pre-parsed background channels. These take precedence over `bg`. */
  bgRGB?: readonly [number, number, number];
  /** Text modifiers such as bold, dim, and underline. */
  modifiers?: string[];
  /** Whether composition treats this cell as a transparent brush hole. */
  empty?: boolean;
  /** Cell opacity from zero through one. */
  opacity?: number;
}

export interface CellMask {
  /** Whether to affect the character. */
  char?: boolean;
  /** Whether to affect the foreground color. */
  fg?: boolean;
  /** Whether to affect the background color. */
  bg?: boolean;
  /** Whether to affect the text modifiers. */
  modifiers?: boolean;
  /** Whether to affect the empty and opacity fields. */
  alpha?: boolean;
}

export const FULL_MASK: CellMask = {
  char: true,
  fg: true,
  bg: true,
  modifiers: true,
  alpha: true,
};

export function maskCell(cell: Cell, mask: CellMask): Cell {
  return {
    char: mask.char ? cell.char : ' ',
    fg: mask.fg ? cell.fg : undefined,
    bg: mask.bg ? cell.bg : undefined,
    fgRGB: mask.fg ? cell.fgRGB : undefined,
    bgRGB: mask.bg ? cell.bgRGB : undefined,
    modifiers: mask.modifiers ? cell.modifiers : undefined,
    empty: mask.alpha ? (cell.empty ?? false) : false,
    opacity: mask.alpha ? (cell.opacity ?? 1) : 1,
  };
}

export function cloneCell(cell: Cell): Cell {
  return {
    char: cell.char,
    fg: cell.fg,
    bg: cell.bg,
    fgRGB: cell.fgRGB,
    bgRGB: cell.bgRGB,
    modifiers: cell.modifiers,
    empty: cell.empty,
    opacity: cell.opacity,
  };
}

export function copyCellInto(target: Cell, source: Cell): void {
  target.char = source.char;
  target.fg = source.fg;
  target.bg = source.bg;
  target.fgRGB = source.fgRGB;
  target.bgRGB = source.bgRGB;
  target.modifiers = source.modifiers;
  target.empty = source.empty;
  target.opacity = source.opacity;
}

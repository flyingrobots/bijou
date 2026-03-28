import { createSurface, type Surface } from '../../ports/surface.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { wrapToWidth } from '../text/wrap.js';
import type { BijouNodeOptions } from './types.js';

export type PreferenceRowKind = 'toggle' | 'choice' | 'info' | 'action';

export interface PreferenceRow {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly valueLabel?: string;
  readonly kind?: PreferenceRowKind;
  readonly checked?: boolean;
  readonly enabled?: boolean;
}

export interface PreferenceSection {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly PreferenceRow[];
}

export interface PreferenceRowLayout {
  readonly valueLabel: string;
  readonly stackValue: boolean;
  readonly descriptionLines: readonly string[];
  readonly height: number;
}

export interface PreferenceRowSurfaceOptions extends BijouNodeOptions {
  readonly width: number;
  readonly selected?: boolean;
}

export interface PreferenceListSurfaceOptions extends BijouNodeOptions {
  readonly width: number;
  readonly selectedRowId?: string;
}

export function preferenceRowSurface(
  row: PreferenceRow,
  options: PreferenceRowSurfaceOptions,
): Surface {
  const ctx = resolveCtx(options.ctx);
  const width = Math.max(1, Math.floor(options.width));
  const layout = resolvePreferenceRowLayout(row, width);
  const surface = createSurface(width, layout.height);
  const bg = options.selected ? resolvePreferenceRowBg(ctx) : undefined;

  fillPreferenceRow(surface, bg);
  writePreferenceLine(surface, 0, buildPreferenceLeftText(row, options.selected === true), {
    strong: options.selected === true,
    bg,
  });

  if (layout.valueLabel.length > 0) {
    if (layout.stackValue) {
      writePreferenceLine(surface, 1, `   ${layout.valueLabel}`, {
        strong: true,
        fg: resolvePreferenceValueFg(row, ctx),
        bg,
      });
    } else {
      const valueChars = Array.from(layout.valueLabel);
      const startX = width >= 3 ? 1 : 0;
      const innerWidth = Math.max(0, width - (startX * 2));
      const valueStart = Math.max(0, innerWidth - valueChars.length);
      for (let offset = 0; offset < valueChars.length && startX + valueStart + offset < width; offset++) {
        const char = valueChars[offset]!;
        if (char === ' ') continue;
        surface.set(startX + valueStart + offset, 0, {
          char,
          fg: resolvePreferenceValueFg(row, ctx),
          bg,
          modifiers: ['bold'],
          empty: false,
        });
      }
    }
  }

  for (let index = 0; index < layout.descriptionLines.length; index++) {
    writePreferenceLine(
      surface,
      (layout.stackValue ? 2 : 1) + index,
      `   ${layout.descriptionLines[index]!}`,
      { dim: true, bg },
    );
  }

  return surface;
}

export function preferenceListSurface(
  sections: readonly PreferenceSection[],
  options: PreferenceListSurfaceOptions,
): Surface {
  const ctx = resolveCtx(options.ctx);
  const width = Math.max(1, Math.floor(options.width));
  const visibleSections = sections.filter((section) => section.rows.length > 0);
  const rows: Array<{ y: number; row: PreferenceRow }> = [];
  let totalHeight = 1;
  let y = 0;

  for (let sectionIndex = 0; sectionIndex < visibleSections.length; sectionIndex++) {
    const section = visibleSections[sectionIndex]!;
    if (sectionIndex > 0) y += 1;
    y += 1;
    y += 1;

    for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex++) {
      const row = section.rows[rowIndex]!;
      rows.push({ y, row });
      const rowLayout = resolvePreferenceRowLayout(row, width);
      y += rowLayout.height;
      if (rowIndex < section.rows.length - 1) y += 1;
    }
  }

  totalHeight = Math.max(1, y);
  const surface = createSurface(width, totalHeight);
  y = 0;

  for (let sectionIndex = 0; sectionIndex < visibleSections.length; sectionIndex++) {
    const section = visibleSections[sectionIndex]!;
    if (sectionIndex > 0) y += 1;
    writePreferenceLine(surface, y, section.title, { strong: true });
    y += 2;

    for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex++) {
      const row = section.rows[rowIndex]!;
      const rowSurface = preferenceRowSurface(row, {
        width,
        selected: options.selectedRowId === row.id,
        ctx,
      });
      surface.blit(rowSurface, 0, y);
      y += rowSurface.height;
      if (rowIndex < section.rows.length - 1) y += 1;
    }
  }

  return surface;
}

export function resolvePreferenceRowLayout(row: PreferenceRow, width: number): PreferenceRowLayout {
  const boundedWidth = Math.max(1, Math.floor(width));
  const valueLabel = formatPreferenceValueLabel(row);
  const leftText = `  ${preferenceRowGlyph(row)} ${row.label}`;
  const startX = boundedWidth >= 3 ? 1 : 0;
  const innerWidth = Math.max(0, boundedWidth - (startX * 2));
  const stackValue = valueLabel.length > 0
    && (Array.from(leftText).length + 3 + Array.from(valueLabel).length > innerWidth);
  const descriptionLines = row.description == null
    ? []
    : wrapToWidth(row.description, Math.max(1, Math.max(14, boundedWidth - 4)));

  return {
    valueLabel,
    stackValue,
    descriptionLines,
    height: 1 + (stackValue ? 1 : 0) + descriptionLines.length,
  };
}

function preferenceRowGlyph(row: PreferenceRow): string {
  if (row.kind === 'toggle') return row.checked === true ? '☑' : '☐';
  if (row.kind === 'choice') return '↻';
  return ' ';
}

function buildPreferenceLeftText(row: PreferenceRow, selected: boolean): string {
  const prefix = selected ? '›' : ' ';
  return `${prefix} ${preferenceRowGlyph(row)} ${row.label}`;
}

function formatPreferenceValueLabel(row: PreferenceRow): string {
  if (row.kind === 'toggle' && row.checked != null) {
    return row.checked ? '☑ On' : '☐ Off';
  }
  if (row.kind === 'choice') {
    return row.valueLabel ?? 'Choose';
  }
  return row.valueLabel ?? '';
}

function fillPreferenceRow(surface: Surface, bg: string | undefined): void {
  if (bg == null) return;
  surface.fill({ char: ' ', bg, empty: false });
}

function resolvePreferenceRowBg(ctx: ReturnType<typeof resolveCtx>): string | undefined {
  return ctx?.surface('elevated').bg
    ?? ctx?.surface('secondary').bg
    ?? ctx?.surface('muted').bg;
}

function resolvePreferenceValueFg(row: PreferenceRow, ctx: ReturnType<typeof resolveCtx>): string | undefined {
  if (ctx == null) return undefined;
  if (row.kind === 'toggle') return row.checked ? ctx.semantic('accent').hex : ctx.semantic('muted').hex;
  if (row.kind === 'choice') return ctx.semantic('accent').hex;
  return ctx.semantic('primary').hex;
}

function writePreferenceLine(
  surface: Surface,
  y: number,
  text: string,
  options: {
    readonly strong?: boolean;
    readonly dim?: boolean;
    readonly fg?: string;
    readonly bg?: string;
  } = {},
): void {
  const chars = Array.from(text);
  for (let x = 0; x < chars.length && x < surface.width; x++) {
    const char = chars[x]!;
    if (char === ' ') continue;
    surface.set(x, y, {
      char,
      fg: options.fg,
      bg: options.bg,
      modifiers: options.strong ? ['bold'] : options.dim ? ['dim'] : undefined,
      empty: false,
    });
  }
}

import { createSurface, isPackedSurface, type Surface, type PackedSurface } from '../../ports/surface.js';
import { parseHex, FLAG_BOLD, FLAG_DIM } from '../render/packed-cell.js';
import type { TokenValue } from '../theme/tokens.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { graphemeWidth } from '../text/grapheme.js';
import {
  prepareWrappedText,
  wrapPreparedTextToWidth,
  type PreparedWrappedText,
} from '../text/wrap.js';
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

export interface PreparedPreferenceRow {
  readonly row: PreferenceRow;
  readonly valueLabel: string;
  readonly baseLeftText: string;
  readonly preparedDescription?: PreparedWrappedText;
}

export interface PreparedPreferenceSection {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly PreparedPreferenceRow[];
}

export interface PreferenceListTheme {
  readonly sectionTitleToken?: TokenValue;
  readonly selectedRowBgToken?: TokenValue;
  readonly toggleOnToken?: TokenValue;
  readonly toggleOffToken?: TokenValue;
  readonly choiceToken?: TokenValue;
  readonly infoToken?: TokenValue;
  readonly descriptionToken?: TokenValue;
}

export interface PreferenceRowSurfaceOptions extends BijouNodeOptions {
  readonly width: number;
  readonly selected?: boolean;
  readonly theme?: PreferenceListTheme;
}

export interface PreferenceListSurfaceOptions extends BijouNodeOptions {
  readonly width: number;
  readonly selectedRowId?: string;
  readonly theme?: PreferenceListTheme;
}

function isPreparedPreferenceRow(row: PreferenceRow | PreparedPreferenceRow): row is PreparedPreferenceRow {
  return 'row' in row && 'baseLeftText' in row;
}

function isPreparedPreferenceSection(
  section: PreferenceSection | PreparedPreferenceSection,
): section is PreparedPreferenceSection {
  return section.rows.length === 0 || isPreparedPreferenceRow(section.rows[0] as PreferenceRow | PreparedPreferenceRow);
}

export function preparePreferenceRow(row: PreferenceRow): PreparedPreferenceRow {
  return {
    row,
    valueLabel: formatPreferenceValueLabel(row),
    baseLeftText: `  ${preferenceRowGlyph(row)} ${row.label}`,
    preparedDescription: row.description == null ? undefined : prepareWrappedText(row.description),
  };
}

export function preparePreferenceSections(
  sections: readonly PreferenceSection[],
): readonly PreparedPreferenceSection[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    rows: section.rows.map((row) => preparePreferenceRow(row)),
  }));
}

export function preferenceRowSurface(
  row: PreferenceRow | PreparedPreferenceRow,
  options: PreferenceRowSurfaceOptions,
): Surface {
  const ctx = resolveCtx(options.ctx);
  const width = Math.max(1, Math.floor(options.width));
  const prepared = isPreparedPreferenceRow(row) ? row : preparePreferenceRow(row);
  const layout = resolvePreferenceRowLayout(prepared, width);
  const surface = createSurface(width, layout.height);
  const bg = options.selected ? resolvePreferenceRowBg(ctx, options.theme) : undefined;

  fillPreferenceRow(surface, bg);
  writePreferenceLine(surface, 0, buildPreferenceLeftText(prepared.row, options.selected === true), {
    strong: options.selected === true,
    bg,
  });

  if (layout.valueLabel.length > 0) {
    if (layout.stackValue) {
      writePreferenceLine(surface, 1, `   ${layout.valueLabel}`, {
        strong: true,
        fg: resolvePreferenceValueFg(prepared.row, ctx, options.theme),
        bg,
      });
    } else {
      const valueChars = Array.from(layout.valueLabel);
      const startX = width >= 3 ? 1 : 0;
      const innerWidth = Math.max(0, width - (startX * 2));
      const valueStart = Math.max(0, innerWidth - valueChars.length);
      const valFg = resolvePreferenceValueFg(prepared.row, ctx, options.theme);
      const packed = isPackedSurface(surface);
      if (packed && valFg) {
        const fgP = parseHex(valFg);
        if (fgP) {
          const fR = fgP[0], fG = fgP[1], fB = fgP[2];
          let bR = -1, bG = 0, bB = 0;
          if (bg) { const bgP = parseHex(bg); if (bgP) { bR = bgP[0]; bG = bgP[1]; bB = bgP[2]; } }
          for (let offset = 0; offset < valueChars.length && startX + valueStart + offset < width; offset++) {
            const char = valueChars[offset]!;
            if (char === ' ') continue;
            (surface as PackedSurface).setRGB(startX + valueStart + offset, 0, char, fR, fG, fB, bR, bG, bB, FLAG_BOLD);
          }
        } else {
          for (let offset = 0; offset < valueChars.length && startX + valueStart + offset < width; offset++) {
            const char = valueChars[offset]!;
            if (char === ' ') continue;
            surface.set(startX + valueStart + offset, 0, { char, fg: valFg, bg, modifiers: ['bold'], empty: false });
          }
        }
      } else {
        for (let offset = 0; offset < valueChars.length && startX + valueStart + offset < width; offset++) {
          const char = valueChars[offset]!;
          if (char === ' ') continue;
          surface.set(startX + valueStart + offset, 0, { char, fg: valFg, bg, modifiers: ['bold'], empty: false });
        }
      }
    }
  }

  for (let index = 0; index < layout.descriptionLines.length; index++) {
    writePreferenceLine(
      surface,
      (layout.stackValue ? 2 : 1) + index,
      `   ${layout.descriptionLines[index]!}`,
      {
        dim: options.theme?.descriptionToken == null,
        fg: options.theme?.descriptionToken?.hex,
        bg,
      },
    );
  }

  return surface;
}

export function preferenceListSurface(
  sections: readonly PreferenceSection[] | readonly PreparedPreferenceSection[],
  options: PreferenceListSurfaceOptions,
): Surface {
  const ctx = resolveCtx(options.ctx);
  const width = Math.max(1, Math.floor(options.width));
  const preparedSections = sections.map((section) => isPreparedPreferenceSection(section)
    ? section
    : {
        id: section.id,
        title: section.title,
        rows: section.rows.map((row) => preparePreferenceRow(row)),
      },
  );
  const visibleSections = preparedSections.filter((section) => section.rows.length > 0);
  let totalHeight = 1;
  let y = 0;

  for (let sectionIndex = 0; sectionIndex < visibleSections.length; sectionIndex++) {
    const section = visibleSections[sectionIndex]!;
    if (sectionIndex > 0) y += 1;
    y += 1;
    y += 1;

    for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex++) {
      const row = section.rows[rowIndex]!;
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
    writePreferenceLine(surface, y, section.title, {
      strong: options.theme?.sectionTitleToken == null,
      fg: options.theme?.sectionTitleToken?.hex,
      bg: options.theme?.sectionTitleToken?.bg,
    });
    y += 2;

    for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex++) {
      const row = section.rows[rowIndex]!;
      const rowLayout = resolvePreferenceRowLayout(row, width);
      const rowSurface = preferenceRowSurface(row, {
        width,
        selected: options.selectedRowId === row.row.id,
        ctx,
        theme: options.theme,
      });
      surface.blit(rowSurface, 0, y);
      y += rowLayout.height;
      if (rowIndex < section.rows.length - 1) y += 1;
    }
  }

  return surface;
}

export function resolvePreferenceRowLayout(
  row: PreferenceRow | PreparedPreferenceRow,
  width: number,
): PreferenceRowLayout {
  const prepared = isPreparedPreferenceRow(row) ? row : preparePreferenceRow(row);
  const boundedWidth = Math.max(1, Math.floor(width));
  const valueLabel = prepared.valueLabel;
  const leftText = prepared.baseLeftText;
  const startX = boundedWidth >= 3 ? 1 : 0;
  const innerWidth = Math.max(0, boundedWidth - (startX * 2));
  const stackValue = valueLabel.length > 0
    && (graphemeWidth(leftText) + 3 + graphemeWidth(valueLabel) > innerWidth);
  const descriptionLines = prepared.preparedDescription == null
    ? []
    : wrapPreparedTextToWidth(prepared.preparedDescription, Math.max(1, Math.max(14, boundedWidth - 4)));

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

function resolvePreferenceRowBg(
  ctx: ReturnType<typeof resolveCtx>,
  theme: PreferenceListTheme | undefined,
): string | undefined {
  if (theme?.selectedRowBgToken != null) {
    return theme.selectedRowBgToken.bg ?? theme.selectedRowBgToken.hex;
  }
  return ctx?.surface('elevated').bg
    ?? ctx?.surface('secondary').bg
    ?? ctx?.surface('muted').bg;
}

function resolvePreferenceValueFg(
  row: PreferenceRow,
  ctx: ReturnType<typeof resolveCtx>,
  theme: PreferenceListTheme | undefined,
): string | undefined {
  if (row.kind === 'toggle' && row.checked === true) {
    return theme?.toggleOnToken?.hex ?? ctx?.semantic('accent').hex;
  }
  if (row.kind === 'toggle' && row.checked === false) {
    return theme?.toggleOffToken?.hex ?? ctx?.semantic('muted').hex;
  }
  if (row.kind === 'choice') {
    return theme?.choiceToken?.hex ?? ctx?.semantic('accent').hex;
  }
  if (row.kind === 'info' || row.kind === 'action') {
    return theme?.infoToken?.hex ?? ctx?.semantic('primary').hex;
  }
  if (ctx == null) return undefined;
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
  const pp = isPackedSurface(surface);
  if (pp && options.fg) {
    const fgP = parseHex(options.fg);
    if (fgP) {
      const fR = fgP[0], fG = fgP[1], fB = fgP[2];
      let bR = -1, bG = 0, bB = 0;
      if (options.bg) { const bgP = parseHex(options.bg); if (bgP) { bR = bgP[0]; bG = bgP[1]; bB = bgP[2]; } }
      const flags = options.strong ? FLAG_BOLD : options.dim ? FLAG_DIM : 0;
      for (let x = 0; x < chars.length && x < surface.width; x++) {
        const char = chars[x]!;
        if (char === ' ') continue;
        (surface as PackedSurface).setRGB(x, y, char, fR, fG, fB, bR, bG, bB, flags);
      }
      return;
    }
  }
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

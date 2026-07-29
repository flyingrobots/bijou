import type { TokenValue } from '../theme/tokens.js';
import { graphemeWidth } from '../text/grapheme.js';
import { prepareWrappedText, wrapPreparedTextToWidth, type PreparedWrappedText } from '../text/wrap.js';
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

interface PreferenceColorStyle {
  readonly fg?: string;
  readonly bg?: string;
  readonly fgRGB?: readonly [number, number, number];
  readonly bgRGB?: readonly [number, number, number];
}

function isPreparedPreferenceRow(row: PreferenceRow | PreparedPreferenceRow): row is PreparedPreferenceRow {
  return 'row' in row && 'baseLeftText' in row;
}

function isPreparedPreferenceSection(
  section: PreferenceSection | PreparedPreferenceSection,
): section is PreparedPreferenceSection {
  const firstRow = section.rows[0];
  return firstRow === undefined || isPreparedPreferenceRow(firstRow);
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

function preferenceRowGlyph(row: PreferenceRow): string {
  if (row.kind === 'toggle') return row.checked === true ? '☑' : '☐';
  if (row.kind === 'choice') return '↻';
  return ' ';
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

export type { PreferenceColorStyle };
export { isPreparedPreferenceRow, isPreparedPreferenceSection, preferenceRowGlyph };

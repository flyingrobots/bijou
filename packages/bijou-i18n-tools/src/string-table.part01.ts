import type { I18nEntryKind } from '@flyingrobots/bijou-i18n';
import { decodeExchangeValue, isExchangeValueKind } from './exchange.js';
import { type AuthoringTranslationStatus } from './tools.js';

export interface StringTableRow {
  readonly namespace: string;
  readonly id: string;
  readonly kind: I18nEntryKind;
  readonly sourceLocale: string;
  readonly sourceValueKind: string;
  readonly sourceValue: string;
  readonly locale: string;
  readonly valueKind: string;
  readonly value: string;
  readonly status: AuthoringTranslationStatus;
  readonly description: string;
}
export interface StringTable {
  readonly columns: readonly string[];
  readonly rows: readonly StringTableRow[];
}
export const STRING_TABLE_COLUMNS = [
  'namespace',
  'id',
  'kind',
  'sourceLocale',
  'sourceValueKind',
  'sourceValue',
  'locale',
  'valueKind',
  'value',
  'status',
  'description',
] as const;
export function isEntryKind(value: string): value is I18nEntryKind {
  return value === 'message' || value === 'resource' || value === 'data';
}
export function isTranslationStatus(
  value: string,
): value is AuthoringTranslationStatus {
  return value === 'current' || value === 'stale' || value === 'missing';
}
export function assertStringTableRow(
  row: Readonly<Record<string, string>>,
  context: string,
): StringTableRow {
  const namespace = requiredCell(row, 'namespace', context);
  const id = requiredCell(row, 'id', context);
  const kind = requiredCell(row, 'kind', context);
  const sourceLocale = requiredCell(row, 'sourceLocale', context);
  const sourceValueKind = requiredCell(row, 'sourceValueKind', context);
  const sourceValue = requiredCell(row, 'sourceValue', context);
  const locale = requiredCell(row, 'locale', context);
  const valueKind = requiredCell(row, 'valueKind', context);
  const value = requiredCell(row, 'value', context);
  const status = requiredCell(row, 'status', context);
  const description = requiredCell(row, 'description', context);

  if (!isEntryKind(kind)) {
    throw new Error(
      `Invalid string table: unknown entry kind ${kind} in ${context}`,
    );
  }
  if (!isTranslationStatus(status)) {
    throw new Error(
      `Invalid string table: unknown status ${status} in ${context}`,
    );
  }
  if (valueKind === '' && value !== '' && status !== 'missing') {
    throw new Error(`Invalid string table: missing valueKind in ${context}`);
  }
  return Object.freeze({
    namespace,
    id,
    kind,
    sourceLocale,
    sourceValueKind,
    sourceValue,
    locale,
    valueKind,
    value,
    status,
    description,
  });
}
export function requiredCell(
  row: Readonly<Record<string, string>>,
  column: (typeof STRING_TABLE_COLUMNS)[number],
  context: string,
): string {
  const value = row[column];
  if (typeof value !== 'string') {
    throw new Error(`Invalid string table: missing ${column} in ${context}`);
  }
  return value;
}
export function decode(
  kind: string,
  payload: string,
  context: string,
): unknown {
  if (!isExchangeValueKind(kind)) throw new Error(`Bad ${context}: k ${kind}`);
  try {
    return decodeExchangeValue({ kind, payload });
  } catch (error) {
    const m = error instanceof Error ? error.message : '?';
    throw new Error(`Bad ${context}: ${m}`, { cause: error });
  }
}
export function rowKey(row: Pick<StringTableRow, 'namespace' | 'id'>): string {
  return `${row.namespace}:${row.id}`;
}

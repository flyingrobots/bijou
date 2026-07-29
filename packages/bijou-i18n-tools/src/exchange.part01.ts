import type { I18nCatalogKey, I18nEntryKind, I18nReference } from '@flyingrobots/bijou-i18n';
import type { AuthoringTranslationStatus } from './tools.js';

export type ExchangeValueKind = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array' | 'reference';

const COLUMNS = [
  'namespace',
  'id',
  'kind',
  'sourceLocale',
  'targetLocale',
  'status',
  'sourceHash',
  'description',
  'sourceValueKind',
  'sourceValue',
  'translatedValueKind',
  'translatedValue',
] as const;

const BAD_VAL = 'Invalid exchange value';

const BAD_WB = 'Invalid translation workbook';

const BAD_CAT = 'Invalid catalog bundle';

export interface EncodedExchangeValue {
  readonly kind: ExchangeValueKind;
  readonly payload: string;
}

export type TranslationWorkbookRow = Readonly<Record<(typeof COLUMNS)[number], string>>;

export interface ExchangeSheet {
  readonly name: string;
  readonly columns: readonly string[];
  readonly rows: readonly TranslationWorkbookRow[];
}

export interface ExchangeWorkbook {
  readonly version: number;
  readonly sheets: readonly ExchangeSheet[];
}

export interface SerializedAuthoringTranslation {
  readonly value: EncodedExchangeValue;
  readonly sourceHash: string;
  readonly status: string;
}

export interface SerializedAuthoringCatalogEntry {
  readonly key: I18nCatalogKey;
  readonly kind: string;
  readonly sourceLocale: string;
  readonly sourceValue: EncodedExchangeValue;
  readonly translations: Readonly<Record<string, SerializedAuthoringTranslation>>;
  readonly description?: string;
}

export interface SerializedAuthoringCatalog {
  readonly namespace: string;
  readonly entries: readonly SerializedAuthoringCatalogEntry[];
}

export interface CatalogBundle {
  readonly version: number;
  readonly catalogs: readonly SerializedAuthoringCatalog[];
}

function isReference(value: unknown): value is I18nReference {
  return typeof value === 'object'
    && value !== null
    && '$ref' in value
    && typeof (value as { $ref?: unknown }).$ref === 'object'
    && (value as { $ref?: unknown }).$ref !== null;
}

function isEntryKind(value: string): value is I18nEntryKind {
  return value === 'message' || value === 'resource' || value === 'data';
}

function isTranslationStatus(value: string): value is AuthoringTranslationStatus {
  return value === 'current' || value === 'stale' || value === 'missing';
}

const VALUE_KINDS = new Set<string>(['string', 'number', 'boolean', 'null', 'object', 'array', 'reference']);

export function isExchangeValueKind(value: string): value is ExchangeValueKind { return VALUE_KINDS.has(value); }

function assertObject(value: unknown, message: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(message);
  }
}

function parseJson(payload: string, message: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    throw new Error(message);
  }
}

export function encodeExchangeValue(value: unknown): EncodedExchangeValue {
  if (isReference(value)) {
    return {
      kind: 'reference',
      payload: JSON.stringify(value.$ref),
    };
  }
  if (typeof value === 'string') {
    return { kind: 'string', payload: value };
  }
  if (typeof value === 'number') {
    return { kind: 'number', payload: String(value) };
  }
  if (typeof value === 'boolean') {
    return { kind: 'boolean', payload: value ? 'true' : 'false' };
  }
  if (value === null) {
    return { kind: 'null', payload: '' };
  }
  if (Array.isArray(value)) {
    return { kind: 'array', payload: JSON.stringify(value) };
  }
  if (typeof value === 'object') {
    return { kind: 'object', payload: JSON.stringify(value) };
  }
  throw new Error(`${BAD_VAL}: unsupported type ${typeof value}`);
}

export { BAD_CAT, BAD_VAL, BAD_WB, COLUMNS, assertObject, isEntryKind, isTranslationStatus, parseJson };

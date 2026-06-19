import type {
  I18nCatalogKey,
  I18nEntryKind,
  I18nReference,
} from '@flyingrobots/bijou-i18n';
import type {
  AuthoringCatalog,
  AuthoringCatalogEntry,
  AuthoringTranslation,
  AuthoringTranslationStatus,
  TranslationRow,
} from './tools.js';
import { exportTranslationRows } from './tools.js';

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

function isExchangeValueKind(value: string): value is ExchangeValueKind { return VALUE_KINDS.has(value); }

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

export function decodeExchangeValue(encoded: EncodedExchangeValue): unknown {
  switch (encoded.kind) {
    case 'string':
      return encoded.payload;
    case 'number': {
      const value = Number(encoded.payload);
      if (Number.isNaN(value)) {
        throw new Error(`${BAD_VAL}: expected number, received ${encoded.payload}`);
      }
      return value;
    }
    case 'boolean':
      if (encoded.payload === 'true') {
        return true;
      }
      if (encoded.payload === 'false') {
        return false;
      }
      throw new Error(`${BAD_VAL}: expected boolean, received ${encoded.payload}`);
    case 'null':
      return null;
    case 'array': {
      const value = parseJson(encoded.payload, `${BAD_VAL}: expected array`);
      if (!Array.isArray(value)) {
        throw new Error(`${BAD_VAL}: expected array`);
      }
      return value;
    }
    case 'object': {
      const value = parseJson(encoded.payload, `${BAD_VAL}: expected object`);
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`${BAD_VAL}: expected object`);
      }
      return value;
    }
    case 'reference': {
      const value = parseJson(encoded.payload, `${BAD_VAL}: expected reference`);
      assertObject(value, `${BAD_VAL}: expected reference`);
      const namespace = value['namespace'];
      const id = value['id'];
      if (typeof namespace !== 'string' || typeof id !== 'string') {
        throw new Error(`${BAD_VAL}: expected reference`);
      }
      return { $ref: { namespace, id } } satisfies I18nReference;
    }
    default:
      throw new Error(`${BAD_VAL}: unknown kind`);
  }
}

function rowToTranslationRow(row: TranslationWorkbookRow): TranslationRow {
  if (!isEntryKind(row.kind)) {
    throw new Error(`${BAD_WB}: unknown entry kind ${row.kind}`);
  }
  if (!isTranslationStatus(row.status)) {
    throw new Error(`${BAD_WB}: unknown translation status ${row.status}`);
  }

  if (!isExchangeValueKind(row.sourceValueKind)) {
    throw new Error(`${BAD_WB}: unknown source kind ${row.sourceValueKind}`);
  }
  const sourceValue = decodeExchangeValue({ kind: row.sourceValueKind, payload: row.sourceValue });

  let translatedValue: unknown;
  if (row.translatedValueKind !== '' || row.translatedValue !== '') {
    if (!isExchangeValueKind(row.translatedValueKind)) {
      throw new Error(`${BAD_WB}: unknown target kind ${row.translatedValueKind}`);
    }
    translatedValue = decodeExchangeValue({ kind: row.translatedValueKind, payload: row.translatedValue });
  }

  return {
    namespace: row.namespace,
    id: row.id,
    kind: row.kind,
    sourceLocale: row.sourceLocale,
    targetLocale: row.targetLocale,
    sourceValue,
    translatedValue,
    status: row.status,
    sourceHash: row.sourceHash,
    description: row.description === '' ? undefined : row.description,
  };
}

function translationRowToWorkbookRow(row: TranslationRow): TranslationWorkbookRow {
  const encodedSource = encodeExchangeValue(row.sourceValue);
  const encodedTranslated = row.translatedValue === undefined
    ? undefined
    : encodeExchangeValue(row.translatedValue);

  return {
    namespace: row.namespace,
    id: row.id,
    kind: row.kind,
    sourceLocale: row.sourceLocale,
    targetLocale: row.targetLocale,
    status: row.status,
    sourceHash: row.sourceHash,
    description: row.description ?? '',
    sourceValueKind: encodedSource.kind,
    sourceValue: encodedSource.payload,
    translatedValueKind: encodedTranslated?.kind ?? '',
    translatedValue: encodedTranslated?.payload ?? '',
  };
}

export function exportTranslationWorkbook(
  catalogs: readonly AuthoringCatalog[],
  locale: string,
): ExchangeWorkbook {
  return {
    version: 1,
    sheets: [
      {
        name: `translations-${locale}`,
        columns: COLUMNS,
        rows: exportTranslationRows(catalogs, locale).map((row) => translationRowToWorkbookRow(row)),
      },
    ],
  };
}

export function importTranslationWorkbook(workbook: ExchangeWorkbook): readonly TranslationRow[] {
  if (workbook.version !== 1) {
    throw new Error(`${BAD_WB}: expected version 1`);
  }
  const sheets: unknown = workbook.sheets;
  if (!Array.isArray(sheets)) {
    throw new Error(`${BAD_WB}: expected sheets array`);
  }

  const rows: TranslationRow[] = [];
  for (const sheet of workbook.sheets) {
    if (!COLUMNS.every((column) => sheet.columns.includes(column))) {
      throw new Error(`${BAD_WB}: missing columns in ${sheet.name}`);
    }
    for (const row of sheet.rows) {
      if (!COLUMNS.every((column) => typeof row[column] === 'string')) {
        throw new Error(`${BAD_WB}: non-string cells in ${sheet.name}`);
      }
      rows.push(rowToTranslationRow(row));
    }
  }
  return rows;
}

export function exportCatalogBundle(catalogs: readonly AuthoringCatalog[]): CatalogBundle {
  return {
    version: 1,
    catalogs: catalogs.map((catalog) => ({
      namespace: catalog.namespace,
      entries: catalog.entries.map((entry) => ({
        key: entry.key,
        kind: entry.kind,
        sourceLocale: entry.sourceLocale,
        sourceValue: encodeExchangeValue(entry.sourceValue),
        translations: Object.fromEntries(
          Object.entries(entry.translations).map(([locale, translation]) => [
            locale,
            {
              value: encodeExchangeValue(translation.value),
              sourceHash: translation.sourceHash,
              status: translation.status,
            } satisfies SerializedAuthoringTranslation,
          ]),
        ),
        ...(entry.description === undefined ? {} : { description: entry.description }),
      })),
    })),
  };
}

export function importCatalogBundle(bundle: CatalogBundle): readonly AuthoringCatalog[] {
  if (bundle.version !== 1) {
    throw new Error(`${BAD_CAT}: expected version 1`);
  }
  const catalogs: unknown = bundle.catalogs;
  if (!Array.isArray(catalogs)) {
    throw new Error(`${BAD_CAT}: expected catalogs array`);
  }

  return bundle.catalogs.map((catalog: SerializedAuthoringCatalog) => ({
    namespace: catalog.namespace,
    entries: (catalog.entries).map((entry: SerializedAuthoringCatalogEntry) => {
      if (!isEntryKind(entry.kind)) {
        throw new Error(`${BAD_CAT}: unknown entry kind ${entry.kind}`);
      }
      const serializedTranslations = entry.translations as Record<string, SerializedAuthoringTranslation>;
      const translationEntries = Object.entries(serializedTranslations);
      const translations: Record<string, AuthoringTranslation> = Object.fromEntries(
        translationEntries.map(([locale, translation]: [string, SerializedAuthoringTranslation]) => {
          if (!isTranslationStatus(translation.status)) {
            throw new Error(`${BAD_CAT}: unknown translation status ${translation.status}`);
          }
          return [
            locale,
            {
              value: decodeExchangeValue(translation.value),
              sourceHash: translation.sourceHash,
              status: translation.status,
            } satisfies AuthoringTranslation,
          ];
        }),
      );
      return {
        key: entry.key,
        kind: entry.kind,
        sourceLocale: entry.sourceLocale,
        sourceValue: decodeExchangeValue(entry.sourceValue),
        translations,
        ...(entry.description === undefined ? {} : { description: entry.description }),
      } satisfies AuthoringCatalogEntry;
    }),
  }));
}

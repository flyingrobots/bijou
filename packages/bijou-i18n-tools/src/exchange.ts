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

export type ExchangeValueKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'object'
  | 'array'
  | 'reference';

export interface EncodedExchangeValue {
  readonly kind: ExchangeValueKind;
  readonly payload: string;
}

export interface TranslationWorkbookRow {
  readonly namespace: string;
  readonly id: string;
  readonly kind: string;
  readonly sourceLocale: string;
  readonly targetLocale: string;
  readonly status: string;
  readonly sourceHash: string;
  readonly description: string;
  readonly sourceValueKind: string;
  readonly sourceValue: string;
  readonly translatedValueKind: string;
  readonly translatedValue: string;
}

export interface ExchangeSheet {
  readonly name: string;
  readonly columns: readonly string[];
  readonly rows: readonly TranslationWorkbookRow[];
}

export interface ExchangeWorkbook {
  readonly version: 1;
  readonly sheets: readonly ExchangeSheet[];
}

export interface SerializedAuthoringTranslation {
  readonly value: EncodedExchangeValue;
  readonly sourceHash: string;
  readonly status: AuthoringTranslationStatus;
}

export interface SerializedAuthoringCatalogEntry {
  readonly key: I18nCatalogKey;
  readonly kind: I18nEntryKind;
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
  readonly version: 1;
  readonly catalogs: readonly SerializedAuthoringCatalog[];
}

const TRANSLATION_WORKBOOK_COLUMNS = [
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
  throw new Error(`Invalid exchange value: unsupported type ${typeof value}`);
}

export function decodeExchangeValue(encoded: EncodedExchangeValue): unknown {
  switch (encoded.kind) {
    case 'string':
      return encoded.payload;
    case 'number': {
      const value = Number(encoded.payload);
      if (Number.isNaN(value)) {
        throw new Error(`Invalid exchange value: expected number payload, received ${encoded.payload}`);
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
      throw new Error(`Invalid exchange value: expected boolean payload, received ${encoded.payload}`);
    case 'null':
      return null;
    case 'array': {
      const value = parseJson(encoded.payload, 'Invalid exchange value: expected array payload');
      if (!Array.isArray(value)) {
        throw new Error('Invalid exchange value: expected array payload');
      }
      return value;
    }
    case 'object': {
      const value = parseJson(encoded.payload, 'Invalid exchange value: expected object payload');
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error('Invalid exchange value: expected object payload');
      }
      return value;
    }
    case 'reference': {
      const value = parseJson(encoded.payload, 'Invalid exchange value: expected reference payload');
      assertObject(value, 'Invalid exchange value: expected reference payload');
      const namespace = value['namespace'];
      const id = value['id'];
      if (typeof namespace !== 'string' || typeof id !== 'string') {
        throw new Error('Invalid exchange value: expected reference payload');
      }
      return { $ref: { namespace, id } } satisfies I18nReference;
    }
    default:
      throw new Error('Invalid exchange value: unknown kind');
  }
}

function rowToTranslationRow(row: TranslationWorkbookRow): TranslationRow {
  if (!isEntryKind(row.kind)) {
    throw new Error(`Invalid translation workbook: unknown entry kind ${row.kind}`);
  }
  if (!isTranslationStatus(row.status)) {
    throw new Error(`Invalid translation workbook: unknown translation status ${row.status}`);
  }

  const sourceValue = decodeExchangeValue({
    kind: row.sourceValueKind as ExchangeValueKind,
    payload: row.sourceValue,
  });

  let translatedValue: unknown;
  if (row.translatedValueKind !== '' || row.translatedValue !== '') {
    translatedValue = decodeExchangeValue({
      kind: row.translatedValueKind as ExchangeValueKind,
      payload: row.translatedValue,
    });
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
        columns: TRANSLATION_WORKBOOK_COLUMNS,
        rows: exportTranslationRows(catalogs, locale).map((row) => translationRowToWorkbookRow(row)),
      },
    ],
  };
}

export function importTranslationWorkbook(workbook: ExchangeWorkbook): readonly TranslationRow[] {
  if (workbook.version !== 1 || !Array.isArray(workbook.sheets)) {
    throw new Error('Invalid translation workbook: expected versioned workbook payload');
  }

  const rows: TranslationRow[] = [];
  for (const sheet of workbook.sheets) {
    if (!TRANSLATION_WORKBOOK_COLUMNS.every((column) => sheet.columns.includes(column))) {
      throw new Error(`Invalid translation workbook: missing required columns in ${sheet.name}`);
    }
    for (const row of sheet.rows) {
      if (!TRANSLATION_WORKBOOK_COLUMNS.every((column) => typeof row[column] === 'string')) {
        throw new Error(`Invalid translation workbook: row in ${sheet.name} contains non-string cells`);
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
  if (bundle.version !== 1 || !Array.isArray(bundle.catalogs)) {
    throw new Error('Invalid catalog bundle: expected versioned bundle payload');
  }

  return bundle.catalogs.map((catalog: SerializedAuthoringCatalog) => ({
    namespace: catalog.namespace,
    entries: (catalog.entries as readonly SerializedAuthoringCatalogEntry[]).map((entry: SerializedAuthoringCatalogEntry) => {
      if (!isEntryKind(entry.kind)) {
        throw new Error(`Invalid catalog bundle: unknown entry kind ${entry.kind}`);
      }
      const serializedTranslations = entry.translations as Record<string, SerializedAuthoringTranslation>;
      const translationEntries = Object.entries(serializedTranslations) as Array<[string, SerializedAuthoringTranslation]>;
      const translations: Record<string, AuthoringTranslation> = Object.fromEntries(
        translationEntries.map(([locale, translation]: [string, SerializedAuthoringTranslation]) => {
          if (!isTranslationStatus(translation.status)) {
            throw new Error(`Invalid catalog bundle: unknown translation status ${translation.status}`);
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

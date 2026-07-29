import type { I18nReference } from '@flyingrobots/bijou-i18n';
import type { AuthoringCatalog, TranslationRow } from './tools.js';
import { exportTranslationRows } from './tools.js';
import { BAD_VAL, BAD_WB, COLUMNS, assertObject, encodeExchangeValue, isEntryKind, isExchangeValueKind, isTranslationStatus, parseJson } from './exchange.part01.js';
import type { EncodedExchangeValue, ExchangeWorkbook, TranslationWorkbookRow } from './exchange.part01.js';

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

export { rowToTranslationRow };

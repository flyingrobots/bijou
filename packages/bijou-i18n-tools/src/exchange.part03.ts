import type { AuthoringCatalog, AuthoringCatalogEntry, AuthoringTranslation, TranslationRow } from './tools.js';
import { BAD_CAT, BAD_WB, COLUMNS, encodeExchangeValue, isEntryKind, isTranslationStatus } from './exchange.part01.js';
import type { CatalogBundle, ExchangeWorkbook, SerializedAuthoringCatalog, SerializedAuthoringCatalogEntry, SerializedAuthoringTranslation } from './exchange.part01.js';
import { decodeExchangeValue, rowToTranslationRow } from './exchange.part02.js';

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

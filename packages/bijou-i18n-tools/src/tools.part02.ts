import {
  type AuthoringCatalog,
  type AuthoringCatalogEntry,
  type AuthoringTranslation,
  type TranslationRow,
  hashSourceValue,
  isReference,
  keyToString,
} from './tools.part01.js';

export function exportTranslationRows(
  catalogs: readonly AuthoringCatalog[],
  locale: string,
): readonly TranslationRow[] {
  const rows: TranslationRow[] = [];
  for (const catalog of catalogs) {
    for (const entry of catalog.entries) {
      const sourceHash = hashSourceValue(entry.sourceValue);
      const translation = entry.translations[locale];
      if (translation === undefined) {
        rows.push({
          namespace: entry.key.namespace,
          id: entry.key.id,
          kind: entry.kind,
          sourceLocale: entry.sourceLocale,
          targetLocale: locale,
          sourceValue: entry.sourceValue,
          status: 'missing',
          sourceHash,
          description: entry.description,
        });
        continue;
      }
      if (translation.status === 'current') {
        continue;
      }
      rows.push({
        namespace: entry.key.namespace,
        id: entry.key.id,
        kind: entry.kind,
        sourceLocale: entry.sourceLocale,
        targetLocale: locale,
        sourceValue: entry.sourceValue,
        translatedValue: translation.value,
        status: translation.status,
        sourceHash,
        description: entry.description,
      });
    }
  }
  return rows;
}
export function importTranslationRows(
  catalogs: readonly AuthoringCatalog[],
  rows: readonly TranslationRow[],
): readonly AuthoringCatalog[] {
  const rowsByKey = new Map<string, TranslationRow>();
  for (const row of rows) {
    rowsByKey.set(`${row.namespace}:${row.id}:${row.targetLocale}`, row);
  }

  return catalogs.map((catalog) => ({
    ...catalog,
    entries: catalog.entries.map((entry) => {
      const translations: Record<string, AuthoringTranslation> = {
        ...entry.translations,
      };
      for (const [rowKey, row] of rowsByKey.entries()) {
        const expectedPrefix = `${entry.key.namespace}:${entry.key.id}:`;
        if (!rowKey.startsWith(expectedPrefix)) {
          continue;
        }
        if (row.translatedValue === undefined) {
          continue;
        }
        translations[row.targetLocale] = {
          value: row.translatedValue,
          sourceHash: row.sourceHash,
          status: 'current',
        };
      }
      return {
        ...entry,
        translations,
      };
    }),
  }));
}
export function validateAndResolve(
  entryMap: Map<string, AuthoringCatalogEntry>,
  value: unknown,
  seen: Set<string>,
): unknown {
  if (!isReference(value)) {
    return value;
  }
  const refKey = keyToString(value.$ref);
  if (seen.has(refKey)) {
    throw new Error(`Cyclic i18n tooling reference: ${refKey}`);
  }
  const referencedEntry = entryMap.get(refKey);
  if (referencedEntry === undefined) {
    throw new Error(`Missing i18n tooling reference: ${refKey}`);
  }
  seen.add(refKey);
  const resolved = validateAndResolve(
    entryMap,
    referencedEntry.sourceValue,
    seen,
  );
  seen.delete(refKey);
  return resolved;
}

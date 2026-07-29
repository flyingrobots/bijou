import { execFileSync } from 'node:child_process';
import {
  parseStringTable,
  type StringTable,
  type StringTableRow,
} from '../packages/bijou-i18n-tools/src/index.js';
import {
  type DogfoodI18nCompletenessIssue,
  type IndexedEntry,
} from './dogfood-i18n-completeness.part01.js';

const SOURCE_TABLE_PATH = 'examples/docs/i18n/source/dogfood-strings.csv';

export function readBaseStringTable(baseRef: string): StringTable {
  const comparisonRef = comparisonRefFor(baseRef);
  try {
    return parseStringTable(
      gitOutput(['show', `${comparisonRef}:${SOURCE_TABLE_PATH}`]),
      'csv',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`unable to read base at ${comparisonRef}: ${message}`, {
      cause: error,
    });
  }
}
export function comparisonRefFor(baseRef: string): string {
  try {
    return gitOutput(['merge-base', 'HEAD', baseRef]).trim() || baseRef;
  } catch {
    return baseRef;
  }
}
export function gitOutput(args: readonly string[]): string {
  return execFileSync('git', [...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}
export function indexStringTable(
  table: StringTable,
): ReadonlyMap<string, IndexedEntry> {
  const entries = new Map<
    string,
    { source?: StringTableRow; rowsByLocale: Map<string, StringTableRow> }
  >();
  for (const row of table.rows) {
    const key = entryKey(row);
    const entry = entries.get(key) ?? {
      rowsByLocale: new Map<string, StringTableRow>(),
    };
    const source =
      row.locale === row.sourceLocale ? row : (entry.source ?? row);
    entry.rowsByLocale.set(row.locale, row);
    entries.set(key, { source, rowsByLocale: entry.rowsByLocale });
  }

  return Object.freeze(
    new Map(
      [...entries.entries()].map(([key, entry]) => {
        if (entry.source === undefined) {
          throw new Error(`missing source row for ${key}`);
        }
        return [
          key,
          Object.freeze({
            source: entry.source,
            rowsByLocale: entry.rowsByLocale,
          }),
        ];
      }),
    ),
  );
}
export function entryKey(
  row: Pick<StringTableRow, 'namespace' | 'id'>,
): string {
  return `${row.namespace}\u0000${row.id}`;
}
export function entrySignature(
  entry: IndexedEntry,
  locales: readonly string[],
): string {
  return [
    rowSignature(entry.source),
    ...locales.map((locale) => {
      const row = entry.rowsByLocale.get(locale);
      return row === undefined
        ? `${locale}\u0002<missing>`
        : `${locale}\u0002${rowSignature(row)}`;
    }),
  ].join('\u0000');
}
export function rowSignature(row: StringTableRow): string {
  return [
    row.kind,
    row.sourceLocale,
    row.sourceValueKind,
    row.sourceValue,
    row.locale,
    row.valueKind,
    row.value,
    row.status,
  ].join('\u0001');
}
export function issue(
  row: Pick<StringTableRow, 'namespace' | 'id'>,
  locale: string,
  reason: string,
): DogfoodI18nCompletenessIssue {
  return Object.freeze({
    namespace: row.namespace,
    id: row.id,
    locale,
    reason,
  });
}

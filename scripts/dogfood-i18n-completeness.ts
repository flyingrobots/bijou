#!/usr/bin/env tsx

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { DOGFOOD_LOCALE_OPTIONS } from '../examples/docs/locale.js';
import { dogfoodStringTable } from '../examples/docs/i18n/dogfood-authoring.js';
import {
  parseStringTable,
  type StringTable,
  type StringTableRow,
} from '../packages/bijou-i18n-tools/src/index.js';

export interface DogfoodI18nCompletenessIssue {
  readonly namespace: string;
  readonly id: string;
  readonly locale: string;
  readonly reason: string;
}

export interface DogfoodI18nCompletenessResult {
  readonly ok: boolean;
  readonly checked: number;
  readonly issues: readonly DogfoodI18nCompletenessIssue[];
}

export interface DogfoodI18nCompletenessOptions {
  readonly table: StringTable;
  readonly baseTable?: StringTable;
  readonly locales?: readonly string[];
}

export interface DogfoodI18nCompletenessIO {
  readonly args?: readonly string[];
  readonly table?: StringTable;
  readonly baseTable?: StringTable;
  readonly locales?: readonly string[];
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
}

interface IndexedEntry {
  readonly source: StringTableRow;
  readonly rowsByLocale: ReadonlyMap<string, StringTableRow>;
}

const SOURCE_TABLE_PATH = 'examples/docs/i18n/source/dogfood-strings.csv';
const DEFAULT_BASE_REF = 'origin/main';

export function evaluateDogfoodI18nCompleteness(
  options: DogfoodI18nCompletenessOptions,
): DogfoodI18nCompletenessResult {
  const locales = options.locales ?? DOGFOOD_LOCALE_OPTIONS.map((locale) => locale.id);
  const currentEntries = indexStringTable(options.table);
  const baseEntries = options.baseTable === undefined
    ? undefined
    : indexStringTable(options.baseTable);
  const changedKeys = [...currentEntries.entries()]
    .filter(([key, entry]) => {
      const baseEntry = baseEntries?.get(key);
      return baseEntry === undefined || entrySignature(entry.source) !== entrySignature(baseEntry.source);
    })
    .map(([key]) => key)
    .sort((left, right) => left.localeCompare(right));

  const issues: DogfoodI18nCompletenessIssue[] = [];
  for (const key of changedKeys) {
    const entry = currentEntries.get(key);
    if (entry === undefined) continue;
    for (const locale of locales) {
      const row = entry.rowsByLocale.get(locale);
      if (row === undefined) {
        issues.push(issue(entry.source, locale, 'missing locale row'));
        continue;
      }
      if (row.status !== 'current') {
        issues.push(issue(entry.source, locale, `status is ${row.status}`));
        continue;
      }
      if (row.valueKind === '') {
        issues.push(issue(entry.source, locale, 'missing value kind'));
        continue;
      }
      if (row.value === '') {
        issues.push(issue(entry.source, locale, 'missing value'));
      }
    }
  }

  return Object.freeze({
    ok: issues.length === 0,
    checked: changedKeys.length,
    issues: Object.freeze(issues),
  });
}

export function runDogfoodI18nCompleteness(io: DogfoodI18nCompletenessIO = {}): number {
  const args = io.args ?? process.argv.slice(2);
  const stdout = io.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr = io.stderr ?? ((text: string) => process.stderr.write(text));
  if (args.includes('--help')) {
    stdout([
      'Usage: npm run dogfood:i18n:complete [-- --base <ref> | --all]',
      '',
      'Checks DOGFOOD localization rows changed relative to a git base ref.',
      'Every changed source string must have current values for all supported locales.',
      '',
    ].join('\n'));
    return 0;
  }

  try {
    const table = io.table ?? dogfoodStringTable();
    const baseTable = io.baseTable ?? (args.includes('--all')
      ? undefined
      : readBaseStringTable(baseRefFromArgs(args)));
    const result = evaluateDogfoodI18nCompleteness({
      table,
      baseTable,
      locales: io.locales,
    });
    if (result.ok) {
      stdout(`dogfood-i18n-completeness: ok (${result.checked} changed source strings)\n`);
      return 0;
    }

    stderr([
      `dogfood-i18n-completeness: failed (${result.checked} changed source strings; ${result.issues.length} issues)`,
      ...result.issues.map((entry) => (
        `- ${entry.namespace}:${entry.id} [${entry.locale}] ${entry.reason}`
      )),
      '',
    ].join('\n'));
    return 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr(`dogfood-i18n-completeness: ${message}\n`);
    return 1;
  }
}

function baseRefFromArgs(args: readonly string[]): string {
  const explicitBaseIndex = args.indexOf('--base');
  if (explicitBaseIndex >= 0 && args[explicitBaseIndex + 1] === undefined) {
    throw new Error('missing value for --base');
  }
  const explicitBase = explicitBaseIndex >= 0 ? args[explicitBaseIndex + 1] : undefined;
  return explicitBase ?? process.env.DOGFOOD_I18N_BASE_REF ?? DEFAULT_BASE_REF;
}

function readBaseStringTable(baseRef: string): StringTable {
  const comparisonRef = comparisonRefFor(baseRef);
  try {
    return parseStringTable(gitOutput(['show', `${comparisonRef}:${SOURCE_TABLE_PATH}`]), 'csv');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `unable to read ${SOURCE_TABLE_PATH} at ${comparisonRef}; fetch the base ref or pass --base <ref>: ${message}`,
    );
  }
}

function comparisonRefFor(baseRef: string): string {
  try {
    return gitOutput(['merge-base', 'HEAD', baseRef]).trim() || baseRef;
  } catch {
    return baseRef;
  }
}

function gitOutput(args: readonly string[]): string {
  return execFileSync('git', [...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function indexStringTable(table: StringTable): ReadonlyMap<string, IndexedEntry> {
  const entries = new Map<string, { source?: StringTableRow; rowsByLocale: Map<string, StringTableRow> }>();
  for (const row of table.rows) {
    const key = entryKey(row);
    const entry = entries.get(key) ?? { rowsByLocale: new Map<string, StringTableRow>() };
    const source = row.locale === row.sourceLocale ? row : entry.source ?? row;
    entry.rowsByLocale.set(row.locale, row);
    entries.set(key, { source, rowsByLocale: entry.rowsByLocale });
  }

  return Object.freeze(new Map([...entries.entries()].map(([key, entry]) => {
    if (entry.source === undefined) {
      throw new Error(`missing source row for ${key}`);
    }
    return [key, Object.freeze({
      source: entry.source,
      rowsByLocale: entry.rowsByLocale,
    })];
  })));
}

function entryKey(row: Pick<StringTableRow, 'namespace' | 'id'>): string {
  return `${row.namespace}\u0000${row.id}`;
}

function entrySignature(row: StringTableRow): string {
  return [
    row.kind,
    row.sourceLocale,
    row.sourceValueKind,
    row.sourceValue,
  ].join('\u0000');
}

function issue(
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

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = runDogfoodI18nCompleteness();
}

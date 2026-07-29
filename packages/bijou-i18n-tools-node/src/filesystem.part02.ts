import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { I18nCatalog } from '@flyingrobots/bijou-i18n';
import { runtimeCatalogsByLocaleFromStringTable, type StringTable } from '@flyingrobots/bijou-i18n-tools';
import { isJsonRecord, runtimeCatalogFileName } from './filesystem.part01.js';

export async function writeRuntimeCatalogFiles(
  dir: string,
  table: StringTable,
): Promise<void> {
  const byLocale = runtimeCatalogsByLocaleFromStringTable(table);
  await mkdir(dir, { recursive: true });
  for (const [locale, catalogs] of Object.entries(byLocale)) {
    const localeDir = join(dir, locale);
    await mkdir(localeDir, { recursive: true });
    for (const catalog of catalogs) {
      await writeFile(
        join(localeDir, runtimeCatalogFileName(catalog.namespace)),
        `${JSON.stringify(catalog, null, 2)}\n`,
        'utf8',
      );
    }
  }
}

export function writeRuntimeCatalogFilesSync(
  dir: string,
  table: StringTable,
): void {
  const byLocale = runtimeCatalogsByLocaleFromStringTable(table);
  mkdirSync(dir, { recursive: true });
  for (const [locale, catalogs] of Object.entries(byLocale)) {
    const localeDir = join(dir, locale);
    mkdirSync(localeDir, { recursive: true });
    for (const catalog of catalogs) {
      writeFileSync(
        join(localeDir, runtimeCatalogFileName(catalog.namespace)),
        `${JSON.stringify(catalog, null, 2)}\n`,
        'utf8',
      );
    }
  }
}

function parseRuntimeCatalogEntry(value: unknown, context: string): I18nCatalog['entries'][number] {
  if (!isJsonRecord(value)) {
    throw new Error(`Invalid runtime catalog json: expected entry object in ${context}`);
  }

  const { key, kind, sourceLocale, values } = value;
  if (!isJsonRecord(key)) {
    throw new Error(`Invalid runtime catalog json: expected entry key object in ${context}`);
  }
  if (typeof key['namespace'] !== 'string' || typeof key['id'] !== 'string') {
    throw new Error(`Invalid runtime catalog json: entry key requires namespace and id in ${context}`);
  }
  if (kind !== 'message' && kind !== 'resource' && kind !== 'data') {
    throw new Error(`Invalid runtime catalog json: unsupported entry kind in ${context}`);
  }
  if (typeof sourceLocale !== 'string' || !isJsonRecord(values)) {
    throw new Error(`Invalid runtime catalog json: entry requires sourceLocale and values in ${context}`);
  }

  const entry: I18nCatalog['entries'][number] = {
    key: { namespace: key['namespace'], id: key['id'] },
    kind,
    sourceLocale,
    values,
  };
  return Object.hasOwn(value, 'fallbackValue')
    ? { ...entry, fallbackValue: value['fallbackValue'] }
    : entry;
}

function parseRuntimeCatalog(input: string, context: string): I18nCatalog {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error(`Invalid runtime catalog json: malformed json in ${context}`);
  }
  if (!isJsonRecord(parsed)) {
    throw new Error(`Invalid runtime catalog json: expected object in ${context}`);
  }
  const { namespace, entries } = parsed;
  if (typeof namespace !== 'string' || !Array.isArray(entries)) {
    throw new Error(`Invalid runtime catalog json: missing namespace or entries in ${context}`);
  }
  return {
    namespace,
    entries: entries.map((entry, index) => parseRuntimeCatalogEntry(entry, `${context} entries[${String(index)}]`)),
  };
}

export async function readRuntimeCatalogFilesForLocale(
  dir: string,
  locale: string,
): Promise<readonly I18nCatalog[]> {
  const localeDir = join(dir, locale);
  const files = (await readdir(localeDir))
    .filter((file) => file.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));
  const catalogs = await Promise.all(files.map(async (file) => parseRuntimeCatalog(
    await readFile(join(localeDir, file), 'utf8'),
    `${localeDir}/${file}`,
  )));
  return Object.freeze(catalogs);
}

export function readRuntimeCatalogFilesForLocaleSync(
  dir: string,
  locale: string,
): readonly I18nCatalog[] {
  const localeDir = join(dir, locale);
  const files = readdirSync(localeDir)
    .filter((file) => file.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));
  return Object.freeze(files.map((file) => parseRuntimeCatalog(
    readFileSync(join(localeDir, file), 'utf8'),
    `${localeDir}/${file}`,
  )));
}

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import type { I18nCatalog } from '@flyingrobots/bijou-i18n';
import {
  parseStringTable,
  parseCatalogBundleJson,
  parseExchangeSheet,
  runtimeCatalogsByLocaleFromStringTable,
  serializeCatalogBundleJson,
  serializeExchangeSheet,
  serializeStringTable,
  type CatalogBundle,
  type DelimitedFormat,
  type ExchangeSheet,
  type ExchangeWorkbook,
  type StringTable,
} from '@flyingrobots/bijou-i18n-tools';

export interface WorkbookDirectorySheet {
  readonly name: string;
  readonly fileName: string;
}

export interface WorkbookDirectoryManifest {
  readonly version: 1;
  readonly format: DelimitedFormat;
  readonly sheets: readonly WorkbookDirectorySheet[];
}

function inferDelimitedFormat(path: string): DelimitedFormat {
  const extension = extname(path).toLowerCase();
  if (extension === '.csv') {
    return 'csv';
  }
  if (extension === '.tsv') {
    return 'tsv';
  }
  throw new Error(`Unsupported sheet file extension: ${extension || '(none)'}`);
}

function inferBundleExtension(path: string): void {
  const extension = extname(path).toLowerCase();
  if (extension !== '.json') {
    throw new Error(`Unsupported catalog bundle file extension: ${extension || '(none)'}`);
  }
}

function slugifySheetName(name: string): string {
  const slug = name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-');
  return slug.length === 0 ? 'sheet' : slug;
}

function manifestPath(dir: string): string {
  return join(dir, 'workbook.json');
}

function sheetNameFromPath(path: string): string {
  const base = basename(path);
  const extension = extname(base);
  return base.slice(0, base.length - extension.length);
}

function isJsonRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function writeExchangeSheetFile(
  path: string,
  sheet: ExchangeSheet,
  format?: DelimitedFormat,
): Promise<void> {
  const resolvedFormat = format ?? inferDelimitedFormat(path);
  const content = serializeExchangeSheet(sheet, resolvedFormat);
  await mkdir(dirnameSafe(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

export async function writeStringTableFile(
  path: string,
  table: StringTable,
  format?: DelimitedFormat,
): Promise<void> {
  const resolvedFormat = format ?? inferDelimitedFormat(path);
  await mkdir(dirnameSafe(path), { recursive: true });
  await writeFile(path, serializeStringTable(table, resolvedFormat), 'utf8');
}

export async function readStringTableFile(
  path: string,
  format?: DelimitedFormat,
): Promise<StringTable> {
  const resolvedFormat = format ?? inferDelimitedFormat(path);
  const content = await readFile(path, 'utf8');
  return parseStringTable(content, resolvedFormat);
}

export function readStringTableFileSync(
  path: string,
  format?: DelimitedFormat,
): StringTable {
  const resolvedFormat = format ?? inferDelimitedFormat(path);
  const content = readFileSync(path, 'utf8');
  return parseStringTable(content, resolvedFormat);
}

export async function readExchangeSheetFile(
  path: string,
  format?: DelimitedFormat,
): Promise<ExchangeSheet> {
  const resolvedFormat = format ?? inferDelimitedFormat(path);
  const content = await readFile(path, 'utf8');
  return parseExchangeSheet(sheetNameFromPath(path), content, resolvedFormat);
}

export async function writeCatalogBundleFile(path: string, bundle: CatalogBundle): Promise<void> {
  inferBundleExtension(path);
  await mkdir(dirnameSafe(path), { recursive: true });
  await writeFile(path, serializeCatalogBundleJson(bundle), 'utf8');
}

export async function readCatalogBundleFile(path: string): Promise<CatalogBundle> {
  inferBundleExtension(path);
  const content = await readFile(path, 'utf8');
  return parseCatalogBundleJson(content);
}

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

export async function writeExchangeWorkbookDirectory(
  dir: string,
  workbook: ExchangeWorkbook,
  format: DelimitedFormat,
): Promise<void> {
  await mkdir(dir, { recursive: true });

  const manifest: WorkbookDirectoryManifest = {
    version: 1,
    format,
    sheets: workbook.sheets.map((sheet) => ({
      name: sheet.name,
      fileName: `${slugifySheetName(sheet.name)}.${format}`,
    })),
  };

  for (const sheet of workbook.sheets) {
    const entry = manifest.sheets.find((candidate) => candidate.name === sheet.name);
    if (entry === undefined) {
      throw new Error(`Missing workbook manifest entry for sheet: ${sheet.name}`);
    }
    await writeFile(join(dir, entry.fileName), serializeExchangeSheet(sheet, format), 'utf8');
  }

  await writeFile(manifestPath(dir), JSON.stringify(manifest, null, 2), 'utf8');
}

export async function readExchangeWorkbookDirectory(dir: string): Promise<ExchangeWorkbook> {
  let manifestRaw: string;
  try {
    manifestRaw = await readFile(manifestPath(dir), 'utf8');
  } catch {
    throw new Error(`Missing workbook manifest: ${manifestPath(dir)}`);
  }

  const manifest = parseWorkbookManifest(manifestRaw);
  const sheets: ExchangeSheet[] = [];
  for (const sheet of manifest.sheets) {
    const path = join(dir, sheet.fileName);
    let content: string;
    try {
      content = await readFile(path, 'utf8');
    } catch {
      throw new Error(`Missing workbook sheet file: ${path}`);
    }
    sheets.push(parseExchangeSheet(sheet.name, content, manifest.format));
  }

  return {
    version: 1,
    sheets,
  };
}

function parseWorkbookManifest(input: string): WorkbookDirectoryManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error('Invalid workbook manifest: malformed json');
  }

  if (!isJsonRecord(parsed)) {
    throw new Error('Invalid workbook manifest: expected object');
  }
  const { version, format, sheets } = parsed;
  if (version !== 1) {
    throw new Error(`Invalid workbook manifest: unsupported version ${String(version)}`);
  }
  if (format !== 'csv' && format !== 'tsv') {
    throw new Error(`Invalid workbook manifest: unsupported format ${String(format)}`);
  }
  if (!Array.isArray(sheets)) {
    throw new Error('Invalid workbook manifest: expected sheets array');
  }

  const parsedSheets = sheets.map((sheet) => {
    if (!isJsonRecord(sheet)) {
      throw new Error('Invalid workbook manifest: sheet entry must be an object');
    }
    const { name, fileName } = sheet;
    if (typeof name !== 'string' || typeof fileName !== 'string') {
      throw new Error('Invalid workbook manifest: sheet entry requires name and fileName');
    }
    return { name, fileName } satisfies WorkbookDirectorySheet;
  });

  return {
    version: 1,
    format,
    sheets: parsedSheets,
  };
}

function dirnameSafe(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash <= 0 ? '.' : path.slice(0, slash);
}

function runtimeCatalogFileName(namespace: string): string {
  return `${encodeURIComponent(namespace)}.json`;
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

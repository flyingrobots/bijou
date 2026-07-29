import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { parseStringTable, parseCatalogBundleJson, parseExchangeSheet, serializeCatalogBundleJson, serializeExchangeSheet, serializeStringTable, type CatalogBundle, type DelimitedFormat, type ExchangeSheet, type StringTable } from '@flyingrobots/bijou-i18n-tools';

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

function dirnameSafe(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash <= 0 ? '.' : path.slice(0, slash);
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

function runtimeCatalogFileName(namespace: string): string {
  return `${encodeURIComponent(namespace)}.json`;
}

export { isJsonRecord, manifestPath, runtimeCatalogFileName, slugifySheetName };

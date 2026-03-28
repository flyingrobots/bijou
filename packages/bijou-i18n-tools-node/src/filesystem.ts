import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import {
  parseCatalogBundleJson,
  parseExchangeSheet,
  serializeCatalogBundleJson,
  serializeExchangeSheet,
  type CatalogBundle,
  type DelimitedFormat,
  type ExchangeSheet,
  type ExchangeWorkbook,
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

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid workbook manifest: expected object');
  }
  const version = (parsed as { version?: unknown }).version;
  const format = (parsed as { format?: unknown }).format;
  const sheets = (parsed as { sheets?: unknown }).sheets;
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
    if (typeof sheet !== 'object' || sheet === null || Array.isArray(sheet)) {
      throw new Error('Invalid workbook manifest: sheet entry must be an object');
    }
    const name = (sheet as { name?: unknown }).name;
    const fileName = (sheet as { fileName?: unknown }).fileName;
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

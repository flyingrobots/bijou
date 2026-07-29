import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseExchangeSheet, serializeExchangeSheet, type DelimitedFormat, type ExchangeSheet, type ExchangeWorkbook } from '@flyingrobots/bijou-i18n-tools';
import { isJsonRecord, manifestPath, slugifySheetName } from './filesystem.part01.js';
import type { WorkbookDirectoryManifest, WorkbookDirectorySheet } from './filesystem.part01.js';

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

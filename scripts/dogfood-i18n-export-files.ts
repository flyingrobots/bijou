import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serializeExchangeSheet } from '../packages/bijou-i18n-tools/src/index.js';
import { createDogfoodTranslationWorkbook } from '../examples/docs/i18n/dogfood-authoring.js';

export async function writeTextFile(
  path: string,
  content: string,
): Promise<void> {
  await mkdir(dirnameSafe(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

export async function writeWorkbookDirectory(
  directory: string,
  workbook: ReturnType<typeof createDogfoodTranslationWorkbook>,
  format: 'csv' | 'tsv',
): Promise<void> {
  await mkdir(directory, { recursive: true });
  const manifest = {
    version: 1,
    format,
    sheets: workbook.sheets.map((sheet) => ({
      name: sheet.name,
      fileName: `${sheet.name}.${format}`,
    })),
  };
  for (const sheet of workbook.sheets) {
    await writeFile(
      join(directory, `${sheet.name}.${format}`),
      serializeExchangeSheet(sheet, format),
      'utf8',
    );
  }
  await writeFile(
    join(directory, 'workbook.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
}

function dirnameSafe(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash <= 0 ? '.' : path.slice(0, slash);
}

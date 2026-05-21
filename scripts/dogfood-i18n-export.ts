import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  serializeCatalogBundleJson,
  serializeExchangeSheet,
} from '../packages/bijou-i18n-tools/src/index.js';
import {
  createDogfoodCatalogBundle,
  createDogfoodTranslationWorkbook,
  dogfoodI18nCoverage,
} from '../examples/docs/i18n/dogfood-authoring.js';

type DogfoodI18nExportFormat = 'csv' | 'tsv' | 'json';

export interface DogfoodI18nExportOptions {
  readonly args?: readonly string[];
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
}

export interface DogfoodI18nExportResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

interface ParsedArgs {
  readonly locale?: string;
  readonly format: DogfoodI18nExportFormat;
  readonly out?: string;
  readonly bundle?: string;
  readonly coverage: boolean;
  readonly help: boolean;
}

function usage(): string {
  return [
    'Usage: npm run dogfood:i18n:export -- --locale <locale> [--format csv|tsv] [--out <dir>] [--bundle <path>]',
    '       npm run dogfood:i18n:export -- --format json [--bundle <path>]',
    '       npm run dogfood:i18n:export -- --coverage',
  ].join('\n');
}

function parseArgs(args: readonly string[]): ParsedArgs {
  let locale: string | undefined;
  let format: DogfoodI18nExportFormat = 'csv';
  let out: string | undefined;
  let bundle: string | undefined;
  let coverage = false;
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--locale') {
      locale = requireArg(args, index, '--locale');
      index += 1;
      continue;
    }
    if (arg === '--format') {
      const value = requireArg(args, index, '--format');
      if (value !== 'csv' && value !== 'tsv' && value !== 'json') {
        throw new Error(`Unsupported Dogfood i18n export format: ${value}`);
      }
      format = value;
      index += 1;
      continue;
    }
    if (arg === '--out') {
      out = requireArg(args, index, '--out');
      index += 1;
      continue;
    }
    if (arg === '--bundle') {
      bundle = requireArg(args, index, '--bundle');
      index += 1;
      continue;
    }
    if (arg === '--coverage') {
      coverage = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }
    throw new Error(`Unknown Dogfood i18n export argument: ${arg}`);
  }

  return {
    locale,
    format,
    out,
    bundle,
    coverage,
    help,
  };
}

function requireArg(args: readonly string[], index: number, name: string): string {
  const value = args[index + 1];
  if (value == null || value.startsWith('--')) {
    throw new Error(`Missing value for ${name}`);
  }
  return value;
}

export async function runDogfoodI18nExport(
  options: DogfoodI18nExportOptions = {},
): Promise<DogfoodI18nExportResult> {
  const args = options.args ?? process.argv.slice(2);
  let stdout = '';
  let stderr = '';
  const writeStdout = (text: string) => {
    stdout += text;
    options.stdout?.(text);
  };
  const writeStderr = (text: string) => {
    stderr += text;
    options.stderr?.(text);
  };

  try {
    const parsed = parseArgs(args);
    if (parsed.help) {
      writeStdout(`${usage()}\n`);
      return { exitCode: 0, stdout, stderr };
    }
    if (parsed.coverage) {
      writeStdout(`${dogfoodI18nCoverage()
        .map((entry) => `${entry.locale}: ${entry.translated}/${entry.total} translated (${entry.missing} missing)`)
        .join('\n')}\n`);
      return { exitCode: 0, stdout, stderr };
    }

    const bundle = createDogfoodCatalogBundle();
    if (parsed.format === 'json') {
      const content = `${serializeCatalogBundleJson(bundle)}\n`;
      if (parsed.bundle != null) {
        await writeTextFile(parsed.bundle, content);
      } else {
        writeStdout(content);
      }
      return { exitCode: 0, stdout, stderr };
    }

    if (parsed.locale == null) {
      throw new Error('Dogfood i18n CSV/TSV export requires --locale');
    }

    const workbook = createDogfoodTranslationWorkbook(parsed.locale);
    if (parsed.out != null) {
      await writeWorkbookDirectory(parsed.out, workbook, parsed.format);
    } else {
      const sheet = workbook.sheets[0];
      if (sheet == null) {
        throw new Error(`Dogfood i18n export produced no sheet for ${parsed.locale}`);
      }
      writeStdout(`${serializeExchangeSheet(sheet, parsed.format)}\n`);
    }
    if (parsed.bundle != null) {
      await writeTextFile(parsed.bundle, `${serializeCatalogBundleJson(bundle)}\n`);
    }
    return { exitCode: 0, stdout, stderr };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeStderr(`${message}\n`);
    if (!message.startsWith('Usage:')) {
      writeStderr(`${usage()}\n`);
    }
    return { exitCode: 1, stdout, stderr };
  }
}

async function writeTextFile(path: string, content: string): Promise<void> {
  await mkdir(dirnameSafe(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

async function writeWorkbookDirectory(
  dir: string,
  workbook: ReturnType<typeof createDogfoodTranslationWorkbook>,
  format: 'csv' | 'tsv',
): Promise<void> {
  await mkdir(dir, { recursive: true });
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
      join(dir, `${sheet.name}.${format}`),
      serializeExchangeSheet(sheet, format),
      'utf8',
    );
  }
  await writeFile(join(dir, 'workbook.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function dirnameSafe(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash <= 0 ? '.' : path.slice(0, slash);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runDogfoodI18nExport({
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  });
  process.exitCode = result.exitCode;
}

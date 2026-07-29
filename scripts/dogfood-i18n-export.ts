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
import {
  dogfoodI18nExportUsage,
  parseDogfoodI18nExportArgs,
} from './dogfood-i18n-export-args.js';
import {
  writeTextFile,
  writeWorkbookDirectory,
} from './dogfood-i18n-export-files.js';

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
    const parsed = parseDogfoodI18nExportArgs(args);
    if (parsed.help) {
      writeStdout(`${dogfoodI18nExportUsage()}\n`);
      return { exitCode: 0, stdout, stderr };
    }
    if (parsed.coverage) {
      writeStdout(
        `${dogfoodI18nCoverage()
          .map(
            (entry) =>
              `${entry.locale}: ${String(entry.translated)}/${String(entry.total)} translated (${String(entry.missing)} missing)`,
          )
          .join('\n')}\n`,
      );
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
      throw new Error('i18n CSV/TSV export requires --locale');
    }

    const workbook = createDogfoodTranslationWorkbook(parsed.locale);
    if (parsed.out != null) {
      await writeWorkbookDirectory(parsed.out, workbook, parsed.format);
    } else {
      const sheet = workbook.sheets[0];
      if (sheet == null) {
        throw new Error(
          `Dogfood i18n export produced no sheet for ${parsed.locale}`,
        );
      }
      writeStdout(`${serializeExchangeSheet(sheet, parsed.format)}\n`);
    }
    if (parsed.bundle != null) {
      await writeTextFile(
        parsed.bundle,
        `${serializeCatalogBundleJson(bundle)}\n`,
      );
    }
    return { exitCode: 0, stdout, stderr };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeStderr(`${message}\n`);
    if (!message.startsWith('Usage:')) {
      writeStderr(`${dogfoodI18nExportUsage()}\n`);
    }
    return { exitCode: 1, stdout, stderr };
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runDogfoodI18nExport({
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  });
  process.exitCode = result.exitCode;
}

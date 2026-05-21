import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runtimeCatalogsByLocaleFromStringTable } from '../packages/bijou-i18n-tools/src/index.js';
import { dogfoodStringTable } from '../examples/docs/i18n/dogfood-authoring.js';

export interface DogfoodI18nBuildOptions {
  readonly outDir?: string;
  readonly args?: readonly string[];
  readonly check?: boolean;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
}

export interface DogfoodI18nBuildResult {
  readonly exitCode: number;
  readonly files: readonly string[];
}

const DEFAULT_OUT_DIR = 'examples/docs/i18n/catalogs';

export function runDogfoodI18nBuild(
  options: DogfoodI18nBuildOptions = {},
): DogfoodI18nBuildResult {
  const outDir = options.outDir ?? DEFAULT_OUT_DIR;
  const check = options.check ?? options.args?.includes('--check') ?? false;
  const writtenFiles: string[] = [];
  try {
    const expectedFiles = runtimeCatalogFiles(outDir);
    if (check) {
      const stale = expectedFiles.filter((file) => (
        !existsSync(file.path)
        || readFileSync(file.path, 'utf8') !== file.content
      ));
      if (stale.length > 0) {
        throw new Error(`generated catalog files are stale: ${stale.map((file) => file.path).join(', ')}`);
      }
      options.stdout?.(`dogfood-i18n-build: ${expectedFiles.length} catalog files up to date\n`);
      return {
        exitCode: 0,
        files: Object.freeze(expectedFiles.map((file) => file.path)),
      };
    }

    rmSync(outDir, { recursive: true, force: true });
    for (const file of expectedFiles) {
      mkdirSync(dirnameSafe(file.path), { recursive: true });
      writeFileSync(file.path, file.content, 'utf8');
      writtenFiles.push(file.path);
    }
    options.stdout?.(`dogfood-i18n-build: wrote ${expectedFiles.length} catalog files\n`);
    return {
      exitCode: 0,
      files: Object.freeze(writtenFiles),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    options.stderr?.(`dogfood-i18n-build: ${message}\n`);
    return {
      exitCode: 1,
      files: Object.freeze([]),
    };
  }
}

function runtimeCatalogFiles(outDir: string): readonly { readonly path: string; readonly content: string }[] {
  const byLocale = runtimeCatalogsByLocaleFromStringTable(dogfoodStringTable());
  return Object.entries(byLocale).flatMap(([locale, catalogs]) => (
    catalogs.map((catalog) => ({
      path: join(outDir, locale, `${encodeURIComponent(catalog.namespace)}.json`),
      content: `${JSON.stringify(catalog, null, 2)}\n`,
    }))
  ));
}

function dirnameSafe(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash <= 0 ? '.' : path.slice(0, slash);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runDogfoodI18nBuild({
    args: process.argv.slice(2),
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  });
  process.exitCode = result.exitCode;
}

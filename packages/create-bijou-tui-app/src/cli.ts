#!/usr/bin/env node

import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  type PackageManager,
  parseArgs,
  scaffoldProject,
  usage,
} from './index.js';

/** CLI entrypoint for create-bijou-tui-app. */
export function runCli(argv: readonly string[]): number {
  const parsedOrCode = parseCliArgs(argv);
  if (typeof parsedOrCode === 'number') {
    return parsedOrCode;
  }

  const parsed = parsedOrCode;
  if (parsed.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  try {
    const result = scaffoldProject({
      targetDir: parsed.targetDirArg,
      install: parsed.install,
      force: parsed.force,
    });

    const relDir = relative(process.cwd(), result.targetDir) || '.';
    const suggestedDir = relDir === '.'
      ? '.'
      : (relDir.startsWith('..') ? result.targetDir : relDir);

    process.stdout.write(`\nCreated project in ${result.targetDir}\n`);
    process.stdout.write(`\nNext steps:\n`);
    if (suggestedDir !== '.') {
      process.stdout.write(`  cd ${quotePath(suggestedDir)}\n`);
    }
    if (!result.installed) {
      process.stdout.write(`  ${installCommand(result.packageManager)}\n`);
    }
    process.stdout.write(`  ${runDevCommand(result.packageManager)}\n\n`);
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`create-bijou-tui-app: ${message}\n`);
    if (isInstallFailure(message)) {
      process.stderr.write('Tip: rerun with --no-install, then install dependencies manually.\n');
    } else {
      process.stderr.write('Tip: run with --help to see CLI options.\n');
    }
    return 1;
  }
}

function parseCliArgs(argv: readonly string[]): ReturnType<typeof parseArgs> | number {
  try {
    return parseArgs(argv);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`create-bijou-tui-app: ${message}\n`);
    process.stderr.write(`\n${usage()}\n`);
    return 1;
  }
}

function quotePath(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function isInstallFailure(message: string): boolean {
  return message.includes(' install failed');
}

function installCommand(pm: PackageManager): string {
  if (pm === 'yarn') return 'yarn';
  if (pm === 'bun') return 'bun install';
  return `${pm} install`;
}

function runDevCommand(pm: PackageManager): string {
  if (pm === 'yarn') return 'yarn dev';
  if (pm === 'bun') return 'bun run dev';
  return `${pm} run dev`;
}

if (isEntrypoint()) {
  const code = runCli(process.argv.slice(2));
  if (code !== 0) process.exit(code);
}

function isEntrypoint(): boolean {
  if (process.argv[1] == null) return false;
  return import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
}

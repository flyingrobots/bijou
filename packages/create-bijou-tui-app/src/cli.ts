#!/usr/bin/env node

import { realpathSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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

/** Parse CLI arguments, returning the parsed result or an exit code on failure. */
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

/** Quote a file path for safe display in shell commands (platform-aware). */
function quotePath(value: string): string {
  if (process.platform === 'win32') {
    const escaped = value
      .replace(/%/g, '%%')
      .replace(/\^/g, '^^')
      .replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return `'${value.replace(/'/g, "'\"'\"'")}'`;
}

/** Check if an error message indicates a package install failure. */
function isInstallFailure(message: string): boolean {
  return message.includes(' install failed');
}

/** Return the install command string for a given package manager. */
function installCommand(pm: PackageManager): string {
  if (pm === 'yarn') return 'yarn';
  if (pm === 'bun') return 'bun install';
  return `${pm} install`;
}

/** Return the dev server command string for a given package manager. */
function runDevCommand(pm: PackageManager): string {
  if (pm === 'yarn') return 'yarn dev';
  if (pm === 'bun') return 'bun run dev';
  return `${pm} run dev`;
}

if (isEntrypoint()) {
  process.exitCode = runCli(process.argv.slice(2));
}

/** Check if this module is being run as the CLI entrypoint. */
function isEntrypoint(): boolean {
  if (process.argv[1] === undefined) return false;
  try {
    return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
  }
}

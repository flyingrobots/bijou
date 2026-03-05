#!/usr/bin/env node

import { relative } from 'node:path';
import {
  type PackageManager,
  parseArgs,
  scaffoldProject,
  usage,
} from './index.js';

/** CLI entrypoint for create-bijou-tui-app. */
export function runCli(argv: readonly string[]): number {
  try {
    const parsed = parseArgs(argv);
    if (parsed.help) {
      process.stdout.write(`${usage()}\n`);
      return 0;
    }

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
      process.stdout.write(`  cd ${suggestedDir}\n`);
    }
    if (!result.installed) {
      process.stdout.write(`  ${installCommand(result.packageManager)}\n`);
    }
    process.stdout.write(`  ${runDevCommand(result.packageManager)}\n\n`);
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`create-bijou-tui-app: ${message}\n`);
    process.stderr.write(`\n${usage()}\n`);
    return 1;
  }
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

const code = runCli(process.argv.slice(2));
if (code !== 0) process.exit(code);

#!/usr/bin/env tsx

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCodeDojoEslintLive } from './code-dojo-eslint-live-cli.js';

export { buildEslintLive, type CodeDojoEslintLive } from './code-dojo-eslint-live-build.js';
export { runCodeDojoEslintLive } from './code-dojo-eslint-live-cli.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const result = runCodeDojoEslintLive(process.argv.slice(2), ROOT);
  for (const line of result.stdout) process.stdout.write(`${line}\n`);
  for (const line of result.stderr) process.stderr.write(`${line}\n`);
  process.exitCode = result.code;
}

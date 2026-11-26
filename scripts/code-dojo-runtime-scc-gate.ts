#!/usr/bin/env tsx

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRuntimeScc } from './code-dojo-runtime-scc-cli.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const result = runRuntimeScc(process.argv.slice(2), ROOT);
for (const line of result.stdout) process.stdout.write(`${line}\n`);
for (const line of result.stderr) process.stderr.write(`${line}\n`);
process.exitCode = result.code;

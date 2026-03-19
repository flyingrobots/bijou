#!/usr/bin/env npx tsx

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { runSmokeAllExamples } from './smoke-all-examples-lib.js';

async function main(): Promise<void> {
  process.exitCode = await runSmokeAllExamples();
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}

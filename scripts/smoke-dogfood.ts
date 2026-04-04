#!/usr/bin/env npx tsx

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parseSmokeDogfoodOptions, runSmokeDogfood } from './smoke-dogfood-lib.js';

async function main(): Promise<void> {
  process.exitCode = await runSmokeDogfood({
    options: parseSmokeDogfoodOptions(process.argv.slice(2)),
  });
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}

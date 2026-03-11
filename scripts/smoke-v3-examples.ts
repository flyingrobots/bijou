#!/usr/bin/env npx tsx

import { execSync, spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const EXAMPLES = [
  'demo.ts',
  'demo-tui.ts',
  'examples/v3-demo/main.ts',
  'examples/v3-css/main.ts',
  'examples/v3-motion/main.ts',
  'examples/v3-subapp/main.ts',
  'examples/v3-worker/main.ts',
  'examples/v3-pipeline/main.ts',
];

execSync('npx tsc -b', { cwd: ROOT, stdio: 'ignore' });

for (const relativePath of EXAMPLES) {
  await runExample(relativePath);
}

async function runExample(relativePath: string): Promise<void> {
  process.stdout.write(`smoke ${relativePath} ... `);

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(
      process.execPath,
      ['--import', 'tsx', resolve(ROOT, relativePath)],
      {
        cwd: ROOT,
        env: {
          ...process.env,
          CI: '1',
          NO_COLOR: '1',
        },
        stdio: 'ignore',
      },
    );

    child.on('error', rejectPromise);
    child.on('exit', (code) => {
      if (code === 0) {
        process.stdout.write('ok\n');
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${relativePath} exited with code ${code ?? 'null'}`));
    });
  });
}

import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const run = promisify(execFile);

// The Python standard-library PTY boundary is Unix-only; Windows has no Unix PTYs.
// The cases are independent child processes, so they run side by side: the second
// one always waits out its 3 s window for a phrase that must not appear.
describe.skipIf(process.platform === 'win32')('Markdown CLI resize', () => {
  it.concurrent.each([
    { name: 'default width expands', flags: [], expands: true },
    { name: 'explicit width remains capped', flags: ['--width=40'], expands: false },
  ])('$name after starting at 40 columns and resizing to 80', async ({ flags, expands }) => {
    const { stdout } = await run('python3', [
      fileURLToPath(new URL('./markdown-font-cli-resize.py', import.meta.url)), ...flags,
    ], { encoding: 'utf8', timeout: 20_000, maxBuffer: 1_048_576 });
    const result: unknown = JSON.parse(stdout);
    expect(result).toMatchObject({ initialHasWidePhrase: false, resizedHasWidePhrase: expands });
  }, 25_000);
});

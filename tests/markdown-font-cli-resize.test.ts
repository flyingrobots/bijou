import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The Python standard-library PTY boundary is Unix-only; Windows has no Unix PTYs.
describe.skipIf(process.platform === 'win32')('Markdown CLI resize', () => {
  it.each([
    { name: 'default width expands', flags: [], expands: true },
    { name: 'explicit width remains capped', flags: ['--width=40'], expands: false },
  ])('$name after starting at 40 columns and resizing to 80', ({ flags, expands }) => {
    const output = execFileSync('python3', [
      fileURLToPath(new URL('./markdown-font-cli-resize.py', import.meta.url)), ...flags,
    ], { encoding: 'utf8', timeout: 20_000, maxBuffer: 1_048_576 });
    const result: unknown = JSON.parse(output);
    expect(result).toMatchObject({ initialHasWidePhrase: false, resizedHasWidePhrase: expands });
  }, 25_000);
});

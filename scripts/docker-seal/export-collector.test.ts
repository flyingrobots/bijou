import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { relative, join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe.skipIf(process.platform !== 'linux')('artifact collection in the sealed worker', () => {
  const root = '/work/source';
  const collector = readFileSync(new URL('./export-files.mjs', import.meta.url), 'utf8');
  const collect = (path: string) => spawnSync(process.execPath, ['--input-type=module', '-e', collector, '--', path], {
    encoding: 'utf8', timeout: 10_000, maxBuffer: 1024 * 1024,
  });
  it('collects exact ordinary file bytes without exporting neighboring files', () => {
    const directory = mkdtempSync(join(root, 'seal-export-'));
    try {
      const file = join(directory, 'report.md');
      writeFileSync(file, 'report\n');
      writeFileSync(join(directory, 'not-requested.md'), 'private fixture\n');
      const path = relative(root, file);
      const result = collect(path);
      expect(result.status).toBe(0);
      const output: unknown = JSON.parse(result.stdout);
      expect(output).toEqual([{ path, data: Buffer.from('report\n').toString('base64') }]);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
  it('refuses a symlink even when its target is inside the copied source', () => {
    const directory = mkdtempSync(join(root, 'seal-export-'));
    try {
      writeFileSync(join(directory, 'report.md'), 'report\n');
      symlinkSync('report.md', join(directory, 'redirect.md'));
      const result = collect(relative(root, join(directory, 'redirect.md')));
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('Export contains a symlink');
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
});

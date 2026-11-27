import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const guard = '/work/source/scripts/docker-seal/require-docker.mjs';

describe('test admission before runtime effects', () => {
  it.each(['child.ts', 'runner.ts'])('refuses a direct benchmark %s import before runtime effects', (file) => {
    const scratch = mkdtempSync(join(tmpdir(), 'seal-benchmark-'));
    const sentinel = join(scratch, 'benchmark-imported');
    const root = resolve(dirname(guard), '../..');
    try {
      const benchmark = pathToFileURL(join(root, 'bench/src/harnesses/wall-time', file)).href;
      const runtime = join(scratch, 'runtime.mjs');
      writeFileSync(runtime, `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(sentinel)}, 'started');`);
      const source = `import ${JSON.stringify(benchmark)}; import ${JSON.stringify(pathToFileURL(runtime).href)};`;
      const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', source], {
        cwd: root, env: { ...process.env, GIT_DIR: '/disposable-invalid-locator' },
        encoding: 'utf8', timeout: 10_000,
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('inherited Git locator');
      expect(existsSync(sentinel)).toBe(false);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });

  it('admits a child in a disposable fixture directory', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'seal-admitted-'));
    try {
      const result = spawnSync(process.execPath, [guard], { cwd: scratch, encoding: 'utf8', timeout: 10_000 });
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });

  it.each(['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_CONFIG_PARAMETERS'])('rejects inherited %s despite environment bypass flags', (locator) => {
    const scratch = mkdtempSync(join(tmpdir(), 'seal-refused-'));
    const sentinel = join(scratch, 'runtime-started');
    try {
      const runtime = join(scratch, 'runtime.mjs');
      writeFileSync(runtime, `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(sentinel)}, 'started');`);
      const source = `import ${JSON.stringify(pathToFileURL(guard).href)}; import ${JSON.stringify(pathToFileURL(runtime).href)};`;
      const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
        cwd: scratch,
        env: { ...process.env, [locator]: '/disposable-invalid-locator', GITHUB_ACTIONS: 'true', GIT_STUNTS_DOCKER: '1' },
        encoding: 'utf8', timeout: 10_000,
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('inherited Git locator');
      expect(existsSync(sentinel)).toBe(false);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });

  it.skipIf(process.platform !== 'linux')('rejects execution outside the temporary filesystems', () => {
    const result = spawnSync(process.execPath, [guard], { cwd: '/', encoding: 'utf8', timeout: 10_000 });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('working directory outside temporary filesystems');
  });
});

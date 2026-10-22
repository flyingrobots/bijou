import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RELEASE_WITNESS_FILES } from './release-product-witness-files.js';

const CLI = fileURLToPath(new URL('./release-product-witnesses.ts', import.meta.url));
const LOADER = import.meta.resolve('tsx');

function withCheckout(run: (root: string, env: NodeJS.ProcessEnv) => void): void {
  const root = mkdtempSync(resolve(tmpdir(), 'bijou-witness-checkout-'));
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  env.GIT_CONFIG_NOSYSTEM = '1';
  env.GIT_CONFIG_GLOBAL = resolve(root, 'empty-git-config');
  writeFileSync(env.GIT_CONFIG_GLOBAL, '');
  mkdirSync(resolve(root, 'empty-hooks'));
  const git = (args: readonly string[]): void => {
    execFileSync('git', [...args], { cwd: root, env, timeout: 10_000, stdio: 'pipe' });
  };
  try {
    for (const file of [...RELEASE_WITNESS_FILES, { path: 'package-lock.json' }]) {
      const target = resolve(root, file.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(resolve(process.cwd(), file.path)));
    }
    git(['init', '-q']);
    git(['config', 'user.name', 'Witness fixture']);
    git(['config', 'user.email', 'witness@example.invalid']);
    git(['config', 'commit.gpgsign', 'false']);
    git(['config', 'core.hooksPath', resolve(root, 'empty-hooks')]);
    git(['add', '.']);
    git(['commit', '-qm', 'fixture']);
    run(root, env);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function invoke(root: string, env: NodeJS.ProcessEnv, args: readonly string[] = []) {
  return spawnSync(process.execPath, ['--import', LOADER, CLI, ...args], {
    cwd: root, env, encoding: 'utf8', timeout: 20_000, maxBuffer: 1024 * 1024,
  });
}

describe('release product witness CLI failures', () => {
  it.each(['untracked.txt', 'package-lock.json'])('refuses dirty checkout %s without a receipt', (path) => {
    withCheckout((root, env) => {
      writeFileSync(resolve(root, path), 'dirty\n');
      const result = invoke(root, env);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('requires a clean checkout');
    });
  });

  it('does not emit a receipt when the actual build process fails', () => {
    withCheckout((root, env) => {
      // This real checkout deliberately has no installed compiler.
      const result = invoke(root, env);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('Witness failed: fresh-build');
    });
  });

  it('rejects unknown arguments before running checks', () => {
    const result = invoke(process.cwd(), process.env, ['--accept-drift']);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Usage: release-product-witnesses.ts');
  });
});

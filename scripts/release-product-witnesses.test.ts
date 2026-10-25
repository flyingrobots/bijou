import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RELEASE_WITNESS_FILES, verifyReleaseWitnessFiles } from './release-product-witness-files.js';
import { invoke, LOADER, withCheckout } from './release-product-witness-test-fixture.js';

describe('release product witness CLI failures', () => {
  it('recognizes the repository root through a directory alias', () => {
    withCheckout((root, env) => {
      const container = mkdtempSync(resolve(tmpdir(), 'bijou-witness-alias-'));
      try {
        const alias = resolve(container, 'checkout');
        symlinkSync(root, alias, 'junction');
        const result = invoke(alias, env);
        expect(result.status).toBe(1);
        expect(result.stdout).toBe('');
        expect(result.stderr).toContain('Witness failed: fresh-build');
      } finally {
        rmSync(container, { recursive: true, force: true });
      }
    });
  });

  it('still rejects a genuine repository subdirectory', () => {
    withCheckout((root, env) => {
      const result = invoke(resolve(root, 'fixtures'), env);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('Run the witness replay from the repository root.');
    });
  });

  it('preserves all pinned bytes through an actual CRLF-configured checkout', () => {
    withCheckout((root, env) => {
      const git = (args: readonly string[]): void => {
        execFileSync('git', [...args], { cwd: root, env, timeout: 10_000, stdio: 'pipe' });
      };
      git(['config', 'core.autocrlf', 'true']);
      for (const file of RELEASE_WITNESS_FILES) rmSync(resolve(root, file.path));
      git(['checkout', '--', ...RELEASE_WITNESS_FILES.map((file) => file.path)]);
      expect(verifyReleaseWitnessFiles(root)).toHaveLength(9);
    });
  });

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


describe('release product witness execution', () => {
  it('finishes each family before starting the next and reports each command', () => {
    withCheckout((root, env) => {
      // Real subprocess fixtures isolate the CLI scheduling/output contract.
      // Product assertions themselves are exercised by the real release replay.
      const files = {
        '.gitignore': 'node_modules/\ninvocations.log\n',
        'packages/bijou/package.json': '{"version":"8.0.0-rc.1"}',
        'node_modules/typescript/bin/tsc': 'require("node:fs").appendFileSync("invocations.log", "build\\n");',
        'scripts/generate-profunctor-page-target.ts': 'import { appendFileSync } from "node:fs"; appendFileSync("invocations.log", "generated\\n");',
        'node_modules/vitest/vitest.mjs': `
          import { appendFileSync } from 'node:fs';
          const families = process.argv.slice(2).filter(arg => arg.startsWith('tests/cycles/'));
          const family = families.map(path => path.split('/').at(-1)).join(',');
          appendFileSync('invocations.log', 'start:' + family + '\\n');
          setTimeout(() => appendFileSync('invocations.log', 'end:' + family + '\\n'), 10);
        `,
      };
      for (const [path, content] of Object.entries(files)) {
        mkdirSync(dirname(resolve(root, path)), { recursive: true });
        writeFileSync(resolve(root, path), content);
      }
      symlinkSync(resolve(dirname(fileURLToPath(LOADER)), '..'), resolve(root, 'node_modules/tsx'), 'junction');
      execFileSync('git', ['add', '.'], { cwd: root, env, stdio: 'pipe' });
      execFileSync('git', ['commit', '-qm', 'execution fixture'], { cwd: root, env, stdio: 'pipe' });
      const result = invoke(root, env);
      expect(result.status, result.stderr).toBe(0);
      expect(readFileSync(resolve(root, 'invocations.log'), 'utf8').trim().split('\n')).toEqual([
        'build', 'generated', 'start:DX-050', 'end:DX-050',
        'start:DX-049', 'end:DX-049', 'start:RE-036', 'end:RE-036',
      ]);
      expect(JSON.parse(result.stdout)).toMatchObject({
        checks: [
          { label: 'fresh-build', status: 'pass' },
          { label: 'DX-050-generated-artifacts', status: 'pass' },
          ...['DX-050', 'DX-049', 'RE-036'].map(family => ({
            label: family + '-product-contract-tests',
            command: ['node', 'node_modules/vitest/vitest.mjs', 'run', 'tests/cycles/' + family, '--maxWorkers', '2'],
            status: 'pass',
          })),
        ],
      });
    });
  });
});

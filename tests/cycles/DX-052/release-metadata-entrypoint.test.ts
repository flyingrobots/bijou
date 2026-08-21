import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

/**
 * `npm run release:preflight` must actually run.
 *
 * It did not. `scripts/release-metadata.ts` is the CLI entry point but was a
 * pure re-export shim that imported `release-metadata.part04.js` for the side
 * effect of *that* module's main guard — and the guard compares
 * `import.meta.url` against `process.argv[1]`, which cannot match when the
 * process was started on the shim. So the command exited 0 having done nothing:
 * no lock-step validation, no stdout, no `GITHUB_OUTPUT`.
 *
 * Two things fell out of that. `REL-META-VERSION-LOCKSTEP` is the release gate
 * assigned to `release:preflight`, so version-mismatch detection was unenforced.
 * And the Release Dry Run's notes job read an empty tag from the missing output
 * and failed with `gh: Missing tag_name parameter (HTTP 400)` — which is the only
 * reason anyone looked.
 *
 * These tests invoke the real entry point as a child process, because that is
 * the only way to observe the defect: every unit test of `runReleaseMetadata()`
 * passed throughout, since the function was always correct. Nothing called it.
 */
describe('DX-052 release-metadata entry point dispatches', () => {
  const root = resolve(import.meta.dirname, '../../..');
  const entry = 'scripts/release-metadata.ts';

  const run = (args: readonly string[]): { status: number; stdout: string } => {
    try {
      const stdout = execFileSync('npx', ['tsx', entry, ...args], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { status: 0, stdout };
    } catch (error) {
      // execFileSync throws an Error carrying `status` and `stdout`; narrow
      // rather than assert, so a different throw shape cannot be misread as a
      // clean exit.
      const status =
        typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
          ? error.status
          : 1;
      const stdout =
        typeof error === 'object' && error !== null && 'stdout' in error && typeof error.stdout === 'string'
          ? error.stdout
          : '';
      return { status, stdout };
    }
  };

  it('prints the lock-step package summary rather than exiting silently', () => {
    const result = run(['--current-version']);
    expect(result.status).toBe(0);
    // The exact symptom: a no-op gate produced no output at all.
    expect(result.stdout.trim()).not.toBe('');
    expect(result.stdout).toContain('@flyingrobots/bijou');
  }, 120_000);

  it('writes the requested GitHub output file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bijou-release-meta-'));
    const out = join(dir, 'github-output.txt');
    const result = run(['--current-version', '--notes-tag-run-id', 'test', '--github-output', out]);

    expect(result.status).toBe(0);
    expect(existsSync(out), 'no GITHUB_OUTPUT was written').toBe(true);
    const written = readFileSync(out, 'utf8');
    // The dry-run notes job reads both of these; empty values made it send
    // tag_name="" and fail with HTTP 400.
    expect(written).toMatch(/^version=.+$/mu);
    expect(written).toMatch(/^notes_tag=dry-run-v.+-test$/mu);
  }, 120_000);

  it('fails on a version the workspace does not match', () => {
    // REL-META-VERSION-LOCKSTEP. This exited 0 while the gate was a no-op, which
    // is the whole reason a no-op gate is worse than a missing one.
    const result = run(['--version', '9.9.9']);
    expect(result.status).not.toBe(0);
  }, 120_000);

  it('rejects an invalid release version', () => {
    const result = run(['--version', 'not-a-version']);
    expect(result.status).not.toBe(0);
  }, 120_000);
});

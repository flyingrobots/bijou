import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { isGitHubHostedJob } from '../scripts/docker-seal/github-hosted.mjs';
import { SEAL_ONLY_TESTS, WINDOWS_TESTS } from '../scripts/windows-tests.js';

// The Windows CI job runs tests outside the seal (docs/guides/sealed-tests.md,
// "Windows, outside the seal"). These cases keep that exception to one job, its
// three commands, and the Linux focused lane's tests.
type Fields = Readonly<Record<string, unknown>>;
function isFields(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function fields(value: unknown, label: string): Fields {
  if (!isFields(value)) throw new Error(`${label} is not a mapping`);
  return value;
}
function runs(job: string): readonly string[] {
  const list: unknown = fields(jobs[job], job)['steps'];
  if (!Array.isArray(list)) throw new Error(`${job}.steps is not a sequence`);
  return list.map((step, index) => fields(step, `${job}.steps[${String(index)}]`)['run']).filter((run) => typeof run === 'string');
}

const source = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
const jobs = fields(fields(parse(source), 'workflow')['jobs'], 'jobs');
const config = 'scripts/vitest-windows.config.ts';

describe('the Windows CI job', () => {
  it('runs only the install, the build, the typecheck and the Windows config', () => {
    expect(fields(jobs['unit_windows'], 'unit_windows')['runs-on']).toBe('windows-2022');
    expect(runs('unit_windows')).toEqual([
      'npm ci --ignore-scripts --no-audit --fund=false',
      'npm run build',
      'npm run typecheck:test',
      `node node_modules/vitest/vitest.mjs run --config ${config}`,
    ]);
  });

  it('keeps the seal session limit and leaves no token on disk', () => {
    const job = fields(jobs['unit_windows'], 'unit_windows');
    expect(job['timeout-minutes']).toBe(30);
    const list: unknown = job['steps'];
    const checkout = Array.isArray(list) ? list.map((step) => fields(step, 'step')).find((step) => String(step['uses']).startsWith('actions/checkout@')) : undefined;
    expect(fields(checkout?.['with'], 'checkout.with')['persist-credentials']).toBe(false);
  });

  it('is the only place that names the Windows config', () => {
    expect(source.split(config).length - 1).toBe(1);
    expect(runs('unit_windows').some((run) => run.includes(config))).toBe(true);
    expect(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).not.toContain('vitest-windows');
  });

  it("runs the Linux focused lane's tests, less those that need the seal", () => {
    const linux = runs('unit_cross_platform').find((run) => run.includes('.test.ts')) ?? '';
    const listed = linux.split(/\s+/).filter((word) => word.endsWith('.test.ts'));
    expect(SEAL_ONLY_TESTS.every((test) => listed.includes(test))).toBe(true);
    expect(WINDOWS_TESTS).toEqual(listed.filter((test) => !SEAL_ONLY_TESTS.includes(test)));
  });

  it('refuses to load anywhere but a Windows CI runner', async () => {
    await expect(import('../scripts/vitest-windows.config.js')).rejects.toThrow('runs only in the Windows CI job');
    const guard = readFileSync(new URL('../scripts/vitest-windows.config.ts', import.meta.url), 'utf8');
    expect(guard).toContain("if (process.platform !== 'win32' || !isGitHubHostedJob()) {");
  });

  describe('which jobs count as GitHub-hosted', () => {
    const hosted = { GITHUB_ACTIONS: 'true', RUNNER_ENVIRONMENT: 'github-hosted', RUNNER_TEMP: tmpdir(), GITHUB_RUN_ID: '45994943357' };

    it('admits a GitHub-hosted job', () => {
      expect(isGitHubHostedJob(hosted)).toBe(true);
    });

    it.each([
      ['a shell that only sets GITHUB_ACTIONS', { GITHUB_ACTIONS: 'true' }],
      ['a self-hosted runner', { ...hosted, RUNNER_ENVIRONMENT: 'self-hosted' }],
      ['a job outside Actions', { ...hosted, GITHUB_ACTIONS: undefined }],
      ['a relative runner temp directory', { ...hosted, RUNNER_TEMP: 'temp' }],
      ['a runner temp directory that does not exist', { ...hosted, RUNNER_TEMP: `${tmpdir()}/bijou-no-such-runner-temp` }],
      ['a run id that is not a number', { ...hosted, GITHUB_RUN_ID: 'local' }],
    ])('refuses %s', (_label, env) => {
      expect(isGitHubHostedJob(env)).toBe(false);
    });
  });
});

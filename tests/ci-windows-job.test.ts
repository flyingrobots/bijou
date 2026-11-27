import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
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
  it('runs only the install, the build and the Windows config', () => {
    expect(fields(jobs['unit_windows'], 'unit_windows')['runs-on']).toBe('windows-2022');
    expect(runs('unit_windows')).toEqual([
      'npm ci --ignore-scripts --no-audit --fund=false',
      'npm run build',
      `node node_modules/vitest/vitest.mjs run --config ${config}`,
    ]);
  });

  it('is the only job that names the Windows config', () => {
    const users = Object.keys(jobs).filter((job) => runs(job).some((run) => run.includes(config)));
    expect(users).toEqual(['unit_windows']);
  });

  it("runs the Linux focused lane's tests, less those that need the seal", () => {
    const linux = runs('unit_cross_platform').find((run) => run.includes('.test.ts')) ?? '';
    const listed = linux.split(/\s+/).filter((word) => word.endsWith('.test.ts'));
    expect(SEAL_ONLY_TESTS.every((test) => listed.includes(test))).toBe(true);
    expect(WINDOWS_TESTS).toEqual(listed.filter((test) => !SEAL_ONLY_TESTS.includes(test)));
  });

  it('refuses to load anywhere but a Windows CI runner', async () => {
    await expect(import('../scripts/vitest-windows.config.js')).rejects.toThrow('runs only in the Windows CI job');
  });
});

import { describe, expect, it } from 'vitest';
import { buildReleaseReadinessPlan, runReleaseReadiness } from './release-readiness.js';

describe('release-readiness', () => {
  it('runs the expected release gate commands in order', () => {
    const plan = buildReleaseReadinessPlan();
    expect(plan.map((step) => step.label)).toEqual([
      'build',
      'typecheck:test',
      'workflow:shell:preflight',
      'release:preflight',
      'test:frames',
      'smoke:canaries',
      'smoke:examples:all',
      'test',
    ]);
    expect(plan.find((step) => step.label === 'smoke:canaries')?.args).toEqual([
      'run',
      'smoke:canaries',
      '--',
      '--skip-build',
    ]);
  });

  it('fails fast when a release gate step fails', () => {
    const executed: string[] = [];
    const stdout: string[] = [];
    const stderr: string[] = [];

    const code = runReleaseReadiness({
      cwd: '/tmp/bijou',
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
      runCommand(step, cwd) {
        executed.push(`${cwd}:${step.label}`);
        return {
          status: step.label === 'test:frames' ? 2 : 0,
        };
      },
    });

    expect(code).toBe(2);
    expect(executed).toEqual([
      '/tmp/bijou:build',
      '/tmp/bijou:typecheck:test',
      '/tmp/bijou:workflow:shell:preflight',
      '/tmp/bijou:release:preflight',
      '/tmp/bijou:test:frames',
    ]);
    expect(stdout).toContain('==> test:frames\n');
    expect(stderr).toContain('release-readiness: test:frames exited with status 2\n');
  });

  it('prints success when every gate passes', () => {
    const stdout: string[] = [];
    const code = runReleaseReadiness({
      stdout: (text) => stdout.push(text),
      runCommand() {
        return { status: 0 };
      },
    });

    expect(code).toBe(0);
    expect(stdout.at(-1)).toBe('release-readiness: ok\n');
  });
});

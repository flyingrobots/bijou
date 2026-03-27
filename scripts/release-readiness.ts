#!/usr/bin/env tsx

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ReleaseReadinessStep {
  readonly label: string;
  readonly command: string;
  readonly args: readonly string[];
}

export interface ReleaseReadinessIO {
  readonly cwd?: string;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
  readonly runCommand?: (step: ReleaseReadinessStep, cwd: string) => {
    readonly status: number | null;
    readonly error?: Error;
  };
}

function npmCommand(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

export function buildReleaseReadinessPlan(): readonly ReleaseReadinessStep[] {
  const npm = npmCommand();
  return [
    { label: 'build', command: npm, args: ['run', 'build'] },
    { label: 'typecheck:test', command: npm, args: ['run', 'typecheck:test'] },
    { label: 'docs:design-system:preflight', command: npm, args: ['run', 'docs:design-system:preflight'] },
    { label: 'workflow:shell:preflight', command: npm, args: ['run', 'workflow:shell:preflight'] },
    { label: 'release:preflight', command: npm, args: ['run', 'release:preflight'] },
    { label: 'test:frames', command: npm, args: ['run', 'test:frames'] },
    { label: 'smoke:canaries', command: npm, args: ['run', 'smoke:canaries', '--', '--skip-build'] },
    { label: 'smoke:examples:all', command: npm, args: ['run', 'smoke:examples:all', '--', '--skip-build'] },
    { label: 'test', command: npm, args: ['test'] },
  ];
}

function defaultRunCommand(step: ReleaseReadinessStep, cwd: string): { readonly status: number | null; readonly error?: Error } {
  const result = spawnSync(step.command, step.args, {
    cwd,
    stdio: 'inherit',
  });
  return {
    status: result.status,
    error: result.error,
  };
}

export function runReleaseReadiness(io: ReleaseReadinessIO = {}): number {
  const cwd = resolve(io.cwd ?? process.cwd());
  const stdout = io.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr = io.stderr ?? ((text: string) => process.stderr.write(text));
  const runCommand = io.runCommand ?? defaultRunCommand;

  for (const step of buildReleaseReadinessPlan()) {
    stdout(`==> ${step.label}\n`);
    const result = runCommand(step, cwd);
    if (result.error) {
      stderr(`release-readiness: ${step.label} failed: ${result.error.message}\n`);
      return 1;
    }
    if (result.status !== 0) {
      stderr(`release-readiness: ${step.label} exited with status ${result.status ?? 'null'}\n`);
      return result.status ?? 1;
    }
  }

  stdout('release-readiness: ok\n');
  return 0;
}

function main(): void {
  process.exitCode = runReleaseReadiness();
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}

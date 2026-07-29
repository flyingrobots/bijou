import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readMilestoneTrackerItems } from './release-readiness-tracker.js';
import {
  type ReleaseReadinessDocsSnapshot,
  type ReleaseReadinessIO,
  buildReleaseReadinessPlan,
} from './release-readiness.part01.js';
import {
  buildReleaseReadinessReport,
  defaultRunCommand,
  formatReleaseReadinessReport,
} from './release-readiness.part02.js';

export function runReleaseReadiness(io: ReleaseReadinessIO = {}): number {
  const cwd = resolve(io.cwd ?? process.cwd());
  const stdout = io.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr = io.stderr ?? ((text: string) => process.stderr.write(text));
  const runCommand = io.runCommand ?? defaultRunCommand;
  const plan = buildReleaseReadinessPlan();

  if (io.milestone != null) {
    const report = buildReleaseReadinessReport({
      milestone: io.milestone,
      trackerItems:
        io.trackerItems ?? readMilestoneTrackerItems(io.milestone, cwd),
      docs: io.docs ?? readReleaseReadinessDocs(cwd, io.milestone),
      plan,
    });
    stdout(formatReleaseReadinessReport(report));
    if (report.status === 'blocked') {
      stderr(`release-readiness: ${io.milestone} report is blocked\n`);
      return 1;
    }
  }

  for (const step of plan) {
    stdout(`==> ${step.label}\n`);
    const result = runCommand(step, cwd);
    if (result.error) {
      stderr(
        `release-readiness: ${step.label} failed: ${result.error.message}\n`,
      );
      return 1;
    }
    if (result.status !== 0) {
      stderr(
        `release-readiness: ${step.label} exited with status ${String(result.status ?? 'null')}\n`,
      );
      return result.status ?? 1;
    }
  }

  stdout('release-readiness: ok\n');
  return 0;
}
export function parseReleaseReadinessArgs(args: readonly string[]): {
  readonly milestone?: string;
} {
  let milestone: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--milestone') {
      const value = args[index + 1];
      if (value == null || value.startsWith('--')) {
        throw new Error('--milestone requires a value');
      }
      milestone = value;
      index += 1;
      continue;
    }
    if (arg?.startsWith('--milestone=')) {
      milestone = arg.slice('--milestone='.length);
      if (milestone === '') throw new Error('--milestone requires a value');
      continue;
    }
    throw new Error(`unknown release:readiness option: ${String(arg)}`);
  }
  return milestone == null ? {} : { milestone };
}
export function readReleaseReadinessDocs(
  cwd: string,
  milestone: string,
): ReleaseReadinessDocsSnapshot {
  const version = milestone.replace(/^v/, '');
  return Object.freeze({
    roadmap: readFileSync(resolve(cwd, 'docs/ROADMAP.md'), 'utf8'),
    bearing: readFileSync(resolve(cwd, 'docs/BEARING.md'), 'utf8'),
    changelog: readFileSync(resolve(cwd, 'docs/CHANGELOG.md'), 'utf8'),
    releaseGuide: readFileSync(resolve(cwd, 'docs/release.md'), 'utf8'),
    releasePacketExists: existsSync(
      resolve(cwd, 'docs/releases', version, 'README.md'),
    ),
  });
}
export function main(): void {
  try {
    process.exitCode = runReleaseReadiness(
      parseReleaseReadinessArgs(process.argv.slice(2)),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`release-readiness: ${message}\n`);
    process.exitCode = 1;
  }
}

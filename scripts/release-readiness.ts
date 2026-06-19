#!/usr/bin/env tsx

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ReleaseReadinessStep {
  readonly label: string;
  readonly command: string;
  readonly args: readonly string[];
}

export interface ReleaseReadinessTrackerLabel {
  readonly name: string;
}

export interface ReleaseReadinessTrackerItem {
  readonly number: number;
  readonly title: string;
  readonly state: string;
  readonly labels?: readonly (string | ReleaseReadinessTrackerLabel)[];
  readonly url?: string;
}

export interface ReleaseReadinessDocsSnapshot {
  readonly roadmap: string;
  readonly bearing: string;
  readonly changelog: string;
  readonly releaseGuide: string;
  readonly releasePacketExists: boolean;
}

export type ReleaseReadinessCheckStatus = 'pass' | 'fail';

export interface ReleaseReadinessReportCheck {
  readonly label: string;
  readonly status: ReleaseReadinessCheckStatus;
  readonly summary: string;
}

export interface ReleaseReadinessReport {
  readonly milestone: string;
  readonly status: 'ready' | 'blocked';
  readonly checks: readonly ReleaseReadinessReportCheck[];
  readonly openTrackerItems: readonly ReleaseReadinessTrackerItem[];
  readonly wipTrackerItems: readonly ReleaseReadinessTrackerItem[];
}

export interface ReleaseReadinessIO {
  readonly cwd?: string;
  readonly milestone?: string;
  readonly trackerItems?: readonly ReleaseReadinessTrackerItem[];
  readonly docs?: ReleaseReadinessDocsSnapshot;
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
    { label: 'lint', command: npm, args: ['run', 'lint'] },
    { label: 'code:size', command: npm, args: ['run', 'code:size'] },
    { label: 'typecheck:test', command: npm, args: ['run', 'typecheck:test'] },
    { label: 'docs:design-system:preflight', command: npm, args: ['run', 'docs:design-system:preflight'] },
    { label: 'dogfood:coverage:gate', command: npm, args: ['run', 'dogfood:coverage:gate'] },
    { label: 'dogfood:i18n:check', command: npm, args: ['run', 'dogfood:i18n:check'] },
    { label: 'dogfood:i18n:debt', command: npm, args: ['run', 'dogfood:i18n:debt'] },
    { label: 'workflow:shell:preflight', command: npm, args: ['run', 'workflow:shell:preflight'] },
    { label: 'release:preflight', command: npm, args: ['run', 'release:preflight'] },
    { label: 'test:frames', command: npm, args: ['run', 'test:frames'] },
    { label: 'verify:interactive-examples', command: npm, args: ['run', 'verify:interactive-examples'] },
    { label: 'smoke:canaries', command: npm, args: ['run', 'smoke:canaries', '--', '--skip-build'] },
    { label: 'smoke:dogfood', command: npm, args: ['run', 'smoke:dogfood', '--', '--skip-build'] },
    { label: 'test', command: npm, args: ['test'] },
  ];
}

export function buildReleaseReadinessReport(options: {
  readonly milestone: string;
  readonly trackerItems: readonly ReleaseReadinessTrackerItem[];
  readonly docs: ReleaseReadinessDocsSnapshot;
  readonly plan?: readonly ReleaseReadinessStep[];
}): ReleaseReadinessReport {
  const milestone = options.milestone;
  const version = milestone.replace(/^v/, '');
  const plan = options.plan ?? buildReleaseReadinessPlan();
  const openTrackerItems = options.trackerItems.filter((item) => item.state.toUpperCase() !== 'CLOSED');
  const wipTrackerItems = options.trackerItems.filter((item) => (
    trackerItemLabelNames(item).includes('work-in-progress')
  ));
  const hasChangelogBoundary = options.docs.changelog.includes(`## [${version}]`)
    || options.docs.changelog.includes(`## [${milestone}]`)
    || options.docs.changelog.includes('## [Unreleased]');
  const hasPackageSmoke = plan.some((step) => step.label === 'smoke:canaries');
  const hasReleaseDryRunBoundary = options.docs.releaseGuide.includes('release-dry-run')
    || options.docs.releaseGuide.includes('Release Dry Run');
  const checks: ReleaseReadinessReportCheck[] = [
    {
      label: 'tracker-open-items',
      status: openTrackerItems.length === 0 ? 'pass' : 'fail',
      summary: openTrackerItems.length === 0
        ? `${milestone} has zero open tracker issues`
        : `${milestone} has ${String(openTrackerItems.length)} open tracker issue(s): ${formatTrackerItems(openTrackerItems)}`,
    },
    {
      label: 'tracker-wip-labels',
      status: wipTrackerItems.length === 0 ? 'pass' : 'fail',
      summary: wipTrackerItems.length === 0
        ? `${milestone} has no lingering work-in-progress labels`
        : `${milestone} has work-in-progress labels on ${formatTrackerItems(wipTrackerItems)}`,
    },
    {
      label: 'docs-roadmap-bearing',
      status: options.docs.roadmap.includes(milestone) && options.docs.bearing.includes(milestone) ? 'pass' : 'fail',
      summary: options.docs.roadmap.includes(milestone) && options.docs.bearing.includes(milestone)
        ? `ROADMAP.md and BEARING.md mention ${milestone}`
        : `ROADMAP.md and BEARING.md must both mention ${milestone}`,
    },
    {
      label: 'docs-changelog',
      status: hasChangelogBoundary ? 'pass' : 'fail',
      summary: hasChangelogBoundary
        ? `CHANGELOG.md has an Unreleased or ${milestone} release boundary`
        : `CHANGELOG.md must contain an Unreleased or ${milestone} release boundary`,
    },
    {
      label: 'release-packet',
      status: options.docs.releasePacketExists ? 'pass' : 'fail',
      summary: options.docs.releasePacketExists
        ? `docs/releases/${version}/README.md exists`
        : `docs/releases/${version}/README.md release evidence packet is missing`,
    },
    {
      label: 'package-smoke',
      status: hasPackageSmoke && hasReleaseDryRunBoundary ? 'pass' : 'fail',
      summary: hasPackageSmoke && hasReleaseDryRunBoundary
        ? 'release:readiness includes smoke:canaries and release.md documents the release dry-run package boundary'
        : 'release:readiness must include smoke:canaries and release.md must document the release dry-run package boundary',
    },
  ];

  return Object.freeze({
    milestone,
    status: checks.some((check) => check.status === 'fail') ? 'blocked' : 'ready',
    checks: Object.freeze(checks.map((check) => Object.freeze({ ...check }))),
    openTrackerItems: Object.freeze(openTrackerItems.map((item) => Object.freeze({ ...item }))),
    wipTrackerItems: Object.freeze(wipTrackerItems.map((item) => Object.freeze({ ...item }))),
  });
}

export function formatReleaseReadinessReport(report: ReleaseReadinessReport): string {
  return [
    `Release readiness: ${report.status.toUpperCase()} (${report.milestone})`,
    '| Check | Status | Summary |',
    '| :--- | :--- | :--- |',
    ...report.checks.map((check) => (
      `| ${check.label} | ${check.status.toUpperCase()} | ${escapeMarkdownTableCell(check.summary)} |`
    )),
    '',
  ].join('\n');
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
  const plan = buildReleaseReadinessPlan();

  if (io.milestone != null) {
    const report = buildReleaseReadinessReport({
      milestone: io.milestone,
      trackerItems: io.trackerItems ?? readMilestoneTrackerItems(io.milestone, cwd),
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
      stderr(`release-readiness: ${step.label} failed: ${result.error.message}\n`);
      return 1;
    }
    if (result.status !== 0) {
      stderr(`release-readiness: ${step.label} exited with status ${String(result.status ?? 'null')}\n`);
      return result.status ?? 1;
    }
  }

  stdout('release-readiness: ok\n');
  return 0;
}

export function parseReleaseReadinessArgs(args: readonly string[]): { readonly milestone?: string } {
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

function readMilestoneTrackerItems(milestone: string, cwd: string): readonly ReleaseReadinessTrackerItem[] {
  const result = spawnSync('gh', [
    'issue',
    'list',
    '--state',
    'all',
    '--milestone',
    milestone,
    '--limit',
    '1000',
    '--json',
    'number,title,state,labels,url',
  ], {
    cwd,
    encoding: 'utf8',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`gh issue list exited with status ${String(result.status ?? 'null')}: ${result.stderr.trim()}`);
  }

  return parseTrackerItems(result.stdout);
}

function readReleaseReadinessDocs(cwd: string, milestone: string): ReleaseReadinessDocsSnapshot {
  const version = milestone.replace(/^v/, '');
  return Object.freeze({
    roadmap: readFileSync(resolve(cwd, 'docs/ROADMAP.md'), 'utf8'),
    bearing: readFileSync(resolve(cwd, 'docs/BEARING.md'), 'utf8'),
    changelog: readFileSync(resolve(cwd, 'docs/CHANGELOG.md'), 'utf8'),
    releaseGuide: readFileSync(resolve(cwd, 'docs/release.md'), 'utf8'),
    releasePacketExists: existsSync(resolve(cwd, 'docs/releases', version, 'README.md')),
  });
}

function trackerItemLabelNames(item: ReleaseReadinessTrackerItem): readonly string[] {
  return Object.freeze((item.labels ?? []).map((label) => (
    typeof label === 'string' ? label : label.name
  )));
}

function formatTrackerItems(items: readonly ReleaseReadinessTrackerItem[]): string {
  return items.map((item) => `#${String(item.number)}`).join(', ');
}

function parseTrackerItems(stdout: string): readonly ReleaseReadinessTrackerItem[] {
  const parsed: unknown = JSON.parse(stdout);
  if (!Array.isArray(parsed)) throw new Error('gh issue list did not return an array');
  return Object.freeze(parsed.map((value) => {
    const item = requireJsonRecord(value, 'gh issue list item');
    const number = item['number'];
    const title = item['title'];
    const state = item['state'];
    const url = item['url'];
    if (typeof number !== 'number' || typeof title !== 'string' || typeof state !== 'string') {
      throw new Error('gh issue list returned an item with an unexpected shape');
    }
    const base = {
      number,
      title,
      state,
      labels: parseTrackerLabels(item['labels']),
    };
    return Object.freeze(typeof url === 'string' ? { ...base, url } : base);
  }));
}

function parseTrackerLabels(value: unknown): readonly (string | ReleaseReadinessTrackerLabel)[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  return Object.freeze(value.map((label) => {
    if (typeof label === 'string') return label;
    const record = requireJsonRecord(label, 'gh issue label');
    const name = record['name'];
    if (typeof name !== 'string') throw new Error('gh issue label is missing name');
    return { name };
  }));
}

function requireJsonRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} is not an object`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function escapeMarkdownTableCell(text: string): string {
  return text.replaceAll('|', '\\|');
}

function main(): void {
  try {
    process.exitCode = runReleaseReadiness(parseReleaseReadinessArgs(process.argv.slice(2)));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`release-readiness: ${message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}

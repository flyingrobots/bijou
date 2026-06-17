import { describe, expect, it } from 'vitest';
import {
  buildReleaseReadinessPlan,
  buildReleaseReadinessReport,
  parseReleaseReadinessArgs,
  runReleaseReadiness,
  type ReleaseReadinessDocsSnapshot,
} from './release-readiness.js';

function releaseDocsSnapshot(
  milestone: string,
  options: { readonly releasePacketExists?: boolean; readonly staleDocs?: boolean } = {},
): ReleaseReadinessDocsSnapshot {
  const version = milestone.replace(/^v/, '');
  const milestoneText = options.staleDocs === true ? 'v0.0.0' : milestone;
  return {
    roadmap: `ROADMAP ${milestoneText}`,
    bearing: `BEARING ${milestoneText}`,
    changelog: `## [Unreleased]\n\n## [${version}]`,
    releaseGuide: `release:readiness ${milestoneText} release-dry-run`,
    releasePacketExists: options.releasePacketExists ?? true,
  };
}

describe('release-readiness', () => {
  it('runs the expected release gate commands in order', () => {
    const plan = buildReleaseReadinessPlan();
    expect(plan.map((step) => step.label)).toEqual([
      'build',
      'lint',
      'code:size',
      'typecheck:test',
      'docs:design-system:preflight',
      'dogfood:coverage:gate',
      'dogfood:i18n:check',
      'dogfood:i18n:debt',
      'workflow:shell:preflight',
      'release:preflight',
      'test:frames',
      'verify:interactive-examples',
      'smoke:canaries',
      'smoke:dogfood',
      'test',
    ]);
    expect(plan.find((step) => step.label === 'verify:interactive-examples')?.args).toEqual([
      'run',
      'verify:interactive-examples',
    ]);
    expect(plan.find((step) => step.label === 'smoke:canaries')?.args).toEqual([
      'run',
      'smoke:canaries',
      '--',
      '--skip-build',
    ]);
    expect(plan.find((step) => step.label === 'smoke:dogfood')?.args).toEqual([
      'run',
      'smoke:dogfood',
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
      '/tmp/bijou:lint',
      '/tmp/bijou:code:size',
      '/tmp/bijou:typecheck:test',
      '/tmp/bijou:docs:design-system:preflight',
      '/tmp/bijou:dogfood:coverage:gate',
      '/tmp/bijou:dogfood:i18n:check',
      '/tmp/bijou:dogfood:i18n:debt',
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

  it('classifies a milestone report as ready when tracker, docs, packet, and package smoke are ready', () => {
    const report = buildReleaseReadinessReport({
      milestone: 'v7.1.0',
      trackerItems: [{
        number: 329,
        title: 'DX-046',
        state: 'CLOSED',
        labels: [{ name: 'legend:dx' }],
      }],
      docs: releaseDocsSnapshot('v7.1.0'),
    });

    expect(report.status).toBe('ready');
    expect(report.checks.map((check) => `${check.label}:${check.status}`)).toEqual([
      'tracker-open-items:pass',
      'tracker-wip-labels:pass',
      'docs-roadmap-bearing:pass',
      'docs-changelog:pass',
      'release-packet:pass',
      'package-smoke:pass',
    ]);
  });

  it('blocks a milestone report when tracker issues are open or still marked work-in-progress', () => {
    const report = buildReleaseReadinessReport({
      milestone: 'v7.1.0',
      trackerItems: [
        {
          number: 270,
          title: 'Release readiness',
          state: 'OPEN',
          labels: [{ name: 'lane:bad-code' }],
        },
        {
          number: 312,
          title: 'DOGFOOD i18n scanner',
          state: 'CLOSED',
          labels: [{ name: 'work-in-progress' }],
        },
      ],
      docs: releaseDocsSnapshot('v7.1.0'),
    });

    expect(report.status).toBe('blocked');
    expect(report.openTrackerItems.map((item) => item.number)).toEqual([270]);
    expect(report.wipTrackerItems.map((item) => item.number)).toEqual([312]);
    expect(report.checks.find((check) => check.label === 'tracker-open-items')?.summary).toContain('#270');
    expect(report.checks.find((check) => check.label === 'tracker-wip-labels')?.summary).toContain('#312');
  });

  it('blocks a milestone report when release docs or release packet evidence are stale', () => {
    const report = buildReleaseReadinessReport({
      milestone: 'v7.1.0',
      trackerItems: [],
      docs: releaseDocsSnapshot('v7.1.0', {
        releasePacketExists: false,
        staleDocs: true,
      }),
    });

    expect(report.status).toBe('blocked');
    expect(report.checks.find((check) => check.label === 'docs-roadmap-bearing')?.status).toBe('fail');
    expect(report.checks.find((check) => check.label === 'release-packet')?.status).toBe('fail');
  });

  it('prints and enforces a milestone report before running the local gauntlet', () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const executed: string[] = [];

    const code = runReleaseReadiness({
      milestone: 'v7.1.0',
      trackerItems: [{ number: 270, title: 'Release readiness', state: 'OPEN' }],
      docs: releaseDocsSnapshot('v7.1.0'),
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
      runCommand(step) {
        executed.push(step.label);
        return { status: 0 };
      },
    });

    expect(code).toBe(1);
    expect(stdout.join('')).toContain('Release readiness: BLOCKED (v7.1.0)');
    expect(stderr.join('')).toContain('release-readiness: v7.1.0 report is blocked');
    expect(executed).toEqual([]);
  });

  it('parses milestone CLI arguments', () => {
    expect(parseReleaseReadinessArgs([])).toEqual({});
    expect(parseReleaseReadinessArgs(['--milestone', 'v7.1.0'])).toEqual({ milestone: 'v7.1.0' });
    expect(parseReleaseReadinessArgs(['--milestone=v7.1.0'])).toEqual({ milestone: 'v7.1.0' });
    expect(() => parseReleaseReadinessArgs(['--milestone'])).toThrow('--milestone requires a value');
    expect(() => parseReleaseReadinessArgs(['--wat'])).toThrow('unknown release:readiness option: --wat');
  });
});

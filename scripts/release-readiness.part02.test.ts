import { describe, expect, it } from 'vitest';
import { buildReleaseReadinessReport, parseReleaseReadinessArgs, runReleaseReadiness, type ReleaseReadinessDocsSnapshot } from './release-readiness.js';

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

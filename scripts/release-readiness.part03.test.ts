import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildMilestoneTrackerItemCommands,
  buildReleaseReadinessReport,
  type ReleaseReadinessDocsSnapshot,
} from './release-readiness.js';
import { readReleaseReadinessDocs } from './release-readiness.part03.js';

function releaseDocsSnapshot(milestone: string): ReleaseReadinessDocsSnapshot {
  const version = milestone.replace(/^v/, '');
  return {
    changelog: `## [Unreleased]\n\n## [${version}]`,
    releaseGuide: `release:readiness ${milestone} release-dry-run`,
    releasePacketExists: true,
  };
}

describe('release-readiness tracker items', () => {
  it('reads release evidence without repository planning documents', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'bijou-release-docs-'));
    try {
      mkdirSync(join(cwd, 'docs/releases/8.0.0'), { recursive: true });
      writeFileSync(join(cwd, 'docs/CHANGELOG.md'), '## [Unreleased]');
      writeFileSync(join(cwd, 'docs/release.md'), 'Release Dry Run');
      writeFileSync(join(cwd, 'docs/releases/8.0.0/README.md'), 'Evidence');
      const docs = readReleaseReadinessDocs(cwd, 'v8.0.0');
      expect(docs.releasePacketExists).toBe(true);
      expect(buildReleaseReadinessReport({
        milestone: 'v8.0.0', trackerItems: [], docs,
      }).status).toBe('ready');
      expect(buildReleaseReadinessReport({
        milestone: 'v8.0.0', trackerItems: [{ number: 527, title: 'Replay witnesses', state: 'OPEN' }], docs,
      }).status).toBe('blocked');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('queries both milestone issues and pull requests for tracker state', () => {
      const commands = buildMilestoneTrackerItemCommands('v7.2.0');

      expect(commands.map((command) => command.kind)).toEqual(['issue', 'pull-request']);
      expect(commands[0]?.args).toEqual([
        'issue',
        'list',
        '--state',
        'all',
        '--milestone',
        'v7.2.0',
        '--limit',
        '1000',
        '--json',
        'number,title,state,labels,url',
      ]);
      expect(commands[1]?.args).toEqual([
        'pr',
        'list',
        '--state',
        'all',
        '--search',
        'milestone:"v7.2.0"',
        '--limit',
        '1000',
        '--json',
        'number,title,state,labels,url',
      ]);
    });

  it('classifies open milestone pull requests as blocking tracker items', () => {
      const report = buildReleaseReadinessReport({
        milestone: 'v7.2.0',
        trackerItems: [{
          kind: 'pull-request',
          number: 461,
          title: 'Release gate',
          state: 'OPEN',
          labels: [{ name: 'release' }],
        }],
        docs: releaseDocsSnapshot('v7.2.0'),
      });
      const openItemsCheck = report.checks.find((check) => check.label === 'tracker-open-items');

      expect(report.status).toBe('blocked');
      expect(openItemsCheck?.status).toBe('fail');
      expect(openItemsCheck?.summary).toContain('v7.2.0 has 1 open tracker item(s): #461');
      expect(openItemsCheck?.summary).not.toContain('open tracker issue');
    });

  it('treats merged milestone pull requests as closed tracker items', () => {
      const report = buildReleaseReadinessReport({
        milestone: 'v7.2.0',
        trackerItems: [{
          kind: 'pull-request',
          number: 360,
          title: 'DOGFOOD Light Theme Readiness',
          state: 'MERGED',
          labels: [{ name: 'release' }],
        }],
        docs: releaseDocsSnapshot('v7.2.0'),
      });
      const openItemsCheck = report.checks.find((check) => check.label === 'tracker-open-items');

      expect(report.status).toBe('ready');
      expect(report.openTrackerItems).toEqual([]);
      expect(openItemsCheck?.summary).toContain('v7.2.0 has zero open tracker items');
    });
});

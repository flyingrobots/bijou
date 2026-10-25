import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { documentationFileExists } from './documentation-corpus.js';
import { buildReleaseReadinessReport } from './release-readiness.js';
import { readReleaseReadinessDocs } from './release-readiness.part03.js';

const ROOT = resolve(import.meta.dirname, '..');

describe('current release evidence packet', () => {
  it('blocks an archive-only packet even when the historical edition remains readable', () => {
    const historicalPacket = join(ROOT, 'docs/releases/7.2.0/README.md');
    expect(existsSync(historicalPacket)).toBe(false);
    expect(documentationFileExists(historicalPacket)).toBe(true);
    const docs = readReleaseReadinessDocs(ROOT, 'v7.2.0');
    expect(docs.releasePacketExists).toBe(false);
    const report = buildReleaseReadinessReport({ milestone: 'v7.2.0', trackerItems: [], docs });
    expect(report.status).toBe('blocked');
    expect(report.checks.find((check) => check.label === 'release-packet')?.status).toBe('fail');
  });

  it('accepts a live stable acceptance packet and reports its actual path', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'bijou-stable-packet-'));
    try {
      mkdirSync(join(cwd, 'docs/releases/8.0.0'), { recursive: true });
      writeFileSync(join(cwd, 'docs/CHANGELOG.md'), '## [Unreleased]');
      writeFileSync(join(cwd, 'docs/release.md'), 'Release Dry Run');
      writeFileSync(join(cwd, 'docs/releases/8.0.0/stable-acceptance.md'), '# Stable acceptance');
      const docs = readReleaseReadinessDocs(cwd, 'v8.0.0');
      expect(docs.releasePacketExists).toBe(true);
      const report = buildReleaseReadinessReport({ milestone: 'v8.0.0', trackerItems: [], docs });
      expect(report.status).toBe('ready');
      expect(report.checks.find((check) => check.label === 'release-packet')?.summary)
        .toContain('docs/releases/8.0.0/stable-acceptance.md');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});

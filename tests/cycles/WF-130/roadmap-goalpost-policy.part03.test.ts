import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error('Expected JSON object');
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

describe('WF-130 roadmap goalpost policy', () => {
  it('disables Markdown line-length linting for project docs', () => {
    const markdownlintConfig = requireRecord(JSON.parse(read('.markdownlint.json')));

    expect(markdownlintConfig.MD013).toBe(false);
    expect(markdownlintConfig['line-length']).toBe(false);
  });

  it('keeps v7.2 release evidence replay commands aligned with split WF-130 proof files', () => {
    const releaseEvidence = read('docs/releases/7.2.0/README.md');
    const proofFiles = [
      'tests/cycles/WF-130/roadmap-goalpost-policy.part01.test.ts',
      'tests/cycles/WF-130/roadmap-goalpost-policy.part02.test.ts',
      'tests/cycles/WF-130/roadmap-goalpost-policy.part03.test.ts',
    ];

    for (const proofFile of proofFiles) {
      expect(releaseEvidence).toContain(proofFile);
    }
  });

  it('publishes discoverable v7.2 release docs before the version bump', () => {
    const releaseDocs = [
      'docs/releases/7.2.0/README.md',
      'docs/releases/7.2.0/whats-new.md',
      'docs/releases/7.2.0/migration-guide.md',
    ];

    for (const releaseDoc of releaseDocs) {
      expect(existsSync(resolve(ROOT, releaseDoc))).toBe(true);
    }

    const releaseIndex = read('docs/releases/README.md');
    expect(releaseIndex).toContain('[Release Evidence (v7.2.0)](./7.2.0/README.md)');
    expect(releaseIndex).toContain('[What\'s New (v7.2.0)](./7.2.0/whats-new.md)');
    expect(releaseIndex).toContain('[Migration Guide (v7.2.0)](./7.2.0/migration-guide.md)');
  });
});

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

function extractBashCommandBlocks(markdown: string): string[] {
  return Array.from(markdown.matchAll(/```bash\n(?<command>[\s\S]*?)```/g)).map(
    (match) => match.groups?.command.trim() ?? '',
  );
}

function extractReferencedTestPaths(markdown: string): string[] {
  const paths = Array.from(markdown.matchAll(/\b((?:packages|scripts|tests)\/[A-Za-z0-9._/-]+\.test\.ts)\b/g)).map(
    (match) => match[1],
  );

  return Array.from(new Set(paths)).sort();
}

describe('WF-130 roadmap goalpost policy', () => {
  it('disables Markdown line-length linting for project docs', () => {
    const markdownlintConfig = requireRecord(JSON.parse(read('.markdownlint.json')));

    expect(markdownlintConfig.MD013).toBe(false);
    expect(markdownlintConfig['line-length']).toBe(false);
  });

  it('keeps v7.2 release evidence replay commands aligned with split WF-130 proof files', () => {
    const releaseEvidence = read('docs/releases/7.2.0/README.md');
    const commandBlocks = extractBashCommandBlocks(releaseEvidence);
    const roadmapReplay = commandBlocks.find((commandBlock) =>
      commandBlock.includes('tests/cycles/WF-130/roadmap-goalpost-policy.part01.test.ts'),
    );
    const proofFiles = [
      'tests/cycles/WF-130/roadmap-goalpost-policy.part01.test.ts',
      'tests/cycles/WF-130/roadmap-goalpost-policy.part02.test.ts',
      'tests/cycles/WF-130/roadmap-goalpost-policy.part03.test.ts',
    ];

    for (const proofFile of proofFiles) {
      expect(roadmapReplay ?? '').toContain(proofFile);
    }
  });

  it('keeps v7.2 release evidence test paths replayable from the checkout', () => {
    const releaseEvidence = read('docs/releases/7.2.0/README.md');
    const referencedTestPaths = extractReferencedTestPaths(releaseEvidence);
    const missingTestPaths = referencedTestPaths.filter((testPath) => !existsSync(resolve(ROOT, testPath)));

    expect(missingTestPaths).toEqual([]);
  });

  it('publishes discoverable v7.2 release docs for the versioned package set', () => {
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

  it('keeps the v7.2 release packet aligned with release-prep and registry gates', () => {
    const releasePacket = read('docs/releases/7.2.0/README.md');
    const publishedPackages = [
      '@flyingrobots/bijou',
      '@flyingrobots/bijou-node',
      '@flyingrobots/bijou-tui',
      '@flyingrobots/bijou-tui-app',
      'create-bijou-tui-app',
      '@flyingrobots/bijou-i18n',
      '@flyingrobots/bijou-i18n-tools',
      '@flyingrobots/bijou-i18n-tools-node',
      '@flyingrobots/bijou-i18n-tools-xlsx',
      '@flyingrobots/bijou-mcp',
    ];

    expect(releasePacket).toContain('## Package And Registry Verification Plan');
    expect(releasePacket).toContain('npm run version 7.2.0');
    expect(releasePacket).toContain('Release Dry Run');
    expect(releasePacket).toContain('https://github.com/flyingrobots/bijou/releases/tag/v7.2.0');
    expect(releasePacket).toContain('Publish workflow passed on 2026-07-05');
    expect(releasePacket).toContain('npm registry verification passed for every automated package');
    expect(releasePacket).toContain('## Release-Time Registry Snapshot');
    expect(releasePacket).toContain(
      'workflow run `28736930944` completed at `2026-07-05T10:03:04Z`',
    );
    expect(releasePacket).toContain('The `npm view` commands');
    expect(releasePacket).toContain('may report a later `latest` value');
    expect(releasePacket).not.toContain('pending final-main release step');
    expect(releasePacket).not.toContain('verification remain final-main work');
    expect(releasePacket).not.toContain('The version bump, final release dry run, tag creation');

    for (const packageName of publishedPackages) {
      expect(releasePacket).toContain(`npm view ${packageName} version dist-tags --json`);
      expect(releasePacket).toContain(`| \`${packageName}\` | \`7.2.0\` | \`7.2.0\` |`);
    }
  });

  it('keeps dev-tooling dependency security in the v7.2 audit replay', () => {
    const releasePacket = read('docs/releases/7.2.0/README.md');

    expect(releasePacket).toContain('Dev-tooling dependency audit');
    expect(releasePacket).toContain('`npm audit --audit-level=high`');
    expect(releasePacket).toContain('`npm audit --omit=dev --audit-level=high`');
    expect(releasePacket).toContain('`esbuild` resolves to `0.28.1`');
    expect(releasePacket).toContain('`node_modules/esbuild`');
  });
});

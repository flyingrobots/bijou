
import { describe, it } from 'vitest';
import { expectClaims, expectNoClaims, read } from './roadmap-goalpost-policy.test-support.js';
describe('WF-130 roadmap pull order', () => {
  it('keeps the v7.2 release packet aligned with release-prep and registry gates', () => {
    const packet = read('docs/releases/7.2.0/README.md');
    const packages = [
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
    expectClaims(packet, [
      '## Package And Registry Verification Plan',
      'npm run version 7.2.0',
      'Release Dry Run',
      'releases/tag/v7.2.0',
      'Publish workflow passed on 2026-07-05',
      'npm registry verification passed for every automated package',
      '## Release-Time Registry Snapshot',
      'workflow run `28736930944` completed at `2026-07-05T10:03:04Z`',
      'may report a later `latest` value',
    ]);
    expectNoClaims(packet, [
      'pending final-main release step',
      'verification remain final-main work',
      'The version bump, final release dry run, tag creation',
    ]);
    for (const packageName of packages) {
      expectClaims(packet, [
        `npm view ${packageName} version dist-tags --json`,
        `| \`${packageName}\` | \`7.2.0\` | \`7.2.0\` |`,
      ]);
    }
  });

  it('keeps dev-tooling dependency security in the v7.2 audit replay', () => {
    expectClaims(read('docs/releases/7.2.0/README.md'), [
      'Dev-tooling dependency audit',
      '`npm audit --audit-level=high`',
      '`npm audit --omit=dev --audit-level=high`',
      '`esbuild` resolves to `0.28.1`',
      '`node_modules/esbuild`',
    ]);
  });
});

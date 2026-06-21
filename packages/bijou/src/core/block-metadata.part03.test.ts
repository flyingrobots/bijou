import { describe, expect, it } from 'vitest';
import { blockPackageManifestReportText, validateBlockPackageManifest } from './block-metadata.js';

describe('block metadata contract', () => {
  it('reports invalid block package manifests deterministically', () => {
      const report = validateBlockPackageManifest({
        packageName: '',
        version: '',
        bijouPeerRange: '',
        blocks: ['AppShell', 'AppShell'],
        docs: ['docs/README.md', 'docs/README.md'],
        tags: ['shell', 'shell'],
      });

      expect(report.passed).toBe(false);
      expect(report.issues.map((issue) => issue.path)).toEqual([
        'packageName',
        'version',
        'bijouPeerRange',
        'blocks[1]',
        'docs[1]',
        'tags[1]',
      ]);
      expect(blockPackageManifestReportText(report)).toContain(
        '- error duplicate-id path=blocks[1]: duplicate block id AppShell',
      );
    });
});

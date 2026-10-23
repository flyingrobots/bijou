import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { releaseLineOf } from '../examples/docs/app-release-line.js';
import { readReleaseReadinessDocs } from './release-readiness.part03.js';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('release readiness and DOGFOOD share the release-line directory', () => {
  it.each(['8.0.0-alpha.1', '8.0.0-beta.12', '8.0.0-rc.1', '8.0.0'])(
    'finds the packet alongside DOGFOOD docs for %s', (version) => {
      const root = mkdtempSync(join(tmpdir(), 'bijou-release-docs-'));
      roots.push(root);
      const directory = join(root, 'docs/releases', releaseLineOf(version));
      for (const [path, content] of [
        [join(root, 'docs/CHANGELOG.md'), '## [Unreleased]'],
        [join(root, 'docs/release.md'), 'Release Dry Run'],
        [join(directory, 'README.md'), 'Evidence packet'],
        [join(directory, 'whats-new.md'), 'Release changes'],
        [join(directory, 'migration-guide.md'), 'Migration'],
      ] as const) {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
      }
      expect(readReleaseReadinessDocs(root, 'v8.0.0').releasePacketExists).toBe(true);
      expect(readReleaseReadinessDocs(root, `v${version}`).releasePacketExists).toBe(!version.includes('-'));
    },
  );
});

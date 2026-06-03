import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('DX-029 scopedNodeIO realpath and symlink docs', () => {
  it('documents realpath-normalized returns and symlink escape rejection in the Node package docs', () => {
    const docs = [
      readRepoFile('packages/bijou-node/README.md'),
      readRepoFile('packages/bijou-node/GUIDE.md'),
      readRepoFile('packages/bijou-node/ADVANCED_GUIDE.md'),
      readRepoFile('packages/bijou-node/ARCHITECTURE.md'),
    ].join('\n');

    expect(docs).toContain('realpath-normalized');
    expect(docs).toContain('resolvePath()');
    expect(docs).toContain('joinPath()');
    expect(docs).toContain('symlink escape');
    expect(docs).toContain('lexical prefix');
  });
});

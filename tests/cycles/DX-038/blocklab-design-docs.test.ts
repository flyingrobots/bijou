import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('DX-038/DX-039 BlockLab design docs', () => {
  it('records the BlockLab rename design with issue-backed Method sections', () => {
    const path = 'docs/design/DX-038-blocklab-rename-and-migration.md';

    expect(existsRepoPath(path)).toBe(true);

    const doc = readRepoFile(path);

    expect(doc).toContain('https://github.com/flyingrobots/bijou/issues/271');
    expect(doc).toContain('BlockLab');
    expect(doc).toContain('## Sponsored Human');
    expect(doc).toContain('## Sponsored Agent');
    expect(doc).toContain('## Hill');
    expect(doc).toContain('## TUI Mockup');
    expect(doc).toContain('## Lower Modes');
    expect(doc).toContain('## Tests To Write First');
  });

  it('records the BlockLab product-parity design with actual Storybook source scan', () => {
    const path = 'docs/design/DX-039-blocklab-product-parity.md';

    expect(existsRepoPath(path)).toBe(true);

    const doc = readRepoFile(path);

    expect(doc).toContain('https://github.com/flyingrobots/bijou/issues/272');
    expect(doc).toContain('Source Scan');
    expect(doc).toContain('https://storybook.js.org/docs/writing-stories/args');
    expect(doc).toContain('https://storybook.js.org/docs/essentials/controls');
    expect(doc).toContain('https://storybook.js.org/docs/writing-tests/interaction-testing');
    expect(doc).toContain('args/controls');
    expect(doc).toContain('addon-like panels');
    expect(doc).toContain('## TUI Mockup');
    expect(doc).toContain('## Lower Modes');
  });
});

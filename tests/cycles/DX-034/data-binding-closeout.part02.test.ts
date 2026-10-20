import { describe, expect, it, readRepoFile, standardBlockStories } from './data-binding-closeout.test-support.js';

describe('DX-034 data binding closeout', () => {
  it('keeps binding-state story coverage visible for DOGFOOD and lower modes', () => {
    const storiesByBlock = new Map(
      ['ReaderSurface', 'InspectorPanel'].map((blockName) => [
        blockName,
        standardBlockStories
          .filter((story) => story.blockName === blockName)
          .map((story) => story.state),
      ]),
    );

    expect(storiesByBlock.get('ReaderSurface')).toEqual([
      'ready',
      'loading',
      'stale',
      'empty',
      'error',
    ]);
    expect(storiesByBlock.get('InspectorPanel')).toEqual([
      'ready',
      'empty',
      'loading',
      'stale',
      'error',
    ]);

    const dogfoodBlocksTest = readRepoFile('tests/cycles/DX-031/dogfood-blocks-section.part03.test.ts');
    expect(dogfoodBlocksTest).toContain('lowering summary');
    expect(dogfoodBlocksTest).toContain('standardBlockStories');
  });
});

describe('DX-034 data binding closeout', () => {
  it('marks DX-034 landed in Method evidence after closing issue 182', () => {
    const design = readRepoFile('docs/design/DX-034-declarative-view-data-binding.md');
    const changelog = readRepoFile('docs/CHANGELOG.md');

    expect(design).toContain('DX-034 is landed for the `v6.0.0` release boundary.');
    expect(design).toContain('Provider-bound AppShell proof is present');
    expect(design).toContain('DOGFOOD binding-state proof is present');
    expect(design).not.toContain('16. Next: prove rendered AppShell');
    expect(design).not.toContain('17. Next: add DOGFOOD stories');

    expect(changelog).toContain('DX-034 data binding closeout');
    expect(changelog).toContain('provider-bound AppShell');
  });
});

describe('DX-034 data binding closeout', () => {
  it('keeps compressed v6 lineage pointing to issue 182 evidence', () => {
    const design = readRepoFile('docs/design/DX-034-declarative-view-data-binding.md');
    expect(design).toContain('contract without keeping issue #182 open');
  });
});

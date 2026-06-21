import {
  _resetDefaultContextForTesting,
  afterEach,
  blockPreviewGuideId,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  foregroundStyledTextCellExists,
  frameText,
  it,
  must,
  pageModel,
  runScript,
  standardBlockPreviewRenderCases,
  standardBlocks,
  standardBlockStories,
} from './dogfood-blocks-section.test-support.js';

describe('DX-031D DOGFOOD Blocks section', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('does not tick the CounterDemoBlock fixture when another Blocks guide is selected', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 43 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });
    const result = await runScript(app, [
      {
        msg: {
          type: 'docs',
          msg: { type: 'select-guide', guideId: 'blocks-preview-counterdemoblock' },
        },
      },
      { key: '+' },
      {
        msg: {
          type: 'docs',
          msg: { type: 'select-guide', guideId: 'blocks-what-are-blocks' },
        },
      },
      { pulse: { dt: 0.6 } },
    ], { ctx });
    const blocksModel = pageModel(result.model, 'blocks');
    expect(blocksModel.selectedGuideId).toBe('blocks-what-are-blocks');
    expect(blocksModel.counterBlockDemo.counter).toBe(6);
    expect(blocksModel.counterBlockDemo.animationTimeMs).toBe(0);
  });
});

describe('DX-031D DOGFOOD Blocks section', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('keeps scripted standard block preview coverage bounded as the catalog grows', () => {
    const caseNames = standardBlockPreviewRenderCases().map((block) => block.metadata.blockName);
    expect(caseNames).toEqual(['AppShell', 'ReaderSurface', 'TemporalDependencyBlock']);
    expect(new Set(caseNames).size).toBe(caseNames.length);
    expect(caseNames.length).toBeLessThan(standardBlocks.length);
  });
});

describe('DX-031D DOGFOOD Blocks section', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('renders the selected standard block preview without stacking every block page', async () => {
    for (const block of standardBlockPreviewRenderCases()) {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 220, rows: 260 } });
      const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });
      const result = await runScript(app, [{
        msg: {
          type: 'docs',
          msg: { type: 'select-guide', guideId: blockPreviewGuideId(block.metadata.blockName) },
        },
      }], { ctx });
      const text = frameText(must(result.frames.at(-1)));
      const otherBlocks = standardBlocks.filter(
        (candidate) => candidate.metadata.blockName !== block.metadata.blockName,
      );
      expect(pageModel(result.model, 'blocks').selectedGuideId).toBe(
        blockPreviewGuideId(block.metadata.blockName),
      );
      expect(text).toContain('blocks • live preview');
      expect(text).toContain('lowering summary');
      expect(text).toContain('documentation');
      expect(text).not.toContain('Live example');
      expect(text).toContain('interactive mode');
      expect(text).toContain('static mode');
      expect(text).toContain('pipe mode');
      expect(text).toContain('accessible mode');
      expect(text).toContain('facts');
      expect(text).toContain('documentation');
      expect(text).not.toContain('surface output:');
      expect(text).not.toContain('Contract: block metadata:');
      expect(text).not.toContain('components=AppShellComposition');
      expect(text).not.toContain('Source: packages/bijou/src/core/standard-blocks.ts');
      expect(text).not.toContain('entity:region.navigation=present');
      expect(text).not.toContain('entity:slot.navigation=present');
      expect(text).not.toContain('interactive:');
      expect(text).not.toContain('static:');
      expect(text).not.toContain('pipe:');
      expect(text).not.toContain('accessible:');
      expect(text).not.toContain('provider snapshots idle; commands ready');
      expect(text).not.toContain('(missing required');
      expect(text).toContain(block.metadata.blockName);
      if (block.metadata.blockName === 'AppShell') {
        expect(text).toContain('ReaderSurface live content from DOGFOOD Blocks.');
        expect(text).toContain('InspectorPanel');
        expect(text).toContain('schema-bound; provider-ready; command-aware');
        expect(text).not.toContain('ReaderSurface block page');
      }
      expect(foregroundStyledTextCellExists(must(result.frames.at(-1)), block.metadata.blockName)).toBe(true);
      for (const story of standardBlockStories.filter(
        (candidate) => candidate.blockName === block.metadata.blockName,
      )) {
        expect(text).toContain(story.id);
      }
      for (const otherBlock of otherBlocks) {
        for (const story of standardBlockStories.filter(
          (candidate) => candidate.blockName === otherBlock.metadata.blockName,
        )) {
          expect(text).not.toContain(story.id);
        }
      }
    }
  }, 15_000);
});

import {
  _resetDefaultContextForTesting,
  afterEach,
  blockPreviewGuideId,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  frameText,
  it,
  KEY_ENTER,
  KEY_NEXT_TAB,
  must,
  pageModel,
  runScript,
  standardBlocks,
} from './dogfood-blocks-section.test-support.js';

describe('DX-031D DOGFOOD Blocks section', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('publishes Blocks as a top-level DOGFOOD section with the requested pages', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 44 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: KEY_NEXT_TAB },
    ], { ctx });
    const model = result.model;
    const blocksModel = pageModel(model, 'blocks');
    const guideLabels = blocksModel.guideState.items.map((item: { label: string }) => item.label);
    const text = frameText(must(result.frames.at(-1)));
    expect(model.docsModel.activePageId).toBe('blocks');
    expect(guideLabels).toEqual([
      'What are Blocks',
      'How to Make Your Own Blocks',
      'Pre-made Blocks',
      'DOGFOOD Surface Blocks',
      'Block Preview',
      ...standardBlocks.map((block) => `  ${block.metadata.blockName}`),
      '  CounterDemoBlock',
      'How Blocks Lower',
    ]);
    expect(blocksModel.selectedGuideId).toBe('blocks-preview-counterdemoblock');
    expect(text).toContain('CounterDemoBlock fixture');
    expect(text).toContain('Counter: 5');
  });
});

describe('DX-031D DOGFOOD Blocks section', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('opens the Block Preview group on the interactive CounterDemoBlock preview', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 220, rows: 260 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });
    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-preview' },
      },
    }], { ctx });
    const text = frameText(must(result.frames.at(-1)));
    expect(pageModel(result.model, 'blocks').selectedGuideId).toBe('blocks-preview-counterdemoblock');
    expect(text).toContain('CounterDemoBlock fixture');
    expect(text).toContain('Counter: 5');
    expect(text).toContain('[-] decrease');
    expect(text).toContain('[+] increase');
    expect(text).toContain('lowering summary');
    expect(text).toContain('documentation');
    expect(text).not.toContain('Available Blocks');
  });
});

describe('DX-031D DOGFOOD Blocks section', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('selects focused standard block rows from the Blocks side navigation', async () => {
    const firstBlock = standardBlocks[0];
    expect(firstBlock).toBeDefined();
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 43 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });
    const result = await runScript(app, [
      { msg: { type: 'docs', msg: { type: 'select-guide', guideId: 'blocks-what-are-blocks' } } },
      { msg: { type: 'docs', msg: { type: 'guide-next' } } },
      { msg: { type: 'docs', msg: { type: 'guide-next' } } },
      { msg: { type: 'docs', msg: { type: 'guide-next' } } },
      { msg: { type: 'docs', msg: { type: 'guide-next' } } },
      { msg: { type: 'docs', msg: { type: 'guide-next' } } },
    ], { ctx });
    const text = frameText(must(result.frames.at(-1)));
    const blockName = firstBlock?.metadata.blockName;
    expect(pageModel(result.model, 'blocks').selectedGuideId).toBe(blockPreviewGuideId(blockName));
    expect(text).toContain(blockName);
    expect(text).toContain('lowering summary');
    expect(text).not.toContain('Available Blocks');
  });
});

describe('DX-031D DOGFOOD Blocks section', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('moves focus back to the Block Preview parent row from the first preview child', async () => {
    const firstBlock = standardBlocks[0];
    expect(firstBlock).toBeDefined();
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 43 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });
    const result = await runScript(app, [
      {
        msg: {
          type: 'docs',
          msg: { type: 'select-guide', guideId: blockPreviewGuideId(firstBlock?.metadata.blockName) },
        },
      },
      { msg: { type: 'docs', msg: { type: 'guide-prev' } } },
    ], { ctx });
    const blocksModel = pageModel(result.model, 'blocks');
    const focusedItem = blocksModel.guideState.items[blocksModel.guideState.focusIndex];
    expect(blocksModel.selectedGuideId).toBe(blockPreviewGuideId(firstBlock?.metadata.blockName));
    expect(focusedItem.value).toBe('blocks-preview');
  });
});

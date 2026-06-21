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
  KEY_BOTTOM,
  KEY_TAB,
  must,
  pageModel,
  runScript,
  standardBlocks,
} from './dogfood-blocks-section.test-support.js';

describe('DX-031D DOGFOOD Blocks section', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('resets the guide content scroll when selecting another block preview', async () => {
    const [firstBlock, secondBlock] = standardBlocks;
    if (firstBlock == null || secondBlock == null) throw new Error('Expected two standard blocks');
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 220, rows: 60 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });
    const result = await runScript(app, [
      {
        msg: {
          type: 'docs',
          msg: { type: 'select-guide', guideId: blockPreviewGuideId(firstBlock.metadata.blockName) },
        },
      },
      { key: KEY_TAB },
      { key: KEY_BOTTOM },
      {
        msg: {
          type: 'docs',
          msg: { type: 'select-guide', guideId: blockPreviewGuideId(secondBlock.metadata.blockName) },
        },
      },
    ], { ctx });
    const model = result.model;
    const last = result.frames.at(-1);
    if (!last) throw new Error('frame');
    const text = frameText(last);
    expect(model.docsModel.scrollByPage.blocks?.['guide-content']?.y ?? 0).toBe(0);
    expect(text).toContain(secondBlock.metadata.blockName);
    expect(text).toContain('lowering summary');
  });
});

describe('DX-031D DOGFOOD Blocks section', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('renders block lowering posture from the standard block mode declarations', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 180, rows: 54 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });
    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-lowering' },
      },
    }], { ctx });
    const text = frameText(must(result.frames.at(-1)));
    const declaredModes = Array.from(
      new Set(standardBlocks.flatMap((block) => block.metadata.modes)),
    ).sort();
    expect(pageModel(result.model, 'blocks').selectedGuideId).toBe('blocks-lowering');
    for (const mode of declaredModes) {
      expect(text).toContain(mode);
    }
    for (const block of standardBlocks) {
      expect(text).toContain(block.metadata.blockName);
    }
  });
});

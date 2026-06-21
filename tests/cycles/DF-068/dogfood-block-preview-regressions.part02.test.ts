import {
  _resetDefaultContextForTesting,
  afterEach,
  blockPreviewGuideId,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  expectBoxTitleRowCloses,
  frameText,
  it,
  must,
  renderBlocksGuide,
  rowContaining,
  rowsFor,
  runScript,
} from './dogfood-block-preview-regressions.test-support.js';

describe('DF-068 DOGFOOD block preview regressions', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('renders the CounterDemoBlock preview page without wrapped border rows and keeps intent keys live', async () => {
    const guideId = blockPreviewGuideId('CounterDemoBlock');
    const selected = await renderBlocksGuide(guideId, 150, 43);
    const incremented = await runScript(
      createDocsApp(selected.ctx, { initialRoute: 'docs', initialPageId: 'blocks' }),
      [
        {
          msg: {
            type: 'docs',
            msg: { type: 'select-guide', guideId },
          },
        },
        { key: '+' },
      ],
      { ctx: selected.ctx },
    );
    const selectedRows = rowsFor(selected.text);
    expectBoxTitleRowCloses(rowContaining(selectedRows, 'CounterDemoBlock fixture'));
    expectBoxTitleRowCloses(rowContaining(selectedRows, 'lowering summary'));
    expectBoxTitleRowCloses(rowContaining(selectedRows, 'documentation'));
    expect(selected.text).toContain('Counter: 5');
    expect(selected.text).toContain('json: {"counter":5}');
    expect(frameText(must(incremented.frames.at(-1)))).toContain('Counter: 6');
    expect(frameText(must(incremented.frames.at(-1)))).toContain('json: {"counter":6}');
  });
});

describe('DF-068 DOGFOOD block preview regressions', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('keeps the shell-owned perf HUD toggle available from block preview pages', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 43 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });
    const toggled = await runScript(app, [
      {
        msg: {
          type: 'docs',
          msg: { type: 'select-guide', guideId: blockPreviewGuideId('AppShell') },
        },
      },
      { key: '`' },
    ], { ctx });
    const model = toggled.model as {
      docsModel: { perfHudOpen: boolean };
    };
    expect(model.docsModel.perfHudOpen).toBe(true);
    expect(frameText(must(toggled.frames.at(-1)))).toContain('Perf HUD');
  });
});

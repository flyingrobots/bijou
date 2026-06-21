import {
  _resetDefaultContextForTesting,
  afterEach,
  blockPreviewGuideId,
  counterDemoBlockSurface,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  frameRows,
  frameText,
  it,
  must,
  pageModel,
  runScript,
  standardBlocks,
} from './dogfood-blocks-section.test-support.js';

describe('DX-031D DOGFOOD Blocks section', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('renders the pre-made block catalog without raw contract dumps', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 43 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });
    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-pre-made' },
      },
    }], { ctx });
    const text = frameText(must(result.frames.at(-1)));
    expect(text).toContain('First-party standard blocks');
    for (const block of standardBlocks) {
      expect(text).toContain(block.metadata.blockName);
    }
    expect(text).not.toContain('block package:');
    expect(text).not.toContain('bijouPeerRange=');
    expect(text).not.toContain('Contract: block metadata:');
    expect(text).not.toContain('components=AppShellComposition');
    expect(text).not.toContain('Source: packages/bijou/src/core/standard-blocks.ts');
  });
});

describe('DX-031D DOGFOOD Blocks section', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('keeps selected block pages preview-first at a normal DOGFOOD viewport', async () => {
    const readerBlock = standardBlocks.find((block) => block.metadata.blockName === 'ReaderSurface');
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 43 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });
    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: blockPreviewGuideId(must(readerBlock).metadata.blockName) },
      },
    }], { ctx });
    const text = frameText(must(result.frames.at(-1)));
    expect(text).toContain('ReaderSurface');
    expect(text).toContain('ReaderSurface live content from DOGFOOD Blocks.');
    expect(text).toContain('lowering summary');
    expect(text).toContain('interactive mode');
    expect(text).toContain('static mode');
    expect(frameRows(must(result.frames.at(-1))).filter((row) => row.includes('┌─ ReaderSurface')).length).toBe(1);
    expect(text).not.toContain('Available Blocks');
    expect(text).not.toContain('Contract: block metadata:');
    expect(text).not.toContain('Source: packages/bijou/src/core/standard-blocks.ts');
  });
});

describe('DX-031D DOGFOOD Blocks section', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('renders the CounterDemoBlock fixture and applies command-intent keys', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 43 } });
    const runCounterSteps = async (keys: readonly string[]) => runScript(
      createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' }),
      [
        {
          msg: {
            type: 'docs',
            msg: { type: 'select-guide', guideId: 'blocks-preview-counterdemoblock' },
          },
        },
        ...keys.map((key) => ({ key })),
      ],
      { ctx },
    );
    const selected = await runCounterSteps([]);
    const incremented = await runCounterSteps(['+']);
    const decremented = await runCounterSteps(['+', '-']);
    expect(pageModel(selected.model, 'blocks').selectedGuideId).toBe('blocks-preview-counterdemoblock');
    expect(pageModel(incremented.model, 'blocks').counterBlockDemo.counter).toBe(6);
    expect(pageModel(decremented.model, 'blocks').counterBlockDemo.counter).toBe(5);
    expect(frameText(must(selected.frames.at(-1)))).toContain('Counter: 5');
    expect(frameText(must(selected.frames.at(-1)))).toContain('[-] decrease');
    expect(frameText(must(selected.frames.at(-1)))).toContain('[+] increase');
    expect(frameText(must(selected.frames.at(-1)))).toContain('json: {"counter":5}');
    const selectedRows = frameRows(must(selected.frames.at(-1)));
    expect(selectedRows.find((row) => row.includes('CounterDemoBlock fixture'))).toContain('┐');
    expect(selectedRows.find((row) => row.includes('┌─ lowering summary'))).toContain('┐');
    expect(frameText(must(incremented.frames.at(-1)))).toContain('Counter: 6');
    expect(frameText(must(incremented.frames.at(-1)))).toContain('json: {"counter":6}');
    expect(frameText(must(decremented.frames.at(-1)))).toContain('Counter: 5');
  });
});

describe('DX-031D DOGFOOD Blocks section', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('sizes the CounterDemoBlock fixture by visible terminal width', () => {
    const baseCtx = createTestContext({ mode: 'interactive', runtime: { columns: 100, rows: 40 } });
    const styledCtx = {
      ...baseCtx,
      style: {
        ...baseCtx.style,
        styled: (_token: unknown, text: string) => `\x1b[31m${text}\x1b[0m`,
      },
    };
    const surface = counterDemoBlockSurface({ counter: 5, ctx: styledCtx });
    expect(surface.width).toBe(70);
  });
});

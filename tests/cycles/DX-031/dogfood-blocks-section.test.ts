import { afterEach, describe, expect, it } from 'vitest';
import { standardBlocks, standardBlockStories } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../../../examples/docs/app.js';
import { counterDemoBlockSurface } from '../../../examples/docs/counter-block-demo.js';

const KEY_ENTER = '\r';
const KEY_NEXT_TAB = ']';
const KEY_TAB = '\t';
const KEY_BOTTOM = 'G';

function blockPreviewGuideId(blockName: string): string {
  const slug = blockName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `blocks-preview-${slug || 'block'}`;
}

function docsPageModel(model: any, pageId: string) {
  return model.docsModel.pageModels[pageId];
}

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char || ' ';
    }
    text += '\n';
  }
  return text;
}

function frameRows(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  return frameText(frame).split('\n');
}

function foregroundStyledTextCellExists(
  frame: {
    width: number;
    height: number;
    get(x: number, y: number): {
      char?: string;
      fg?: unknown;
      fgRGB?: unknown;
      modifiers?: readonly string[];
    };
  },
  needle: string,
) {
  for (let y = 0; y < frame.height; y++) {
    let row = '';
    for (let x = 0; x < frame.width; x++) {
      row += frame.get(x, y).char || ' ';
    }

    for (
      let start = row.indexOf(needle);
      start !== -1;
      start = row.indexOf(needle, start + 1)
    ) {
      for (let x = start; x < Math.min(frame.width, start + needle.length); x++) {
        const cell = frame.get(x, y);
        if (
          cell.fg != null
          || cell.fgRGB != null
          || (cell.modifiers?.length ?? 0) > 0
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

describe('DX-031D DOGFOOD Blocks section', () => {
  afterEach(() => _resetDefaultContextForTesting());

  it('publishes Blocks as a top-level DOGFOOD section with the requested pages', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 44 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: KEY_NEXT_TAB },
    ], { ctx });
    const model = result.model as any;
    const blocksModel = docsPageModel(model, 'blocks');
    const guideLabels = blocksModel.guideState.items.map((item: { label: string }) => item.label);

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
    expect(blocksModel.selectedGuideId).toBe('blocks-what-are-blocks');
  });

  it('opens the Block Preview group on the first standard block preview', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 220, rows: 260 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });

    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-preview' },
      },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);
    const firstBlockName = standardBlocks[0]!.metadata.blockName;

    expect(docsPageModel(result.model as any, 'blocks').selectedGuideId).toBe(blockPreviewGuideId(firstBlockName));
    expect(text).toContain(`${firstBlockName}`);
    expect(text).toContain('lowering summary');
    expect(text).toContain('documentation');
    expect(text).not.toContain('Live example');
    expect(text).not.toContain('Available Blocks');
  });

  it('selects focused standard block rows from the Blocks side navigation', async () => {
    const firstBlock = standardBlocks[0];
    expect(firstBlock).toBeDefined();

    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 43 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });
    const result = await runScript(app, [
      { msg: { type: 'docs', msg: { type: 'guide-next' } } },
      { msg: { type: 'docs', msg: { type: 'guide-next' } } },
      { msg: { type: 'docs', msg: { type: 'guide-next' } } },
      { msg: { type: 'docs', msg: { type: 'guide-next' } } },
    ], { ctx });
    const text = frameText(result.frames.at(-1)!);
    const blockName = firstBlock!.metadata.blockName;

    expect(docsPageModel(result.model as any, 'blocks').selectedGuideId).toBe(blockPreviewGuideId(blockName));
    expect(text).toContain(`${blockName}`);
    expect(text).toContain('lowering summary');
    expect(text).not.toContain('Available Blocks');
  });

  it('renders the pre-made block catalog without raw contract dumps', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 43 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });
    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-pre-made' },
      },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);

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

  it('keeps selected block pages preview-first at a normal DOGFOOD viewport', async () => {
    const readerBlock = standardBlocks.find((block) => block.metadata.blockName === 'ReaderSurface');
    expect(readerBlock).toBeDefined();

    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 43 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });
    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: blockPreviewGuideId(readerBlock!.metadata.blockName) },
      },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(text).toContain('ReaderSurface');
    expect(text).toContain('ReaderSurface live content from DOGFOOD Blocks.');
    expect(text).toContain('lowering summary');
    expect(text).toContain('interactive mode');
    expect(text).toContain('static mode');
    expect(frameRows(result.frames.at(-1)!).filter((row) => row.includes('┌─ ReaderSurface')).length).toBe(1);
    expect(text).not.toContain('Available Blocks');
    expect(text).not.toContain('Contract: block metadata:');
    expect(text).not.toContain('Source: packages/bijou/src/core/standard-blocks.ts');
  });

  it('renders the CounterDemoBlock fixture and applies command-intent keys', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 43 } });
    const runCounterSteps = async (keys: readonly string[]) => runScript(
      createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any }),
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

    expect(docsPageModel(selected.model as any, 'blocks').selectedGuideId).toBe('blocks-preview-counterdemoblock');
    expect(docsPageModel(incremented.model as any, 'blocks').counterBlockDemo.counter).toBe(6);
    expect(docsPageModel(decremented.model as any, 'blocks').counterBlockDemo.counter).toBe(5);
    expect(frameText(selected.frames.at(-1)!)).toContain('Counter: 5');
    expect(frameText(selected.frames.at(-1)!)).toContain('[-] decrease');
    expect(frameText(selected.frames.at(-1)!)).toContain('[+] increase');
    expect(frameText(selected.frames.at(-1)!)).toContain('json: {"counter":5}');
    const selectedRows = frameRows(selected.frames.at(-1)!);
    expect(selectedRows.find((row) => row.includes('CounterDemoBlock fixture'))).toContain('┐');
    expect(selectedRows.find((row) => row.includes('┌─ lowering summary'))).toContain('┐');
    expect(frameText(incremented.frames.at(-1)!)).toContain('Counter: 6');
    expect(frameText(incremented.frames.at(-1)!)).toContain('json: {"counter":6}');
    expect(frameText(decremented.frames.at(-1)!)).toContain('Counter: 5');
  });

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

  it('does not tick the CounterDemoBlock fixture when another Blocks guide is selected', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 43 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });

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
    const blocksModel = docsPageModel(result.model as any, 'blocks');

    expect(blocksModel.selectedGuideId).toBe('blocks-what-are-blocks');
    expect(blocksModel.counterBlockDemo.counter).toBe(6);
    expect(blocksModel.counterBlockDemo.animationTimeMs).toBe(0);
  });

  it('renders the selected standard block preview without stacking every block page', async () => {
    for (const block of standardBlocks) {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 220, rows: 260 } });
      const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });
      const result = await runScript(app, [{
        msg: {
          type: 'docs',
          msg: { type: 'select-guide', guideId: blockPreviewGuideId(block.metadata.blockName) },
        },
      }], { ctx });
      const text = frameText(result.frames.at(-1)!);
      const otherBlocks = standardBlocks.filter(
        (candidate) => candidate.metadata.blockName !== block.metadata.blockName,
      );

      expect(docsPageModel(result.model as any, 'blocks').selectedGuideId).toBe(
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
      expect(text).toContain(block.metadata.blockName);
      if (block.metadata.blockName === 'AppShell') {
        expect(text).toContain('ReaderSurface live content from DOGFOOD Blocks.');
        expect(text).toContain('InspectorPanel');
        expect(text).toContain('schema-bound; provider-ready; command-aware');
        expect(text).not.toContain('ReaderSurface block page');
      }
      expect(foregroundStyledTextCellExists(result.frames.at(-1)!, block.metadata.blockName)).toBe(true);
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

  it('resets the guide content scroll when selecting another block preview', async () => {
    const [firstBlock, secondBlock] = standardBlocks;
    expect(firstBlock).toBeDefined();
    expect(secondBlock).toBeDefined();

    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 220, rows: 60 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });
    const result = await runScript(app, [
      {
        msg: {
          type: 'docs',
          msg: { type: 'select-guide', guideId: blockPreviewGuideId(firstBlock!.metadata.blockName) },
        },
      },
      { key: KEY_TAB },
      { key: KEY_BOTTOM },
      {
        msg: {
          type: 'docs',
          msg: { type: 'select-guide', guideId: blockPreviewGuideId(secondBlock!.metadata.blockName) },
        },
      },
    ], { ctx });
    const model = result.model as any;
    const text = frameText(result.frames.at(-1)!);

    expect(model.docsModel.scrollByPage.blocks?.['guide-content']?.y ?? 0).toBe(0);
    expect(text).toContain(`${secondBlock!.metadata.blockName}`);
    expect(text).toContain('lowering summary');
  });

  it('renders block lowering posture from the standard block mode declarations', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 180, rows: 54 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });

    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-lowering' },
      },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);
    const declaredModes = Array.from(
      new Set(standardBlocks.flatMap((block) => block.metadata.modes)),
    ).sort();

    expect(docsPageModel(result.model as any, 'blocks').selectedGuideId).toBe('blocks-lowering');
    for (const mode of declaredModes) {
      expect(text).toContain(mode);
    }
    for (const block of standardBlocks) {
      expect(text).toContain(block.metadata.blockName);
    }
  });
});

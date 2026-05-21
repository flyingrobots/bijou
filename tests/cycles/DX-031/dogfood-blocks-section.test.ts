import { afterEach, describe, expect, it } from 'vitest';
import { standardBlocks, standardBlockStories } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../../../examples/docs/app.js';

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

    const start = row.indexOf(needle);
    if (start === -1) continue;

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
      'Block Preview',
      ...standardBlocks.map((block) => `  ${block.metadata.blockName}`),
      'How Blocks Lower',
    ]);
    expect(blocksModel.selectedGuideId).toBe('blocks-what-are-blocks');
  });

  it('keeps the block preview overview as an index instead of one giant live preview stack', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 220, rows: 260 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });

    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-preview' },
      },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(docsPageModel(result.model as any, 'blocks').selectedGuideId).toBe('blocks-preview');
    expect(text).toContain('Block Preview');
    expect(text).toContain('Available Blocks');
    expect(text).not.toContain('Live example');
    expect(text).not.toContain('Live lowering preview');
    expect(text).not.toContain('Live documentation');
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
      expect(text).toContain('Live example');
      expect(text).toContain('Live lowering preview');
      expect(text).toContain('Live documentation');
      expect(text).toContain('interactive mode');
      expect(text).toContain('static mode');
      expect(text).toContain('pipe mode');
      expect(text).toContain('accessible mode');
      expect(text).toContain('facts:');
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
      expect(text).toContain(`Page: ${block.metadata.blockName}`);
      expect(text).toContain(block.metadata.blockName);
      if (block.metadata.blockName === 'AppShell') {
        expect(text).toContain('ReaderSurface live content from DOGFOOD Blocks.');
        expect(text).toContain('InspectorPanel');
        expect(text).toContain('schema-bound; provider-ready; command-aware');
        expect(text).not.toContain('ReaderSurface block page');
      }
      expect(foregroundStyledTextCellExists(result.frames.at(-1)!, block.metadata.blockName)).toBe(true);
      for (const story of standardBlockStories.filter((candidate) => candidate.blockName === block.metadata.blockName)) {
        expect(text).toContain(story.id);
      }
      for (const otherBlock of otherBlocks) {
        expect(text).not.toContain(`Page: ${otherBlock.metadata.blockName}`);
      }
    }
  });

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
    expect(text).toContain(`Page: ${secondBlock!.metadata.blockName}`);
    expect(text).toContain('Live example');
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

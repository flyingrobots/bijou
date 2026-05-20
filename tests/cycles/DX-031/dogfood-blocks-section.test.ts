import { afterEach, describe, expect, it } from 'vitest';
import { standardBlocks, standardBlockStories } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../../../examples/docs/app.js';

const KEY_ENTER = '\r';
const KEY_NEXT_TAB = ']';

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
      'How Blocks Lower',
    ]);
    expect(blocksModel.selectedGuideId).toBe('blocks-what-are-blocks');
  });

  it('renders a code-backed preview of standard blocks and their story variants', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 180, rows: 54 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });

    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-preview' },
      },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(docsPageModel(result.model as any, 'blocks').selectedGuideId).toBe('blocks-preview');
    for (const block of standardBlocks) {
      expect(text).toContain(block.metadata.blockName);
    }
    for (const story of standardBlockStories.slice(0, 8)) {
      expect(text).toContain(story.id);
      expect(text).toContain(story.label);
    }
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

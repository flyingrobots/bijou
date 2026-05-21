import { describe, expect, it } from 'vitest';
import { standardBlocks } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../../../examples/docs/app.js';

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }): string {
  let text = '';
  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      text += frame.get(x, y).char || ' ';
    }
    text += '\n';
  }
  return text;
}

describe('DX-031F DOGFOOD block mode proof', () => {
  it('shows live multi-mode lowering for every standard block in the DOGFOOD Blocks preview', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 240, rows: 180 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'blocks',
    });

    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-preview' },
      },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect((result.model as any).docsModel.pageModels.blocks.selectedGuideId).toBe('blocks-preview');
    for (const block of standardBlocks) {
      expect(text).toContain(`Page: ${block.metadata.blockName}`);
      for (const mode of block.metadata.modes) {
        expect(text).toContain(`${mode}: ${block.metadata.blockName}`);
        expect(block.render({
          mode,
          slots: proofSlotsFor(block.metadata.blockName),
        }).facts).toEqual(expect.arrayContaining([
          { kind: 'entity', key: 'block', value: block.metadata.blockName },
          { kind: 'state', key: 'block.rendered', value: true },
        ]));
      }
    }
    expect(text).not.toContain('definition placeholder');
  });
});

function proofSlotsFor(blockName: string): Readonly<Record<string, unknown>> {
  switch (blockName) {
    case 'AppShell':
      return {
        navigation: 'Blocks',
        content: 'ReaderSurface',
        inspector: 'InspectorPanel',
        status: 'ready',
      };
    case 'ReaderSurface':
      return {
        navigation: 'Blocks',
        content: 'Block content',
        outline: ['one', 'two'],
      };
    case 'InspectorPanel':
      return {
        selection: 'ReaderSurface',
        details: ['schema-aware'],
        actions: ['reveal'],
      };
    default:
      throw new Error(`unknown block ${blockName}`);
  }
}

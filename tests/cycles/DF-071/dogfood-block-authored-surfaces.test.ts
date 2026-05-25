import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../../../examples/docs/app.js';
import {
  defaultDogfoodBlockRegistry,
  searchPanelBlock,
} from '../../../examples/docs/dogfood-blocks.js';

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

describe('DF-071 DOGFOOD block-authored surfaces', () => {
  it('renders a DOGFOOD surface block inventory from the runtime registry', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 80 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });
    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-dogfood-surfaces' },
      },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(text).toContain('DOGFOOD Surface Blocks');
    for (const entry of defaultDogfoodBlockRegistry.entries()) {
      expect(text).toContain(entry.blockName);
      expect(text).toContain(`-> ${entry.surfaceId} (${entry.role})`);
    }
    expect(text).toContain('FooterHintBlock');
    expect(text).toContain('frame.footer');
    expect(text).toContain('Surface: landing.title');
    expect(text).toContain('Role: title');
    expect(text).not.toContain('block package:');
    expect(text).not.toContain('providerHandle');
    expect(text).not.toContain('subscription');
  });

  it('opens Blocks search with title text owned by SearchPanelBlock', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });
    const result = await runScript(app, [{ key: '/' }], { ctx });
    const text = frameText(result.frames.at(-1)!);
    const expectedTitle = String(searchPanelBlock.render({
      config: { title: 'Search blocks' },
      mode: 'accessible',
    }).output);

    expect(text).toContain(expectedTitle);
    expect(text).toContain('What are Blocks');
    expect(text).toContain('Pre-made Blocks');
  });
});

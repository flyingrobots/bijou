import { describe, expect, it } from 'vitest';
import { must, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../../../examples/docs/app.js';
import { defaultDogfoodBlockRegistry, dogfoodDocsSurfaceBlock, dogfoodDocsSurfaceBlockRegistryEntry } from '../../../examples/docs/dogfood-blocks.js';

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}

describe('DF-030 DOGFOOD docs surface Block', () => {
  it('registers the docs surface in DOGFOOD inventory and product docs', async () => {
      expect(dogfoodDocsSurfaceBlockRegistryEntry.block).toBe(dogfoodDocsSurfaceBlock);
      expect(dogfoodDocsSurfaceBlockRegistryEntry.role).toBe('app-shell');
      expect(defaultDogfoodBlockRegistry.forSurface('docs.surface')).toBe(
        dogfoodDocsSurfaceBlockRegistryEntry,
      );
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 140 } });
      const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });
      const result = await runScript(app, [{
        msg: {
          type: 'docs',
          msg: { type: 'select-guide', guideId: 'blocks-dogfood-surfaces' },
        },
      }], { ctx });
      const text = frameText(must(result.frames.at(-1)));
      expect(text).toContain('DogfoodDocsSurfaceBlock');
      expect(text).toContain('-> docs.surface (app-shell)');
      expect(text).toContain('DOGFOOD docs, navigation, search, reader, and proof artifact surface.');
      expect(text).toContain('Rendered preview');
      expect(text).toContain('DOGFOOD Docs Surface');
      expect(text).toContain('proof: table-demo.gif available');
    });
});

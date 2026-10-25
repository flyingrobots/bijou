import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '../packages/bijou-tui/src/driver.js';
import { createDocsApp } from '../examples/docs/app-root.js';

afterEach(() => { _resetDefaultContextForTesting(); });

describe('published raster fonts and their DOGFOOD demonstration', () => {
  it('exports the reusable font API from the public TUI package', async () => {
    const api = await import('@flyingrobots/bijou-tui');
    expect(api.RasterFontGlyph).toBeTypeOf('function');
    expect(api.RasterFont).toBeTypeOf('function');
    expect(api.layoutRasterText).toBeTypeOf('function');
    expect(api.rasterizeText).toBeTypeOf('function');
    expect(api.rasterTextSurface).toBeTypeOf('function');
  });

  it('presents the V8 title and enters documentation immediately', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const initial = await runScript(createDocsApp(ctx), [], { ctx });
    const frame = initial.frames[0];
    if (frame === undefined) throw new Error('Missing initial frame.');
    let text = '';
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) text += frame.get(x, y).char;
      text += '\n';
    }
    expect(text).toContain('Bijou v8');
    const entered = await runScript(createDocsApp(ctx), [{ key: '\r' }], { ctx });
    expect(entered.model.route).toBe('docs');
  });
});

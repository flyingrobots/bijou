import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../examples/docs/app.js';

const KEY_ENTER = '\r';
const KEY_DOWN = '\x1b[B';

describe('docs preview app', () => {
  it('lands on the hero page first and enters the docs on Enter', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    expect((initial.model as any).route).toBe('landing');

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    expect((entered.model as any).route).toBe('docs');
  });

  it('keeps landing-page hero whitespace transparent over the page background', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200, rows: 60 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = initial.frames[0]!;

    expect(frame.get(50, 10).char).toBe(' ');
    expect(frame.get(50, 10).bg).toBe(ctx.surface('primary').bg);
  });

  it('keeps the real BIJOU hero on narrower terminals instead of swapping to a fallback card', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 80, rows: 28 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = initial.frames[0]!;

    let text = '';
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        text += frame.get(x, y).char || ' ';
      }
      text += '\n';
    }

    expect(text).not.toContain('Surface-native docs');
    expect(text).toContain('████');
  });

  it('expands a family, selects a story, and cycles its variants', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_ENTER },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
      { key: '.' },
    ], { ctx });

    const pageModel = (result.model as any).docsModel.pageModels['learn-by-touch'];

    expect((result.model as any).route).toBe('docs');
    expect(pageModel.selectedStoryId).toBe('alert');
    expect(pageModel.variantIndexByStory.alert).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../examples/docs/app.js';

const KEY_DOWN = '\x1b[B';
const KEY_TAB = '\t';

describe('docs preview app', () => {
  it('uses arrow keys for story navigation so shell scroll keys stay available', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [{ key: KEY_DOWN }], { ctx });
    const pageModel = (result.model as any).pageModels['learn-by-touch'];

    expect(pageModel.listState.focusIndex).toBe(1);
  });

  it('keeps j/k available for docs-pane scrolling after focus moves there', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_TAB },
      { key: 'j' },
    ], { ctx });

    expect((result.model as any).focusedPaneByPage['learn-by-touch']).toBe('story-docs');
    expect((result.model as any).scrollByPage['learn-by-touch']['story-docs'].y).toBeGreaterThan(0);
  });
});

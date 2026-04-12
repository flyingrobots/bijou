import { afterEach, describe, expect, it } from 'vitest';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../../../examples/docs/app.js';

const KEY_F2 = '\x1bOQ';
const KEY_DOWN = '\x1b[B';
const KEY_ENTER = '\r';

describe('RE-017 framed shell theme demo', () => {
  afterEach(() => _resetDefaultContextForTesting());

  it('uses the landing theme selector as the same theme source for the docs app', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 36 } });
    const originalBg = ctx.surface('primary').bg;
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: '6' },
      { key: KEY_ENTER },
    ], { ctx });

    const model = result.model as {
      route: string;
      landingThemeIndex: number;
      landingToast?: { message: string };
      docsModel: { activeShellThemeId?: string; pageModels: Record<string, { landingThemeIndex: number }> };
    };
    const frame = result.frames.at(-1)!;

    expect(model.route).toBe('docs');
    expect(model.landingThemeIndex).toBe(5);
    expect(model.landingToast?.message).toBe('Verdant Plum');
    expect(model.docsModel.activeShellThemeId).toBe('verdant-plum');
    expect(Object.values(model.docsModel.pageModels).every((pageModel) => pageModel.landingThemeIndex === 5)).toBe(true);
    expect(ctx.surface('primary').bg).toBe(originalBg);
    expect(frame.get(frame.width - 2, 2).bg).toBe('#043015');
  });

  it('uses the stock frame shell-theme row as the single theme control inside docs', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 36 } });
    const originalBg = ctx.surface('primary').bg;
    const app = createDocsApp(ctx, { initialRoute: 'docs' });

    const result = await runScript(app, [
      { key: KEY_F2 },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
    ], { ctx });

    const model = result.model as {
      landingThemeIndex: number;
      docsModel: { activeShellThemeId?: string; pageModels: Record<string, { landingThemeIndex: number }> };
    };
    const frame = result.frames.at(-1)!;
    expect(model.landingThemeIndex).toBe(1);
    expect(model.docsModel.activeShellThemeId).toBe('cabinet-of-curiosities');
    expect(Object.values(model.docsModel.pageModels).every((pageModel) => pageModel.landingThemeIndex === 1)).toBe(true);
    expect(ctx.surface('primary').bg).toBe(originalBg);
    expect(frame.get(frame.width - 2, 2).bg).toBe('#1d1720');
  });
});

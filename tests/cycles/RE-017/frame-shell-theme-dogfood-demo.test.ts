import { afterEach, describe, expect, it } from 'vitest';
import { BIJOU_LIGHT } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import {
  createScriptTestContext as createTestContext,
  runScriptDeterministic as runScript,
} from '../../helpers/scripted.js';
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

  it('cycles the stock frame shell-theme row through DogFood shell themes before landing palettes', async () => {
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
      docsModel: {
        activeShellThemeId?: string;
        pageModels: Record<string, { landingThemeIndex: number; activeShellThemeId?: string }>;
      };
    };
    const frame = result.frames.at(-1)!;
    expect(model.landingThemeIndex).toBe(0);
    expect(model.docsModel.activeShellThemeId).toBe('dogfood-light');
    expect(Object.values(model.docsModel.pageModels).every((pageModel) => pageModel.landingThemeIndex === 0)).toBe(true);
    expect(Object.values(model.docsModel.pageModels).every((pageModel) => pageModel.activeShellThemeId === 'dogfood-light')).toBe(true);
    expect(ctx.surface('primary').bg).toBe(originalBg);
    expect(frame.get(frame.width - 2, 2).bg).toBe(BIJOU_LIGHT.surface.primary.bg);
  });
});

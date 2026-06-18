import { afterEach, describe, expect, it } from 'vitest';
import { BIJOU_LIGHT } from '@flyingrobots/bijou';
import { must, _resetDefaultContextForTesting  } from '@flyingrobots/bijou/adapters/test';
import type { KeyMsg } from '@flyingrobots/bijou-tui';
import {
  createScriptTestContext as createTestContext,
  runScriptDeterministic as runScript,
} from '../../helpers/scripted.js';
import { createDocsApp } from '../../../examples/docs/app.js';
import { normalizeViewOutput } from '../../../packages/bijou-tui/src/view-output.js';

const KEY_ENTER = '\r';

describe('RE-017 framed shell theme demo', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

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
    const frame = must(result.frames.at(-1));

    expect(model.route).toBe('docs');
    expect(model.landingThemeIndex).toBe(5);
    expect(model.landingToast?.message).toBe('Verdant Plum');
    expect(model.docsModel.activeShellThemeId).toBe('verdant-plum');
    expect(Object.values(model.docsModel.pageModels).every((pageModel) => pageModel.landingThemeIndex === 5)).toBe(true);
    expect(ctx.surface('primary').bg).toBe(originalBg);
    expect(frame.get(frame.width - 2, 2).bg).toBe('#043015');
  });

  it('cycles the stock frame shell-theme row through DogFood shell themes before landing palettes', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 36 } });
    const originalBg = ctx.surface('primary').bg;
    const app = createDocsApp(ctx, { initialRoute: 'docs' });

    let [model] = app.init();
    [model] = app.update(keyMsg('f2'), model);
    [model] = app.update(keyMsg('down'), model);
    [model] = app.update(keyMsg('enter'), model);

    const resultModel = model as {
      landingThemeIndex: number;
      docsModel: {
        activeShellThemeId?: string;
        pageModels: Record<string, { landingThemeIndex: number; activeShellThemeId?: string }>;
      };
    };
    const frame = normalizeViewOutput(app.view(model), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface;
    expect(resultModel.landingThemeIndex).toBe(0);
    expect(resultModel.docsModel.activeShellThemeId).toBe('dogfood:light');
    expect(Object.values(resultModel.docsModel.pageModels).every((pageModel) => pageModel.landingThemeIndex === 0)).toBe(true);
    expect(Object.values(resultModel.docsModel.pageModels).every((pageModel) => pageModel.activeShellThemeId === 'dogfood:light')).toBe(true);
    expect(ctx.surface('primary').bg).toBe(originalBg);
    expect(frame.get(frame.width - 2, 2).bg).toBe(BIJOU_LIGHT.surface.primary.bg);
  });
});

function keyMsg(key: string): KeyMsg {
  return {
    type: 'key' as const,
    key,
    ctrl: false,
    alt: false,
    shift: false,
  };
}

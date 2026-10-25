import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import type { Surface } from '../packages/bijou/src/index.js';
import { runScript } from '../packages/bijou-tui/src/driver.js';
import { normalizeViewOutput } from '../packages/bijou-tui/src/view-output.js';
import { createDocsApp } from '../examples/docs/app-root.js';
import { BIJOU_VERSION } from '../examples/docs/app-ids.js';

function frameText(frame: Surface): string {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) text += frame.get(x, y).char;
    text += '\n';
  }
  return text;
}

afterEach(() => { _resetDefaultContextForTesting(); });

describe('actual DOGFOOD title presentation', () => {
  it.each(['static', 'pipe', 'accessible'] as const)(
    'retains release facts and immediate navigation without animated artwork in %s', async (mode) => {
      const ctx = createTestContext({ mode, runtime: { columns: 120, rows: 40 } });
      const app = createDocsApp(ctx);
      const result = await runScript(app, [], { ctx });
      const dimensions = { width: 120, height: 40 };
      const shown = frameText(normalizeViewOutput(app.view(result.model), dimensions).surface);
      expect(shown).not.toMatch(/[\u2800-\u28ff]/u);
      expect(shown).toContain('Bijou v8');
      expect(shown).toContain(BIJOU_VERSION);
      expect(shown).toContain('Press [Enter]');
      const later = app.view({ ...result.model, landingTimeMs: 1500 });
      expect(frameText(normalizeViewOutput(later, dimensions).surface)).toBe(shown);
      const entered = await runScript(createDocsApp(ctx), [{ key: '\r' }], { ctx });
      expect(entered.model.route).toBe('docs');
    },
  );

  it('refreshes the localized prompt immediately without waiting for an animation pulse', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, {
      locale: 'en',
      extraI18nCatalogs: [{
        namespace: 'bijou.dogfood',
        entries: [{
          key: { namespace: 'bijou.dogfood', id: 'landing.prompt.enter' },
          kind: 'message', sourceLocale: 'en',
          values: { en: 'Press [Enter]', fr: 'Appuyez sur [Entrée]' },
        }],
      }],
    });
    const result = await runScript(app, [
      { msg: { type: 'docs', msg: { type: 'cycle-locale' } } },
    ], { ctx });
    const frame = result.frames.at(-1);
    if (frame === undefined) throw new Error('Missing localized frame.');
    expect(frameText(frame)).toContain('Appuyez');
  });
});

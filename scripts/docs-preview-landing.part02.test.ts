import { afterEach, createDocsApp, createTestContext, describe, expect, frameText, it,
  runScript, serializeFrame, _resetDefaultContextForTesting } from './docs-preview.test-support.js';
import { must } from '@flyingrobots/bijou/adapters/test';
import { createSurface } from '../packages/bijou/src/index.js';
import { paintCylinderTitle } from '../examples/docs/app-cylinder-title.js';
import { resolveLandingTheme } from '../examples/docs/app-landing-themes.js';

function silhouette(text: string): string {
  return Array.from(text, (char) => /[\u2801-\u28ff]/u.test(char) ? char : ' ').join('');
}

afterEach(() => { _resetDefaultContextForTesting(); });

describe('Jacquard cylinder landing', () => {
  it('renders real Braille glyph coverage and moves the silhouette on a pulse', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx);
    const initial = await runScript(app, [], { ctx });
    const pulsed = await runScript(app, [{ pulse: { dt: 0.35 } }], { ctx });
    const first = frameText(must(initial.frames[0]));
    const next = frameText(must(pulsed.frames.at(-1)));
    expect(first.match(/[\u2801-\u28ff]/gu)?.length ?? 0).toBeGreaterThan(100);
    expect(next.match(/[\u2801-\u28ff]/gu)?.length ?? 0).toBeGreaterThan(100);
    expect(silhouette(first)).not.toBe(silhouette(next));
    expect(first).toContain('V8 / Jacquard 12');
    expect(first).not.toContain('V7 Launch Wake');
  });

  it('reproduces fixed-time geometry and keeps every title cell inside its bounded viewport', () => {
    const tokens = resolveLandingTheme(0);
    const first = createSurface(120, 40);
    const second = createSurface(120, 40);
    paintCylinderTitle(first, tokens, 352);
    paintCylinderTitle(second, tokens, 352);
    expect(serializeFrame(first)).toEqual(serializeFrame(second));
    let count = 0;
    for (let y = 0; y < first.height; y++) {
      for (let x = 0; x < first.width; x++) {
        const cell = first.get(x, y);
        if (!/[\u2801-\u28ff]/u.test(cell.char)) continue;
        count++;
        expect(x).toBeGreaterThanOrEqual(2);
        expect(x).toBeLessThan(118);
        expect(y).toBeLessThan(24);
        expect(cell.bg).toBe(tokens.background);
      }
    }
    expect(count).toBeGreaterThan(100);
  });

  it.each([[39, 20], [80, 13]])('leaves undersized %sx%s surfaces untouched', (width, height) => {
    const surface = createSurface(width, height);
    const before = serializeFrame(surface);
    paintCylinderTitle(surface, resolveLandingTheme(0), 0);
    expect(serializeFrame(surface)).toEqual(before);
  });
});

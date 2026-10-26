import { DOGFOOD_BOOK_LIGHT_THEME } from '../examples/docs/dogfood-book-theme-spec.js';
import {
  afterEach,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  frameText,
  it,
  KEY_DOWN,
  KEY_ENTER,
  KEY_F2,
  KEY_F10,
  KEY_UP,
  runScript,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

function editorText(text: string): string {
  const lines = text.split('\n');
  const top = lines.findIndex((line) => line.includes('┌─ Theme editor'));
  const header = lines[top];
  if (header === undefined) throw new Error('Missing Theme editor panel.');
  const left = header.indexOf('┌');
  const right = header.indexOf('┐', left);
  if (left < 0 || right < left) throw new Error('Missing Theme editor bounds.');
  return lines.slice(top + 1).filter((line) => line[left] === '│')
    .map((line) => line.slice(left + 1, right)).join('').replace(/\s/gu, '');
}

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('scrolls the Theme Inspector drawer without closing it', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 118, rows: 20 } });
    const app = createDocsApp(ctx);
    const scrolled = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_F10 },
      { key: KEY_DOWN },
      { key: KEY_DOWN },
    ], { ctx });
    expect((scrolled.model).themeInspectorOpen).toBe(true);
    expect((scrolled.model).themeInspectorScrollY).toBeGreaterThan(0);
    expect(frameText(must(scrolled.frames.at(-1)))).toContain('Theme Inspector');
    const restored = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_F10 },
      { key: KEY_DOWN },
      { key: KEY_DOWN },
      { key: KEY_UP },
    ], { ctx });
    expect((restored.model).themeInspectorOpen).toBe(true);
    expect((restored.model).themeInspectorScrollY).toBeLessThan((scrolled.model).themeInspectorScrollY);
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('publishes the Theme Lab page with active shell facts and palettes', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 44 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'themes',
    });
    const result = await runScript(app, [], { ctx });
    const text = frameText(must(result.frames.at(-1)));
    expect((result.model).docsModel.activePageId).toBe('themes');
    expect(text).toContain('Theme Lab');
    expect(text).toContain('Active: Bijou Book / Dark');
    expect(text).toContain('Theme: dogfood-book-dark');
    expect(text).toContain('Default dark preset: bijou-dark');
    expect(text).toContain('Default light preset: bijou-light');
    expect(text).toContain('Color reuse: dark');
    expect(editorText(text)).toContain('*1.BijouBook/Dark->dogfood-book-dark');
    expect(text).toContain('Bijou Book / Dark');
    expect(text).toContain('semantic.primary');

    const lightResult = await runScript(app, [
      { key: KEY_F2 },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
      { key: KEY_F2 },
    ], { ctx });
    const lightText = frameText(must(lightResult.frames.at(-1)));

    expect(lightResult.model.docsModel.activeShellThemeId).toBe('book:light');
    expect(lightText).toContain('Active: Bijou Book / Light');
    expect(lightText).toContain('Theme: dogfood-book-light');
    expect(editorText(lightText)).toContain('*2.BijouBook/Light->dogfood-book-light');
    expect(lightText).toContain('Bijou Book / Light');
    expect(lightText).toContain(DOGFOOD_BOOK_LIGHT_THEME.semantic.primary.hex);
    expect(lightText).not.toContain('Active: Bijou Book / Dark');
  });
});

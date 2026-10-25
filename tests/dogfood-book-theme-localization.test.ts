import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '../packages/bijou-tui/src/driver.js';
import { createDocsApp } from '../examples/docs/app-root.js';

interface Frame { readonly width: number; readonly height: number; get(x: number, y: number): { char: string } }
function frameText(frame: Frame | undefined): string {
  if (frame === undefined) throw new Error('Missing frame.');
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) text += frame.get(x, y).char;
    text += '\n';
  }
  return text;
}

function panelText(frame: Frame | undefined): string {
  const lines = frameText(frame).split('\n');
  const top = lines.findIndex(line => line.includes('┌'));
  const header = lines[top];
  if (header === undefined) throw new Error('Missing overlay header.');
  const left = header.indexOf('┌');
  const right = header.indexOf('┐', left);
  const end = lines.findIndex((line, y) => y > top && line[left] === '└' && line[right] === '┘');
  if (right < left || end < top) throw new Error('Missing overlay bounds.');
  return lines.slice(top, end + 1).map(line => line.slice(left, right + 1)).join('\n');
}

const PICKER = [{ key: '\x1bOQ' }, { key: '\x1b[B' }];
const LIGHT = [...PICKER, { key: '\r' }];
const LIGHT_CLOSED = [...LIGHT, { key: '\x1bOQ' }];
afterEach(() => { _resetDefaultContextForTesting(); });

describe('book theme runtime localization', () => {
  it.each([
    ['en', 'Dark', 'Light', 'Coral light', 'Rose paper'],
    ['de', 'Dunkel', 'Hell', 'Korallenlicht', 'Roséfarbenes'],
    ['es', 'Oscuro', 'Claro', 'Luz coral', 'Papel rosa'],
    ['fr', 'Sombre', 'Clair', 'Lumière corail', 'Papier rose'],
  ])('localizes actual %s picker, mode descriptions, Theme Lab and Inspector', async (locale, dark, light, darkCopy, lightCopy) => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 180, rows: 56 } });
    const app = () => createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'themes', locale });
    const picker = await runScript(app(), PICKER, { ctx });
    expect(panelText(picker.frames.at(-1))).toContain(`Bijou Book / ${dark}`);
    expect(panelText(picker.frames.at(-1))).toContain(darkCopy);
    const switched = await runScript(app(), LIGHT, { ctx });
    expect(switched.model.docsModel.activeShellThemeId).toBe('book:light');
    expect(panelText(switched.frames.at(-1))).toContain(`Bijou Book / ${light}`);
    expect(panelText(switched.frames.at(-1))).toContain(lightCopy);
    const lab = await runScript(app(), LIGHT_CLOSED, { ctx });
    expect(frameText(lab.frames.at(-1))).toContain(`Bijou Book / ${light}`);
    const inspector = await runScript(app(), [...LIGHT_CLOSED, { key: '\x1b[21~' }], { ctx });
    expect(panelText(inspector.frames.at(-1))).toContain(`Bijou Book / ${light}`);
  });

  it('updates existing picker labels after the actual locale activation command', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 180, rows: 56 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'themes', locale: 'en' });
    const result = await runScript(app, [
      { msg: { type: 'docs', msg: { type: 'cycle-locale' } } }, ...PICKER,
    ], { ctx });
    expect(panelText(result.frames.at(-1))).toContain('Bijou Book / Sombre');
    expect(panelText(result.frames.at(-1))).not.toContain('Bijou Book / Dark');
  });

  it('keeps separate app locales independent', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 180, rows: 56 } });
    const german = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'themes', locale: 'de' });
    const french = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'themes', locale: 'fr' });
    const fr = await runScript(french, PICKER, { ctx });
    expect(panelText(fr.frames.at(-1))).toContain('Bijou Book / Sombre');
    const de = await runScript(german, PICKER, { ctx });
    expect(panelText(de.frames.at(-1))).toContain('Bijou Book / Dunkel');
  });
});

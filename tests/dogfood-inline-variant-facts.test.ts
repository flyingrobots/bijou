import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '../packages/bijou-tui/src/driver.js';
import { createDocsApp } from '../examples/docs/app-root.js';

interface Frame { readonly width: number; readonly height: number; get(x: number, y: number): { char: string } }

function frameText(frame: Frame | undefined): string {
  if (frame === undefined) throw new Error('Missing frame.');
  const lines: string[] = [];
  for (let y = 0; y < frame.height; y++) {
    let line = '';
    for (let x = 0; x < frame.width; x++) line += frame.get(x, y).char;
    lines.push(line);
  }
  return lines.join('\n');
}

const squash = (text: string): string => text.replace(/\s+/g, ' ');

async function componentsText(
  columns: number,
  locale: string,
  storyId: string,
  variantIndex: number,
): Promise<string> {
  const ctx = createTestContext({ mode: 'interactive', runtime: { columns, rows: 60 } });
  const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'components', locale });
  const result = await runScript(app, [
    { msg: { type: 'docs', msg: { type: 'select-story', storyId } } },
    { msg: { type: 'docs', msg: { type: 'select-variant', index: variantIndex } } },
    { msg: { type: 'docs', msg: { type: 'set-profile', mode: 'static' } } },
  ], { ctx });
  return squash(frameText(result.frames.at(-1)));
}

afterEach(() => { _resetDefaultContextForTesting(); });

describe('Components reading path inline variant facts (#624)', () => {
  it.each([200, 120, 90, 50])('shows variant, count and profile in the main pane at %i columns', async (columns) => {
    const text = await componentsText(columns, 'en', 'alert', 1);
    expect(text).toContain('Variant 2 of 3: Warning');
    expect(text).toContain('Profile: Static');
  });

  it('shows a single-variant story as one of one', async () => {
    const text = await componentsText(200, 'en', 'guided-flow', 0);
    expect(text).toContain('Variant 1 of 1: Staging rollout');
  });

  it('reports the resolved variant position for a fractional selection', async () => {
    const text = await componentsText(120, 'en', 'alert', 1.5);
    expect(text).toContain('Variant 2 of 3: Warning');
    expect(text).not.toContain('Variant 2.5');
  });

  it.each([
    ['de', 'Variante 2 von 3: Warning', 'Profil: Static'],
    ['es', 'Variante 2 de 3: Warning', 'Perfil: Static'],
    ['fr', 'Variante 2 sur 3 : Warning', 'Profil : Static'],
  ])('localizes the inline facts for %s', async (locale, variant, profile) => {
    const text = await componentsText(200, locale, 'alert', 1);
    expect(text).toContain(variant);
    expect(text).toContain(profile);
  });
});

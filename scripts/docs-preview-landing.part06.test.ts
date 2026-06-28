import {
  afterEach,
  colorHex,
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
  runScript,
  themeContrastRatio,
  type ColorRef,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

interface StyledFrame {
  readonly width: number;
  readonly height: number;
  get(x: number, y: number): { readonly char?: string; readonly fg?: ColorRef; readonly bg?: ColorRef };
}

function styledTextCells(
  frame: StyledFrame,
  text: string,
): readonly { readonly char?: string; readonly fg?: ColorRef; readonly bg?: ColorRef }[] {
  for (let y = 0; y < frame.height; y++) {
    let row = '';
    for (let x = 0; x < frame.width; x++) row += frame.get(x, y).char ?? ' ';
    const start = row.indexOf(text);
    if (start < 0) continue;
    return Array.from(text).map((char, index) => ({ ...frame.get(start + index, y), char }));
  }
  return [];
}

function expectReadableStyledText(frame: StyledFrame, text: string, minRatio = 4.5): void {
  const cells = styledTextCells(frame, text).filter((cell) => cell.char !== ' ');
  expect(cells.length, text).toBeGreaterThan(0);
  for (const cell of cells) {
    const fg = must(colorHex(cell.fg));
    const bg = must(colorHex(cell.bg));
    const ratio = must(themeContrastRatio(fg, bg));
    expect(ratio, `${text} ${fg} on ${bg}`).toBeGreaterThanOrEqual(minRatio);
  }
}

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('themes the light Theme Inspector chrome and usage proof cells', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 44 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'guides',
    });
    const openLightInspector = [
      { key: KEY_F2 },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
      { key: KEY_F2 },
      { key: KEY_F10 },
    ];
    const result = await runScript(app, openLightInspector, { ctx });
    const frame = must(result.frames.at(-1));
    const text = frameText(frame);

    expect(result.model.docsModel.activeShellThemeId).toBe('dogfood:light');
    expect(result.model.themeInspectorOpen).toBe(true);
    expect(text).toContain('DOGFOOD usage');
    expect(text).toContain('drawer.border');
    expect(text).toContain('summary.copy');
    expect(text).toContain('Reference palette');
    expectReadableStyledText(frame, 'Theme Inspector', 3);
    expectReadableStyledText(frame, 'Active: DOGFOOD / Light');
    expectReadableStyledText(frame, 'DOGFOOD usage');
    expectReadableStyledText(frame, 'drawer.border');

    const bottom = await runScript(app, [
      ...openLightInspector,
      ...Array.from({ length: 80 }, () => ({ key: KEY_DOWN })),
    ], { ctx });
    expectReadableStyledText(must(bottom.frames.at(-1)), 'F10/Esc close');
  });
});

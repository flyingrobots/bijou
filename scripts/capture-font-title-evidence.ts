/** Capture production DOGFOOD views as bounded, replayable software cell scenes. */
import { execFileSync } from 'node:child_process';
import { colorHex, type OutputMode } from '../packages/bijou/src/index.js';
import { createTestContext, _resetDefaultContextForTesting } from '../packages/bijou/src/adapters/test/index.js';
import { runScript } from '../packages/bijou-tui/src/driver.js';
import { normalizeViewOutput } from '../packages/bijou-tui/src/view-output.js';
import { createDocsApp } from '../examples/docs/app-root.js';
import { BIJOU_VERSION } from '../examples/docs/app-ids.js';

const frames = [];
for (const outputMode of ['interactive', 'static', 'pipe', 'accessible'] as const satisfies readonly OutputMode[]) {
  for (const mode of ['dark', 'light'] as const) {
    const sizes = outputMode === 'interactive' ? [[120, 40], [64, 20], [200, 60], [39, 13]] : [[120, 40]];
    for (const [columns = 120, rows = 40] of sizes) {
      const ctx = createTestContext({ mode: outputMode, runtime: { columns, rows } });
      const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'themes' });
      const keys = mode === 'light' ? ['\x1bOQ', '\x1b[B', '\r', '\x1bOQ'].map(key => ({ key })) : [];
      const result = await runScript(app, keys, { ctx });
      if (result.model.docsModel.activeShellThemeId !== `book:${mode}`) throw new Error('Mode selection failed.');
      const times = outputMode === 'interactive' ? [0, 350, 1500] : [0, 1500];
      let previous = '';
      for (const timeMs of times) {
        const output = app.view({ ...result.model, route: 'landing', landingTimeMs: timeMs });
        const frame = normalizeViewOutput(output, { width: columns, height: rows }).surface;
        let text = '';
        let brailleCells = 0;
        const cells = [];
        const retainCells = outputMode === 'interactive' && columns === 120 && rows === 40 && timeMs !== 1500;
        for (let y = 0; y < frame.height; y++) {
          for (let x = 0; x < frame.width; x++) {
            const cell = frame.get(x, y);
            text += cell.char;
            if (/[\u2801-\u28ff]/u.test(cell.char)) brailleCells++;
            if (retainCells) cells.push([cell.char, colorHex(cell.fg) ?? null, colorHex(cell.bg) ?? null]);
          }
          text += '\n';
        }
        if (text.includes('\x1b')) throw new Error('Unexpected ANSI control in normalized glyphs.');
        if (outputMode !== 'interactive') {
          if (brailleCells !== 0 || !text.includes(BIJOU_VERSION) || !text.includes('Press [Enter]')) throw new Error('Lowered meaning failed.');
          if (timeMs !== 0 && previous !== text) throw new Error('Lowered text animates.');
        }
        previous = text;
        frames.push({ outputMode, mode, viewport: { columns, rows }, width: frame.width, height: frame.height, timeMs,
          themeId: result.model.docsModel.activeShellThemeId, brailleCells, text, cells });
      }
      _resetDefaultContextForTesting();
    }
  }
}
process.stdout.write(JSON.stringify({ schema: 'bijou-font-title-scenes/1', sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  version: BIJOU_VERSION, provenance: 'Production app views through real test adapter; theme selected with settings keys. Software cell captures, not physical terminal screenshots. Cells retain glyph and fg/bg but not modifiers.', frames }));

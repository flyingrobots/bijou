/** Retain real DOGFOOD application views for the README images. */
import { execFileSync } from 'node:child_process';
import { colorHex } from '../../packages/bijou/src/index.js';
import {
  createTestContext,
  _resetDefaultContextForTesting,
} from '../../packages/bijou/src/adapters/test/index.js';
import { runScript } from '../../packages/bijou-tui/src/driver.js';
import { normalizeViewOutput } from '../../packages/bijou-tui/src/view-output.js';
import { createDocsApp } from '../../examples/docs/app-root.js';

const frames = [];
for (const page of ['components', 'themes'] as const) {
  const columns = 140;
  const rows = 36;
  const ctx = createTestContext({ mode: 'interactive', runtime: { columns, rows } });
  const app = createDocsApp(ctx, {
    initialRoute: 'docs',
    initialPageId: page,
    initialSelectedStoryId: 'dense-comparison',
  });
  const keys = page === 'themes'
    ? ['\x1bOQ', '\x1b[B', '\r', '\x1bOQ'].map(key => ({ key }))
    : [];
  const { model } = await runScript(app, keys, { ctx });
  const surface = normalizeViewOutput(app.view(model), { width: columns, height: rows }).surface;
  const cells = [];
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      cells.push([cell.char, colorHex(cell.fg) ?? null, colorHex(cell.bg) ?? null]);
    }
  }
  frames.push({
    name: `dogfood-${page}`,
    themeId: model.docsModel.activeShellThemeId,
    width: surface.width,
    height: surface.height,
    cells,
  });
  _resetDefaultContextForTesting();
}
process.stdout.write(JSON.stringify({
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  provenance: 'Production DOGFOOD views through the deterministic test adapter; glyph and colour captures, without text modifiers.',
  frames,
}));

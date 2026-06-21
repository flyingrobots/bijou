import { afterEach, describe, expect, it } from 'vitest';

import { _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { normalizeViewOutput } from '../../../packages/bijou-tui/src/view-output.js';
import { createScriptTestContext as createTestContext } from '../../helpers/scripted.js';

import { createDocsApp } from '../../../examples/docs/app.js';
import { runKeysDeterministically } from './dogfood-light-theme-readiness.test-support.js';
import { KEY_DOWN, KEY_ENTER, KEY_ESCAPE, KEY_F2, KEY_Q, assertBorderCellsPaintBackground, centeredModalBorderCells } from './dogfood-light-theme-readiness.chrome-support.js';

describe('DL-017 DOGFOOD light theme readiness', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });
  it('paints DOGFOOD light quit modal chrome with explicit backgrounds', async () => {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 36 } });
      const app = createDocsApp(ctx, { initialRoute: 'docs' });

      const model = await runKeysDeterministically(app, [
        KEY_F2,
        KEY_DOWN,
        KEY_ENTER,
        KEY_ESCAPE,
        KEY_Q,
      ]);
      const frame = normalizeViewOutput(app.view(model), {
        width: ctx.runtime.columns,
        height: ctx.runtime.rows,
      }).surface;

      expect(model.docsModel.activeShellThemeId).toBe('dogfood:light');
      assertBorderCellsPaintBackground(
        frame,
        centeredModalBorderCells(frame, 'Quit?'),
        'quit modal',
      );
    });
});

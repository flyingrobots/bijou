import { afterEach, describe, expect, it } from 'vitest';

import { must, _resetDefaultContextForTesting  } from '@flyingrobots/bijou/adapters/test';
import { normalizeViewOutput } from '../../../packages/bijou-tui/src/view-output.js';
import { createScriptTestContext as createTestContext } from '../../helpers/scripted.js';
import { DOGFOOD_SHELL_THEMES } from '../../../examples/docs/dogfood-shell-themes.js';
import { createDocsApp } from '../../../examples/docs/app.js';
import { docsVisualThemeFromShellThemeChoice } from '../../../examples/docs/app-landing.js';
import {
  docsThemeDescriptionToken,
  docsThemeSurfaceToken,
} from '../../../examples/docs/app-docs-theme-tokens.js';

import { MSG_CTRL_T, MSG_F10, assertTokenTextColors } from './dogfood-light-theme-readiness.chrome-support.js';

describe('DL-017 DOGFOOD light theme readiness', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });
  it('renders Theme Lab and Theme Inspector swatch text with readable light theme tokens', () => {
      const lightTheme = DOGFOOD_SHELL_THEMES[0]?.modes?.find((mode) => mode.id === 'light')?.theme;
      expect(lightTheme?.name).toBe('dogfood-light');
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 180, rows: 56 } });
      const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'themes' });

      const [initialModel] = app.init();
      const [lightModel] = app.update(MSG_CTRL_T, initialModel);
      const labFrame = normalizeViewOutput(app.view(lightModel), {
        width: ctx.runtime.columns,
        height: ctx.runtime.rows,
      }).surface;
      assertTokenTextColors(
        labFrame,
        'status.success',
        must(lightTheme).surface.primary.hex,
        must(lightTheme).surface.muted.hex,
        'Theme Lab',
      );

      const [inspectorModel] = app.update(MSG_F10, lightModel);
      const inspectorVisualTheme = docsVisualThemeFromShellThemeChoice({
        id: 'dogfood:light',
        label: 'DOGFOOD / Light',
        theme: must(lightTheme),
      });
      const inspectorFrame = normalizeViewOutput(app.view(inspectorModel), {
        width: ctx.runtime.columns,
        height: ctx.runtime.rows,
      }).surface;
      assertTokenTextColors(
        inspectorFrame,
        'semantic.success',
        docsThemeSurfaceToken(inspectorVisualTheme).hex,
        docsThemeDescriptionToken(inspectorVisualTheme).hex,
        'Theme Inspector',
      );
    });
});

import type {
  BijouContext,
} from '../../packages/bijou/src/index.js';
import type { LandingThemeTokens } from './app-landing.js';
import {
  applyDocsShellThemeToContext as applyShellThemeStateToContext,
  resolveDocsShellThemeById as resolveShellThemeStateById,
  resolveDocsVisualThemeByShellThemeId as resolveVisualThemeByShellThemeStateId,
  resolveLandingThemeIndexForShellThemeId as resolveLandingThemeIndexForShellThemeStateId,
} from './app-docs-shell-theme.js';
import { DOCS_SHELL_THEME_STATE } from './app-shell-theme-state.js';

export const resolveDocsShellThemeById = (id: string | undefined) =>
  resolveShellThemeStateById(DOCS_SHELL_THEME_STATE, id);

export const resolveLandingThemeIndexForShellThemeId = (
  id: string | undefined,
): number =>
  resolveLandingThemeIndexForShellThemeStateId(
    DOCS_SHELL_THEME_STATE,
    id,
  );

export const resolveDocsVisualThemeByShellThemeId = (
  id: string | undefined,
): LandingThemeTokens =>
  resolveVisualThemeByShellThemeStateId(DOCS_SHELL_THEME_STATE, id);

export const applyDocsShellThemeToContext = (
  context: BijouContext,
  themeId: string | undefined,
): BijouContext =>
  applyShellThemeStateToContext(
    DOCS_SHELL_THEME_STATE,
    context,
    themeId,
  );

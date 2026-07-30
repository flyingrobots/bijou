/**
 * Public DOGFOOD application facade.
 *
 * The implementation is split by responsibility so the docs application
 * remains inside the repository's Code Dojo size and context boundaries.
 */

export { DOGFOOD_THEME_SAFE_PAIRS } from './dogfood-shell-themes.js';
export { stripMarkdownFrontmatter } from './app-markdown.js';
export {
  resolveDocsThemeActiveHeaderTabToken,
} from './app-docs-theme-tokens.js';
export { DOGFOOD_I18N_CATALOG } from './i18n/dogfood-catalog.js';
export { FRAME_I18N_CATALOG } from '../../packages/bijou-tui/src/index.js';
export {
  resolveDocsLayoutVariant,
  type DocsLayoutVariant,
} from './app-ids.js';
export { docsShellThemesForTesting } from './app-shell-theme-state.js';
export { createDocsApp } from './app-root.js';
export { runDocsApp } from './app-run.js';

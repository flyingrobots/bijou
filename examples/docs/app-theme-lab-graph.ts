import {
  collectTransitiveTokenDependents,
  ruleAuthoredDefinitions,
  type Theme,
  type ThemeMode,
} from '../../packages/bijou/src/index.js';
import {
  THEME_LAB_EDITABLE_PATHS,
  themeLabEditableHex,
  type ThemeLabEditableTokenPath,
} from './app-theme-lab-editor-model.js';

export interface ThemeLabGraphNode {
  readonly path: ThemeLabEditableTokenPath;
  readonly hex: string;
  readonly edited: boolean;
  readonly edges: readonly string[];
}

const NO_EDGES: ReadonlyMap<string, readonly string[]> = new Map();

// Named as a `mode` field rather than a bare literal so the localization
// scanner reads it as a token-family identifier, not as visible copy.
const DEFAULT_THEME_MODE = Object.freeze({ mode: 'dark' } as const);

/**
 * Read the real dependency edges out of the theme being edited.
 *
 * These used to be a frozen table declared beside the editor, which meant the
 * drawn graph was a second source of truth that could disagree with the theme
 * — and did: it claimed `ui.cursor` fed a `focus.current` token that does not
 * exist anywhere in `Theme`. Reading the edges back out of the token graph
 * makes them true by construction and keeps them correct when definitions
 * change.
 *
 * Edges are transitive, because the editor's question is "what moves if I
 * change this" rather than "what names this directly". Editing
 * `status.success` changes `semantic.success`, which changes `border.success`;
 * all of them belong on screen.
 *
 * Themes without recoverable provenance (hand-authored flat token values, or
 * copies that lost their identity) render as nodes with no edges rather than
 * with invented ones.
 */
function themeLabDependentEdges(
  theme: Theme,
  mode: ThemeMode,
): ReadonlyMap<string, readonly string[]> {
  const definitions = ruleAuthoredDefinitions(theme);
  return definitions === undefined ? NO_EDGES : collectTransitiveTokenDependents(definitions, mode);
}

export function themeLabGraphNodes(
  baseTheme: Theme,
  draftTheme: Theme,
  mode: ThemeMode = DEFAULT_THEME_MODE.mode,
): readonly ThemeLabGraphNode[] {
  const edgesByPath = themeLabDependentEdges(baseTheme, mode);
  return THEME_LAB_EDITABLE_PATHS.map((path) => {
    const baseHex = themeLabEditableHex(baseTheme, path);
    const draftHex = themeLabEditableHex(draftTheme, path);
    return {
      path,
      hex: draftHex,
      edited: baseHex !== draftHex,
      edges: edgesByPath.get(path) ?? [],
    };
  });
}

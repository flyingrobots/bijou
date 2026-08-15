import {
  createTokenGraph,
  ruleAuthoredDefinitions,
  type Theme,
  type ThemeMode,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  dogfoodText,
  type ThemeLabProvenanceLine,
} from './app-theme-lab-provenance-contract.js';
import { ruleLines, valueLines } from './app-theme-lab-provenance-lines.js';

export type {
  ThemeLabProvenanceLine,
  ThemeLabProvenanceTone,
} from './app-theme-lab-provenance-contract.js';

export interface ThemeLabProvenanceOptions {
  readonly overrideHex?: string;
}

/**
 * Explain how the selected token got its value.
 *
 * This is the Theme Lab's answer to "why is it that colour". A rule-authored
 * token reports the rule that chose it, every candidate the rule considered,
 * the score each was ranked on, its contrast against the target, and whether
 * it won, lost, or was excluded outright. A referenced token reports what it
 * defers to. A literal reports that it is a literal — which is itself the
 * finding, because a literal cannot re-decide when the palette moves.
 */
export function themeLabProvenanceLines(
  theme: Theme,
  path: string,
  mode: ThemeMode,
  localization?: LocalizationPort,
  options: ThemeLabProvenanceOptions = {},
): readonly ThemeLabProvenanceLine[] {
  const override = overrideLines(path, options.overrideHex, localization);
  const definitions = ruleAuthoredDefinitions(theme);
  if (definitions === undefined) {
    return [...override, {
      text: dogfoodText(
        localization,
        'themeLab.provenance.none',
        'No provenance: this theme was authored as flat token values.',
      ),
      tone: 'muted',
    }];
  }

  const graph = createTokenGraph(definitions);
  try {
    const inspection = graph.inspect(path, mode);
    const provenance = inspection.kind === 'rule'
      ? ruleLines(inspection, localization)
      : valueLines(inspection, localization);
    return [...override, ...provenance];
  } catch {
    // Editable paths such as `surface.primary.bg` address a field of a token
    // rather than a token, so they have no definition of their own to inspect.
    return [...override, {
      text: dogfoodText(
        localization,
        'themeLab.provenance.field',
        '{path} is a field of a token, not a token with its own rule.',
        { path },
      ),
      tone: 'muted',
    }];
  } finally {
    graph.dispose();
  }
}

function overrideLines(
  path: string,
  overrideHex: string | undefined,
  localization: LocalizationPort | undefined,
): readonly ThemeLabProvenanceLine[] {
  if (overrideHex === undefined) return [];
  return [{
    text: dogfoodText(
      localization,
      'themeLab.provenance.override',
      '{path} is a direct override: {hex}; base provenance follows.',
      { path, hex: overrideHex },
    ),
    tone: 'accent',
    swatch: overrideHex,
  }];
}

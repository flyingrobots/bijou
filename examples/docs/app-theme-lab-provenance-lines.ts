import type { ThemeRuleInspection, TokenGraphInspection } from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  dogfoodText,
  type ThemeLabProvenanceLine,
} from './app-theme-lab-provenance-contract.js';

// Candidate reasons are rule-inspection identifiers rather than visible copy.
// Naming them once as `kind` fields keeps the localization scanner from
// reading them as prose that needs translating.
const CANDIDATE_SELECTED = Object.freeze({ kind: 'selected' } as const);
const CANDIDATE_EXCLUDED = Object.freeze({ kind: 'excluded' } as const);

const CANDIDATE_LABEL_WIDTH = 16;
const SCORE_WIDTH = 4;

function ratioLabel(ratio: number | undefined): string {
  return ratio === undefined ? '' : `${ratio.toFixed(2)}:1`;
}

/** Lines describing a rule-authored token: the rule, then every candidate. */
export function ruleLines(
  inspection: ThemeRuleInspection,
  localization: LocalizationPort | undefined,
): readonly ThemeLabProvenanceLine[] {
  const header: ThemeLabProvenanceLine[] = [
    {
      text: dogfoodText(localization, 'themeLab.provenance.rule', 'rule {rule} -> {hex}', {
        rule: inspection.rule,
        hex: inspection.hex,
      }),
      tone: 'accent',
      swatch: inspection.hex,
    },
    {
      text: dogfoodText(localization, 'themeLab.provenance.considered', 'considered {count} candidates', {
        count: inspection.candidates.length,
      }),
      tone: 'muted',
    },
  ];

  const won = dogfoodText(localization, 'themeLab.provenance.won', 'WON ');
  const skipped = dogfoodText(localization, 'themeLab.provenance.skipped', 'skip');
  const scoreLabel = dogfoodText(localization, 'themeLab.provenance.score', 'score');

  return [...header, ...inspection.candidates.map((candidate) => {
    const selected = candidate.reasons.includes(CANDIDATE_SELECTED.kind);
    const excluded = candidate.reasons.includes(CANDIDATE_EXCLUDED.kind);
    const mark = selected ? won : excluded ? skipped : '    ';
    const label = (candidate.path ?? candidate.label).padEnd(CANDIDATE_LABEL_WIDTH);
    const score = candidate.score === undefined
      ? ''
      : `${scoreLabel} ${String(candidate.score).padStart(SCORE_WIDTH)}`;
    const row = `${mark} ${label} ${candidate.hex ?? ''}  ${score}  ${ratioLabel(candidate.ratio)}`;
    return {
      text: row.trimEnd(),
      tone: selected ? 'body' as const : 'muted' as const,
      ...(candidate.hex === undefined ? {} : { swatch: candidate.hex }),
    };
  })];
}

/** Lines describing a token that is a reference or a bare literal. */
export function valueLines(
  inspection: TokenGraphInspection,
  localization: LocalizationPort | undefined,
): readonly ThemeLabProvenanceLine[] {
  if (inspection.dependencies.length === 0) {
    return [
      {
        text: dogfoodText(localization, 'themeLab.provenance.literal', 'literal {hex}', {
          hex: inspection.hex,
        }),
        tone: 'body',
        swatch: inspection.hex,
      },
      {
        text: dogfoodText(
          localization,
          'themeLab.provenance.literalNote',
          'A literal cannot re-decide when the palette moves.',
        ),
        tone: 'muted',
      },
    ];
  }

  return [
    {
      text: dogfoodText(localization, 'themeLab.provenance.reference', 'reference {hex}', {
        hex: inspection.hex,
      }),
      tone: 'body',
      swatch: inspection.hex,
    },
    ...inspection.dependencies.map((dependency) => ({
      text: dogfoodText(localization, 'themeLab.provenance.defersTo', '  defers to {dependency}', {
        dependency,
      }),
      tone: 'muted' as const,
    })),
  ];
}

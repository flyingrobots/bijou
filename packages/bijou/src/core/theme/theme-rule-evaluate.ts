import { themeContrastRatio } from './doctor.js';
import type { StoredDefinition } from './graph-guards.js';
import { collectThemeRuleCandidates, type ThemeRuleCandidate } from './theme-rule-candidates.js';
import { nthThemeRuleIndex, scoreThemeRuleCandidate } from './theme-rule-metrics.js';
import type {
  ColorDefinition,
  ThemeColorRuleDefinition,
  ThemeRuleCandidateInspection,
  ThemeRuleCandidateReason,
  ThemeRuleInspection,
} from './graph-types.js';

type ThemeMode = 'light' | 'dark';

export interface ThemeRuleContext {
  readonly definitions: ReadonlyMap<string, StoredDefinition>;
  readonly mode: ThemeMode;
  readonly path: string;
  readonly visited: Set<string>;
  resolveColor(def: ColorDefinition, mode: ThemeMode, visited: Set<string>): string;
}

interface RankedCandidate extends ThemeRuleCandidate {
  readonly ratio?: number;
  readonly score: number;
  readonly selectable: boolean;
}

export function evaluateThemeColorRule(
  rule: ThemeColorRuleDefinition,
  context: ThemeRuleContext,
): ThemeRuleInspection {
  const candidates = collectThemeRuleCandidates(rule, context);
  const ranked = rankCandidates(rule, candidates, context);
  const selected = chooseCandidate(rule, ranked);
  if (selected === undefined) {
    throw new Error(`Theme rule "${rule.rule}" for "${context.path}" has no selectable candidates.`);
  }

  return {
    kind: 'rule',
    path: context.path,
    mode: context.mode,
    rule: rule.rule,
    hex: selected.hex ?? selected.label,
    selected: inspectCandidate(selected, true),
    candidates: ranked.map(candidate => inspectCandidate(candidate, candidate === selected)),
    dependencies: collectDependencies(rule, candidates),
  };
}

function rankCandidates(
  rule: ThemeColorRuleDefinition,
  candidates: readonly ThemeRuleCandidate[],
  context: ThemeRuleContext,
): readonly RankedCandidate[] {
  const target = 'target' in rule ? context.resolveColor(rule.target, context.mode, new Set(context.visited)) : undefined;
  const againstDef = vividAgainst(rule);
  if (vividMinContrast(rule) !== undefined && againstDef === undefined) {
    throw new Error(`Theme rule "${rule.rule}" for "${context.path}" requires "against" when "minContrast" is set.`);
  }
  const against = againstDef !== undefined
    ? context.resolveColor(againstDef, context.mode, new Set(context.visited))
    : target;
  return candidates.map(candidate => rankCandidate(rule, candidate, target, against));
}

function rankCandidate(
  rule: ThemeColorRuleDefinition,
  candidate: ThemeRuleCandidate,
  target: string | undefined,
  against: string | undefined,
): RankedCandidate {
  const ratio = candidate.hex !== undefined && against !== undefined ? themeContrastRatio(candidate.hex, against) : undefined;
  const minContrast = ruleMinContrast(rule);
  const contrastOk = minContrast === undefined || (ratio ?? 0) >= minContrast;
  const score = scoreThemeRuleCandidate(rule, candidate.hex, target, ratio);
  return {
    ...candidate,
    ...(ratio === undefined ? {} : { ratio }),
    score,
    selectable: candidate.hex !== undefined && !candidate.excluded && !candidate.invalid && contrastOk,
  };
}

function chooseCandidate(rule: ThemeColorRuleDefinition, ranked: readonly RankedCandidate[]): RankedCandidate | undefined {
  const selectable = ranked.filter(candidate => candidate.selectable);
  if (rule.rule === 'min-contrast-with') return selectable.find(candidate => (candidate.ratio ?? 0) >= (rule.ratio ?? 4.5));
  if (rule.rule === 'nth-color') return selectable[nthThemeRuleIndex(selectable.length, rule.index)];
  return selectable.reduce<RankedCandidate | undefined>(
    (best, candidate) => best === undefined || candidate.score > best.score ? candidate : best,
    undefined,
  );
}

function inspectCandidate(candidate: RankedCandidate, selected: boolean): ThemeRuleCandidateInspection {
  const reasons: ThemeRuleCandidateReason[] = [];
  if (selected) reasons.push('selected');
  else if (candidate.excluded) reasons.push('excluded');
  else if (candidate.invalid) reasons.push('invalid');
  else if (!candidate.selectable) reasons.push('contrast-too-low');
  else reasons.push('eligible', 'not-selected');
  return {
    label: candidate.label,
    ...(candidate.path === undefined ? {} : { path: candidate.path }),
    ...(candidate.hex === undefined ? {} : { hex: candidate.hex }),
    ...(candidate.ratio === undefined ? {} : { ratio: candidate.ratio }),
    score: candidate.score,
    reasons,
  };
}

function collectDependencies(rule: ThemeColorRuleDefinition, candidates: readonly ThemeRuleCandidate[]): readonly string[] {
  const deps = new Set<string>();
  if ('target' in rule) addColorDeps(rule.target, deps);
  const against = vividAgainst(rule);
  if (against !== undefined) addColorDeps(against, deps);
  for (const candidate of candidates) if (candidate.path !== undefined) deps.add(candidate.path);
  return [...deps];
}

function vividAgainst(rule: ThemeColorRuleDefinition): ColorDefinition | undefined {
  return rule.rule === 'most-vivid' || rule.rule === 'least-vivid' ? rule.against : undefined;
}

function vividMinContrast(rule: ThemeColorRuleDefinition): number | undefined {
  return rule.rule === 'most-vivid' || rule.rule === 'least-vivid' ? rule.minContrast : undefined;
}

function ruleMinContrast(rule: ThemeColorRuleDefinition): number | undefined {
  return rule.rule === 'min-contrast-with' ? rule.ratio ?? 4.5 : vividMinContrast(rule);
}

function addColorDeps(def: ColorDefinition, deps: Set<string>): void {
  if (typeof def === 'string') return;
  if ('ref' in def) {
    deps.add(def.ref);
    for (const transform of def.transform ?? []) {
      if (transform.type === 'mix') deps.add(transform.with);
    }
  } else if ('light' in def) {
    addColorDeps(def.light, deps);
    addColorDeps(def.dark, deps);
  }
}

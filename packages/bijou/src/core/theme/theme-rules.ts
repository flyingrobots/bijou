import type {
  ColorDefinition,
  ThemeColorRuleDefinition,
  ThemeRuleCandidateInput,
  ThemeRuleCandidateScope,
  ThemeRuleCandidateSource,
} from './graph-types.js';

export interface MinContrastRuleOptions {
  readonly ratio: number;
}

export interface VividRuleOptions {
  readonly against?: ColorDefinition;
  readonly minContrast?: number;
  readonly not?: readonly string[];
}

export function scope(path: string, options: { readonly not?: readonly string[] } = {}): ThemeRuleCandidateScope {
  assertNonEmpty(path, 'Theme rule scope path');
  return Object.freeze({
    kind: 'scope' as const,
    path,
    ...(options.not === undefined ? {} : { not: [...options.not] }),
  });
}

export function tokenCandidate(path: string): ThemeRuleCandidateInput {
  assertNonEmpty(path, 'Theme rule candidate path');
  return Object.freeze({
    kind: 'path' as const,
    path,
  });
}

export function colorCandidate(value: string, label?: string): ThemeRuleCandidateInput {
  assertNonEmpty(value, 'Theme rule candidate color');
  return Object.freeze({
    kind: 'value' as const,
    value,
    ...(label === undefined ? {} : { label }),
  });
}

export function bestContrastWith(
  target: ColorDefinition,
  candidates: ThemeRuleCandidateSource,
): ThemeColorRuleDefinition {
  return Object.freeze({
    rule: 'best-contrast-with' as const,
    target,
    candidates,
  });
}

export function minContrastWith(
  target: ColorDefinition,
  candidates: ThemeRuleCandidateSource,
  options: MinContrastRuleOptions,
): ThemeColorRuleDefinition {
  return Object.freeze({
    rule: 'min-contrast-with' as const,
    target,
    candidates,
    ratio: options.ratio,
  });
}

export function mostVivid(
  candidates: ThemeRuleCandidateSource,
  options: VividRuleOptions = {},
): ThemeColorRuleDefinition {
  return vividRule('most-vivid', candidates, options);
}

export function leastVivid(
  candidates: ThemeRuleCandidateSource,
  options: VividRuleOptions = {},
): ThemeColorRuleDefinition {
  return vividRule('least-vivid', candidates, options);
}

export function closestColor(
  target: ColorDefinition,
  candidates: ThemeRuleCandidateSource,
): ThemeColorRuleDefinition {
  return Object.freeze({
    rule: 'closest-color' as const,
    target,
    candidates,
  });
}

export function nthColor(candidates: ThemeRuleCandidateSource, index: number): ThemeColorRuleDefinition {
  return Object.freeze({
    rule: 'nth-color' as const,
    candidates,
    index,
  });
}

export function isThemeColorRuleDefinition(value: unknown): value is ThemeColorRuleDefinition {
  if (typeof value !== 'object' || value === null || Array.isArray(value) || !('rule' in value)) return false;
  const rule = value.rule;
  return rule === 'best-contrast-with'
    || rule === 'min-contrast-with'
    || rule === 'most-vivid'
    || rule === 'least-vivid'
    || rule === 'closest-color'
    || rule === 'nth-color';
}

function vividRule(
  rule: 'most-vivid' | 'least-vivid',
  candidates: ThemeRuleCandidateSource,
  options: VividRuleOptions,
): ThemeColorRuleDefinition {
  return Object.freeze({
    rule,
    candidates,
    ...(options.against === undefined ? {} : { against: options.against }),
    ...(options.minContrast === undefined ? {} : { minContrast: options.minContrast }),
    ...(options.not === undefined ? {} : { not: [...options.not] }),
  });
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim() === '') {
    throw new Error(`${label} is required.`);
  }
}

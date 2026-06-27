import { hexToRgb, rgbToHex } from './color.js';
import type { StoredDefinition } from './graph-guards.js';
import type {
  ColorDefinition,
  ThemeColorRuleDefinition,
  ThemeRuleCandidateInput,
} from './graph-types.js';

type ThemeMode = 'light' | 'dark';

export interface ThemeRuleCandidateContext {
  readonly definitions: ReadonlyMap<string, StoredDefinition>;
  readonly mode: ThemeMode;
  readonly visited: Set<string>;
  resolveColor(def: ColorDefinition, mode: ThemeMode, visited: Set<string>): string;
}

export interface ThemeRuleCandidate {
  readonly path?: string;
  readonly label: string;
  readonly hex?: string;
  readonly excluded: boolean;
  readonly invalid: boolean;
}

export function collectThemeRuleCandidates(
  rule: ThemeColorRuleDefinition,
  context: ThemeRuleCandidateContext,
): readonly ThemeRuleCandidate[] {
  const excluded = new Set<string>();
  if ((rule.rule === 'most-vivid' || rule.rule === 'least-vivid') && rule.not !== undefined) {
    for (const path of rule.not) excluded.add(path);
  }

  if (isCandidateScope(rule.candidates) && rule.candidates.not !== undefined) {
    for (const path of rule.candidates.not) excluded.add(path);
  }

  const inputs = candidateInputs(rule.candidates, context.definitions);
  return inputs.map(input => resolveCandidate(input, excluded, context));
}

function candidateInputs(
  candidates: ThemeColorRuleDefinition['candidates'],
  definitions: ReadonlyMap<string, StoredDefinition>,
): readonly ThemeRuleCandidateInput[] {
  return isCandidateScope(candidates) ? scopeInputs(candidates.path, definitions) : candidates;
}

function isCandidateScope(
  candidates: ThemeColorRuleDefinition['candidates'],
): candidates is Extract<ThemeColorRuleDefinition['candidates'], { readonly kind: 'scope' }> {
  return !isCandidateArray(candidates);
}

function isCandidateArray(
  candidates: ThemeColorRuleDefinition['candidates'],
): candidates is readonly ThemeRuleCandidateInput[] {
  return Array.isArray(candidates);
}

function scopeInputs(scope: string, definitions: ReadonlyMap<string, StoredDefinition>): readonly ThemeRuleCandidateInput[] {
  const prefix = `${scope}.`;
  return [...definitions.keys()]
    .filter(path => path.startsWith(prefix) && !path.slice(prefix.length).includes('.'))
    .map(path => ({ kind: 'path' as const, path }));
}

function resolveCandidate(
  input: ThemeRuleCandidateInput,
  excluded: ReadonlySet<string>,
  context: ThemeRuleCandidateContext,
): ThemeRuleCandidate {
  const path = candidatePath(input);
  const rawValue = candidateRawValue(input);
  const label = candidateLabel(input, path, rawValue);

  try {
    const hex = path === undefined
      ? rgbToHex(hexToRgb(rawValue ?? label))
      : context.resolveColor({ ref: path }, context.mode, new Set(context.visited));
    return {
      label,
      ...(path === undefined ? {} : { path }),
      hex,
      excluded: path !== undefined && excluded.has(path),
      invalid: false,
    };
  } catch {
    return {
      label,
      ...(path === undefined ? {} : { path }),
      excluded: path !== undefined && excluded.has(path),
      invalid: true,
    };
  }
}

function candidatePath(input: ThemeRuleCandidateInput): string | undefined {
  if (typeof input === 'string') return input.startsWith('#') ? undefined : input;
  return input.kind === 'path' ? input.path : undefined;
}

function candidateRawValue(input: ThemeRuleCandidateInput): string | undefined {
  if (typeof input === 'string') return input.startsWith('#') ? input : undefined;
  return input.kind === 'value' ? input.value : undefined;
}

function candidateLabel(
  input: ThemeRuleCandidateInput,
  path: string | undefined,
  rawValue: string | undefined,
): string {
  if (path !== undefined) return path;
  if (typeof input === 'object' && input.kind === 'value' && input.label !== undefined) return input.label;
  return rawValue ?? 'candidate';
}

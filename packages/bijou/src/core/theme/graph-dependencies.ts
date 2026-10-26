import type {
  ColorDefinition,
  ThemeColorRuleDefinition,
  ThemeRuleCandidateInput,
  ThemeRuleCandidateScope,
  ThemeRuleCandidateSource,
} from './graph-types.js';
import type { StoredDefinition } from './graph-guards.js';
import { isTokenDefinition } from './graph-guards.js';
import { hasThemeRulePath } from './theme-rule-paths.js';
import { isThemeColorRuleDefinition } from './theme-rules.js';

type GraphMode = 'light' | 'dark';

export function collectGraphDefinitionDependencies(
  def: StoredDefinition,
  mode: GraphMode,
  definitions: ReadonlyMap<string, StoredDefinition>,
): readonly string[] {
  const deps = new Set<string>();
  if (isThemeColorRuleDefinition(def)) {
    collectRuleDependencies(def, mode, definitions, deps);
  } else if (isTokenDefinition(def)) {
    collectColorDependencies(def.fg, mode, deps);
    if (def.bg !== undefined) collectColorDependencies(def.bg, mode, deps);
  } else {
    collectColorDependencies(def, mode, deps);
  }
  return [...deps].filter((path) => hasThemeRulePath(definitions, path));
}

function collectRuleDependencies(
  rule: ThemeColorRuleDefinition,
  mode: GraphMode,
  definitions: ReadonlyMap<string, StoredDefinition>,
  deps: Set<string>,
): void {
  if ('target' in rule) collectColorDependencies(rule.target, mode, deps);
  if ((rule.rule === 'most-vivid' || rule.rule === 'least-vivid') && rule.against !== undefined) {
    collectColorDependencies(rule.against, mode, deps);
  }
  if (!isCandidateScope(rule.candidates)) {
    for (const candidate of rule.candidates) collectCandidateDependency(candidate, deps);
    return;
  }
  const prefix = `${rule.candidates.path}.`;
  for (const path of definitions.keys()) {
    if (path.startsWith(prefix) && !path.slice(prefix.length).includes('.')) deps.add(path);
  }
}

function isCandidateScope(
  candidates: ThemeRuleCandidateSource,
): candidates is ThemeRuleCandidateScope {
  return !Array.isArray(candidates);
}

function collectCandidateDependency(candidate: ThemeRuleCandidateInput, deps: Set<string>): void {
  if (typeof candidate === 'string') {
    if (!candidate.startsWith('#')) deps.add(candidate);
    return;
  }
  if (candidate.kind === 'path') deps.add(candidate.path);
}

function collectColorDependencies(
  def: ColorDefinition,
  mode: GraphMode,
  deps: Set<string>,
): void {
  if (typeof def === 'string') return;
  if ('ref' in def) {
    deps.add(def.ref);
    for (const transform of def.transform ?? []) {
      if (transform.type === 'mix') deps.add(transform.with);
    }
  } else if ('light' in def) {
    collectColorDependencies(mode === 'light' ? def.light : def.dark, mode, deps);
  }
}

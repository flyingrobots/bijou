import type { OutputMode } from './detect/tty.js';
import {
  type ModeLoweringFact,
  type ModeLoweringIssue,
  type ModeLoweringModeFacts,
  DEFAULT_BASELINE_MODE,
  FACT_SEPARATOR,
  MODE_ORDER,
} from './mode-lowering.part01.js';
import { formatFactValue } from './mode-lowering.part04.js';

export function duplicateFactIssues(
  modeFacts: ModeLoweringModeFacts,
): readonly ModeLoweringIssue[] {
  const seenIdentities = new Set<string>();
  const duplicateIdentities = new Set<string>();
  const issues: ModeLoweringIssue[] = [];

  for (const fact of modeFacts.facts) {
    const identity = factIdentity(fact);
    if (!seenIdentities.has(identity)) {
      seenIdentities.add(identity);
      continue;
    }

    if (duplicateIdentities.has(identity)) {
      continue;
    }

    duplicateIdentities.add(identity);
    issues.push({
      kind: 'duplicate-fact',
      severity: 'warning',
      mode: modeFacts.mode,
      factKind: fact.kind,
      key: fact.key,
      message: `${modeFacts.mode} has duplicate ${fact.kind} ${fact.key}`,
    });
  }

  return issues;
}
export function missingFactIssue(
  baselineMode: OutputMode,
  mode: OutputMode,
  fact: ModeLoweringFact,
): ModeLoweringIssue {
  return {
    kind: 'missing-required-fact',
    severity: 'error',
    mode,
    baselineMode,
    factKind: fact.kind,
    key: fact.key,
    message: `${mode} is missing required ${fact.kind} ${fact.key} from ${baselineMode}`,
  };
}
export function mismatchedFactIssue(
  baselineMode: OutputMode,
  mode: OutputMode,
  expected: ModeLoweringFact,
  actual: ModeLoweringFact,
): ModeLoweringIssue {
  return {
    kind: 'mismatched-fact-value',
    severity: 'error',
    mode,
    baselineMode,
    factKind: expected.kind,
    key: expected.key,
    expected: expected.value,
    actual: actual.value,
    message: `${mode} ${expected.kind} ${expected.key} differs from ${baselineMode}: expected ${formatFactValue(expected.value)}, got ${formatFactValue(actual.value)}`,
  };
}
export function firstFactsByIdentity(
  facts: readonly ModeLoweringFact[],
): ReadonlyMap<string, ModeLoweringFact> {
  const factsByIdentity = new Map<string, ModeLoweringFact>();
  for (const fact of facts) {
    const identity = factIdentity(fact);
    if (!factsByIdentity.has(identity)) {
      factsByIdentity.set(identity, fact);
    }
  }

  return factsByIdentity;
}
export function factIdentity(fact: ModeLoweringFact): string {
  return `${fact.kind}${FACT_SEPARATOR}${fact.key}`;
}
export function factValueDiffers(
  expected: ModeLoweringFact,
  actual: ModeLoweringFact,
): boolean {
  if (expected.value === undefined) {
    return false;
  }

  return expected.value !== actual.value;
}
export function resolveBaselineMode(
  requestedMode: OutputMode | undefined,
  modeFactsByMode: ReadonlyMap<OutputMode, ModeLoweringModeFacts>,
  modes: readonly ModeLoweringModeFacts[],
): OutputMode {
  if (requestedMode !== undefined) {
    return requestedMode;
  }

  if (modeFactsByMode.has(DEFAULT_BASELINE_MODE)) {
    return DEFAULT_BASELINE_MODE;
  }

  return modes[0]?.mode ?? DEFAULT_BASELINE_MODE;
}
export function compareModeFacts(
  a: ModeLoweringModeFacts,
  b: ModeLoweringModeFacts,
): number {
  return modeRank(a.mode) - modeRank(b.mode);
}
export function modeRank(mode: OutputMode): number {
  return MODE_ORDER.indexOf(mode);
}

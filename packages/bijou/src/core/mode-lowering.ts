import type { OutputMode } from './detect/tty.js';

export type ModeLoweringFactKind =
  | 'entity'
  | 'edge'
  | 'count'
  | 'label'
  | 'state'
  | 'custom';

export type ModeLoweringFactValue = string | number | boolean;

export interface ModeLoweringFact {
  readonly kind: ModeLoweringFactKind;
  readonly key: string;
  readonly value?: ModeLoweringFactValue;
  readonly label?: string;
  readonly required?: boolean;
}

export interface ModeLoweringModeFacts {
  readonly mode: OutputMode;
  readonly facts: readonly ModeLoweringFact[];
}

export type ModeLoweringSeverity = 'warning' | 'error';

export type ModeLoweringIssueKind =
  | 'missing-required-fact'
  | 'mismatched-fact-value'
  | 'duplicate-fact'
  | 'custom-assertion-failed';

export interface ModeLoweringIssue {
  readonly kind: ModeLoweringIssueKind;
  readonly severity: ModeLoweringSeverity;
  readonly mode?: OutputMode;
  readonly baselineMode?: OutputMode;
  readonly factKind?: ModeLoweringFactKind;
  readonly key?: string;
  readonly expected?: ModeLoweringFactValue;
  readonly actual?: ModeLoweringFactValue;
  readonly message: string;
}

export interface ModeLoweringAssertionResult {
  readonly passed: boolean;
  readonly message: string;
  readonly mode?: OutputMode;
  readonly key?: string;
  readonly severity?: ModeLoweringSeverity;
}

export interface ModeLoweringOptions {
  readonly baselineMode?: OutputMode;
  readonly modes: readonly ModeLoweringModeFacts[];
  readonly assertions?: readonly ModeLoweringAssertionResult[];
}

export interface ModeLoweringReport {
  readonly baselineMode: OutputMode;
  readonly checkedModes: readonly OutputMode[];
  readonly issues: readonly ModeLoweringIssue[];
  readonly passed: boolean;
}

const DEFAULT_BASELINE_MODE: OutputMode = 'interactive';
const MODE_ORDER: readonly OutputMode[] = ['interactive', 'static', 'pipe', 'accessible'];
const FACT_SEPARATOR = ':';
const LIST_SEPARATOR = ',';
const EMPTY_LABEL = '-';

export function lintModeLowering(options: ModeLoweringOptions): ModeLoweringReport {
  const modes = [...options.modes].sort(compareModeFacts);
  const modeNames = modes.map((modeFacts) => modeFacts.mode);
  const modeFactsByMode = new Map<OutputMode, ModeLoweringModeFacts>();
  for (const modeFacts of modes) {
    modeFactsByMode.set(modeFacts.mode, modeFacts);
  }

  const baselineMode = resolveBaselineMode(options.baselineMode, modeFactsByMode, modes);
  const baselineFacts = modeFactsByMode.get(baselineMode)?.facts ?? [];
  const issues: ModeLoweringIssue[] = [];

  for (const modeFacts of modes) {
    issues.push(...duplicateFactIssues(modeFacts));
  }

  for (const modeFacts of modes) {
    if (modeFacts.mode === baselineMode) {
      continue;
    }

    issues.push(...compareAgainstBaseline({
      baselineMode,
      baselineFacts,
      modeFacts,
    }));
  }

  for (const assertion of options.assertions ?? []) {
    if (assertion.passed) {
      continue;
    }

    issues.push({
      kind: 'custom-assertion-failed',
      severity: assertion.severity ?? 'error',
      mode: assertion.mode,
      key: assertion.key,
      message: assertion.message,
    });
  }

  return {
    baselineMode,
    checkedModes: modeNames,
    issues,
    passed: issues.length === 0,
  };
}

export function modeLoweringReportText(report: ModeLoweringReport): string {
  const status = report.passed ? 'passed' : 'failed';
  const checked = report.checkedModes.length === 0
    ? EMPTY_LABEL
    : report.checkedModes.join(LIST_SEPARATOR);
  const lines = [`mode lowering: ${status} baseline=${report.baselineMode} checked=${checked}`];

  if (report.issues.length === 0) {
    return lines.join('\n');
  }

  lines.push('issues:');
  for (const issue of report.issues) {
    lines.push(`- ${issue.severity} ${issue.kind}${issueModeText(issue)}${issueFactText(issue)}: ${issue.message}`);
  }

  return lines.join('\n');
}

interface BaselineCompareOptions {
  readonly baselineMode: OutputMode;
  readonly baselineFacts: readonly ModeLoweringFact[];
  readonly modeFacts: ModeLoweringModeFacts;
}

function compareAgainstBaseline(options: BaselineCompareOptions): readonly ModeLoweringIssue[] {
  const issues: ModeLoweringIssue[] = [];
  const factsByIdentity = firstFactsByIdentity(options.modeFacts.facts);
  for (const baselineFact of options.baselineFacts) {
    if (baselineFact.required === false) {
      continue;
    }

    const candidate = factsByIdentity.get(factIdentity(baselineFact));
    if (candidate === undefined) {
      issues.push(missingFactIssue(options.baselineMode, options.modeFacts.mode, baselineFact));
      continue;
    }

    if (factValueDiffers(baselineFact, candidate)) {
      issues.push(mismatchedFactIssue(options.baselineMode, options.modeFacts.mode, baselineFact, candidate));
    }
  }

  return issues;
}

function duplicateFactIssues(modeFacts: ModeLoweringModeFacts): readonly ModeLoweringIssue[] {
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

function missingFactIssue(
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

function mismatchedFactIssue(
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

function firstFactsByIdentity(facts: readonly ModeLoweringFact[]): ReadonlyMap<string, ModeLoweringFact> {
  const factsByIdentity = new Map<string, ModeLoweringFact>();
  for (const fact of facts) {
    const identity = factIdentity(fact);
    if (!factsByIdentity.has(identity)) {
      factsByIdentity.set(identity, fact);
    }
  }

  return factsByIdentity;
}

function factIdentity(fact: ModeLoweringFact): string {
  return `${fact.kind}${FACT_SEPARATOR}${fact.key}`;
}

function factValueDiffers(expected: ModeLoweringFact, actual: ModeLoweringFact): boolean {
  if (expected.value === undefined) {
    return false;
  }

  return expected.value !== actual.value;
}

function resolveBaselineMode(
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

function compareModeFacts(a: ModeLoweringModeFacts, b: ModeLoweringModeFacts): number {
  return modeRank(a.mode) - modeRank(b.mode);
}

function modeRank(mode: OutputMode): number {
  return MODE_ORDER.indexOf(mode);
}

function issueModeText(issue: ModeLoweringIssue): string {
  return issue.mode === undefined ? '' : ` mode=${issue.mode}`;
}

function issueFactText(issue: ModeLoweringIssue): string {
  if (issue.factKind === undefined || issue.key === undefined) {
    return '';
  }

  return ` fact=${issue.factKind}${FACT_SEPARATOR}${issue.key}`;
}

function formatFactValue(value: ModeLoweringFactValue | undefined): string {
  return value === undefined ? EMPTY_LABEL : String(value);
}

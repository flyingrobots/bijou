import type { OutputMode } from './detect/tty.js';
import {
  type ModeLoweringFact,
  type ModeLoweringIssue,
  type ModeLoweringModeFacts,
  type ModeLoweringOptions,
  type ModeLoweringReport,
  EMPTY_LABEL,
  LIST_SEPARATOR,
} from './mode-lowering.part01.js';
import {
  compareModeFacts,
  duplicateFactIssues,
  factIdentity,
  factValueDiffers,
  firstFactsByIdentity,
  mismatchedFactIssue,
  missingFactIssue,
  resolveBaselineMode,
} from './mode-lowering.part03.js';
import { issueFactText, issueModeText } from './mode-lowering.part04.js';

export function lintModeLowering(
  options: ModeLoweringOptions,
): ModeLoweringReport {
  const modes = [...options.modes].sort(compareModeFacts);
  const modeNames = modes.map((modeFacts) => modeFacts.mode);
  const modeFactsByMode = new Map<OutputMode, ModeLoweringModeFacts>();
  for (const modeFacts of modes) {
    modeFactsByMode.set(modeFacts.mode, modeFacts);
  }

  const baselineMode = resolveBaselineMode(
    options.baselineMode,
    modeFactsByMode,
    modes,
  );
  const baselineFacts = modeFactsByMode.get(baselineMode)?.facts ?? [];
  const issues: ModeLoweringIssue[] = [];

  for (const modeFacts of modes) {
    issues.push(...duplicateFactIssues(modeFacts));
  }

  for (const modeFacts of modes) {
    if (modeFacts.mode === baselineMode) {
      continue;
    }

    issues.push(
      ...compareAgainstBaseline({
        baselineMode,
        baselineFacts,
        modeFacts,
      }),
    );
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
  const checked =
    report.checkedModes.length === 0
      ? EMPTY_LABEL
      : report.checkedModes.join(LIST_SEPARATOR);
  const lines = [
    `mode lowering: ${status} baseline=${report.baselineMode} checked=${checked}`,
  ];

  if (report.issues.length === 0) {
    return lines.join('\n');
  }

  lines.push('issues:');
  for (const issue of report.issues) {
    lines.push(
      `- ${issue.severity} ${issue.kind}${issueModeText(issue)}${issueFactText(issue)}: ${issue.message}`,
    );
  }

  return lines.join('\n');
}
export interface BaselineCompareOptions {
  readonly baselineMode: OutputMode;
  readonly baselineFacts: readonly ModeLoweringFact[];
  readonly modeFacts: ModeLoweringModeFacts;
}
export function compareAgainstBaseline(
  options: BaselineCompareOptions,
): readonly ModeLoweringIssue[] {
  const issues: ModeLoweringIssue[] = [];
  const factsByIdentity = firstFactsByIdentity(options.modeFacts.facts);
  for (const baselineFact of options.baselineFacts) {
    if (baselineFact.required === false) {
      continue;
    }

    const candidate = factsByIdentity.get(factIdentity(baselineFact));
    if (candidate === undefined) {
      issues.push(
        missingFactIssue(
          options.baselineMode,
          options.modeFacts.mode,
          baselineFact,
        ),
      );
      continue;
    }

    if (factValueDiffers(baselineFact, candidate)) {
      issues.push(
        mismatchedFactIssue(
          options.baselineMode,
          options.modeFacts.mode,
          baselineFact,
          candidate,
        ),
      );
    }
  }

  return issues;
}

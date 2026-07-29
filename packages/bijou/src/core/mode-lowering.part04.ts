import {
  type ModeLoweringFactValue,
  type ModeLoweringIssue,
  EMPTY_LABEL,
  FACT_SEPARATOR,
} from './mode-lowering.part01.js';

export function issueModeText(issue: ModeLoweringIssue): string {
  return issue.mode === undefined ? '' : ` mode=${issue.mode}`;
}
export function issueFactText(issue: ModeLoweringIssue): string {
  if (issue.factKind === undefined || issue.key === undefined) {
    return '';
  }

  return ` fact=${issue.factKind}${FACT_SEPARATOR}${issue.key}`;
}
export function formatFactValue(
  value: ModeLoweringFactValue | undefined,
): string {
  return value === undefined ? EMPTY_LABEL : String(value);
}

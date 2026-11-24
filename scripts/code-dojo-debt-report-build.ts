import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadCodeDojoEslintRules, type CodeDojoEslintRuleCount } from './code-dojo-debt-baselines.js';
import { loadCodeDojoDebtInput, summarizeCodeDojoDebt, type CodeDojoDebtInput } from './code-dojo-debt.js';
import type { CodeDojoLiveInput } from './code-dojo-debt-report-live.js';

export const CODE_DOJO_REPORT_SCHEMA = 'code-dojo.debt-report.v1';
const TOP_LIMIT = 10;

export type CodeDojoReportSource =
  | { readonly id: 'file-context' | 'mock-ban' | 'eslint'; readonly count: number }
  | { readonly id: 'code-size'; readonly count: number; readonly overHardLimit: number };

export interface CodeDojoDebtReport {
  readonly schema: typeof CODE_DOJO_REPORT_SCHEMA;
  readonly totalViolations: number;
  readonly ceiling: number;
  readonly goalpostReduction: number;
  readonly nextGoalpostTarget: number;
  readonly sources: readonly CodeDojoReportSource[];
  readonly eslintRules: readonly CodeDojoEslintRuleCount[];
  readonly live: CodeDojoLiveInput | null;
}

export interface CodeDojoDebtReportInput {
  readonly debt: CodeDojoDebtInput;
  readonly ceiling: number;
  readonly eslintRules: readonly CodeDojoEslintRuleCount[];
  readonly live: CodeDojoLiveInput | null;
}

function byCountThen<T>(count: (item: T) => number, key: (item: T) => string): (a: T, b: T) => number {
  return (a, b) => count(b) - count(a) || key(a).localeCompare(key(b), 'en');
}

/** Pure: every number comes from `summarizeCodeDojoDebt`, the gate's own computation. */
export function buildCodeDojoDebtReport(input: CodeDojoDebtReportInput): CodeDojoDebtReport {
  const summary = summarizeCodeDojoDebt(input.debt);
  const { live } = input;
  return {
    schema: CODE_DOJO_REPORT_SCHEMA,
    totalViolations: summary.totalViolations,
    ceiling: input.ceiling,
    goalpostReduction: summary.goalpostReduction,
    nextGoalpostTarget: summary.nextGoalpostTarget,
    sources: [
      { id: 'file-context', count: summary.fileContextViolations },
      { id: 'mock-ban', count: summary.mockBanViolations },
      { id: 'code-size', count: summary.codeSizeViolations, overHardLimit: summary.codeSizeHardLimitViolations },
      { id: 'eslint', count: summary.eslintViolations },
    ],
    eslintRules: [...input.eslintRules]
      .sort(byCountThen((rule) => rule.count, (rule) => rule.ruleId))
      .slice(0, TOP_LIMIT),
    live: live == null ? null : {
      eslintViolations: live.eslintViolations,
      eslintFiles: live.eslintFiles == null ? null : [...live.eslintFiles]
        .sort(byCountThen((file) => file.count, (file) => file.path))
        .slice(0, TOP_LIMIT),
    },
  };
}

/** The `--max` ceiling the gate script passes to `code-dojo-debt.ts`. */
export function readCodeDojoCeiling(root: string): number {
  const parsed: unknown = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const scripts = typeof parsed === 'object' && parsed != null && 'scripts' in parsed ? parsed.scripts : null;
  const command = typeof scripts === 'object' && scripts != null && 'code-dojo:debt' in scripts
    ? scripts['code-dojo:debt']
    : null;
  const match = typeof command === 'string' ? /--max (\d+)/u.exec(command) : null;
  if (match?.[1] == null) throw new Error('package.json code-dojo:debt has no --max ceiling');
  return Number(match[1]);
}

export function loadCodeDojoDebtReport(root: string, live: CodeDojoLiveInput | null): CodeDojoDebtReport {
  return buildCodeDojoDebtReport({
    debt: loadCodeDojoDebtInput(root),
    ceiling: readCodeDojoCeiling(root),
    eslintRules: loadCodeDojoEslintRules(root),
    live,
  });
}

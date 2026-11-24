export interface EslintFileResult {
  readonly filePath: string;
  readonly errorCount?: number;
  readonly warningCount?: number;
  readonly messages?: readonly { readonly ruleId?: string | null }[];
}

export interface EslintSummary {
  readonly total: number;
  readonly errors: number;
  readonly warnings: number;
  readonly rules: Map<string, number>;
}

export const lintTargets: readonly string[];

export function runEslintJson(root: string, targets?: readonly string[]): EslintFileResult[];

export function summarizeEslintResults(results: readonly EslintFileResult[]): EslintSummary;

export function summarizeEslintFiles(
  results: readonly EslintFileResult[],
  root: string,
): { path: string; count: number }[];

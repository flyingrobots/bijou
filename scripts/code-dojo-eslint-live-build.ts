import {
  summarizeEslintFiles,
  summarizeEslintResults,
  type EslintFileResult,
} from './code-dojo/eslint-results.mjs';
import type { CodeDojoLiveFile } from './code-dojo-debt-report-live.js';

export const LIVE_FILE_LIMIT = 10;

export interface CodeDojoEslintLive {
  readonly schema: 'code-dojo.eslint-live.v1';
  readonly eslintViolations: number;
  readonly eslintFiles: readonly CodeDojoLiveFile[];
}

/**
 * Builds the live artifact from the raw ESLint results the ratchet consumes.
 * The total comes from summarizeEslintResults, the same function
 * scripts/code-dojo/check-eslint.mjs uses, so the two cannot drift.
 */
export function buildEslintLive(results: readonly EslintFileResult[], root: string): CodeDojoEslintLive {
  return {
    schema: 'code-dojo.eslint-live.v1',
    eslintViolations: summarizeEslintResults(results).total,
    eslintFiles: summarizeEslintFiles(results, root).slice(0, LIVE_FILE_LIMIT),
  };
}

import { isCheckEntries, ghJson } from './pr-review-status-parse.js';
import type {
  ReviewStatusOptions,
  ReviewStatusReport,
} from './pr-review-status-contract.js';
import { computeExitCode, summarizeChecks } from './pr-review-status-checks.js';
import { summarizeCodeRabbitStatus } from './pr-review-status-coderabbit.js';
import {
  fetchPullRequest,
  fetchReviewThreads,
} from './pr-review-status-github.js';
import { writeReviewStatus } from './pr-review-status-output.js';
import {
  computeMergeReadiness,
  computeMergeReadinessExitCode,
} from './pr-review-status-readiness.js';
import {
  extractUnresolvedFindings,
  summarizeReviews,
} from './pr-review-status-reviews.js';

export function runReviewStatus(args: readonly string[]): void {
  const options = parseArgs(args);
  const pr = fetchPullRequest(options.prArg);
  const checks = summarizeChecks(
    ghJson(
      [
        'pr',
        'checks',
        String(pr.number),
        '--json',
        'name,bucket,state,link,workflow',
      ],
      isCheckEntries,
    ),
  );
  const unresolved = extractUnresolvedFindings(fetchReviewThreads(pr.number));
  const reviews = summarizeReviews(pr.reviews);
  const codeRabbit = summarizeCodeRabbitStatus(
    checks.codeRabbit,
    pr.comments,
    pr.reviews,
  );
  const readiness = computeMergeReadiness({
    pr,
    checks,
    unresolvedCount: unresolved.length,
    reviews,
    codeRabbit,
    minReviews: options.minReviews,
  });
  const report: ReviewStatusReport = {
    pr,
    checks,
    unresolved,
    reviews,
    codeRabbit,
    readiness,
    options,
  };
  writeReviewStatus(report);
  process.exitCode = options.mergeReady
    ? computeMergeReadinessExitCode(readiness)
    : computeExitCode(checks, unresolved.length);
}

function parseArgs(args: readonly string[]): ReviewStatusOptions {
  let mergeReady = false;
  let minReviews = 2;
  let prArg: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? '';
    if (arg === '--merge-ready') {
      mergeReady = true;
    } else if (arg === '--min-reviews') {
      const value = args[index + 1];
      if (value == null || !/^\d+$/.test(value)) {
        throw new Error('--min-reviews requires a numeric value');
      }
      minReviews = Number.parseInt(value, 10);
      index += 1;
    } else if (prArg == null) {
      prArg = arg;
    } else {
      throw new Error(`unexpected argument: ${arg}`);
    }
  }
  return { mergeReady, minReviews, prArg };
}

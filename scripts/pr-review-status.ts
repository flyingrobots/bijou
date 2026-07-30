#!/usr/bin/env npx tsx

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runReviewStatus } from './pr-review-status-cli.js';

export type {
  CheckEntry,
  CheckSummary,
  CodeRabbitStatus,
  MergeReadiness,
  PullRequestComment,
  PullRequestReview,
  ReviewSummary,
  UnresolvedFinding,
} from './pr-review-status-contract.js';
export type {
  PageInfo,
  PullRequestConnection,
  PullRequestGraphqlResponse,
  ReviewThreadComment,
  ReviewThreadNode,
  ReviewThreadsResponse,
} from './pr-review-status-github-contract.js';
export { computeExitCode, summarizeChecks } from './pr-review-status-checks.js';
export { summarizeCodeRabbitStatus } from './pr-review-status-coderabbit.js';
export {
  computeMergeReadiness,
  computeMergeReadinessExitCode,
  mergeReadinessHeading,
} from './pr-review-status-readiness.js';
export {
  assertUntruncatedPullRequestData,
  extractUnresolvedFindings,
  summarizeReviews,
} from './pr-review-status-reviews.js';

if (
  process.argv[1] != null &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  runReviewStatus(process.argv.slice(2));
}

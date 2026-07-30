import type { PullRequestView } from './pr-review-status-contract.js';
import type { ReviewThreadNode } from './pr-review-status-github-contract.js';
import {
  ghGraphql,
  ghJson,
  isPrNumberPayload,
  isPullRequestGraphqlResponse,
  isReviewThreadsResponse,
} from './pr-review-status-parse.js';
import {
  PULL_REQUEST_QUERY,
  REVIEW_THREADS_QUERY,
} from './pr-review-status-queries.js';
import { assertUntruncatedPullRequestData } from './pr-review-status-reviews.js';

export function fetchReviewThreads(
  prNumber: number,
): readonly ReviewThreadNode[] {
  const payload = ghGraphql(
    REVIEW_THREADS_QUERY,
    { prNumber: String(prNumber) },
    isReviewThreadsResponse,
  );
  const reviewThreads = payload.data.repository.pullRequest.reviewThreads;
  assertUntruncatedPullRequestData({ reviewThreads });
  return reviewThreads.nodes;
}

export function fetchPullRequest(prArg: string | undefined): PullRequestView {
  const selector = prArg == null || prArg === '' ? undefined : prArg;
  const prNumber = ghJson(
    [
      'pr',
      'view',
      ...(selector === undefined ? [] : [selector]),
      '--json',
      'number',
    ],
    isPrNumberPayload,
  ).number;
  const payload = ghGraphql(
    PULL_REQUEST_QUERY,
    { prNumber: String(prNumber) },
    isPullRequestGraphqlResponse,
  );
  const pullRequest = payload.data.repository.pullRequest;
  if (pullRequest == null) {
    throw new Error(
      `no pull request found for ${selector ?? 'current branch'}`,
    );
  }
  assertUntruncatedPullRequestData(pullRequest);
  return {
    ...pullRequest,
    comments: pullRequest.comments.nodes,
    reviews: pullRequest.reviews.nodes,
  };
}

import type {
  PullRequestComment,
  PullRequestReview,
  ReviewSummary,
  SubmittedReview,
  UnresolvedFinding,
} from './pr-review-status-contract.js';
import type {
  PullRequestConnection,
  ReviewThreadComment,
  ReviewThreadNode,
} from './pr-review-status-github-contract.js';
import {
  isAutomatedReviewer,
  isSubmittedReview,
} from './pr-review-status-authors.js';

export function assertUntruncatedPullRequestData(input: {
  readonly comments?: Pick<
    PullRequestConnection<PullRequestComment>,
    'pageInfo' | 'totalCount'
  >;
  readonly reviews?: Pick<
    PullRequestConnection<PullRequestReview>,
    'pageInfo' | 'totalCount'
  >;
  readonly reviewThreads?: Pick<
    PullRequestConnection<ReviewThreadNode>,
    'pageInfo' | 'totalCount'
  >;
}): void {
  const truncated: string[] = [];
  if (input.comments?.pageInfo.hasNextPage) {
    truncated.push(`comments=${String(input.comments.totalCount)}`);
  }
  if (input.reviews?.pageInfo.hasNextPage) {
    truncated.push(`reviews=${String(input.reviews.totalCount)}`);
  }
  if (input.reviewThreads?.pageInfo.hasNextPage) {
    truncated.push(`reviewThreads=${String(input.reviewThreads.totalCount)}`);
  }
  if (truncated.length > 0) {
    throw new Error(
      `pull request metadata truncated; pagination required for ${truncated.join(', ')}`,
    );
  }
}

export function extractUnresolvedFindings(
  threads: readonly ReviewThreadNode[],
): readonly UnresolvedFinding[] {
  return threads
    .filter((thread) => !thread.isResolved)
    .map((thread) => thread.comments.nodes[0])
    .filter((comment): comment is ReviewThreadComment => comment != null)
    .map((comment) => ({
      author: comment.author?.login ?? '(unknown)',
      path: comment.path ?? '(no file)',
      url: comment.url,
      summary: summarizeComment(comment.body),
    }));
}

export function summarizeReviews(
  reviews: readonly PullRequestReview[],
): ReviewSummary {
  const latestByReviewer = new Map<string, SubmittedReview>();
  const byState: Record<string, number> = {};
  for (const review of reviews) {
    if (!isSubmittedReview(review)) continue;
    const reviewer = review.author?.login ?? '(unknown)';
    if (isAutomatedReviewer(review.author)) continue;
    const previous = latestByReviewer.get(reviewer);
    if (previous == null || previous.submittedAt < review.submittedAt) {
      latestByReviewer.set(reviewer, review);
    }
  }
  for (const review of latestByReviewer.values()) {
    byState[review.state] = (byState[review.state] ?? 0) + 1;
  }
  return {
    total: latestByReviewer.size,
    approvals: byState.APPROVED ?? 0,
    changesRequested: byState.CHANGES_REQUESTED ?? 0,
    comments: byState.COMMENTED ?? 0,
    byState,
  };
}

function summarizeComment(body: string): string {
  const firstLine = body
    .split('\n')
    .map((line) => line.trim())
    .find(
      (line) =>
        line.length > 0 &&
        !line.startsWith('<!--') &&
        !line.startsWith('<details>') &&
        !line.startsWith('</details>'),
    );
  return firstLine == null ? '(no summary)' : firstLine.slice(0, 140);
}

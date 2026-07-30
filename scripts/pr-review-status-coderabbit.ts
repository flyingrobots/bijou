import type {
  CheckEntry,
  CodeRabbitEventKind,
  CodeRabbitStatus,
  PullRequestComment,
  PullRequestReview,
} from './pr-review-status-contract.js';
import {
  isCodeRabbitAuthor,
  isSubmittedReview,
} from './pr-review-status-authors.js';

function staleNote(count: number): string {
  return `${String(count)} stale rate-limit comment${count === 1 ? '' : 's'} ignored`;
}

export function summarizeCodeRabbitStatus(
  codeRabbitCheck: CheckEntry | null,
  comments: readonly PullRequestComment[],
  reviews: readonly PullRequestReview[],
): CodeRabbitStatus {
  const events = collectCodeRabbitEvents(comments, reviews);
  const latestEvent = events[0] ?? null;
  const latestNonRateLimitAt =
    events.find((event) => event.kind !== 'rate_limit')?.at ?? null;
  const hasPassingCheck = codeRabbitCheck?.bucket === 'pass';
  const staleRateLimitCount = events.filter((event) => {
    if (event.kind !== 'rate_limit') return false;
    return (
      hasPassingCheck ||
      (latestNonRateLimitAt != null && event.at < latestNonRateLimitAt)
    );
  }).length;
  const activeRateLimitCount =
    events.filter((event) => event.kind === 'rate_limit').length -
    staleRateLimitCount;
  const shared = {
    latestKind: latestEvent?.kind ?? 'none',
    staleRateLimitCount,
    activeRateLimitCount,
  };

  if (codeRabbitCheck?.bucket === 'pass') {
    return {
      state: 'pass',
      detail:
        staleRateLimitCount > 0
          ? `pass (${staleNote(staleRateLimitCount)})`
          : 'pass',
      ...shared,
    };
  }
  if (codeRabbitCheck?.bucket === 'pending') {
    return {
      state: activeRateLimitCount > 0 ? 'rate_limited' : 'pending',
      detail: activeRateLimitCount > 0 ? 'rate-limited' : 'pending',
      ...shared,
    };
  }
  if (
    codeRabbitCheck?.bucket === 'fail' ||
    codeRabbitCheck?.bucket === 'cancel'
  ) {
    return {
      state: 'failing',
      detail: codeRabbitCheck.bucket === 'cancel' ? 'canceled' : 'failing',
      ...shared,
    };
  }
  if (activeRateLimitCount > 0) {
    return { state: 'rate_limited', detail: 'rate-limited', ...shared };
  }
  if (latestEvent?.kind === 'clean') {
    return {
      state: 'clean',
      detail:
        staleRateLimitCount > 0
          ? `no actionable comments (${staleNote(staleRateLimitCount)})`
          : 'no actionable comments',
      ...shared,
    };
  }
  if (latestEvent?.kind === 'actionable') {
    return {
      state: 'actionable',
      detail:
        staleRateLimitCount > 0
          ? `actionable comments (${staleNote(staleRateLimitCount)})`
          : 'actionable comments',
      ...shared,
    };
  }
  if (latestEvent != null) {
    return {
      state: 'commented',
      detail:
        staleRateLimitCount > 0
          ? `commented (${staleNote(staleRateLimitCount)})`
          : 'commented',
      ...shared,
    };
  }
  return { state: 'missing', detail: 'missing', ...shared };
}

function collectCodeRabbitEvents(
  comments: readonly PullRequestComment[],
  reviews: readonly PullRequestReview[],
): readonly { readonly at: string; readonly kind: CodeRabbitEventKind }[] {
  const commentEvents = comments
    .filter((comment) => isCodeRabbitAuthor(comment.author?.login))
    .map((comment) => ({
      at: comment.createdAt,
      kind: classifyCodeRabbitBody(comment.body),
    }));
  const reviewEvents = reviews
    .filter(isSubmittedReview)
    .filter((review) => isCodeRabbitAuthor(review.author?.login))
    .map((review) => ({
      at: review.submittedAt,
      kind: classifyCodeRabbitBody(review.body),
    }));
  return [...commentEvents, ...reviewEvents].sort((left, right) =>
    right.at.localeCompare(left.at),
  );
}

function classifyCodeRabbitBody(body: string): CodeRabbitEventKind {
  const normalized = body.toLowerCase();
  if (normalized.includes('rate limit exceeded')) return 'rate_limit';
  if (
    normalized.includes(
      'no actionable comments were generated in the recent review',
    )
  )
    return 'clean';
  if (/\*\*actionable comments posted:\s*[1-9]/i.test(body)) {
    return 'actionable';
  }
  if (/\*\*actionable comments posted:\s*0/i.test(body)) return 'clean';
  return 'other';
}

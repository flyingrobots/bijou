import type {
  CheckEntry,
  CodeRabbitStatus,
  PullRequestComment,
  PullRequestReview,
} from './pr-review-status-contract.js';
import { collectCodeRabbitEvents } from './pr-review-status-coderabbit-events.js';

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
  const latestCompletionAt = events.find((event) =>
    event.kind === 'clean' || event.kind === 'actionable' ||
    (event.submitted && event.kind !== 'rate_limit'),
  )?.at ?? null;
  const staleRateLimitCount = events.filter((event) => {
    if (event.kind !== 'rate_limit') return false;
    return latestCompletionAt != null && event.at < latestCompletionAt;
  }).length;
  const activeRateLimitCount =
    events.filter((event) => event.kind === 'rate_limit').length -
    staleRateLimitCount;
  const shared = {
    latestKind: latestEvent?.kind ?? 'none',
    staleRateLimitCount,
    activeRateLimitCount,
  };

  if (codeRabbitCheck?.bucket === 'pass' && activeRateLimitCount === 0) {
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

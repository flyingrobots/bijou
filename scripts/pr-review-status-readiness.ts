import type {
  CheckSummary,
  CodeRabbitStatus,
  MergeReadiness,
  PullRequestView,
  ReviewSummary,
} from './pr-review-status-contract.js';

export function mergeReadinessHeading(readiness: MergeReadiness): string {
  return readiness.status === 'blocked'
    ? 'Merge blockers'
    : 'Pending merge signals';
}

export function computeMergeReadiness(input: {
  readonly pr: Pick<
    PullRequestView,
    'state' | 'isDraft' | 'reviewDecision' | 'mergeStateStatus'
  >;
  readonly checks: CheckSummary;
  readonly unresolvedCount: number;
  readonly reviews: ReviewSummary;
  readonly codeRabbit: CodeRabbitStatus;
  readonly minReviews: number;
}): MergeReadiness {
  const reasons: string[] = [];
  if (input.pr.state !== 'OPEN') {
    reasons.push(`pull request is ${input.pr.state.toLowerCase()}`);
  }
  if (input.pr.isDraft) reasons.push('pull request is still a draft');
  if (input.pr.reviewDecision === 'REVIEW_REQUIRED') {
    reasons.push('review decision is review_required');
  }
  if (input.pr.reviewDecision === 'CHANGES_REQUESTED') {
    reasons.push('review decision is changes_requested');
  }
  if (
    input.pr.mergeStateStatus != null &&
    input.pr.mergeStateStatus !== '' &&
    isBlockingMergeState(input.pr.mergeStateStatus)
  ) {
    reasons.push(`merge state is ${input.pr.mergeStateStatus.toLowerCase()}`);
  }
  if (input.checks.failing.length > 0) {
    reasons.push(countReason(input.checks.failing.length, 'failing check'));
  }
  if (input.checks.canceled.length > 0) {
    reasons.push(countReason(input.checks.canceled.length, 'canceled check'));
  }
  if (input.unresolvedCount > 0) {
    reasons.push(
      countReason(input.unresolvedCount, 'unresolved review thread'),
    );
  }
  if (input.reviews.changesRequested > 0) {
    reasons.push(
      countReason(input.reviews.changesRequested, 'change-request review'),
    );
  }
  if (input.reviews.total < input.minReviews) {
    reasons.push(
      `needs at least ${String(input.minReviews)} review${input.minReviews === 1 ? '' : 's'} (found ${String(input.reviews.total)})`,
    );
  }
  if (reasons.length > 0) return { status: 'blocked', reasons };

  const pendingReasons: string[] = [];
  if (input.pr.mergeStateStatus === 'UNKNOWN') {
    pendingReasons.push('mergeability is still being computed');
  }
  if (input.checks.pending.length > 0) {
    pendingReasons.push(
      countReason(input.checks.pending.length, 'pending check'),
    );
  }
  if (input.codeRabbit.state === 'pending') {
    pendingReasons.push('CodeRabbit review still pending');
  } else if (input.codeRabbit.state === 'rate_limited') {
    pendingReasons.push('CodeRabbit is rate-limited');
  }
  return pendingReasons.length > 0
    ? { status: 'pending', reasons: pendingReasons }
    : { status: 'ready', reasons: [] };
}

export function computeMergeReadinessExitCode(
  readiness: MergeReadiness,
): number {
  switch (readiness.status) {
    case 'ready':
      return 0;
    case 'pending':
      return 8;
    case 'blocked':
      return 1;
  }
}

function countReason(count: number, singular: string): string {
  return `${String(count)} ${singular}${count === 1 ? '' : 's'}`;
}

function isBlockingMergeState(state: string): boolean {
  return (
    state !== 'CLEAN' &&
    state !== 'HAS_HOOKS' &&
    state !== 'UNSTABLE' &&
    state !== 'UNKNOWN'
  );
}

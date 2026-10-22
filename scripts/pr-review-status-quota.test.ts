import { describe, expect, it } from 'vitest';
import type { PullRequestComment, PullRequestReview } from './pr-review-status-contract.js';
import {
  computeMergeReadiness, computeMergeReadinessExitCode,
  summarizeChecks, summarizeCodeRabbitStatus, summarizeReviews,
} from './pr-review-status.js';

const passing = { name: 'CodeRabbit', bucket: 'pass', state: 'SUCCESS' };
const at = '2026-10-22T10:00:00Z';
const later = '2026-10-22T11:00:00Z';
const newest = '2026-10-22T12:00:00Z';

function comment(body: string, createdAt = at): PullRequestComment {
  return { author: { login: 'coderabbitai[bot]' }, body, createdAt };
}

function review(submittedAt = later): PullRequestReview {
  return {
    author: { login: 'coderabbitai[bot]' }, body: 'Review completed.',
    submittedAt, state: 'COMMENTED',
  };
}

describe('quota-skipped CodeRabbit reviews', () => {
  it.each([
    'Rate limit exceeded. Please wait 30m.',
    '## Review limit reached\nNext included review available in 52 minutes.',
    '<!-- This is an auto-generated comment: rate limited by coderabbit.ai -->',
  ])('retains an active quota notice despite a successful status: %s', (body) => {
    const status = summarizeCodeRabbitStatus(passing, [comment(body)], []);
    expect(status.state).toBe('rate_limited');
    expect(status.latestKind).toBe('rate_limit');
    expect(status.activeRateLimitCount).toBe(1);
    expect(status.staleRateLimitCount).toBe(0);
  });

  it('does not mistake a later progress comment for review completion', () => {
    const status = summarizeCodeRabbitStatus(passing, [
      comment('Review limit reached'), comment('Review in progress', later),
    ], []);
    expect(status.state).toBe('rate_limited');
    expect(status.activeRateLimitCount).toBe(1);
  });

  it('supersedes an older quota notice with a later submitted review', () => {
    const status = summarizeCodeRabbitStatus(
      passing, [comment('Review limit reached')], [review()],
    );
    expect(status.state).toBe('pass');
    expect(status.staleRateLimitCount).toBe(1);
    expect(status.activeRateLimitCount).toBe(0);
  });

  it('keeps a newer quota notice active after a previous review', () => {
    const status = summarizeCodeRabbitStatus(
      passing, [comment('Review limit reached', newest)], [review()],
    );
    expect(status.state).toBe('rate_limited');
    expect(status.activeRateLimitCount).toBe(1);
  });

  it('uses an edited notice timestamp instead of its original creation time', () => {
    const notice = { ...comment('Review limit reached'), updatedAt: newest };
    const status = summarizeCodeRabbitStatus(passing, [notice], [review()]);
    expect(status.state).toBe('rate_limited');
    expect(status.activeRateLimitCount).toBe(1);
  });

  it('preserves a failing check even when a quota notice is present', () => {
    const status = summarizeCodeRabbitStatus(
      { ...passing, bucket: 'fail', state: 'FAILURE' },
      [comment('Review limit reached')], [],
    );
    expect(status.state).toBe('failing');
  });

  it('keeps merge readiness pending even when the human review gate is met', () => {
    const status = summarizeCodeRabbitStatus(
      passing, [comment('Review limit reached')], [],
    );
    const readiness = computeMergeReadiness({
      pr: { state: 'OPEN', isDraft: false, reviewDecision: 'APPROVED', mergeStateStatus: 'CLEAN' },
      checks: summarizeChecks([passing]), unresolvedCount: 0,
      reviews: summarizeReviews(['alice', 'bob'].map((login) => ({
        author: { login }, body: 'Approved', submittedAt: later, state: 'APPROVED',
      }))),
      codeRabbit: status, minReviews: 2,
    });
    expect(readiness.status).toBe('pending');
    expect(readiness.reasons).toContain('CodeRabbit is rate-limited');
    expect(computeMergeReadinessExitCode(readiness)).toBe(8);
  });
});

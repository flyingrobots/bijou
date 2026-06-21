import { describe, expect, it } from 'vitest';
import { computeMergeReadiness, computeMergeReadinessExitCode, summarizeChecks, summarizeCodeRabbitStatus, summarizeReviews } from './pr-review-status.js';

describe('computeMergeReadiness', () => {
  it('blocks when the review gate is not met even if checks are green', () => {
    const readiness = computeMergeReadiness({
      pr: { state: 'OPEN', isDraft: false, reviewDecision: null, mergeStateStatus: 'CLEAN' },
      checks: summarizeChecks([{ name: 'CodeRabbit', bucket: 'pass', state: 'SUCCESS' }]),
      unresolvedCount: 0,
      reviews: summarizeReviews([{ author: { login: 'alice' }, body: 'ok', submittedAt: '2026-03-13T10:00:00Z', state: 'APPROVED' }]),
      codeRabbit: summarizeCodeRabbitStatus(
        { name: 'CodeRabbit', bucket: 'pass', state: 'SUCCESS' },
        [],
        [],
      ),
      minReviews: 2,
    });
    expect(readiness.status).toBe('blocked');
    expect(readiness.reasons).toContain('needs at least 2 reviews (found 1)');
    expect(computeMergeReadinessExitCode(readiness)).toBe(1);
  });
  it('returns pending when checks are still running after all blocking gates are satisfied', () => {
    const readiness = computeMergeReadiness({
      pr: { state: 'OPEN', isDraft: false, reviewDecision: 'APPROVED', mergeStateStatus: 'CLEAN' },
      checks: summarizeChecks([
        { name: 'CodeRabbit', bucket: 'pass', state: 'SUCCESS' },
        { name: 'test (22)', bucket: 'pending', state: 'PENDING' },
      ]),
      unresolvedCount: 0,
      reviews: summarizeReviews([
        { author: { login: 'alice' }, body: 'ok', submittedAt: '2026-03-13T10:00:00Z', state: 'APPROVED' },
        { author: { login: 'bob' }, body: 'ok', submittedAt: '2026-03-13T11:00:00Z', state: 'APPROVED' },
      ]),
      codeRabbit: summarizeCodeRabbitStatus(
        { name: 'CodeRabbit', bucket: 'pass', state: 'SUCCESS' },
        [],
        [],
      ),
      minReviews: 2,
    });
    expect(readiness.status).toBe('pending');
    expect(readiness.reasons).toContain('1 pending check');
    expect(computeMergeReadinessExitCode(readiness)).toBe(8);
  });
  it('treats unknown merge state as pending while GitHub computes mergeability', () => {
    const readiness = computeMergeReadiness({
      pr: { state: 'OPEN', isDraft: false, reviewDecision: 'APPROVED', mergeStateStatus: 'UNKNOWN' },
      checks: summarizeChecks([{ name: 'CodeRabbit', bucket: 'pass', state: 'SUCCESS' }]),
      unresolvedCount: 0,
      reviews: summarizeReviews([
        { author: { login: 'alice' }, body: 'ok', submittedAt: '2026-03-13T10:00:00Z', state: 'APPROVED' },
        { author: { login: 'bob' }, body: 'ok', submittedAt: '2026-03-13T11:00:00Z', state: 'APPROVED' },
      ]),
      codeRabbit: summarizeCodeRabbitStatus(
        { name: 'CodeRabbit', bucket: 'pass', state: 'SUCCESS' },
        [],
        [],
      ),
      minReviews: 2,
    });
    expect(readiness.status).toBe('pending');
    expect(readiness.reasons).toContain('mergeability is still being computed');
    expect(computeMergeReadinessExitCode(readiness)).toBe(8);
  });
  it('returns ready once checks, reviews, and bot state are all clear', () => {
    const readiness = computeMergeReadiness({
      pr: { state: 'OPEN', isDraft: false, reviewDecision: 'APPROVED', mergeStateStatus: 'CLEAN' },
      checks: summarizeChecks([{ name: 'CodeRabbit', bucket: 'pass', state: 'SUCCESS' }]),
      unresolvedCount: 0,
      reviews: summarizeReviews([
        { author: { login: 'alice' }, body: 'ok', submittedAt: '2026-03-13T10:00:00Z', state: 'APPROVED' },
        { author: { login: 'bob' }, body: 'ok', submittedAt: '2026-03-13T11:00:00Z', state: 'APPROVED' },
      ]),
      codeRabbit: summarizeCodeRabbitStatus(
        { name: 'CodeRabbit', bucket: 'pass', state: 'SUCCESS' },
        [],
        [],
      ),
      minReviews: 2,
    });
    expect(readiness.status).toBe('ready');
    expect(readiness.reasons).toEqual([]);
    expect(computeMergeReadinessExitCode(readiness)).toBe(0);
  });
  it('blocks when GitHub still requires review or reports a non-mergeable state', () => {
    const readiness = computeMergeReadiness({
      pr: { state: 'OPEN', isDraft: false, reviewDecision: 'REVIEW_REQUIRED', mergeStateStatus: 'BLOCKED' },
      checks: summarizeChecks([{ name: 'CodeRabbit', bucket: 'pass', state: 'SUCCESS' }]),
      unresolvedCount: 0,
      reviews: summarizeReviews([
        { author: { login: 'alice' }, body: 'ok', submittedAt: '2026-03-13T10:00:00Z', state: 'APPROVED' },
        { author: { login: 'bob' }, body: 'ok', submittedAt: '2026-03-13T11:00:00Z', state: 'APPROVED' },
      ]),
      codeRabbit: summarizeCodeRabbitStatus(
        { name: 'CodeRabbit', bucket: 'pass', state: 'SUCCESS' },
        [],
        [],
      ),
      minReviews: 2,
    });
    expect(readiness.status).toBe('blocked');
    expect(readiness.reasons).toContain('review decision is review_required');
    expect(readiness.reasons).toContain('merge state is blocked');
  });
});

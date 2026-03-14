import { describe, expect, it } from 'vitest';
import {
  computeExitCode,
  computeMergeReadiness,
  computeMergeReadinessExitCode,
  extractUnresolvedFindings,
  summarizeChecks,
  summarizeCodeRabbitStatus,
  summarizeReviews,
} from './pr-review-status.js';

describe('summarizeChecks', () => {
  it('counts passing, pending, failing, canceled, and CodeRabbit checks', () => {
    const summary = summarizeChecks([
      { name: 'test (18)', bucket: 'pass', state: 'SUCCESS' },
      { name: 'CodeRabbit', bucket: 'pending', state: 'PENDING' },
      { name: 'lint', bucket: 'fail', state: 'FAILURE' },
      { name: 'test (22)', bucket: 'cancel', state: 'CANCELLED' },
    ]);

    expect(summary.counts.pass).toBe(1);
    expect(summary.counts.pending).toBe(1);
    expect(summary.counts.fail).toBe(1);
    expect(summary.counts.cancel).toBe(1);
    expect(summary.codeRabbit?.name).toBe('CodeRabbit');
    expect(summary.failing).toHaveLength(1);
    expect(summary.pending).toHaveLength(1);
    expect(summary.canceled).toHaveLength(1);
  });
});

describe('extractUnresolvedFindings', () => {
  it('keeps only unresolved review threads and extracts the first comment summary', () => {
    const findings = extractUnresolvedFindings([
      {
        isResolved: false,
        comments: {
          nodes: [{
            author: { login: 'coderabbitai' },
            body: '<!-- hidden -->\n\nHandle PTY shutdown race cleanly.',
            path: 'scripts/pty-driver.py',
            url: 'https://example.test/thread/1',
          }],
        },
      },
      {
        isResolved: false,
        comments: {
          nodes: [{
            author: null,
            body: 'Anonymous review comment.',
            path: null,
            url: 'https://example.test/thread/3',
          }],
        },
      },
      {
        isResolved: true,
        comments: {
          nodes: [{
            author: { login: 'reviewer' },
            body: 'already handled',
            path: 'scripts/smoke-canaries.ts',
            url: 'https://example.test/thread/2',
          }],
        },
      },
    ]);

    expect(findings).toEqual([{
      author: 'coderabbitai',
      path: 'scripts/pty-driver.py',
      summary: 'Handle PTY shutdown race cleanly.',
      url: 'https://example.test/thread/1',
    }, {
      author: '(unknown)',
      path: '(no file)',
      summary: 'Anonymous review comment.',
      url: 'https://example.test/thread/3',
    }]);
  });
});

describe('computeExitCode', () => {
  it('returns success only when checks and threads are clear', () => {
    const summary = summarizeChecks([{ name: 'test', bucket: 'pass', state: 'SUCCESS' }]);
    expect(computeExitCode(summary, 0)).toBe(0);
  });

  it('returns pending when only pending checks remain', () => {
    const summary = summarizeChecks([{ name: 'CodeRabbit', bucket: 'pending', state: 'PENDING' }]);
    expect(computeExitCode(summary, 0)).toBe(8);
  });

  it('returns failure for unresolved threads, failing checks, or canceled checks', () => {
    const passing = summarizeChecks([{ name: 'test', bucket: 'pass', state: 'SUCCESS' }]);
    const failing = summarizeChecks([{ name: 'lint', bucket: 'fail', state: 'FAILURE' }]);
    const canceled = summarizeChecks([{ name: 'test (22)', bucket: 'cancel', state: 'CANCELLED' }]);

    expect(computeExitCode(passing, 1)).toBe(1);
    expect(computeExitCode(failing, 0)).toBe(1);
    expect(computeExitCode(canceled, 0)).toBe(1);
  });
});

describe('summarizeReviews', () => {
  it('collapses to the latest non-automated review per reviewer for merge gating', () => {
    const summary = summarizeReviews([
      { author: { login: 'alice' }, body: 'needs work', submittedAt: '2026-03-13T09:00:00Z', state: 'CHANGES_REQUESTED' },
      { author: { login: 'alice' }, body: 'looks good', submittedAt: '2026-03-13T10:00:00Z', state: 'APPROVED' },
      { author: { login: 'bob' }, body: 'needs work', submittedAt: '2026-03-13T11:00:00Z', state: 'CHANGES_REQUESTED' },
      { author: { login: 'coderabbitai' }, body: 'notes', submittedAt: '2026-03-13T12:00:00Z', state: 'COMMENTED' },
      { author: { login: 'chatgpt-codex-connector' }, body: 'notes', submittedAt: '2026-03-13T12:30:00Z', state: 'COMMENTED' },
    ]);

    expect(summary).toEqual({
      total: 2,
      approvals: 1,
      changesRequested: 1,
      comments: 0,
      byState: {
        APPROVED: 1,
        CHANGES_REQUESTED: 1,
      },
    });
  });
});

describe('summarizeCodeRabbitStatus', () => {
  it('down-ranks stale rate-limit comments when a newer pass signal exists', () => {
    const status = summarizeCodeRabbitStatus(
      { name: 'CodeRabbit', bucket: 'pass', state: 'SUCCESS' },
      [{
        author: { login: 'coderabbitai' },
        body: 'Rate limit exceeded. Please wait 30m.',
        createdAt: '2026-03-13T10:00:00Z',
      }, {
        author: { login: 'coderabbitai' },
        body: 'No actionable comments were generated in the recent review. 🎉',
        createdAt: '2026-03-13T11:00:00Z',
      }],
      [],
    );

    expect(status.state).toBe('pass');
    expect(status.staleRateLimitCount).toBe(1);
    expect(status.activeRateLimitCount).toBe(0);
    expect(status.detail).toContain('stale rate-limit comment');
  });

  it('treats the latest active rate-limit signal as pending review work', () => {
    const status = summarizeCodeRabbitStatus(
      { name: 'CodeRabbit', bucket: 'pending', state: 'PENDING' },
      [{
        author: { login: 'coderabbitai' },
        body: 'Rate limit exceeded. Please wait 30m.',
        createdAt: '2026-03-13T12:00:00Z',
      }],
      [],
    );

    expect(status.state).toBe('rate_limited');
    expect(status.staleRateLimitCount).toBe(0);
    expect(status.activeRateLimitCount).toBe(1);
    expect(status.detail).toBe('rate-limited');
  });
});

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

import { describe, expect, it } from 'vitest';
import { summarizeReviews } from './pr-review-status.js';

describe('summarizeReviews', () => {
  it('collapses to the latest non-automated review per reviewer for merge gating', () => {
    const summary = summarizeReviews([
      { author: { login: 'alice' }, body: 'needs work', submittedAt: '2026-03-13T09:00:00Z', state: 'CHANGES_REQUESTED' },
      { author: { login: 'alice' }, body: 'looks good', submittedAt: '2026-03-13T10:00:00Z', state: 'APPROVED' },
      { author: { login: 'bob' }, body: 'needs work', submittedAt: '2026-03-13T11:00:00Z', state: 'CHANGES_REQUESTED' },
      { author: { login: 'carol' }, body: 'draft review', submittedAt: null, state: 'PENDING' },
      { author: { login: 'coderabbitai', __typename: 'Bot' }, body: 'notes', submittedAt: '2026-03-13T12:00:00Z', state: 'COMMENTED' },
      { author: { login: 'review-buddy', __typename: 'Bot' }, body: 'LGTM', submittedAt: '2026-03-13T12:30:00Z', state: 'APPROVED' },
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

import { describe, expect, it } from 'vitest';
import { assertUntruncatedPullRequestData } from './pr-review-status.js';

describe('assertUntruncatedPullRequestData', () => {
  it('passes when comment and review metadata fit in a single page', () => {
    expect(() => { assertUntruncatedPullRequestData({
      comments: { totalCount: 12, pageInfo: { hasNextPage: false } },
      reviews: { totalCount: 4, pageInfo: { hasNextPage: false } },
    }); }).not.toThrow();
  });
  it('fails fast when GitHub reports truncated comment or review metadata', () => {
    expect(() => { assertUntruncatedPullRequestData({
      comments: { totalCount: 101, pageInfo: { hasNextPage: true } },
      reviews: { totalCount: 4, pageInfo: { hasNextPage: false } },
    }); }).toThrow('pull request metadata truncated; pagination required for comments=101');
  });
  it('fails fast when review thread metadata is truncated', () => {
    expect(() => { assertUntruncatedPullRequestData({
      reviewThreads: { totalCount: 101, pageInfo: { hasNextPage: true } },
    }); }).toThrow('pull request metadata truncated; pagination required for reviewThreads=101');
  });
});

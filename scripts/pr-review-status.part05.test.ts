import { describe, expect, it } from 'vitest';
import { summarizeCodeRabbitStatus } from './pr-review-status.js';

describe('summarizeCodeRabbitStatus', () => {
  it('accepts CodeRabbit bot login variants when collecting events', () => {
    const status = summarizeCodeRabbitStatus(
      null,
      [{
        author: { login: 'coderabbitai[bot]', __typename: 'Bot' },
        body: 'No actionable comments were generated in the recent review. 🎉',
        createdAt: '2026-03-13T12:00:00Z',
      }],
      [],
    );

    expect(status.state).toBe('clean');
    expect(status.latestKind).toBe('clean');
  });

  it('prefers a live pending check over older clean history', () => {
    const status = summarizeCodeRabbitStatus(
      { name: 'CodeRabbit', bucket: 'pending', state: 'PENDING' },
      [{
        author: { login: 'coderabbitai' },
        body: 'No actionable comments were generated in the recent review. 🎉',
        createdAt: '2026-03-13T10:00:00Z',
      }],
      [],
    );

    expect(status.state).toBe('pending');
    expect(status.detail).toBe('pending');
    expect(status.staleRateLimitCount).toBe(0);
    expect(status.activeRateLimitCount).toBe(0);
  });

  it('ignores pending draft reviews without submitted timestamps', () => {
    const status = summarizeCodeRabbitStatus(
      null,
      [],
      [{
        author: { login: 'coderabbitai', __typename: 'Bot' },
        body: 'draft review',
        submittedAt: null,
        state: 'PENDING',
      }],
    );

    expect(status.state).toBe('missing');
    expect(status.latestKind).toBe('none');
  });

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

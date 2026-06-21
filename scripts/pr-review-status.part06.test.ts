import { describe, expect, it } from 'vitest';
import { mergeReadinessHeading } from './pr-review-status.js';

describe('mergeReadinessHeading', () => {
  it('uses a pending-specific heading for pending-only states', () => {
    expect(mergeReadinessHeading({ status: 'pending', reasons: ['1 pending check'] })).toBe('Pending merge signals');
    expect(mergeReadinessHeading({ status: 'blocked', reasons: ['1 failing check'] })).toBe('Merge blockers');
  });
});

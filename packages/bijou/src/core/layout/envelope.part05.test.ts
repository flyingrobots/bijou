import { describe, expect, it } from 'vitest';
import { assignLayoutChild, defineLayoutEnvelope, isResolvedLayoutEnvelope, layoutConstraints, layoutPreference } from './envelope.js';

describe('parent-owned measurement and assignment', () => {
  it('does not let child preference force parent assignment', () => {
    const child = defineLayoutEnvelope({
      id: 'docs.nav',
      role: 'navigation',
      constraints: layoutConstraints({ maxInline: 120, maxBlock: 24 }),
      preference: layoutPreference({
        minInline: 12,
        preferredInline: 999,
        maxInline: 'unbounded',
        preferredBlock: 24,
      }),
    });

    const assigned = assignLayoutChild(
      child,
      { inlineStart: 0, blockStart: 0, inlineSize: 24, blockSize: 24 },
      'parent fixed track wins over preferred inline size',
    );

    expect(assigned.preference.preferredInline).toBe(999);
    expect(assigned.assigned.inlineSize).toBe(24);
    expect(assigned.reason).toBe('parent fixed track wins over preferred inline size');
    expect(isResolvedLayoutEnvelope(assigned)).toBe(true);
  });
});

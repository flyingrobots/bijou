import { describe, expect, it } from 'vitest';
import { defineLayoutEnvelope, isResolvedLayoutEnvelope, layoutConstraints, layoutPreference } from './envelope.js';

describe('layout envelope facts', () => {
  it('normalizes layout facts', () => {
    const envelope = defineLayoutEnvelope({
      id: ' docs.content ',
      role: ' viewport ',
      direction: 'rtl',
      constraints: layoutConstraints({
        minInline: 0,
        maxInline: 96,
        minBlock: 6,
        maxBlock: 'unbounded',
      }),
      preference: layoutPreference({
        minInline: 32,
        preferredInline: 72,
        maxInline: 'unbounded',
        minBlock: 6,
        preferredBlock: 18,
        maxBlock: 24,
      }),
      fit: 'clip',
    });

    expect(envelope.id).toBe('docs.content');
    expect(envelope.role).toBe('viewport');
    expect(envelope.direction).toBe('rtl');
    expect(envelope.constraints).toEqual({
      minInline: 0,
      maxInline: 96,
      minBlock: 6,
      maxBlock: 'unbounded',
    });
    expect(envelope.preference.preferredInline).toBe(72);
    expect(envelope.fit).toBe('clip');
    expect(isResolvedLayoutEnvelope(envelope)).toBe(false);
    expect(isResolvedLayoutEnvelope({ ...envelope, assigned: null, reason: 'malformed' })).toBe(false);
    expect(Object.isFrozen(envelope)).toBe(true);
    expect(Object.isFrozen(envelope.constraints)).toBe(true);
    expect(Object.isFrozen(envelope.preference)).toBe(true);
  });
});

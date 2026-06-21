import { describe, expect, it } from 'vitest';
import { defineLayoutEnvelope, layoutConstraints, layoutPreference, resolveStackLayout } from './envelope.js';

describe('stack layout', () => {
  it('assigns fixed and flexible tracks with gaps deterministically', () => {
    const resolved = resolveStackLayout({
      id: 'docs.shell',
      role: 'shell',
      axis: 'inline',
      direction: 'ltr',
      rect: { inlineStart: 0, blockStart: 0, inlineSize: 96, blockSize: 24 },
      gap: 1,
      children: [
        {
          envelope: defineLayoutEnvelope({
            id: 'docs.nav',
            role: 'navigation',
            constraints: layoutConstraints({ maxInline: 96, maxBlock: 24 }),
            preference: layoutPreference({ preferredInline: 24, preferredBlock: 24 }),
          }),
          track: { kind: 'fixed', size: 24 },
        },
        {
          envelope: defineLayoutEnvelope({
            id: 'docs.content',
            role: 'viewport',
            constraints: layoutConstraints({ maxInline: 96, maxBlock: 24 }),
            preference: layoutPreference({ minInline: 32, preferredInline: 72, preferredBlock: 24 }),
          }),
          track: { kind: 'flex', weight: 1 },
        },
        {
          envelope: defineLayoutEnvelope({
            id: 'docs.inspector',
            role: 'inspector',
            constraints: layoutConstraints({ maxInline: 96, maxBlock: 24 }),
            preference: layoutPreference({ preferredInline: 18, preferredBlock: 24 }),
          }),
          track: { kind: 'fixed', size: 18 },
        },
      ],
    });

    expect(resolved.children.map((child) => child.assigned)).toEqual([
      { inlineStart: 0, blockStart: 0, inlineSize: 24, blockSize: 24 },
      { inlineStart: 25, blockStart: 0, inlineSize: 52, blockSize: 24 },
      { inlineStart: 78, blockStart: 0, inlineSize: 18, blockSize: 24 },
    ]);
    expect(resolved.children[1]?.reason).toContain('stack inline flex track');
  });

  it('distributes leftover flexible cells with a stable source-order policy', () => {
    const child = (id: string) => ({
      envelope: defineLayoutEnvelope({
        id,
        role: 'pane',
        constraints: layoutConstraints({ maxInline: 5, maxBlock: 1 }),
        preference: layoutPreference({ preferredInline: 1, preferredBlock: 1 }),
      }),
      track: { kind: 'flex' as const },
    });

    const resolved = resolveStackLayout({
      id: 'rounding',
      role: 'test',
      axis: 'inline',
      rect: { inlineStart: 0, blockStart: 0, inlineSize: 5, blockSize: 1 },
      children: [child('a'), child('b'), child('c')],
    });

    expect(resolved.roundingPolicy).toBe('largest-remainder-source-order');
    expect(resolved.children.map((item) => item.assigned.inlineSize)).toEqual([2, 2, 1]);
  });
});

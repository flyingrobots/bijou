import { describe, expect, it } from 'vitest';
import { defineLayoutEnvelope, layoutConstraints, layoutPreference, placeInRect } from './envelope.js';

describe('place layout', () => {
  it('aligns children at logical start, center, end, and stretch', () => {
    const child = defineLayoutEnvelope({
      id: 'docs.badge',
      role: 'status',
      constraints: layoutConstraints({ maxInline: 20, maxBlock: 10 }),
      preference: layoutPreference({ preferredInline: 4, preferredBlock: 2 }),
    });

    expect(placeInRect({
      envelope: child,
      direction: 'ltr',
      parent: { inlineStart: 2, blockStart: 3, inlineSize: 20, blockSize: 10 },
      size: { inlineSize: 4, blockSize: 2 },
      inlineAlign: 'start',
      blockAlign: 'start',
    }).assigned).toEqual({ inlineStart: 2, blockStart: 3, inlineSize: 4, blockSize: 2 });

    expect(placeInRect({
      envelope: child,
      direction: 'ltr',
      parent: { inlineStart: 2, blockStart: 3, inlineSize: 20, blockSize: 10 },
      size: { inlineSize: 4, blockSize: 2 },
      inlineAlign: 'center',
      blockAlign: 'center',
    }).assigned).toEqual({ inlineStart: 10, blockStart: 7, inlineSize: 4, blockSize: 2 });

    expect(placeInRect({
      envelope: child,
      direction: 'ltr',
      parent: { inlineStart: 2, blockStart: 3, inlineSize: 20, blockSize: 10 },
      size: { inlineSize: 4, blockSize: 2 },
      inlineAlign: 'end',
      blockAlign: 'end',
    }).assigned).toEqual({ inlineStart: 18, blockStart: 11, inlineSize: 4, blockSize: 2 });

    expect(placeInRect({
      envelope: child,
      direction: 'ltr',
      parent: { inlineStart: 2, blockStart: 3, inlineSize: 20, blockSize: 10 },
      size: { inlineSize: 4, blockSize: 2 },
      inlineAlign: 'stretch',
      blockAlign: 'stretch',
    }).assigned).toEqual({ inlineStart: 2, blockStart: 3, inlineSize: 20, blockSize: 10 });
  });

  it('flips inline start and end under RTL without changing source order', () => {
    const child = defineLayoutEnvelope({
      id: 'docs.action',
      role: 'button',
      constraints: layoutConstraints({ maxInline: 20, maxBlock: 1 }),
      preference: layoutPreference({ preferredInline: 4, preferredBlock: 1 }),
    });

    expect(placeInRect({
      envelope: child,
      direction: 'rtl',
      parent: { inlineStart: 0, blockStart: 0, inlineSize: 20, blockSize: 1 },
      size: { inlineSize: 4, blockSize: 1 },
      inlineAlign: 'start',
      blockAlign: 'start',
    }).assigned.inlineStart).toBe(16);

    expect(placeInRect({
      envelope: child,
      direction: 'rtl',
      parent: { inlineStart: 0, blockStart: 0, inlineSize: 20, blockSize: 1 },
      size: { inlineSize: 4, blockSize: 1 },
      inlineAlign: 'end',
      blockAlign: 'start',
    }).assigned.inlineStart).toBe(0);
  });
});

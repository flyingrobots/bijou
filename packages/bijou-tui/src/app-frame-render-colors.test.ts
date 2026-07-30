import { createSurface } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import {
  deriveActiveHeaderTabToken,
  paintActiveHeaderTab,
} from './app-frame-render-colors.js';

describe('deriveActiveHeaderTabToken', () => {
  it('reuses identical theme derivations and invalidates color changes', () => {
    const ctx = createTestContext();
    const first = deriveActiveHeaderTabToken(ctx, '#111111', '#eeeeee');
    const repeated = deriveActiveHeaderTabToken(ctx, '#111111', '#eeeeee');
    const changed = deriveActiveHeaderTabToken(ctx, '#222222', '#eeeeee');

    expect(repeated).toBe(first);
    expect(changed).not.toBe(first);
  });
});

describe('paintActiveHeaderTab', () => {
  it('preserves an RGB-only cell background when the token has none', () => {
    const surface = createSurface(1, 1, {
      char: 'A',
      bgRGB: [17, 34, 51],
      empty: false,
    });

    paintActiveHeaderTab(
      surface,
      [{ pageId: 'home', startCol: 0, endCol: 0 }],
      'home',
      createTestContext(),
      { hex: '#ffffff' },
    );

    expect(surface.get(0, 0).bgRGB).toEqual([17, 34, 51]);
  });
});

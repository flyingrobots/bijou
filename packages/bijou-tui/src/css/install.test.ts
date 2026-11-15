import { describe, expect, it } from 'vitest';
import { BIJOU_DARK, BIJOU_LIGHT, cloneContextWithTheme } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { installBCSSResolver } from './install.js';

const SHEET = 'FrameHeader { background: var(surface.elevated); }';

describe('installBCSSResolver', () => {
  it('resolves var() against the theme of the context it is called on, including theme clones', () => {
    const base = createTestContext({ theme: BIJOU_DARK });
    installBCSSResolver(base, SHEET);
    const light = cloneContextWithTheme(base, BIJOU_LIGHT);

    // Oracle: each context's own surface token; `background` takes the surface's background colour.
    expect(base.resolveBCSS({ type: 'FrameHeader' })['background']).toBe(base.surface('elevated').bg);
    expect(light.resolveBCSS({ type: 'FrameHeader' })['background']).toBe(light.surface('elevated').bg);
  });

  it('gives the two themes different elevated surfaces, so the clone check above can fail', () => {
    const base = createTestContext({ theme: BIJOU_DARK });
    const light = cloneContextWithTheme(base, BIJOU_LIGHT);
    expect(light.surface('elevated').bg).not.toBe(base.surface('elevated').bg);
  });

  it('keeps the text colour for color: var() of a surface token', () => {
    const ctx = createTestContext({ theme: BIJOU_DARK });
    installBCSSResolver(ctx, 'FrameHeader { color: var(surface.elevated); }');
    // Oracle: a surface token's foreground is its text colour.
    expect(ctx.resolveBCSS({ type: 'FrameHeader' })['color']).toBe(ctx.surface('elevated').hex);
  });
});

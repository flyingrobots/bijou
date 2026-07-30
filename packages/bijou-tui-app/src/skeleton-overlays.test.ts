import { describe, expect, it } from 'vitest';
import { resolveQuitModalWidth } from './skeleton-overlays.js';

describe('resolveQuitModalWidth', () => {
  it('never returns a negative width for a visible terminal', () => {
    expect(resolveQuitModalWidth(1)).toBe(0);
  });

  it('preserves the established modal sizing at usable widths', () => {
    expect(resolveQuitModalWidth(80)).toBe(56);
    expect(resolveQuitModalWidth(24)).toBe(20);
  });
});

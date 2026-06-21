import { describe, expect, it } from 'vitest';
import { assignLayoutChild, defineLayoutEnvelope, layoutConstraints, layoutPreference, renderWithResolvedLayout } from './envelope.js';

describe('render-facing layout seam', () => {
  it('rejects visible render input without an assigned layout envelope', () => {
    const envelope = defineLayoutEnvelope({
      id: 'docs.reader',
      role: 'region',
      constraints: layoutConstraints({ maxInline: 80, maxBlock: 24 }),
      preference: layoutPreference({ preferredInline: 72, preferredBlock: 18 }),
    });

    expect(() => renderWithResolvedLayout(envelope, () => 'unreachable')).toThrow(
      'layout render seam: visible node docs.reader requires an assigned layout envelope',
    );
  });
  it('passes assignment to the renderer', () => {
    const envelope = assignLayoutChild(
      defineLayoutEnvelope({
        id: 'docs.reader',
        role: 'region',
        constraints: layoutConstraints({ maxInline: 80, maxBlock: 24 }),
        preference: layoutPreference({ preferredInline: 72, preferredBlock: 18 }),
      }),
      { inlineStart: 24, blockStart: 1, inlineSize: 52, blockSize: 22 },
      'parent assigned remaining space',
    );

    const rendered = renderWithResolvedLayout(envelope, ({ assigned }) => {
      return `paint ${[assigned.inlineStart, assigned.blockStart, assigned.inlineSize, assigned.blockSize].join(':')}`;
    });

    expect(rendered.output).toBe('paint 24:1:52:22');
    expect(rendered.assigned).toEqual({
      inlineStart: 24,
      blockStart: 1,
      inlineSize: 52,
      blockSize: 22,
    });
    expect(Object.isFrozen(rendered)).toBe(true);
  });
});

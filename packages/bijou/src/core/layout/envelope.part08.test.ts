import { describe, expect, it } from 'vitest';
import { assignLayoutChild, defineLayoutEnvelope, layoutConstraints, layoutExplanationFacts, layoutExplanationText, layoutPreference } from './envelope.js';

describe('layout explanation facts', () => {
  it('explains resolved layout without rendering strings or ANSI output', () => {
    const resolved = assignLayoutChild(
      defineLayoutEnvelope({
        id: 'docs.content',
        role: 'viewport',
        direction: 'ltr',
        constraints: layoutConstraints({ minInline: 0, maxInline: 96, minBlock: 0, maxBlock: 24 }),
        preference: layoutPreference({
          minInline: 32,
          preferredInline: 72,
          maxInline: 'unbounded',
          minBlock: 6,
          preferredBlock: 18,
          maxBlock: 'unbounded',
        }),
      }),
      { inlineStart: 24, blockStart: 1, inlineSize: 72, blockSize: 22 },
      'took remaining inline space in stack after fixed nav and status chrome',
    );

    expect(layoutExplanationFacts(resolved)).toEqual([
      { kind: 'layout', key: 'node.id', value: 'docs.content' },
      { kind: 'layout', key: 'role', value: 'viewport' },
      { kind: 'layout', key: 'direction', value: 'ltr' },
      { kind: 'layout', key: 'constraints.inline', value: '0..96' },
      { kind: 'layout', key: 'constraints.block', value: '0..24' },
      { kind: 'layout', key: 'preference.inline', value: 'min 32 preferred 72 max unbounded' },
      { kind: 'layout', key: 'preference.block', value: 'min 6 preferred 18 max unbounded' },
      { kind: 'layout', key: 'assigned', value: 'inline-start 24 block-start 1 inline-size 72 block-size 22' },
      {
        kind: 'layout',
        key: 'reason',
        value: 'took remaining inline space in stack after fixed nav and status chrome',
      },
    ]);
    expect(layoutExplanationText(resolved)).toContain('node docs.content');
    expect(layoutExplanationText(resolved)).not.toContain('\u001b[');
  });
});

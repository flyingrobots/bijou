import { describe, expect, it } from 'vitest';
import {
  createFixturePromotionRecord,
  fixturePromotionText,
  reverseFixturePromotionRecord,
} from './fixture-promotion.js';

describe('fixture promotion path', () => {
  it('creates deterministic fixture-to-docs promotion records', () => {
    const record = createFixturePromotionRecord({
      id: 'alert-basic-docs',
      from: { kind: 'fixture', path: 'packages/bijou/src/core/components/alert.test.ts', label: 'basic alert test' },
      to: { kind: 'docs', path: 'packages/bijou/README.md#status-and-feedback', label: 'README alert docs' },
      metadata: {
        packageName: '@flyingrobots/bijou',
        componentName: 'alert',
        family: 'status-feedback',
        modes: ['interactive', 'pipe'],
        docs: { summary: 'Persistent in-flow message.' },
      },
      matrix: {
        storyId: 'alert',
        profiles: [],
        variants: [],
        captures: [],
        missingModes: [],
      },
      tags: ['docs', 'regression', 'docs'],
      notes: ['Keep the README example aligned with the basic alert fixture.'],
    });

    expect(record.tags).toEqual(['docs', 'regression']);
    expect(fixturePromotionText(record)).toBe([
      'fixture promotion: alert-basic-docs',
      'from=fixture packages/bijou/src/core/components/alert.test.ts (basic alert test)',
      'to=docs packages/bijou/README.md#status-and-feedback (README alert docs)',
      'component=@flyingrobots/bijou/alert',
      'matrix=alert',
      'tags=docs,regression',
      'notes:',
      '- Keep the README example aligned with the basic alert fixture.',
    ].join('\n'));
  });

  it('reverses promotion direction while preserving provenance', () => {
    const record = createFixturePromotionRecord({
      id: 'alert-docs-fixture',
      from: { kind: 'docs', path: 'packages/bijou/README.md#alert' },
      to: { kind: 'fixture', path: 'packages/bijou/src/core/components/alert.test.ts' },
      tags: ['regression'],
    });

    const reversed = reverseFixturePromotionRecord(record, { id: 'alert-fixture-docs' });

    expect(reversed.id).toBe('alert-fixture-docs');
    expect(reversed.from).toEqual(record.to);
    expect(reversed.to).toEqual(record.from);
    expect(reversed.tags).toEqual(['regression']);
  });
});

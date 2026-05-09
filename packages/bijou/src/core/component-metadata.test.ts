import { describe, expect, it } from 'vitest';
import {
  componentMetadataReportText,
  componentMetadataSummary,
  defineComponentMetadata,
  validateComponentMetadata,
} from './component-metadata.js';

describe('component metadata contract', () => {
  it('validates and summarizes component metadata', () => {
    const metadata = defineComponentMetadata({
      packageName: '@flyingrobots/bijou',
      componentName: 'alert',
      family: 'status-feedback',
      modes: ['interactive', 'static', 'pipe', 'accessible'],
      sourcePath: 'packages/bijou/src/core/components/alert.ts',
      docs: {
        summary: 'Persistent in-flow message with severity.',
        useWhen: ['A state needs explanation.'],
        avoidWhen: ['The message should disappear automatically.'],
        relatedDocs: ['packages/bijou/README.md'],
      },
      args: [
        { name: 'variant', type: 'AlertVariant', required: true },
        { name: 'ctx', type: 'BijouContext', required: false },
      ],
      variants: [
        {
          id: 'warning',
          label: 'Warning',
          facts: [{ kind: 'state', key: 'severity', value: 'warning' }],
        },
      ],
      invariants: [
        {
          id: 'message-survives-lowering',
          description: 'Message text remains present in pipe and accessible modes.',
          facts: [{ kind: 'label', key: 'message' }],
        },
      ],
      examples: [
        {
          id: 'basic',
          label: 'Basic alert',
          path: 'examples/alert-basic.ts',
        },
      ],
    });

    expect(validateComponentMetadata(metadata).issues).toEqual([]);
    expect(componentMetadataSummary(metadata)).toBe([
      'component metadata: @flyingrobots/bijou/alert',
      'family=status-feedback',
      'modes=interactive,static,pipe,accessible',
      'args=variant,ctx',
      'variants=warning',
      'invariants=message-survives-lowering',
      'examples=basic',
      'source=packages/bijou/src/core/components/alert.ts',
    ].join('\n'));
  });

  it('reports missing fields, empty modes, and duplicate ids deterministically', () => {
    const report = validateComponentMetadata({
      packageName: '',
      componentName: '   ',
      family: 'status-feedback',
      modes: ['pipe', 'pipe'],
      docs: {
        summary: '',
      },
      args: [
        { name: 'variant', type: 'AlertVariant' },
        { name: 'variant', type: 'AlertVariant' },
      ],
      variants: [
        { id: 'warning', label: 'Warning' },
        { id: 'warning', label: 'Warning duplicate' },
      ],
      invariants: [
        { id: '', description: '' },
      ],
      examples: [
        { id: 'basic', label: 'Basic' },
        { id: 'basic', label: 'Basic duplicate' },
      ],
    });

    expect(report.passed).toBe(false);
    expect(report.issues.map((issue) => issue.path)).toEqual([
      'packageName',
      'componentName',
      'docs.summary',
      'modes[1]',
      'args[1].name',
      'variants[1].id',
      'invariants[0].id',
      'invariants[0].description',
      'examples[1].id',
    ]);
    expect(componentMetadataReportText(report)).toContain('- error duplicate-id path=variants[1].id: duplicate variant id warning');
  });

  it('throws on invalid metadata when defining authoring metadata', () => {
    expect(() => defineComponentMetadata({
      packageName: '@flyingrobots/bijou',
      componentName: 'alert',
      family: '',
      modes: [],
      docs: { summary: 'Alert docs.' },
    })).toThrow('component metadata: failed');
  });
});

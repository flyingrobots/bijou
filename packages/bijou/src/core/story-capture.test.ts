import { describe, expect, it } from 'vitest';
import {
  captureStoryMatrix,
  storyCaptureMatrixText,
} from './story-capture.js';

describe('story capture matrix', () => {
  it('captures every profile and variant combination', () => {
    const calls: string[] = [];
    const matrix = captureStoryMatrix({
      storyId: 'alert',
      title: 'Alert',
      metadata: {
        packageName: '@flyingrobots/bijou',
        componentName: 'alert',
        family: 'status-feedback',
        modes: ['interactive', 'pipe'],
        docs: { summary: 'Persistent in-flow message.' },
      },
      profiles: [
        { id: 'rich', label: 'Rich', mode: 'interactive', width: 80 },
        { id: 'pipe', label: 'Pipe', mode: 'pipe', width: 80 },
      ],
      variants: [
        { id: 'info', label: 'Info' },
        { id: 'warning', label: 'Warning' },
      ],
      requiredModes: ['interactive', 'static', 'pipe', 'accessible'],
      render(input) {
        calls.push(`${input.profile.id}:${input.variant.id}`);
        return `${input.variant.label} in ${input.profile.mode}`;
      },
    });

    expect(calls).toEqual(['rich:info', 'rich:warning', 'pipe:info', 'pipe:warning']);
    expect(matrix.captures.map((capture) => capture.output)).toEqual([
      'Info in interactive',
      'Warning in interactive',
      'Info in pipe',
      'Warning in pipe',
    ]);
    expect(matrix.missingModes).toEqual(['static', 'accessible']);
    expect(matrix.metadata?.componentName).toBe('alert');
  });

  it('renders deterministic matrix text grouped by variant and profile', () => {
    const matrix = captureStoryMatrix({
      storyId: 'status',
      profiles: [
        { id: 'rich', label: 'Rich', mode: 'interactive', width: 40 },
        { id: 'a11y', label: 'Accessible', mode: 'accessible', width: 40 },
      ],
      variants: [
        { id: 'ok', label: 'OK' },
      ],
      requiredModes: ['interactive', 'accessible'],
      render(input) {
        return `${input.variant.id}:${input.profile.mode}`;
      },
    });

    expect(storyCaptureMatrixText(matrix)).toBe([
      'story capture matrix: status profiles=rich,a11y variants=ok',
      'missingModes=-',
      'variant ok (OK)',
      '[rich interactive width=40]',
      'ok:interactive',
      '[a11y accessible width=40]',
      'ok:accessible',
    ].join('\n'));
  });
});

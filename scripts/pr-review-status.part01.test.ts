import { describe, expect, it } from 'vitest';
import { summarizeChecks } from './pr-review-status.js';

describe('summarizeChecks', () => {
  it('counts passing, pending, failing, canceled, and CodeRabbit checks', () => {
    const summary = summarizeChecks([
      { name: 'test (18)', bucket: 'pass', state: 'SUCCESS' },
      { name: 'CodeRabbit', bucket: 'pending', state: 'PENDING' },
      { name: 'lint', bucket: 'fail', state: 'FAILURE' },
      { name: 'test (22)', bucket: 'cancel', state: 'CANCELLED' },
    ]);

    expect(summary.counts.pass).toBe(1);
    expect(summary.counts.pending).toBe(1);
    expect(summary.counts.fail).toBe(1);
    expect(summary.counts.cancel).toBe(1);
    expect(summary.codeRabbit?.name).toBe('CodeRabbit');
    expect(summary.failing).toHaveLength(1);
    expect(summary.pending).toHaveLength(1);
    expect(summary.canceled).toHaveLength(1);
  });
});

import { describe, expect, it } from 'vitest';
import { computeExitCode, summarizeChecks } from './pr-review-status.js';

describe('computeExitCode', () => {
  it('returns success only when checks and threads are clear', () => {
    const summary = summarizeChecks([{ name: 'test', bucket: 'pass', state: 'SUCCESS' }]);
    expect(computeExitCode(summary, 0)).toBe(0);
  });

  it('returns pending when only pending checks remain', () => {
    const summary = summarizeChecks([{ name: 'CodeRabbit', bucket: 'pending', state: 'PENDING' }]);
    expect(computeExitCode(summary, 0)).toBe(8);
  });

  it('returns failure for unresolved threads, failing checks, or canceled checks', () => {
    const passing = summarizeChecks([{ name: 'test', bucket: 'pass', state: 'SUCCESS' }]);
    const failing = summarizeChecks([{ name: 'lint', bucket: 'fail', state: 'FAILURE' }]);
    const canceled = summarizeChecks([{ name: 'test (22)', bucket: 'cancel', state: 'CANCELLED' }]);

    expect(computeExitCode(passing, 1)).toBe(1);
    expect(computeExitCode(failing, 0)).toBe(1);
    expect(computeExitCode(canceled, 0)).toBe(1);
  });
});

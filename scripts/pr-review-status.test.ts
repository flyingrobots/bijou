import { describe, expect, it } from 'vitest';
import { computeExitCode, extractUnresolvedFindings, summarizeChecks } from './pr-review-status.js';

describe('summarizeChecks', () => {
  it('counts passing, pending, failing, and CodeRabbit checks', () => {
    const summary = summarizeChecks([
      { name: 'test (18)', bucket: 'pass', state: 'SUCCESS' },
      { name: 'CodeRabbit', bucket: 'pending', state: 'PENDING' },
      { name: 'lint', bucket: 'fail', state: 'FAILURE' },
    ]);

    expect(summary.counts.pass).toBe(1);
    expect(summary.counts.pending).toBe(1);
    expect(summary.counts.fail).toBe(1);
    expect(summary.codeRabbit?.name).toBe('CodeRabbit');
    expect(summary.failing).toHaveLength(1);
    expect(summary.pending).toHaveLength(1);
  });
});

describe('extractUnresolvedFindings', () => {
  it('keeps only unresolved review threads and extracts the first comment summary', () => {
    const findings = extractUnresolvedFindings([
      {
        isResolved: false,
        comments: {
          nodes: [{
            author: { login: 'coderabbitai' },
            body: '<!-- hidden -->\n\nHandle PTY shutdown race cleanly.',
            path: 'scripts/pty-driver.py',
            url: 'https://example.test/thread/1',
          }],
        },
      },
      {
        isResolved: true,
        comments: {
          nodes: [{
            author: { login: 'reviewer' },
            body: 'already handled',
            path: 'scripts/smoke-canaries.ts',
            url: 'https://example.test/thread/2',
          }],
        },
      },
    ]);

    expect(findings).toEqual([{
      author: 'coderabbitai',
      path: 'scripts/pty-driver.py',
      summary: 'Handle PTY shutdown race cleanly.',
      url: 'https://example.test/thread/1',
    }]);
  });
});

describe('computeExitCode', () => {
  it('returns success only when checks and threads are clear', () => {
    const summary = summarizeChecks([{ name: 'test', bucket: 'pass', state: 'SUCCESS' }]);
    expect(computeExitCode(summary, 0)).toBe(0);
  });

  it('returns pending when only pending checks remain', () => {
    const summary = summarizeChecks([{ name: 'CodeRabbit', bucket: 'pending', state: 'PENDING' }]);
    expect(computeExitCode(summary, 0)).toBe(8);
  });

  it('returns failure for unresolved threads or failing checks', () => {
    const passing = summarizeChecks([{ name: 'test', bucket: 'pass', state: 'SUCCESS' }]);
    const failing = summarizeChecks([{ name: 'lint', bucket: 'fail', state: 'FAILURE' }]);

    expect(computeExitCode(passing, 1)).toBe(1);
    expect(computeExitCode(failing, 0)).toBe(1);
  });
});

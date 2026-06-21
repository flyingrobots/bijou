import { describe, expect, it } from 'vitest';
import { extractUnresolvedFindings } from './pr-review-status.js';

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
        isResolved: false,
        comments: {
          nodes: [{
            author: null,
            body: 'Anonymous review comment.',
            path: null,
            url: 'https://example.test/thread/3',
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
    }, {
      author: '(unknown)',
      path: '(no file)',
      summary: 'Anonymous review comment.',
      url: 'https://example.test/thread/3',
    }]);
  });
});

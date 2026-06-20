import { describe, expect, it } from 'vitest';
import { GH_EXEC_OPTIONS } from './pr-review-status-parse.js';

describe('GH_EXEC_OPTIONS', () => {
  it('bounds gh subprocess execution for CI safety', () => {
    expect(GH_EXEC_OPTIONS.timeout).toBe(30_000);
    expect(GH_EXEC_OPTIONS.maxBuffer).toBe(2 * 1024 * 1024);
    expect(GH_EXEC_OPTIONS.encoding).toBe('utf8');
    expect(GH_EXEC_OPTIONS.env?.GH_PAGER).toBe('cat');
  });
});

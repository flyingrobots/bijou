import { describe, it, expect } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { formatFormTitle } from './form-utils.js';

describe('formatFormTitle', () => {
  it('returns ? title when noColor: true', () => {
    const ctx = createTestContext({ noColor: true });
    expect(formatFormTitle('Name', ctx)).toBe('? Name');
  });

  it('returns ? title when mode: accessible', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(formatFormTitle('Name', ctx)).toBe('? Name');
  });

  it('returns styled ? title in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = formatFormTitle('Name', ctx);
    expect(result).toContain('?');
    expect(result).toContain('Name');
  });

  it('handles empty string title', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = formatFormTitle('', ctx);
    expect(result).toContain('?');
  });
});

import { describe, it, expect } from 'vitest';
import { box, headerBox } from './box.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('defensive input handling', () => {
  it('handles null/undefined content gracefully', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(Reflect.apply(box, undefined, [null, { ctx }])).toBe('');
    expect(Reflect.apply(box, undefined, [undefined, { ctx }])).toBe('');
  });
  it('handles null/undefined label in headerBox gracefully', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(Reflect.apply(headerBox, undefined, [null, { ctx }])).toBe('');
    expect(Reflect.apply(headerBox, undefined, [undefined, { ctx }])).toBe('');
  });
});

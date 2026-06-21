import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { flex } from './flex.js';

// ---------------------------------------------------------------------------
// Background token
// ---------------------------------------------------------------------------
describe('background token', () => {
  it('container bgToken does not crash with plainStyle ctx', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const token = { hex: '#ffffff', bg: '#003366' };
    const result = flex(
      { direction: 'row', width: 20, height: 2, gap: 2, bgToken: token, ctx },
      { basis: 5, content: 'A' },
      { basis: 5, content: 'B' },
    );
    // plainStyle is identity, so output should contain A and B
    expect(result).toContain('A');
    expect(result).toContain('B');
  });
  it('child bgToken does not crash with plainStyle ctx', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const token = { hex: '#ffffff', bg: '#003366' };
    const result = flex(
      { direction: 'row', width: 20, height: 2, ctx },
      { basis: 10, bgToken: token, content: 'filled' },
      { basis: 10, content: 'plain' },
    );
    expect(result).toContain('filled');
    expect(result).toContain('plain');
  });
  it('bgToken without ctx is no-op (strict equality)', () => {
    const token = { hex: '#ffffff', bg: '#003366' };
    const withToken = flex(
      { direction: 'row', width: 20, height: 2, bgToken: token },
      { basis: 10, content: 'hello' },
    );
    const withoutToken = flex(
      { direction: 'row', width: 20, height: 2 },
      { basis: 10, content: 'hello' },
    );
    expect(withToken).toBe(withoutToken);
  });
  it('bgToken with noColor is no-op (strict equality)', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const token = { hex: '#ffffff', bg: '#003366' };
    const withToken = flex(
      { direction: 'row', width: 20, height: 2, bgToken: token, ctx },
      { basis: 10, content: 'hello' },
    );
    const withoutToken = flex(
      { direction: 'row', width: 20, height: 2, ctx },
      { basis: 10, content: 'hello' },
    );
    expect(withToken).toBe(withoutToken);
  });
});

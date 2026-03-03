import { describe, it, expect } from 'vitest';
import { shouldApplyBg, makeBgFill } from './bg-fill.js';
import { createTestContext } from '../adapters/test/index.js';

describe('shouldApplyBg', () => {
  it('returns true for interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(shouldApplyBg(ctx)).toBe(true);
  });

  it('returns true for static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    expect(shouldApplyBg(ctx)).toBe(true);
  });

  it('returns false for pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(shouldApplyBg(ctx)).toBe(false);
  });

  it('returns false for accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(shouldApplyBg(ctx)).toBe(false);
  });

  it('returns false when noColor is true', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    expect(shouldApplyBg(ctx)).toBe(false);
  });

  it('returns false when ctx is undefined', () => {
    expect(shouldApplyBg(undefined)).toBe(false);
  });
});

describe('makeBgFill', () => {
  it('returns a fill function for interactive mode with bg token', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const token = { hex: '#ffffff', bg: '#000000' };
    const fill = makeBgFill(token, ctx);
    expect(fill).toBeTypeOf('function');
    expect(fill!('hello')).toBe('hello'); // plainStyle identity
  });

  it('returns a fill function for static mode with bg token', () => {
    const ctx = createTestContext({ mode: 'static' });
    const token = { hex: '#ffffff', bg: '#000000' };
    const fill = makeBgFill(token, ctx);
    expect(fill).toBeTypeOf('function');
  });

  it('returns undefined for pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const token = { hex: '#ffffff', bg: '#000000' };
    expect(makeBgFill(token, ctx)).toBeUndefined();
  });

  it('returns undefined for accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const token = { hex: '#ffffff', bg: '#000000' };
    expect(makeBgFill(token, ctx)).toBeUndefined();
  });

  it('returns undefined when noColor is true', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const token = { hex: '#ffffff', bg: '#000000' };
    expect(makeBgFill(token, ctx)).toBeUndefined();
  });

  it('returns undefined when ctx is undefined', () => {
    const token = { hex: '#ffffff', bg: '#000000' };
    expect(makeBgFill(token, undefined)).toBeUndefined();
  });

  it('returns undefined when token is undefined', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(makeBgFill(undefined, ctx)).toBeUndefined();
  });

  it('returns undefined when token has no bg field', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const token = { hex: '#ffffff' };
    expect(makeBgFill(token, ctx)).toBeUndefined();
  });
});

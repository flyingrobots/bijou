import { describe, it, expect } from 'vitest';
import { isKeyMsg, isResizeMsg } from './types.js';
import type { KeyMsg, ResizeMsg } from './types.js';

describe('isKeyMsg', () => {
  it('returns true for valid KeyMsg', () => {
    const msg: KeyMsg = { type: 'key', key: 'a', ctrl: false, alt: false, shift: false };
    expect(isKeyMsg(msg)).toBe(true);
  });

  it('returns true for Ctrl+C KeyMsg', () => {
    const msg: KeyMsg = { type: 'key', key: 'c', ctrl: true, alt: false, shift: false };
    expect(isKeyMsg(msg)).toBe(true);
  });

  it('returns false for ResizeMsg', () => {
    const msg: ResizeMsg = { type: 'resize', columns: 80, rows: 24 };
    expect(isKeyMsg(msg)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isKeyMsg(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isKeyMsg(undefined)).toBe(false);
  });

  it('returns false for string', () => {
    expect(isKeyMsg('key')).toBe(false);
  });

  it('returns false for object without type', () => {
    expect(isKeyMsg({ key: 'a' })).toBe(false);
  });

  it('returns false for object with wrong type', () => {
    expect(isKeyMsg({ type: 'custom', key: 'a' })).toBe(false);
  });
});

describe('isResizeMsg', () => {
  it('returns true for valid ResizeMsg', () => {
    const msg: ResizeMsg = { type: 'resize', columns: 120, rows: 40 };
    expect(isResizeMsg(msg)).toBe(true);
  });

  it('returns false for KeyMsg', () => {
    const msg: KeyMsg = { type: 'key', key: 'q', ctrl: false, alt: false, shift: false };
    expect(isResizeMsg(msg)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isResizeMsg(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isResizeMsg(undefined)).toBe(false);
  });

  it('returns false for object with wrong type', () => {
    expect(isResizeMsg({ type: 'key' })).toBe(false);
  });

  it('returns false for a plain string', () => {
    expect(isResizeMsg('some string')).toBe(false);
  });

  it('returns false for empty object', () => {
    expect(isResizeMsg({})).toBe(false);
  });
});

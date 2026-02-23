import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { box, headerBox } from './box.js';
import { _resetThemeForTesting } from '../theme/resolve.js';

describe('box', () => {
  const originalEnv = { ...process.env };
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    _resetThemeForTesting();
    delete process.env['BIJOU_ACCESSIBLE'];
    delete process.env['NO_COLOR'];
    delete process.env['CI'];
    delete process.env['TERM'];
    delete process.env['BIJOU_THEME'];
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true });
    _resetThemeForTesting();
  });

  it('renders boxen in interactive mode', () => {
    const result = box('Hello World');
    expect(result).toContain('Hello World');
    expect(result).toContain('─'); // border chars
  });

  it('returns content only in pipe mode', () => {
    Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
    expect(box('Hello World')).toBe('Hello World');
  });

  it('returns content only in accessible mode', () => {
    process.env['BIJOU_ACCESSIBLE'] = '1';
    expect(box('Hello World')).toBe('Hello World');
  });
});

describe('headerBox', () => {
  const originalEnv = { ...process.env };
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    _resetThemeForTesting();
    delete process.env['BIJOU_ACCESSIBLE'];
    delete process.env['NO_COLOR'];
    delete process.env['CI'];
    delete process.env['TERM'];
    delete process.env['BIJOU_THEME'];
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true });
    _resetThemeForTesting();
  });

  it('renders header box with detail in interactive mode', () => {
    const result = headerBox('Title', { detail: 'some detail' });
    expect(result).toContain('Title');
    expect(result).toContain('some detail');
  });

  it('renders pipe format', () => {
    Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
    expect(headerBox('Title', { detail: 'detail' })).toBe('Title  detail');
  });

  it('renders accessible format', () => {
    process.env['BIJOU_ACCESSIBLE'] = '1';
    expect(headerBox('Title', { detail: 'detail' })).toBe('Title: detail');
  });

  it('renders label only when no detail', () => {
    Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
    expect(headerBox('Title')).toBe('Title');
  });
});

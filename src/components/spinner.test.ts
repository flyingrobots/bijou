import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spinnerFrame } from './spinner.js';

describe('spinnerFrame', () => {
  const originalEnv = { ...process.env };
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    delete process.env['BIJOU_ACCESSIBLE'];
    delete process.env['NO_COLOR'];
    delete process.env['CI'];
    delete process.env['TERM'];
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true });
  });

  it('returns animated frame in interactive mode', () => {
    const frame = spinnerFrame(0, { label: 'Loading' });
    expect(frame).toContain('Loading');
    expect(frame).toMatch(/^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/);
  });

  it('cycles through frames', () => {
    const frame0 = spinnerFrame(0);
    const frame1 = spinnerFrame(1);
    expect(frame0).not.toBe(frame1);
  });

  it('returns static format in CI mode', () => {
    process.env['CI'] = 'true';
    const frame = spinnerFrame(0, { label: 'Building' });
    expect(frame).toBe('... Building');
  });

  it('returns pipe format when piped', () => {
    Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
    const frame = spinnerFrame(0, { label: 'Processing' });
    expect(frame).toBe('Processing...');
  });

  it('returns accessible format', () => {
    process.env['BIJOU_ACCESSIBLE'] = '1';
    const frame = spinnerFrame(0, { label: 'Loading' });
    expect(frame).toBe('Loading. Please wait.');
  });

  it('uses custom frames', () => {
    const frame = spinnerFrame(0, { frames: ['-', '\\', '|', '/'], label: 'Spinning' });
    expect(frame).toBe('- Spinning');
  });

  it('defaults label to Loading', () => {
    const frame = spinnerFrame(0);
    expect(frame).toContain('Loading');
  });
});

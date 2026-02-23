import { describe, it, expect } from 'vitest';
import { spinnerFrame } from './spinner.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('spinnerFrame', () => {
  it('returns animated frame in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const frame = spinnerFrame(0, { label: 'Loading', ctx });
    expect(frame).toContain('Loading');
    expect(frame).toMatch(/^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/);
  });

  it('cycles through frames', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const frame0 = spinnerFrame(0, { ctx });
    const frame1 = spinnerFrame(1, { ctx });
    expect(frame0).not.toBe(frame1);
  });

  it('returns static format in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const frame = spinnerFrame(0, { label: 'Building', ctx });
    expect(frame).toBe('... Building');
  });

  it('returns pipe format in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const frame = spinnerFrame(0, { label: 'Processing', ctx });
    expect(frame).toBe('Processing...');
  });

  it('returns accessible format in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const frame = spinnerFrame(0, { label: 'Loading', ctx });
    expect(frame).toBe('Loading. Please wait.');
  });

  it('uses custom frames', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const frame = spinnerFrame(0, { frames: ['-', '\\', '|', '/'], label: 'Spinning', ctx });
    expect(frame).toBe('- Spinning');
  });

  it('defaults label to Loading', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const frame = spinnerFrame(0, { ctx });
    expect(frame).toContain('Loading');
  });
});

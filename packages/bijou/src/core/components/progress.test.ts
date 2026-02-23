import { describe, it, expect } from 'vitest';
import { progressBar } from './progress.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('progressBar', () => {
  it('renders progress bar at 0% in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(0, { width: 10, ctx });
    expect(result).toContain('[');
    expect(result).toContain(']');
    expect(result).toContain('0%');
  });

  it('renders progress bar at 100% in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(100, { width: 10, ctx });
    expect(result).toContain('100%');
    expect(result).toContain('██████████');
  });

  it('renders progress bar at 50% in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(50, { width: 10, ctx });
    expect(result).toContain('50%');
    expect(result).toContain('█████');
    expect(result).toContain('░░░░░');
  });

  it('clamps below 0', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(-10, { width: 10, ctx });
    expect(result).toContain('0%');
  });

  it('clamps above 100', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(150, { width: 10, ctx });
    expect(result).toContain('100%');
  });

  it('hides percent when showPercent is false', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(50, { width: 10, showPercent: false, ctx });
    expect(result).not.toContain('%');
  });

  it('returns pipe format in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = progressBar(45, { ctx });
    expect(result).toBe('Progress: 45%');
  });

  it('returns accessible format in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = progressBar(45, { ctx });
    expect(result).toBe('45 percent complete.');
  });

  it('uses custom filled and empty characters', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(50, { width: 4, filled: '#', empty: '-', ctx });
    expect(result).toContain('##--');
  });
});

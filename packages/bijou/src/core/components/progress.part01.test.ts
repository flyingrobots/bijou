import { describe, it, expect } from 'vitest';
import { progressBar } from './progress.js';
import { createTestContext, auditStyle } from '../../adapters/test/index.js';

describe('progressBar', () => {
  it('renders progress bar at 0% in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(0, { width: 10, ctx });
    expect(result).toContain('0%');
    expect(result).not.toContain('[');
    expect(result).not.toContain(']');
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
    expect(result).toContain('⠐⠐⠐⠐⠐');
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

  it('falls back to the default width for non-finite width input', () => {
    const ctx = createTestContext({ mode: 'static' });
    expect(progressBar(45, { width: Number.NaN, ctx })).toBe(progressBar(45, { ctx }));
  });

  it('uses custom filled and empty characters', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = progressBar(50, { width: 4, filled: '#', empty: '-', ctx });
    expect(result).toContain('##--');
  });

  it('uses theme tokens by default for rich progress colors', () => {
    const style = auditStyle();
    const ctx = createTestContext({ mode: 'static', style });

    progressBar(50, { width: 4, ctx });

    expect(style.calls.some((call) => call.method === 'styled' && call.text.includes('50%'))).toBe(true);
    expect(style.calls.some((call) => call.method === 'styled' && call.text.includes('⠐'))).toBe(true);
    expect(style.calls.some((call) => call.method === 'rgb')).toBe(false);
    expect(style.calls.some((call) => call.method === 'hex')).toBe(false);
  });

  it('accepts custom label and fill tokens', () => {
    const style = auditStyle();
    const ctx = createTestContext({ mode: 'static', style });

    progressBar(50, {
      width: 4,
      labelToken: { hex: '#ffeeaa', modifiers: ['bold'] },
      filledToken: { hex: '#00aaee' },
      filledEndToken: { hex: '#ff44aa' },
      emptyToken: { hex: '#112233' },
      ctx,
    });

    expect(style.wasStyled({ hex: '#ffeeaa', modifiers: ['bold'] }, '50%')).toBe(true);
    expect(style.calls.some((call) => call.method === 'styled' && call.token?.hex === '#00aaee' && call.text === '█')).toBe(true);
    expect(style.calls.some((call) => call.method === 'styled' && call.token?.hex === '#112233' && call.text.includes('⠐'))).toBe(true);
  });

  it('reaches the filled-end token at the trailing edge of a partial bar', () => {
    const style = auditStyle();
    const ctx = createTestContext({ mode: 'static', style });

    progressBar(50, {
      width: 4,
      filledToken: { hex: '#00aaee' },
      filledEndToken: { hex: '#ff44aa' },
      emptyToken: { hex: '#112233' },
      ctx,
    });

    const filledCalls = style.calls.filter((call) => call.method === 'styled' && call.text === '█');
    expect(filledCalls).toHaveLength(2);
    expect(filledCalls[0]?.token?.hex).toBe('#00aaee');
    expect(filledCalls[1]?.token?.hex).toBe('#ff44aa');
  });

  it('still honors explicit gradient overrides', () => {
    const style = auditStyle();
    const ctx = createTestContext({ mode: 'static', style });

    progressBar(50, {
      width: 4,
      gradient: [
        { pos: 0, color: [255, 0, 0] },
        { pos: 1, color: [0, 0, 255] },
      ],
      ctx,
    });

    expect(style.calls.some((call) => call.method === 'rgb')).toBe(true);
  });
});

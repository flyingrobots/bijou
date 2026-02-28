import { describe, it, expect } from 'vitest';
import { auditStyle } from './audit-style.js';
import type { TokenValue } from '../../core/theme/tokens.js';
import { createTestContext } from './index.js';

const token: TokenValue = { hex: '#ff0000' };
const token2: TokenValue = { hex: '#00ff00', modifiers: ['bold'] };

describe('auditStyle', () => {
  it('records styled() calls', () => {
    const style = auditStyle();
    style.styled(token, 'hello');
    expect(style.calls).toHaveLength(1);
    expect(style.calls[0]).toEqual({ method: 'styled', text: 'hello', token });
  });

  it('records rgb() calls', () => {
    const style = auditStyle();
    style.rgb(255, 0, 0, 'red text');
    expect(style.calls).toHaveLength(1);
    expect(style.calls[0]).toEqual({ method: 'rgb', text: 'red text', color: [255, 0, 0] });
  });

  it('records hex() calls', () => {
    const style = auditStyle();
    style.hex('#ff0000', 'hex text');
    expect(style.calls).toHaveLength(1);
    expect(style.calls[0]).toEqual({ method: 'hex', text: 'hex text', color: '#ff0000' });
  });

  it('records bold() calls', () => {
    const style = auditStyle();
    style.bold('strong');
    expect(style.calls).toHaveLength(1);
    expect(style.calls[0]).toEqual({ method: 'bold', text: 'strong' });
  });

  it('returns text unchanged', () => {
    const style = auditStyle();
    expect(style.styled(token, 'hello')).toBe('hello');
    expect(style.rgb(255, 0, 0, 'red')).toBe('red');
    expect(style.hex('#ff0000', 'hex')).toBe('hex');
    expect(style.bold('bold')).toBe('bold');
  });

  it('records multiple calls in order', () => {
    const style = auditStyle();
    style.styled(token, 'first');
    style.bold('second');
    style.styled(token2, 'third');
    expect(style.calls).toHaveLength(3);
    expect(style.calls[0]!.text).toBe('first');
    expect(style.calls[1]!.text).toBe('second');
    expect(style.calls[2]!.text).toBe('third');
  });

  it('wasStyled() finds matching calls', () => {
    const style = auditStyle();
    style.styled(token, 'hello world');
    style.styled(token2, 'goodbye');
    expect(style.wasStyled(token, 'hello')).toBe(true);
    expect(style.wasStyled(token, 'world')).toBe(true);
    expect(style.wasStyled(token, 'hello world')).toBe(true);
  });

  it('wasStyled() returns false for non-matching token', () => {
    const style = auditStyle();
    style.styled(token, 'hello');
    expect(style.wasStyled(token2, 'hello')).toBe(false);
  });

  it('wasStyled() returns false for non-matching substring', () => {
    const style = auditStyle();
    style.styled(token, 'hello');
    expect(style.wasStyled(token, 'xyz')).toBe(false);
  });

  it('wasStyled() ignores non-styled calls', () => {
    const style = auditStyle();
    style.bold('hello');
    style.hex('#ff0000', 'hello');
    expect(style.wasStyled(token, 'hello')).toBe(false);
  });

  it('reset() clears all recorded calls', () => {
    const style = auditStyle();
    style.styled(token, 'hello');
    style.bold('world');
    expect(style.calls).toHaveLength(2);
    style.reset();
    expect(style.calls).toHaveLength(0);
  });

  it('interops with createTestContext', () => {
    const style = auditStyle();
    const ctx = createTestContext();
    // Replace the style in the context
    const testCtx = { ...ctx, style };
    testCtx.style.styled(token, 'test');
    expect(style.calls).toHaveLength(1);
    expect(style.wasStyled(token, 'test')).toBe(true);
  });
});

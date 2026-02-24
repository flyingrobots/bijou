import { describe, it, expect } from 'vitest';
import { plainStyle } from './style.js';

describe('plainStyle()', () => {
  const style = plainStyle();

  it('styled() returns text unchanged', () => {
    expect(style.styled({ hex: '#ff0000', modifiers: [] }, 'hello')).toBe('hello');
  });

  it('bold() returns text unchanged', () => {
    expect(style.bold('strong')).toBe('strong');
  });

  it('rgb() returns text unchanged', () => {
    expect(style.rgb(255, 0, 0, 'red')).toBe('red');
  });

  it('hex() returns text unchanged', () => {
    expect(style.hex('#00ff00', 'green')).toBe('green');
  });
});

import { describe, expect, it } from 'vitest';
import { createWebRuntime, createWebStyle } from './index.js';

const RED = '\x1b[38;2;255;0;0m';
const FG_OFF = '\x1b[39m';
const BG_OFF = '\x1b[49m';

describe('createWebStyle()', () => {
  const style = createWebStyle();

  it('applies 24-bit foreground and background colors', () => {
    expect(style.rgb(255, 0, 170, 'hi')).toBe(`\x1b[38;2;255;0;170mhi${FG_OFF}`);
    expect(style.hex('#ff00aa', 'hi')).toBe(`\x1b[38;2;255;0;170mhi${FG_OFF}`);
    expect(style.hex('f0a', 'hi')).toBe(`\x1b[38;2;255;0;170mhi${FG_OFF}`);
    expect(style.bgRgb(1, 2, 3, 'hi')).toBe(`\x1b[48;2;1;2;3mhi${BG_OFF}`);
    expect(style.bgHex('#010203', 'hi')).toBe(`\x1b[48;2;1;2;3mhi${BG_OFF}`);
  });

  it('applies bold weight', () => {
    expect(style.bold('hi')).toBe('\x1b[1mhi\x1b[22m');
  });

  it('styles a token with foreground, modifiers, and background', () => {
    const token = { hex: '#ff0000', bg: '#000000', modifiers: ['bold' as const, 'underline' as const] };
    expect(style.styled(token, 'x')).toBe(
      `\x1b[48;2;0;0;0m${RED}\x1b[1m\x1b[4mx\x1b[24m\x1b[22m${FG_OFF}${BG_OFF}`,
    );
    expect(style.styled({ hex: '#ff0000' }, 'x')).toBe(`${RED}x${FG_OFF}`);
  });

  it.each([
    ['dim', '\x1b[2m', '\x1b[22m'],
    ['strikethrough', '\x1b[9m', '\x1b[29m'],
    ['inverse', '\x1b[7m', '\x1b[27m'],
    ['curly-underline', '\x1b[4:3m', '\x1b[24m'],
    ['dotted-underline', '\x1b[4:4m', '\x1b[24m'],
    ['dashed-underline', '\x1b[4:5m', '\x1b[24m'],
  ] as const)('applies the %s modifier', (modifier, open, close) => {
    expect(style.styled({ hex: '', modifiers: [modifier] }, 'x')).toBe(`${open}x${close}`);
  });

  it('clamps channels and leaves text plain for an invalid hex color', () => {
    expect(style.rgb(300, -5, 12.6, 'x')).toBe(`\x1b[38;2;255;0;13mx${FG_OFF}`);
    expect(style.rgb(Number.NaN, 0, 0, 'x')).toBe(`\x1b[38;2;0;0;0mx${FG_OFF}`);
    expect(style.hex('not-a-color', 'x')).toBe('x');
    expect(style.bgHex('#12345', 'x')).toBe('x');
    expect(style.styled({ hex: 'zzz' }, 'x')).toBe('x');
  });

  it('reopens the outer color after a nested color closes', () => {
    const inner = style.rgb(0, 0, 255, 'b');
    expect(style.rgb(255, 0, 0, `a${inner}c`)).toBe(`${RED}a\x1b[38;2;0;0;255mb${FG_OFF}${RED}c${FG_OFF}`);
  });

  it('closes and reopens styles around line breaks', () => {
    expect(style.rgb(255, 0, 0, 'a\nb\r\nc')).toBe(`${RED}a${FG_OFF}\n${RED}b${FG_OFF}\r\n${RED}c${FG_OFF}`);
  });

  it('returns empty text unchanged', () => {
    expect(style.bold('')).toBe('');
    expect(style.rgb(1, 2, 3, '')).toBe('');
  });
});

describe('createWebStyle() honoring NO_COLOR', () => {
  const token = { hex: '#ff0000', bg: '#000000', modifiers: ['bold' as const, 'curly-underline' as const] };

  it('returns every method unstyled when noColor is set', () => {
    const style = createWebStyle({ noColor: true });
    expect([
      style.styled(token, 'x'), style.rgb(1, 2, 3, 'x'), style.hex('#fff', 'x'),
      style.bgRgb(1, 2, 3, 'x'), style.bgHex('#fff', 'x'), style.bold('x'),
    ]).toEqual(['x', 'x', 'x', 'x', 'x', 'x']);
  });

  it('reads NO_COLOR from the runtime on every call', () => {
    const runtime = createWebRuntime({ env: { NO_COLOR: '1' } });
    const style = createWebStyle({ runtime });
    expect(style.styled(token, 'x')).toBe('x');
    expect(style.bold('x')).toBe('x');
    runtime.setEnv('NO_COLOR', undefined);
    expect(style.bold('x')).toBe('\x1b[1mx\x1b[22m');
    expect(style.rgb(255, 0, 0, 'x')).toBe(`${RED}x${FG_OFF}`);
  });

  it('lets an explicit noColor option override the runtime', () => {
    const runtime = createWebRuntime({ env: { NO_COLOR: '1' } });
    expect(createWebStyle({ runtime, noColor: false }).bold('x')).toBe('\x1b[1mx\x1b[22m');
  });
});

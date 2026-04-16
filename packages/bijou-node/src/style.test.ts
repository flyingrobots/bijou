import { describe, it, expect } from 'vitest';
import { chalkStyle } from './style.js';

describe('chalkStyle()', () => {
  describe('ambient color mode', () => {
    const style = chalkStyle(false);

    it('styled() returns string containing the text', () => {
      expect(style.styled({ hex: '#ff0000' }, 'red')).toContain('red');
    });

    it('styled() applies bold modifier', () => {
      const result = style.styled({ hex: '#ffffff', modifiers: ['bold'] }, 'text');
      expect(result).toContain('text');
    });

    it('styled() applies dim modifier', () => {
      expect(style.styled({ hex: '#808080', modifiers: ['dim'] }, 'muted')).toContain('muted');
    });

    it('styled() applies strikethrough modifier', () => {
      expect(style.styled({ hex: '#ffffff', modifiers: ['strikethrough'] }, 'gone')).toContain('gone');
    });

    it('styled() applies inverse modifier', () => {
      expect(style.styled({ hex: '#ffffff', modifiers: ['inverse'] }, 'inv')).toContain('inv');
    });

    it('styled() applies underline modifier', () => {
      expect(style.styled({ hex: '#ffffff', modifiers: ['underline'] }, 'uline')).toContain('uline');
    });

    it('styled() applies curly-underline via raw SGR 4:3', () => {
      const result = style.styled({ hex: '#ffffff', modifiers: ['curly-underline'] }, 'curly');
      expect(result).toContain('curly');
    });

    it('rgb() returns string containing the text', () => {
      expect(style.rgb(255, 0, 0, 'red')).toContain('red');
    });

    it('hex() returns string containing the text', () => {
      expect(style.hex('#00ff00', 'green')).toContain('green');
    });

    it('bold() returns string containing the text', () => {
      expect(style.bold('strong')).toContain('strong');
    });

    it('bgRgb() returns string containing the text', () => {
      expect(style.bgRgb(0, 0, 255, 'blue')).toContain('blue');
    });

    it('bgHex() returns string containing the text', () => {
      expect(style.bgHex('#0000ff', 'blue')).toContain('blue');
    });
  });

  describe('explicit level: 3 mode', () => {
    const style = chalkStyle({ level: 3 });

    it('styled() emits ANSI for hex color deterministically', () => {
      expect(style.styled({ hex: '#ff0000' }, 'red')).toMatch(/\x1b\[/);
    });

    it('styled() emits ANSI for underline modifier', () => {
      expect(style.styled({ hex: '#ffffff', modifiers: ['underline'] }, 'uline')).toMatch(/\x1b\[/);
    });

    it('styled() emits SGR 4:3 for curly-underline', () => {
      const result = style.styled({ hex: '#ffffff', modifiers: ['curly-underline'] }, 'curly');
      expect(result).toContain('\x1b[4:3m');
      expect(result).toContain('\x1b[24m');
    });

    it('styled() emits SGR 4:4 for dotted-underline', () => {
      const result = style.styled({ hex: '#ffffff', modifiers: ['dotted-underline'] }, 'dotted');
      expect(result).toContain('\x1b[4:4m');
    });

    it('styled() emits SGR 4:5 for dashed-underline', () => {
      const result = style.styled({ hex: '#ffffff', modifiers: ['dashed-underline'] }, 'dashed');
      expect(result).toContain('\x1b[4:5m');
    });

    it('styled() emits ANSI for bold modifier', () => {
      expect(style.styled({ hex: '#ffffff', modifiers: ['bold'] }, 'text')).toMatch(/\x1b\[/);
    });

    it('styled() emits ANSI for dim modifier', () => {
      expect(style.styled({ hex: '#808080', modifiers: ['dim'] }, 'muted')).toMatch(/\x1b\[/);
    });

    it('styled() emits ANSI for strikethrough modifier', () => {
      expect(style.styled({ hex: '#ffffff', modifiers: ['strikethrough'] }, 'gone')).toMatch(/\x1b\[/);
    });

    it('styled() emits ANSI for inverse modifier', () => {
      expect(style.styled({ hex: '#ffffff', modifiers: ['inverse'] }, 'inv')).toMatch(/\x1b\[/);
    });

    it('bgRgb() emits ANSI for background color', () => {
      expect(style.bgRgb(0, 0, 255, 'blue')).toMatch(/\x1b\[/);
    });

    it('bgHex() emits ANSI for background color', () => {
      expect(style.bgHex('#0000ff', 'blue')).toMatch(/\x1b\[/);
    });

    it('styled() applies bg field from token', () => {
      const result = style.styled({ hex: '#ffffff', bg: '#0000ff' }, 'bg-test');
      expect(result).toMatch(/\x1b\[/);
      expect(result).toContain('bg-test');
    });
  });

  describe('noColor mode', () => {
    const style = chalkStyle(true);

    it('rgb() returns plain text', () => {
      expect(style.rgb(255, 0, 0, 'red')).toBe('red');
    });

    it('hex() returns plain text', () => {
      expect(style.hex('#ff0000', 'red')).toBe('red');
    });

    it('styled() passes text through without modification', () => {
      // In noColor mode, styled uses base chalk (no hex call),
      // so without modifiers the text should pass through exactly
      expect(style.styled({ hex: '#ff0000' }, 'plain')).toBe('plain');
    });

    it('bold() returns plain text in noColor mode', () => {
      expect(style.bold('text')).toBe('text');
    });

    it('bgRgb() returns plain text', () => {
      expect(style.bgRgb(0, 0, 255, 'blue')).toBe('blue');
    });

    it('bgHex() returns plain text', () => {
      expect(style.bgHex('#0000ff', 'blue')).toBe('blue');
    });

    it('styled() returns plain text for underline variants in noColor mode', () => {
      expect(style.styled({ hex: '#ffffff', modifiers: ['underline'] }, 'u')).toBe('u');
      expect(style.styled({ hex: '#ffffff', modifiers: ['curly-underline'] }, 'c')).toBe('c');
      expect(style.styled({ hex: '#ffffff', modifiers: ['dotted-underline'] }, 'd')).toBe('d');
      expect(style.styled({ hex: '#ffffff', modifiers: ['dashed-underline'] }, 'x')).toBe('x');
    });
  });

  describe('level: 0 mode', () => {
    const style = chalkStyle({ level: 0 });

    it('styled() returns plain text when chalk level is 0', () => {
      expect(style.styled({ hex: '#ff0000' }, 'plain')).toBe('plain');
    });

    it('styled() does not emit raw SGR for underline variants at level 0', () => {
      const result = style.styled({ hex: '#ffffff', modifiers: ['curly-underline'] }, 'text');
      expect(result).toBe('text');
      expect(result).not.toContain('\x1b[');
    });
  });
});

import { describe, expect, it } from 'vitest';
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

  describe('noColor mode', () => {
    const style = chalkStyle(true);

    it('rgb() returns plain text', () => {
      expect(style.rgb(255, 0, 0, 'red')).toBe('red');
    });

    it('hex() returns plain text', () => {
      expect(style.hex('#ff0000', 'red')).toBe('red');
    });

    it('styled() passes text through without modification', () => {
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
});

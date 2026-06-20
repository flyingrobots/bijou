import { describe, expect, it } from 'vitest';
import { chalkStyle } from './style.js';

const ESC = '\x1b[';

describe('chalkStyle() explicit color levels', () => {
  describe('explicit level: 3 mode', () => {
    const style = chalkStyle({ level: 3 });

    it('styled() emits ANSI for hex color deterministically', () => {
      expect(style.styled({ hex: '#ff0000' }, 'red')).toContain(ESC);
    });

    it('styled() emits ANSI for underline modifier', () => {
      expect(style.styled({ hex: '#ffffff', modifiers: ['underline'] }, 'uline')).toContain(ESC);
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

    it('styled() emits ANSI for bold/dim/strikethrough/inverse modifiers', () => {
      expect(style.styled({ hex: '#ffffff', modifiers: ['bold'] }, 'text')).toContain(ESC);
      expect(style.styled({ hex: '#808080', modifiers: ['dim'] }, 'muted')).toContain(ESC);
      expect(style.styled({ hex: '#ffffff', modifiers: ['strikethrough'] }, 'gone')).toContain(ESC);
      expect(style.styled({ hex: '#ffffff', modifiers: ['inverse'] }, 'inv')).toContain(ESC);
    });

    it('emits ANSI for background colors and token bg fields', () => {
      expect(style.bgRgb(0, 0, 255, 'blue')).toContain(ESC);
      expect(style.bgHex('#0000ff', 'blue')).toContain(ESC);
      expect(style.styled({ hex: '#ffffff', bg: '#0000ff' }, 'bg-test')).toContain(ESC);
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

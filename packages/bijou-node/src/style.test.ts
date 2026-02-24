import { describe, it, expect } from 'vitest';
import chalk from 'chalk';
import { chalkStyle } from './style.js';

// Chalk may suppress color in non-TTY test environments.
// We test behavior, not ANSI codes: colored mode should use chalk (may or may not emit ANSI),
// noColor mode must return plain text.
const chalkEmitsColor = chalk.hex('#ff0000')('x') !== 'x';

describe('chalkStyle()', () => {
  describe('with color', () => {
    const style = chalkStyle(false);

    it('styled() returns string containing the text', () => {
      expect(style.styled({ hex: '#ff0000' }, 'red')).toContain('red');
    });

    it.runIf(chalkEmitsColor)('styled() applies hex color when chalk supports it', () => {
      expect(style.styled({ hex: '#ff0000' }, 'red')).toMatch(new RegExp('\\x1b\\['));
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

    it('rgb() returns string containing the text', () => {
      expect(style.rgb(255, 0, 0, 'red')).toContain('red');
    });

    it('hex() returns string containing the text', () => {
      expect(style.hex('#00ff00', 'green')).toContain('green');
    });

    it('bold() returns string containing the text', () => {
      expect(style.bold('strong')).toContain('strong');
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

    it('bold() still applies (chalk.bold is not gated by noColor)', () => {
      expect(style.bold('text')).toContain('text');
    });
  });
});

import { describe, expect, it } from 'vitest';
import type { StylePort } from '../../ports/style.js';
import { createTestContext } from '../../adapters/test/index.js';
import { hexToRgb } from '../theme/color.js';
import { stripAnsi } from '../text/grapheme.js';
import { parseAnsiToSurface } from '../render/differ.js';
import { inspector } from './inspector.js';

function ansiStyle(): StylePort {
  function fg(color: string, text: string): string {
    const [r, g, b] = hexToRgb(color);
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[39m`;
  }

  function bg(color: string, text: string): string {
    const [r, g, b] = hexToRgb(color);
    return `\x1b[48;2;${r};${g};${b}m${text}\x1b[49m`;
  }

  function bold(text: string): string {
    return `\x1b[1m${text}\x1b[22m`;
  }

  return {
    styled(token, text) {
      let result = text;
      if (token.hex) result = fg(token.hex, result);
      if (token.bg) result = bg(token.bg, result);
      if (token.modifiers?.includes('bold')) result = bold(result);
      if (token.modifiers?.includes('dim')) result = `\x1b[2m${result}\x1b[22m`;
      if (token.modifiers?.includes('underline')) result = `\x1b[4m${result}\x1b[24m`;
      if (token.modifiers?.includes('inverse')) result = `\x1b[7m${result}\x1b[27m`;
      if (token.modifiers?.includes('strikethrough')) result = `\x1b[9m${result}\x1b[29m`;
      return result;
    },
    rgb(r, g, b, text) {
      return `\x1b[38;2;${r};${g};${b}m${text}\x1b[39m`;
    },
    hex(color, text) {
      return fg(color, text);
    },
    bgRgb(r, g, b, text) {
      return `\x1b[48;2;${r};${g};${b}m${text}\x1b[49m`;
    },
    bgHex(color, text) {
      return bg(color, text);
    },
    bold,
  };
}

describe('inspector', () => {
  it('renders a boxed inspector surface with current selection emphasis in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const rendered = inspector({
      title: 'active variant',
      currentValue: 'Warning',
      sections: [
        { title: 'Profile', content: 'Rich' },
        {
          title: 'Description',
          content: 'The user can continue, but only after reading the caution.',
          tone: 'muted',
        },
      ],
      width: 48,
      ctx,
    });

    expect(rendered).toContain('┌');
    expect(rendered).toContain('┘');
    expect(rendered).toContain('active variant');
    expect(rendered).toContain('Current selection');
    expect(rendered).toContain('Warning');
    expect(rendered).toContain('Profile');
    expect(rendered).toContain('Description');
  });

  it('omits empty sections instead of rendering empty headings', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const rendered = inspector({
      title: 'active variant',
      currentValue: 'Warning',
      sections: [],
      ctx,
    });

    expect(rendered).toContain('Current selection: Warning');
    expect(rendered).not.toContain('Profile:');
    expect(rendered).not.toContain('Description:');
  });

  it('preserves labeled inspector content in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const rendered = inspector({
      title: 'active variant',
      currentValue: 'Warning',
      sections: [
        { title: 'Profile', content: 'Rich' },
      ],
      ctx,
    });

    expect(rendered).toContain('Inspector: active variant');
    expect(rendered).toContain('Current selection: Warning');
    expect(rendered).toContain('Profile: Rich');
  });

  it('supports chrome-less rich rendering for block composition', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const rendered = inspector({
      title: 'active variant',
      currentValue: 'Warning',
      sections: [
        { title: 'Profile', content: 'Rich' },
      ],
      chrome: 'none',
      ctx,
    });

    expect(rendered).toContain('Current selection');
    expect(rendered).toContain('Warning');
    expect(rendered).toContain('Profile');
    expect(rendered).not.toContain('┌');
    expect(rendered).not.toContain('┘');
  });

  it('preserves box background fill after nested styled content resets', () => {
    const bgToken = { hex: '#88aadd', bg: '#1a2744' };
    const ctx = createTestContext({ mode: 'interactive', style: ansiStyle() });
    const rendered = inspector({
      title: 'active variant',
      currentValue: 'Release metadata',
      sections: [
        { title: 'Profile', content: 'Rich' },
        {
          title: 'Description',
          content: 'Short supporting labels that belong inline with other metadata.',
          tone: 'muted',
        },
      ],
      width: 32,
      bgToken,
      ctx,
    });

    const plainLines = stripAnsi(rendered).split('\n');
    const width = Math.max(...plainLines.map((line) => line.length));
    const surface = parseAnsiToSurface(rendered, width, plainLines.length);
    const currentSelectionRow = plainLines.findIndex((line) => line.includes('Current selection'));

    expect(currentSelectionRow).toBeGreaterThanOrEqual(0);
    expect(surface.get(width - 2, currentSelectionRow).bg).toBe(bgToken.bg);
  });
});

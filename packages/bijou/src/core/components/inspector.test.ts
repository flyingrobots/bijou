import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { stripAnsi } from '../text/grapheme.js';
import { parseAnsiToSurface } from '../render/differ.js';
import { inspector } from './inspector.js';
import { ansiStyle } from './inspector.test-style.js';

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
    const row = plainLines.findIndex((line) => line.includes('Current selection'));

    expect(row).toBeGreaterThanOrEqual(0);
    expect(surface.get(width - 2, row).bg).toBe(bgToken.bg);
  });
});

import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { inspector } from './inspector.js';

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
});

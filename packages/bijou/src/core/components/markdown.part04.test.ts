import { describe, expect, it } from 'vitest';
import { auditStyle, createTestContext } from '../../adapters/test/index.js';
import { markdown } from './markdown.js';

describe('markdown()', () => {
  it('styles wrapped paragraph prose with the primary semantic token', () => {
    const style = auditStyle();
    const ctx = createTestContext({
      mode: 'interactive',
      runtime: { columns: 80 },
      style,
    });

    markdown('Readable prose belongs to the active theme.', { ctx });

    expect(style.wasStyled(ctx.semantic('primary'), 'Readable prose')).toBe(true);
  });
});

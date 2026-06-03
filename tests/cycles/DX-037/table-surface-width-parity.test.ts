import { describe, expect, it } from 'vitest';
import { stripAnsi, surfaceToString, tableSurface } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';

describe('DX-037 tableSurface responsive width parity', () => {
  it('fits string Surface table cells to an explicit total width like table()', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 36, rows: 20 } });
    const surface = tableSurface({
      columns: [
        { header: 'Package', minWidth: 6 },
        { header: 'Release proof', minWidth: 8, weight: 3 },
      ],
      rows: [
        ['bijou', 'canonical docs surface carries release title and layout evidence'],
        ['bijou-tui', 'workspace shell keeps navigation usable at narrow widths'],
      ],
      width: 36,
      ctx,
    });
    const text = stripAnsi(surfaceToString(surface, ctx.style));

    expect(surface.width).toBeLessThanOrEqual(36);
    expect(text).toContain('canonical docs');
    expect(text).toContain('layout evidence');
    expect(text).toContain('workspace shell');
  });

  it('preserves word boundaries when fitted string cells wrap by default', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 36, rows: 20 } });
    const surface = tableSurface({
      columns: [
        { header: 'Package', minWidth: 6 },
        { header: 'Release proof', minWidth: 8, weight: 3 },
      ],
      rows: [
        ['bijou', 'canonical docs surface carries release title and layout evidence'],
      ],
      width: 36,
      ctx,
    });
    const text = stripAnsi(surfaceToString(surface, ctx.style));
    const lines = text.split('\n');

    expect(text).toContain('surface');
    expect(text).toContain('evidence');
    expect(lines.some((line) => line.includes('layout evid') && !line.includes('layout evidence'))).toBe(false);
    expect(lines.some((line) => line.includes('│ ence'))).toBe(false);
  });
});

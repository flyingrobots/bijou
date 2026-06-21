import { describe, it, expect } from 'vitest';
import { flex } from './flex.js';

// ---------------------------------------------------------------------------
// Resize scenario
// ---------------------------------------------------------------------------
describe('resize reflow', () => {
  it('produces different layouts for different widths', () => {
    const renderApp = (width: number, height: number): string =>
      flex(
        { direction: 'row', width, height, gap: 1 },
        { basis: 15, content: 'sidebar' },
        { flex: 1, content: (w) => `main(${String(w)})` },
      );
    const wide = renderApp(80, 24);
    const narrow = renderApp(40, 24);
    // Wide should allocate more to main
    expect(wide).toContain('main(64)');   // 80 - 15 - 1 gap
    expect(narrow).toContain('main(24)'); // 40 - 15 - 1 gap
  });
});

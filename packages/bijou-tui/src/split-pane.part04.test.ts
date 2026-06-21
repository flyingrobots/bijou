import { describe, it, expect } from 'vitest';
import { createSurface, stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { visibleLength } from './viewport.js';
import { createSplitPaneState, splitPane, splitPaneSurface } from './split-pane.js';

describe('splitPane render', () => {
  it('renders row dimensions', () => {
    const state = createSplitPaneState({ ratio: 0.5 });
    const output = splitPane(state, {
      direction: 'row',
      width: 21,
      height: 4,
      paneA: (w, h) => `A(${String(w)}x${String(h)})`,
      paneB: (w, h) => `B(${String(w)}x${String(h)})`,
    });

    const lines = output.split('\n');
    expect(lines).toHaveLength(4);
    for (const line of lines) {
      expect(visibleLength(line)).toBe(21);
    }
    expect(output).toContain('A(');
    expect(output).toContain('B(');
  });

  it('sanitizes multi-column dividerChar to preserve layout width', () => {
    const state = createSplitPaneState({ ratio: 0.5 });
    const output = splitPane(state, {
      direction: 'row',
      width: 16,
      height: 3,
      dividerChar: '██',
      paneA: () => 'left',
      paneB: () => 'right',
    });

    const lines = output.split('\n');
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(visibleLength(line)).toBe(16);
    }
  });

  it('renders column dimensions', () => {
    const state = createSplitPaneState({ ratio: 0.5 });
    const output = splitPane(state, {
      direction: 'column',
      width: 12,
      height: 7,
      paneA: () => 'top',
      paneB: () => 'bottom',
    });

    const lines = output.split('\n');
    expect(lines).toHaveLength(7);
    for (const line of lines) {
      expect(visibleLength(line)).toBe(12);
    }
    expect(output).toContain('top');
    expect(output).toContain('bottom');
  });

  it('renders row surface dimensions', () => {
    const ctx = createTestContext();
    const state = createSplitPaneState({ ratio: 0.5 });
    const surface = splitPaneSurface(state, {
      direction: 'row',
      width: 21,
      height: 4,
      paneA: () => stringToSurface('LEFT', 4, 1),
      paneB: () => stringToSurface('RIGHT', 5, 1),
    });

    expect(surface.width).toBe(21);
    expect(surface.height).toBe(4);

    const lines = surfaceToString(surface, ctx.style).split('\n');
    expect(lines).toHaveLength(4);
    for (const line of lines) {
      expect(visibleLength(line)).toBe(21);
    }
    expect(lines.join('\n')).toContain('LEFT');
    expect(lines.join('\n')).toContain('RIGHT');
  });

  it('preserves structured cell styling on the surface path', () => {
    const state = createSplitPaneState({ ratio: 0.5 });
    const styledPane = createSurface(2, 1, { char: 'L', fg: '#00ffff', bg: '#112233', empty: false });
    const surface = splitPaneSurface(state, {
      direction: 'row',
      width: 7,
      height: 1,
      paneA: () => styledPane,
      paneB: () => stringToSurface('R', 1, 1),
    });

    expect(surface.get(0, 0).char).toBe('L');
    expect(surface.get(0, 0).fg).toBe('#00ffff');
    expect(surface.get(0, 0).bg).toBe('#112233');
  });

  it('sanitizes non-finite and fractional surface dimensions', () => {
    const state = createSplitPaneState({ ratio: 0.5 });
    const surface = splitPaneSurface(state, {
      direction: 'row',
      width: 9.9,
      height: Number.NaN,
      paneA: () => stringToSurface('LEFT', 4, 1),
      paneB: () => stringToSurface('RIGHT', 5, 1),
    });

    expect(surface.width).toBe(0);
    expect(surface.height).toBe(0);
  });
});

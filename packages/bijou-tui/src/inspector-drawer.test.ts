import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { inspectorDrawer } from './inspector-drawer.js';

describe('inspectorDrawer', () => {
  it('renders inspector content inside a right-anchored drawer', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const overlay = inspectorDrawer({
      title: 'Inspector',
      inspector: {
        title: 'Focused context',
        currentValue: 'editor:content',
        sections: [
          { title: 'Page', content: 'editor' },
          { title: 'Anchor', content: 'right', tone: 'muted' },
        ],
      },
      width: 28,
      screenWidth: 100,
      screenHeight: 20,
      ctx,
    });

    expect(overlay.col).toBe(72);
    expect(overlay.row).toBe(0);
    expect(overlay.content).toContain('Inspector');
    expect(overlay.content).toContain('Current selection');
    expect(overlay.content).toContain('editor:content');
    expect(overlay.content).toContain('Page');
  });

  it('supports top-anchored drawers with region-aware inspector width', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const overlay = inspectorDrawer({
      title: 'Panel Inspector',
      inspector: {
        title: 'Focused context',
        currentValue: 'ops:stats',
        sections: [
          { title: 'Page', content: 'ops' },
          { title: 'Release', content: 'v1.3.0' },
        ],
      },
      anchor: 'top',
      height: 9,
      screenWidth: 100,
      screenHeight: 30,
      region: { row: 4, col: 10, width: 40, height: 12 },
      ctx,
    });

    expect(overlay.row).toBe(4);
    expect(overlay.col).toBe(10);
    expect(overlay.content).toContain('Panel Inspector');
    expect(overlay.content).toContain('Current selection');
    expect(overlay.content).toContain('ops:stats');
    expect(overlay.content).toContain('Page');
    expect(overlay.content).toContain('Release');
  });
});

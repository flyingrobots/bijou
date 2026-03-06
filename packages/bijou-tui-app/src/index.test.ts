import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript, stripAnsi, visibleLength } from '@flyingrobots/bijou-tui';
import { createTuiAppSkeleton } from './index.js';

describe('createTuiAppSkeleton', () => {
  it('throws when tabs are explicitly empty', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(() => createTuiAppSkeleton({ ctx, tabs: [] })).toThrow(/must contain at least one tab/);
  });

  it('ships default two tabs: drawer page then 1/3-2/3 split page', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const app = createTuiAppSkeleton({ ctx, title: 'Skeleton' });

    const [model] = app.init();
    expect(model.pageOrder).toHaveLength(2);

    const firstFrame = app.view(model);
    const firstLines = firstFrame.split('\n');
    expect(stripAnsi(firstLines[0] ?? '')).toContain('Home');
    expect(stripAnsi(firstLines[0] ?? '')).toContain('|');
    expect(stripAnsi(firstLines[0] ?? '')).toContain('Split');
    expect(stripAnsi(firstFrame)).toContain('Drawer');

    const switched = await runScript(app, [{ key: ']' }]);
    expect(switched.model.activePageId).toBe('split');

    const splitFrame = app.view(switched.model);
    expect(stripAnsi(splitFrame)).toContain('Left pane (1/3)');
    expect(stripAnsi(splitFrame)).toContain('Right pane (2/3)');
  });

  it('renders a two-line footer with status over controls and a full-width separator', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const app = createTuiAppSkeleton({
      ctx,
      statusMessage: 'Build green',
      keyLegend: 'legend-controls',
    });

    const [model] = app.init();
    const output = app.view(model);
    const lines = output.split('\n');

    const statusRow = lines[model.rows - 2] ?? '';
    const controlsRow = lines[model.rows - 1] ?? '';

    expect(stripAnsi(statusRow)).toContain('Build green');
    expect(stripAnsi(controlsRow)).toContain('legend-controls');

    if (model.rows >= 4) {
      const slashRow = lines[model.rows - 3] ?? '';
      expect(stripAnsi(slashRow)).toBe('\\'.repeat(model.columns));
      expect(visibleLength(slashRow)).toBe(model.columns);
    }
  });

  it('opens quit confirmation on q and ctrl+c, and supports cancel', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const app = createTuiAppSkeleton({ ctx });

    const qOpen = await runScript(app, [{ key: 'q' }]);
    expect(stripAnsi(qOpen.frames.at(-1) ?? '')).toContain('Quit App?');

    const qCancel = await runScript(app, [{ key: 'q' }, { key: 'n' }]);
    expect(stripAnsi(app.view(qCancel.model))).not.toContain('Quit App?');

    const ctrlCOpen = await runScript(app, [{ key: '\x03' }]);
    expect(stripAnsi(ctrlCOpen.frames.at(-1) ?? '')).toContain('Quit App?');
  });

  it('animates drawer changes via physics commands', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const app = createTuiAppSkeleton({ ctx });

    const result = await runScript(app, [
      { key: 'o' },
      { key: 'o', delay: 120 },
    ]);

    // Initial frame + key frame + animation frames + second toggle.
    expect(result.frames.length).toBeGreaterThan(3);
  });
});

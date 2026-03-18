import { describe, expect, it } from 'vitest';
import { createTestContext, mockClock } from '@flyingrobots/bijou/adapters/test';
import { runScript, stripAnsi, visibleLength } from '@flyingrobots/bijou-tui';
import { surfaceToString } from '@flyingrobots/bijou';
import { createTuiAppSkeleton } from './index.js';

function expectSurface(value: ReturnType<ReturnType<typeof createTuiAppSkeleton>['view']>) {
  if (typeof value === 'string' || !('cells' in value)) {
    throw new Error('expected a surface-native framed app view');
  }
  return value;
}

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
    const firstString = surfaceToString(expectSurface(firstFrame), ctx.style);
    const firstLines = firstString.split('\n');
    expect(stripAnsi(firstLines[0] ?? '')).toContain('Home');
    expect(stripAnsi(firstLines[0] ?? '')).toContain('|');
    expect(stripAnsi(firstLines[0] ?? '')).toContain('Split');
    expect(stripAnsi(firstString)).toContain('Drawer');

    const switched = await runScript(app, [{ key: ']' }], { ctx });
    expect(switched.model.activePageId).toBe('split');

    const splitFrame = app.view(switched.model);
    const splitString = surfaceToString(expectSurface(splitFrame), ctx.style);
    const plain = stripAnsi(splitString);
    expect(plain).toContain('Split');
    expect(plain).toContain('Split ready');
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
    const lines = surfaceToString(expectSurface(output), ctx.style).split('\n');

    const statusRow = lines[model.rows - 2] ?? '';
    const controlsRow = lines[model.rows - 1] ?? '';

    expect(stripAnsi(statusRow)).toContain('Build green');
    expect(stripAnsi(controlsRow)).toContain('legend-controls');

    if (model.rows >= 4) {
      const slashRow = lines[model.rows - 3] ?? '';
      expect(stripAnsi(slashRow)).toHaveLength(model.columns);
    }
  });

  it('opens quit confirmation on q and ctrl+c, and supports cancel', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const app = createTuiAppSkeleton({ ctx });

    const qOpen = await runScript(app, [{ key: 'q' }], { ctx });
    expect(stripAnsi(surfaceToString(qOpen.frames.at(-1)!, ctx.style))).toContain('Quit App?');

    const qCancel = await runScript(app, [{ key: 'q' }, { key: 'n' }], { ctx });
    expect(stripAnsi(surfaceToString(expectSurface(app.view(qCancel.model)), ctx.style))).not.toContain('Quit App?');

    const ctrlCOpen = await runScript(app, [{ key: '\x03' }], { ctx });
    expect(stripAnsi(surfaceToString(ctrlCOpen.frames.at(-1)!, ctx.style))).toContain('Quit App?');
  });

  it('animates drawer changes via physics commands', async () => {
    const clock = mockClock();
    const ctx = createTestContext({ mode: 'interactive', clock });
    const app = createTuiAppSkeleton({ ctx });

    const promise = runScript(app, [
      { key: 'o' },
      { key: 'o', delay: 120 },
    ], { ctx });
    for (let i = 0; i < 80; i++) {
      await clock.advanceByAsync(25);
    }
    const result = await promise;

    // Initial frame + key frame + animation frames + second toggle.
    expect(result.frames.length).toBeGreaterThan(3);
  });
});

import { describe, expect, it } from 'vitest';
import { createTestContext, mockClock } from '@flyingrobots/bijou/adapters/test';
import { createSplitPaneState, runScript, stripAnsi, visibleLength } from '@flyingrobots/bijou-tui';
import { createSurface, surfaceToString, type Surface } from '@flyingrobots/bijou';
import { testRuntime } from '../../bijou-tui/src/index.js';
import { createTuiAppSkeleton } from './index.js';

function expectSurface(value: ReturnType<ReturnType<typeof createTuiAppSkeleton>['view']>) {
  if (typeof value === 'string' || !('cells' in value)) {
    throw new Error('expected a surface-native framed app view');
  }
  return value;
}

function textSurface(label: string, width: number, height: number): Surface {
  const surface = createSurface(Math.max(0, width), Math.max(0, height));
  if (width <= 0 || height <= 0) return surface;

  const clipped = label.slice(0, Math.max(0, width));
  for (let index = 0; index < clipped.length; index++) {
    surface.set(index, 0, { char: clipped[index]!, empty: false });
  }
  return surface;
}

describe('createTuiAppSkeleton', () => {
  it('throws when tabs are explicitly empty', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(() => createTuiAppSkeleton({ ctx, tabs: [] })).toThrow(/must contain at least one tab/);
  });

  it('rejects tabs that define both a render callback and layout factory', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(() => createTuiAppSkeleton({
      ctx,
      tabs: [{
        id: 'bad',
        title: 'Bad',
        render: (width, height) => textSurface('render', width, height),
        layout: () => ({
          kind: 'pane',
          paneId: 'bad-main',
          render: (width, height) => textSurface('layout', width, height),
        }),
      }],
    })).toThrow(/cannot define both render and layout/);
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
    expect(stripAnsi(firstString)).toContain('Supplemental drawer');

    const switched = await runScript(app, [{ key: ']' }], { ctx });
    expect(switched.model.activePageId).toBe('split');

    const splitFrame = app.view(switched.model);
    const splitString = surfaceToString(expectSurface(splitFrame), ctx.style);
    const plain = stripAnsi(splitString);
    expect(plain).toContain('Split');
    expect(plain).toContain('Primary workspace');
    expect(plain).toContain('Secondary context');
    expect(plain).toContain('Split ready');
  });

  it('renders consumer-provided tab content inside the stock shell', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const app = createTuiAppSkeleton({
      ctx,
      title: 'Consumer App',
      tabs: [{
        id: 'dashboard',
        title: 'Dashboard',
        render: (width, height, context) =>
          textSurface(`Consumer ${context.tab.title} ${context.model.ready ? 'ready' : 'pending'}`, width, height),
      }],
    });

    const [model] = app.init();
    const output = surfaceToString(expectSurface(app.view(model)), ctx.style);
    const plain = stripAnsi(output);

    expect(plain).toContain('Consumer Dashboard ready');
    expect(plain).toContain('Consumer App');
    expect(plain).not.toContain('Supplemental drawer');
    expect(plain).not.toContain('Primary workspace');
  });

  it('renders consumer-provided layout factories for custom tab topology', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const app = createTuiAppSkeleton({
      ctx,
      tabs: [{
        id: 'layout',
        title: 'Layout',
        layout: () => ({
          kind: 'split',
          splitId: 'consumer-split',
          direction: 'row',
          state: createSplitPaneState({ ratio: 0.5 }),
          paneA: {
            kind: 'pane',
            paneId: 'consumer-left',
            render: (width, height) => textSurface('Consumer left block', width, height),
          },
          paneB: {
            kind: 'pane',
            paneId: 'consumer-right',
            render: (width, height) => textSurface('Consumer right block', width, height),
          },
        }),
      }],
    });

    const [model] = app.init();
    const plain = stripAnsi(surfaceToString(expectSurface(app.view(model)), ctx.style));

    expect(plain).toContain('Consumer left block');
    expect(plain).toContain('Consumer right block');
    expect(plain).not.toContain('Supplemental drawer');
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

    const harness = await testRuntime(app, { ctx });
    await harness.press('q');
    expect(stripAnsi(surfaceToString(harness.frame, ctx.style))).toContain('Quit?');
    expect(harness.messages).toHaveLength(1);

    await harness.press('n');
    expect(stripAnsi(surfaceToString(expectSurface(app.view(harness.model)), ctx.style))).not.toContain('Quit?');
    expect(harness.snapshots.length).toBeGreaterThan(2);
    await harness.teardown();

    const ctrlCOpen = await runScript(app, [{ key: '\x03' }], { ctx });
    expect(stripAnsi(surfaceToString(ctrlCOpen.frames.at(-1)!, ctx.style))).toContain('Quit?');
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

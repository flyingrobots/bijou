import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript, stripAnsi, visibleLength } from '@flyingrobots/bijou-tui';
import { createTuiAppSkeleton } from './index.js';

describe('createTuiAppSkeleton', () => {
  it('throws when tabs are empty', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(() => createTuiAppSkeleton({ ctx, tabs: [] })).toThrow(/must contain at least one tab/);
  });

  it('renders top tabs with pipe separators and a full-width backslash separator row', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const app = createTuiAppSkeleton({
      ctx,
      title: 'Skeleton',
      tabs: [
        { id: 'home', title: 'Home' },
        { id: 'settings', title: 'Settings' },
      ],
      statusMessage: 'Ready',
    });

    const [model] = app.init();
    const output = app.view(model);
    const lines = output.split('\n');

    expect(stripAnsi(lines[0] ?? '')).toContain('Home');
    expect(stripAnsi(lines[0] ?? '')).toContain('|');
    expect(stripAnsi(lines[0] ?? '')).toContain('Settings');

    if (model.rows >= 3) {
      const slashRow = lines[model.rows - 2] ?? '';
      expect(stripAnsi(slashRow)).toBe('\\'.repeat(model.columns));
      expect(visibleLength(slashRow)).toBe(model.columns);
    }
  });

  it('updates footer status based on the active tab', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const app = createTuiAppSkeleton({
      ctx,
      tabs: [
        { id: 'ops', title: 'Ops' },
        { id: 'logs', title: 'Logs' },
      ],
      statusMessage: (state) => `active:${state.activeTabId}`,
    });

    const result = await runScript(app, [{ key: ']' }]);
    const output = app.view(result.model);
    const lines = output.split('\n');
    const footer = lines[result.model.rows - 1] ?? '';

    expect(result.model.activePageId).toBe('logs');
    expect(stripAnsi(footer)).toContain('active:logs');
  });

  it('wires default q quit binding', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const app = createTuiAppSkeleton({
      ctx,
      tabs: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
      ],
    });

    const result = await runScript(app, [{ key: 'q' }, { key: ']' }]);
    expect(result.model.activePageId).toBe('a');
  });
});

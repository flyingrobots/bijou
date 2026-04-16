import { describe, expect, it } from 'vitest';
import { createTestContext } from './adapters/test/index.js';
import { observeTheme } from './context-theme.js';
import { createBijou } from './factory.js';
import { mockRuntime } from './adapters/test/runtime.js';
import { mockIO } from './adapters/test/io.js';
import { plainStyle } from './adapters/test/style.js';

describe('observeTheme()', () => {
  it('observes test-context token graph changes through the public context', () => {
    const ctx = createTestContext();
    const seen: Array<{ path: string, fullReload: boolean }> = [];
    const subscription = observeTheme(ctx, (change) => {
      seen.push({ path: change.path, fullReload: change.fullReload });
      expect(change.ctx).toBe(ctx);
    });

    ctx.tokenGraph.set('semantic.accent', '#123456');

    expect(seen).toEqual([{ path: 'semantic.accent', fullReload: false }]);
    expect(ctx.semantic('accent').hex).toBe('#123456');
    expect(ctx.semantic('accent').fgRGB).toEqual([0x12, 0x34, 0x56]);

    subscription.dispose();
    ctx.tokenGraph.set('semantic.accent', '#654321');
    expect(seen).toHaveLength(1);
  });

  it('marks graph imports as full reloads', () => {
    const ctx = createTestContext();
    const seen: Array<{ path: string, fullReload: boolean }> = [];

    const subscription = observeTheme(ctx, (change) => {
      seen.push({ path: change.path, fullReload: change.fullReload });
    });

    ctx.tokenGraph.import({
      semantic: {
        accent: '#abcdef',
      },
    });

    expect(seen).toEqual([{ path: '*', fullReload: true }]);
    expect(ctx.semantic('accent').hex).toBe('#abcdef');
    expect(ctx.semantic('accent').fgRGB).toEqual([0xab, 0xcd, 0xef]);

    subscription.dispose();
  });
});

describe('context token graph wiring', () => {
  it('createTestContext exposes the same token graph that accessors read', () => {
    const ctx = createTestContext();

    expect(ctx.tokenGraph).toBe(ctx.theme.tokenGraph);

    ctx.tokenGraph.set('semantic.primary', '#112233');
    expect(ctx.semantic('primary').hex).toBe('#112233');
    expect(ctx.semantic('primary').fgRGB).toEqual([0x11, 0x22, 0x33]);
  });

  it('createBijou exposes the same token graph that accessors read', () => {
    const ctx = createBijou({
      runtime: mockRuntime(),
      io: mockIO(),
      style: plainStyle(),
    });

    expect(ctx.tokenGraph).toBe(ctx.theme.tokenGraph);

    ctx.tokenGraph.set('semantic.primary', '#445566');
    expect(ctx.semantic('primary').hex).toBe('#445566');
    expect(ctx.semantic('primary').fgRGB).toEqual([0x44, 0x55, 0x66]);
  });
});

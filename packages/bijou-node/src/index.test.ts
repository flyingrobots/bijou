import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import {
  createNodeContext,
  initDefaultContext,
  startApp,
  _resetInitializedForTesting,
  _registerDefaultContextInitializerForTesting,
} from './index.js';
import { getDefaultContext, stringToSurface, type Surface, type Theme } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createFramedApp, run } from '@flyingrobots/bijou-tui';

function textSurface(text: string): Surface {
  const lines = text.split('\n');
  return stringToSurface(text, Math.max(1, ...lines.map((line) => line.length)), Math.max(1, lines.length));
}

function makeTheme(name: string, primaryHex: string, primaryBg: string, accentHex = '#c084fc'): Theme {
  return {
    name,
    status: {
      success: { hex: '#22c55e' },
      error: { hex: '#ef4444' },
      warning: { hex: '#f59e0b' },
      info: { hex: '#38bdf8' },
      pending: { hex: '#64748b', modifiers: ['dim'] },
      active: { hex: '#38bdf8' },
      muted: { hex: '#64748b', modifiers: ['dim', 'strikethrough'] },
    },
    semantic: {
      success: { hex: '#22c55e' },
      error: { hex: '#ef4444' },
      warning: { hex: '#f59e0b' },
      info: { hex: '#38bdf8' },
      accent: { hex: accentHex },
      muted: { hex: '#94a3b8', modifiers: ['dim'] },
      primary: { hex: primaryHex, modifiers: ['bold'] },
    },
    gradient: {
      brand: [
        { pos: 0, color: [56, 189, 248] },
        { pos: 1, color: [192, 132, 252] },
      ],
      progress: [
        { pos: 0, color: [34, 197, 94] },
        { pos: 1, color: [56, 189, 248] },
      ],
    },
    border: {
      primary: { hex: '#38bdf8' },
      secondary: { hex: accentHex },
      success: { hex: '#22c55e' },
      warning: { hex: '#f59e0b' },
      error: { hex: '#ef4444' },
      muted: { hex: '#64748b' },
    },
    ui: {
      cursor: { hex: '#38bdf8' },
      scrollThumb: { hex: '#38bdf8' },
      scrollTrack: { hex: '#334155' },
      sectionHeader: { hex: primaryHex, modifiers: ['bold'] },
      logo: { hex: '#38bdf8' },
      tableHeader: { hex: primaryHex },
      trackEmpty: { hex: '#1e293b' },
    },
    surface: {
      primary: { hex: primaryHex, bg: primaryBg },
      secondary: { hex: '#e2e8f0', bg: '#1e293b' },
      elevated: { hex: primaryHex, bg: '#334155' },
      overlay: { hex: primaryHex, bg: primaryBg },
      muted: { hex: '#94a3b8', bg: '#020617' },
    },
  };
}

const TEST_THEME: Theme = makeTheme('test-theme', '#f8fafc', '#0f172a');
const LIGHT_THEME: Theme = makeTheme('light-theme', '#0f172a', '#f8fafc', '#2563eb');
const DARK_THEME: Theme = makeTheme('dark-theme', '#f8fafc', '#020617', '#c084fc');

const TEST_THEME_SET = [
  { id: 'light', theme: LIGHT_THEME },
  { id: 'dark', theme: DARK_THEME },
] as const;

const CUSTOM_ID_THEME_SET = [
  { id: 'sunrise', scheme: 'light' as const, theme: LIGHT_THEME },
  { id: 'midnight', scheme: 'dark' as const, theme: DARK_THEME },
] as const;

const UNUSED_THEME: Theme = {
  ...TEST_THEME,
  name: 'unused-theme',
};

const LEGACY_TEST_THEME: Theme = {
  name: 'test-theme',
  status: {
    success: { hex: '#22c55e' },
    error: { hex: '#ef4444' },
    warning: { hex: '#f59e0b' },
    info: { hex: '#38bdf8' },
    pending: { hex: '#64748b', modifiers: ['dim'] },
    active: { hex: '#38bdf8' },
    muted: { hex: '#64748b', modifiers: ['dim', 'strikethrough'] },
  },
  semantic: {
    success: { hex: '#22c55e' },
    error: { hex: '#ef4444' },
    warning: { hex: '#f59e0b' },
    info: { hex: '#38bdf8' },
    accent: { hex: '#c084fc' },
    muted: { hex: '#94a3b8', modifiers: ['dim'] },
    primary: { hex: '#f8fafc', modifiers: ['bold'] },
  },
  gradient: {
    brand: [
      { pos: 0, color: [56, 189, 248] },
      { pos: 1, color: [192, 132, 252] },
    ],
    progress: [
      { pos: 0, color: [34, 197, 94] },
      { pos: 1, color: [56, 189, 248] },
    ],
  },
  border: {
    primary: { hex: '#38bdf8' },
    secondary: { hex: '#c084fc' },
    success: { hex: '#22c55e' },
    warning: { hex: '#f59e0b' },
    error: { hex: '#ef4444' },
    muted: { hex: '#64748b' },
  },
  ui: {
    cursor: { hex: '#38bdf8' },
    scrollThumb: { hex: '#38bdf8' },
    scrollTrack: { hex: '#334155' },
    sectionHeader: { hex: '#f8fafc', modifiers: ['bold'] },
    logo: { hex: '#38bdf8' },
    tableHeader: { hex: '#f8fafc' },
    trackEmpty: { hex: '#1e293b' },
  },
  surface: {
    primary: { hex: '#f8fafc', bg: '#0f172a' },
    secondary: { hex: '#e2e8f0', bg: '#1e293b' },
    elevated: { hex: '#f8fafc', bg: '#334155' },
    overlay: { hex: '#f8fafc', bg: '#0f172a' },
    muted: { hex: '#94a3b8', bg: '#020617' },
  },
};

describe('createNodeContext()', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns BijouContext with all five fields', () => {
    const ctx = createNodeContext();
    expect(ctx.theme).toBeDefined();
    expect(ctx.mode).toBeDefined();
    expect(ctx.runtime).toBeDefined();
    expect(ctx.io).toBeDefined();
    expect(ctx.style).toBeDefined();
  });

  it('theme is resolved with a name', () => {
    const ctx = createNodeContext();
    expect(typeof ctx.theme.theme.name).toBe('string');
    expect(typeof ctx.theme.noColor).toBe('boolean');
  });

  it('mode is a valid OutputMode', () => {
    const ctx = createNodeContext();
    expect(['interactive', 'static', 'pipe', 'accessible']).toContain(ctx.mode);
  });

  it('runtime reads process.env', () => {
    vi.stubEnv('__BIJOU_TEST_CTX__', 'test-value');
    const ctx = createNodeContext();
    expect(ctx.runtime.env('__BIJOU_TEST_CTX__')).toBe('test-value');
  });

  it('respects NO_COLOR env var', () => {
    vi.stubEnv('NO_COLOR', '1');
    const ctx = createNodeContext();
    expect(ctx.theme.noColor).toBe(true);
  });

  it('uses an explicit theme override when provided', () => {
    const ctx = createNodeContext({ theme: LEGACY_TEST_THEME });
    expect(ctx.theme.theme.name).toBe('test-theme');
    expect(ctx.theme.theme.surface.primary.bg).toBe('#0f172a');
  });

  it('selects the matching theme from a named theme set for explicit dark mode', () => {
    const ctx = createNodeContext({ themes: TEST_THEME_SET, themeMode: 'dark' });
    expect(ctx.theme.theme.name).toBe('dark-theme');
  });

  it('detects light mode automatically for a named theme set', () => {
    vi.stubEnv('COLORFGBG', '0;15');
    const ctx = createNodeContext({ themes: TEST_THEME_SET, themeMode: 'auto' });
    expect(ctx.theme.theme.name).toBe('light-theme');
  });

  it('supports custom theme ids when a scheme hint is provided', () => {
    const ctx = createNodeContext({ themes: CUSTOM_ID_THEME_SET, themeMode: 'dark' });
    expect(ctx.theme.theme.name).toBe('dark-theme');
  });

  it('lets BIJOU_THEME select a named theme from the provided set', () => {
    vi.stubEnv('BIJOU_THEME', 'light');
    const ctx = createNodeContext({ themes: TEST_THEME_SET, themeMode: 'dark' });
    expect(ctx.theme.theme.name).toBe('light-theme');
  });

  it('lets an explicit themeOverride beat BIJOU_THEME for theme sets', () => {
    vi.stubEnv('BIJOU_THEME', 'dark');
    const ctx = createNodeContext({
      themes: TEST_THEME_SET,
      themeOverride: 'light',
      themeMode: 'dark',
      theme: UNUSED_THEME,
    });
    expect(ctx.theme.theme.name).toBe('light-theme');
  });
});

describe('initDefaultContext()', () => {
  beforeEach(() => {
    _resetInitializedForTesting();
    _resetDefaultContextForTesting();
    _registerDefaultContextInitializerForTesting();
  });

  afterEach(() => {
    _resetInitializedForTesting();
    _resetDefaultContextForTesting();
    _registerDefaultContextInitializerForTesting();
  });

  it('first call returns a BijouContext with all five fields', () => {
    const ctx = initDefaultContext();
    expect(ctx.theme).toBeDefined();
    expect(ctx.mode).toBeDefined();
    expect(ctx.runtime).toBeDefined();
    expect(ctx.io).toBeDefined();
    expect(ctx.style).toBeDefined();
  });

  it('first call sets the default context', () => {
    const ctx = initDefaultContext();
    expect(getDefaultContext()).toBe(ctx);
  });

  it('subsequent call returns a new context without overwriting the default', () => {
    const first = initDefaultContext();
    const second = initDefaultContext();
    expect(second).not.toBe(first);
    expect(getDefaultContext()).toBe(first);
  });

  it('registers an explicit theme override as the default on first call', () => {
    const ctx = initDefaultContext({ theme: LEGACY_TEST_THEME });
    expect(ctx.theme.theme.name).toBe('test-theme');
    expect(getDefaultContext()).toBe(ctx);
  });

  it('registers the auto-selected theme from a theme set on first call', () => {
    vi.stubEnv('COLORFGBG', '0;15');
    const ctx = initDefaultContext({ themes: TEST_THEME_SET, themeMode: 'auto' });
    expect(ctx.theme.theme.name).toBe('light-theme');
    expect(getDefaultContext()).toBe(ctx);
  });
});

describe('startApp()', () => {
  beforeEach(() => {
    _resetInitializedForTesting();
    _resetDefaultContextForTesting();
    _registerDefaultContextInitializerForTesting();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    _resetInitializedForTesting();
    _resetDefaultContextForTesting();
    _registerDefaultContextInitializerForTesting();
    vi.unstubAllEnvs();
  });

  it('initializes the default node context automatically when ctx is omitted', async () => {
    vi.stubEnv('TERM', 'dumb');
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    await startApp({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('hello from startApp'),
    });

    expect(getDefaultContext()).toBeDefined();
    expect(spy).toHaveBeenCalledWith('hello from startApp');
    spy.mockRestore();
  });

  it('uses an explicit ctx without overwriting the existing default context', async () => {
    vi.stubEnv('TERM', 'dumb');
    const defaultCtx = initDefaultContext();
    const explicitCtx = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } });
    const writeSpy = vi.spyOn(explicitCtx.io, 'write');

    await startApp({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('explicit ctx path'),
    }, { ctx: explicitCtx });

    expect(getDefaultContext()).toBe(defaultCtx);
    expect(writeSpy).toHaveBeenCalledWith('explicit ctx path');
  });

  it('lets run() resolve the Node default context without a manual init step', async () => {
    vi.stubEnv('TERM', 'dumb');
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    await run({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('hello from ambient run'),
    });

    expect(getDefaultContext()).toBeDefined();
    expect(spy).toHaveBeenCalledWith('hello from ambient run');
    spy.mockRestore();
  });

  it('delegates to self-running framed apps instead of bypassing their hosted runner', async () => {
    const ctx = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } });
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (_msg, model) => [model, []],
        layout: () => ({
          kind: 'pane',
          paneId: 'main',
          render: () => textSurface('framed through startApp'),
        }),
      }],
    });
    const runSpy = vi.spyOn(app, 'run');

    await startApp(app, { ctx });

    expect(runSpy).toHaveBeenCalledWith({ ctx });
    expect(ctx.io.written.some((chunk) => chunk.includes('framed through startApp'))).toBe(true);
  });

  it('creates and registers a themed default context when startApp() receives a theme override', async () => {
    vi.stubEnv('TERM', 'dumb');
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    await startApp({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('hello from themed startApp'),
    }, { theme: TEST_THEME });

    expect(getDefaultContext()?.theme.theme.name).toBe('test-theme');
    expect(spy).toHaveBeenCalledWith('hello from themed startApp');
    spy.mockRestore();
  });

  it('creates and registers the auto-selected theme from a theme set when startApp() receives themes', async () => {
    vi.stubEnv('TERM', 'dumb');
    vi.stubEnv('COLORFGBG', '0;15');
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    await startApp({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('hello from auto themed startApp'),
    }, { themes: TEST_THEME_SET, themeMode: 'auto' });

    expect(getDefaultContext()?.theme.theme.name).toBe('light-theme');
    expect(spy).toHaveBeenCalledWith('hello from auto themed startApp');
    spy.mockRestore();
  });

  it('prefers an explicit ctx over a theme override when both are provided', async () => {
    vi.stubEnv('TERM', 'dumb');
    const explicitCtx = createTestContext({ mode: 'pipe', runtime: { columns: 40, rows: 10 } });
    const writeSpy = vi.spyOn(explicitCtx.io, 'write');

    await startApp({
      init: () => [0, []],
      update: (_msg, model) => [model, []],
      view: () => textSurface('explicit ctx beats theme'),
    }, { ctx: explicitCtx, theme: TEST_THEME });

    expect(getDefaultContext()).not.toBe(explicitCtx);
    expect(writeSpy).toHaveBeenCalledWith('explicit ctx beats theme');
  });
});

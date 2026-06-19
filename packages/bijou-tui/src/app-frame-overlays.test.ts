import { describe, expect, it } from 'vitest';
import { CYAN_MAGENTA, TEAL_ORANGE_PINK, createResolved, type Theme } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { FrameShellTheme, FrameShellThemeChange, FrameShellThemeFamily, FrameShellThemeSpec } from './app-frame.js';
import { createKeyMap } from './keybindings.js';
import {
  mergeShellThemeSettings,
  renderHelpOverlay,
  resolveFrameShellThemeChoices,
  resolveCurrentShellTheme,
  resolveNextShellTheme,
  type ResolvedFrameShellTheme,
} from './app-frame-overlays.js';

function shellTheme(
  id: string,
  label: string,
  resolvedTheme: ReturnType<typeof createResolved>,
): ResolvedFrameShellTheme {
  return {
    id,
    label,
    shellTheme: {
      id,
      label,
      theme: resolvedTheme.theme,
    },
    shellThemeSpec: {
      id,
      label,
      theme: resolvedTheme.theme,
    },
    shellThemeId: id,
    shellThemeLabel: label,
    resolvedTheme,
  };
}

function requireConcreteShellThemeTheme(shellTheme: FrameShellTheme): Theme {
  return shellTheme.theme;
}

function requireConcreteShellThemeChange(change: FrameShellThemeChange): Theme {
  return change.shellTheme.theme;
}

describe('app-frame-overlays', () => {
  it('resolves current and next shell themes by stable id', () => {
    const themes = [
      shellTheme('default', 'Default', createResolved(CYAN_MAGENTA, false)),
      shellTheme('citrus', 'Citrus', createResolved(TEAL_ORANGE_PINK, false)),
    ] as const;

    expect(resolveCurrentShellTheme(themes, 'citrus')?.label).toBe('Citrus');
    expect(resolveCurrentShellTheme(themes, 'missing')?.label).toBe('Default');
    expect(resolveNextShellTheme(themes, 'default')?.id).toBe('citrus');
    expect(resolveNextShellTheme(themes, 'citrus')?.id).toBe('default');
  });

  it('flattens mode-aware shell themes into stable family and mode choices', () => {
    const ctx = { theme: createResolved(CYAN_MAGENTA, false, 'dark') };

    const choices = resolveFrameShellThemeChoices([
      {
        id: 'dogfood',
        label: 'DOGFOOD',
        modes: [
          { id: 'dark', label: 'Dark', theme: CYAN_MAGENTA },
          { id: 'light', label: 'Light', theme: TEAL_ORANGE_PINK },
        ],
      },
    ], ctx);

    expect(choices.map((choice) => choice.id)).toEqual(['dogfood:dark', 'dogfood:light']);
    expect(choices[0]).toMatchObject({
      id: 'dogfood:dark',
      label: 'DOGFOOD / Dark',
      shellThemeId: 'dogfood',
      shellThemeLabel: 'DOGFOOD',
      modeId: 'dark',
      modeLabel: 'Dark',
    });
    expect(choices[0]?.shellTheme.id).toBe('dogfood:dark');
    expect(choices[0]?.shellTheme.theme).toBe(CYAN_MAGENTA);
    expect(choices[0]?.shellThemeSpec.id).toBe('dogfood');
    expect(choices[0]?.resolvedTheme.theme).toBe(CYAN_MAGENTA);
    expect(choices[1]?.resolvedTheme.theme).toBe(TEAL_ORANGE_PINK);
  });

  it('keeps concrete shell theme specs source-compatible while accepting mode families', () => {
    const concrete = {
      id: 'default',
      label: 'Default',
      theme: CYAN_MAGENTA,
    } satisfies FrameShellTheme;
    const family = {
      id: 'dogfood',
      label: 'DOGFOOD',
      modes: [
        { id: 'dark', label: 'Dark', theme: CYAN_MAGENTA },
        { id: 'light', label: 'Light', theme: TEAL_ORANGE_PINK },
      ],
    } satisfies FrameShellThemeFamily;
    const specs: readonly FrameShellThemeSpec[] = [concrete, family];
    const change = {
      shellTheme: {
        id: 'dogfood:dark',
        label: 'DOGFOOD / Dark',
        theme: CYAN_MAGENTA,
      },
      shellThemeSpec: family,
      shellThemeId: 'dogfood',
      shellThemeLabel: 'DOGFOOD',
      modeId: 'dark',
      modeLabel: 'Dark',
      ctx: createTestContext(),
    } satisfies FrameShellThemeChange;

    expect(requireConcreteShellThemeTheme(concrete)).toBe(CYAN_MAGENTA);
    expect(requireConcreteShellThemeChange(change)).toBe(CYAN_MAGENTA);
    expect(specs.map((spec) => spec.id)).toEqual(['default', 'dogfood']);
  });

  it('merges a stock shell-theme row into the shell settings section', () => {
    const themes = [
      shellTheme('default', 'Default', createResolved(CYAN_MAGENTA, false)),
      shellTheme('citrus', 'Citrus', createResolved(TEAL_ORANGE_PINK, false)),
    ] as const;

    const settings = mergeShellThemeSettings(
      {
        title: 'Settings',
        sections: [{ id: 'shell', title: 'Shell', rows: [] }],
      },
      themes,
      'default',
      undefined,
    );

    expect(settings?.sections[0]?.rows).toHaveLength(1);
    expect(settings?.sections[0]?.rows[0]).toMatchObject({
      id: '__frame-shell-theme__',
      label: 'Shell theme',
      valueLabel: 'Default',
    });
  });

  it('renders a bounded help overlay and clamps overscroll', () => {
    const helpKeys = createKeyMap<{ type: 'quit' }>()
      .bind('q', 'Quit', { type: 'quit' })
      .bind('up', 'Scroll up', { type: 'quit' })
      .bind('down', 'Scroll down', { type: 'quit' })
      .bind('g', 'Top', { type: 'quit' })
      .bind('shift+g', 'Bottom', { type: 'quit' });

    const overlay = renderHelpOverlay(
      { columns: 40, rows: 12, helpScrollY: 999 },
      helpKeys,
    );

    expect(overlay.body.width).toBeLessThanOrEqual(36);
    expect(overlay.body.height).toBeLessThanOrEqual(8);
    expect(overlay.scrollY).toBe(overlay.maxScrollY);
  });
});

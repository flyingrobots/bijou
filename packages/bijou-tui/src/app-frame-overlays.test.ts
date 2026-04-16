import { describe, expect, it } from 'vitest';
import { CYAN_MAGENTA, TEAL_ORANGE_PINK, createResolved } from '@flyingrobots/bijou';
import { createKeyMap } from './keybindings.js';
import {
  mergeShellThemeSettings,
  renderHelpOverlay,
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
    resolvedTheme,
  };
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

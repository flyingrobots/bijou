import { createResolved, type Theme } from '@flyingrobots/bijou';
import type { FrameShellTheme, FrameShellThemeChange } from './app-frame.js';
import type { ResolvedFrameShellTheme } from './app-frame-overlays.js';

export function shellTheme(
  id: string,
  label: string,
  resolvedTheme: ReturnType<typeof createResolved>,
): ResolvedFrameShellTheme {
  return {
    id,
    label,
    shellTheme: { id, label, theme: resolvedTheme.theme },
    shellThemeSpec: { id, label, theme: resolvedTheme.theme },
    shellThemeId: id,
    shellThemeLabel: label,
    resolvedTheme,
  };
}

export function requireConcreteShellThemeTheme(shellTheme: FrameShellTheme): Theme {
  return shellTheme.theme;
}

export function requireConcreteShellThemeChange(change: FrameShellThemeChange): Theme {
  return change.shellTheme.theme;
}

import {
  createResolved,
  type BijouContext,
} from '@flyingrobots/bijou';
import type { FrameShellThemeSpec } from './app-frame.js';
import type { ResolvedFrameShellTheme } from './app-frame-overlay-contract.js';

export function frameShellThemeChoiceId(
  shellThemeId: string,
  modeId?: string,
): string {
  return modeId === undefined ? shellThemeId : `${shellThemeId}:${modeId}`;
}

export function resolveFrameShellThemeChoices(
  shellThemes: readonly FrameShellThemeSpec[],
  ctx: Pick<BijouContext, 'theme'>,
): readonly ResolvedFrameShellTheme[] {
  const choices: ResolvedFrameShellTheme[] = [];
  const seen = new Set<string>();
  for (const shellTheme of shellThemes) {
    const modes = shellTheme.modes ?? [];
    const hasLegacyTheme = shellTheme.theme !== undefined;
    if (hasLegacyTheme && modes.length > 0) {
      throw new Error(
        `createFramedApp: shellTheme "${shellTheme.id}" cannot define both theme and modes`,
      );
    }
    if (!hasLegacyTheme && modes.length === 0) {
      throw new Error(
        `createFramedApp: shellTheme "${shellTheme.id}" requires theme or modes`,
      );
    }
    if (hasLegacyTheme) {
      const id = frameShellThemeChoiceId(shellTheme.id);
      assertUniqueChoice(seen, id);
      choices.push({
        id,
        label: shellTheme.label,
        description: shellTheme.description,
        shellTheme,
        shellThemeSpec: shellTheme,
        shellThemeId: shellTheme.id,
        shellThemeLabel: shellTheme.label,
        resolvedTheme: createResolved(
          shellTheme.theme,
          ctx.theme.noColor,
          ctx.theme.colorScheme,
        ),
      });
      continue;
    }
    for (const mode of modes) {
      const id = frameShellThemeChoiceId(shellTheme.id, mode.id);
      assertUniqueChoice(seen, id);
      const label = `${shellTheme.label} / ${mode.label}`;
      const description = mode.description ?? shellTheme.description;
      choices.push({
        id,
        label,
        description,
        shellTheme: {
          id,
          label,
          description,
          theme: mode.theme,
        },
        shellThemeSpec: shellTheme,
        shellThemeId: shellTheme.id,
        shellThemeLabel: shellTheme.label,
        modeId: mode.id,
        modeLabel: mode.label,
        resolvedTheme: createResolved(
          mode.theme,
          ctx.theme.noColor,
          ctx.theme.colorScheme,
        ),
      });
    }
  }
  return Object.freeze(choices);
}

export function resolveCurrentShellTheme(
  shellThemes: readonly ResolvedFrameShellTheme[],
  activeShellThemeId: string | undefined,
): ResolvedFrameShellTheme | undefined {
  return (
    shellThemes.find((theme) => theme.id === activeShellThemeId) ??
    shellThemes[0]
  );
}

export function resolveNextShellTheme(
  shellThemes: readonly ResolvedFrameShellTheme[],
  activeShellThemeId: string | undefined,
): ResolvedFrameShellTheme | undefined {
  if (shellThemes.length === 0) return undefined;
  const index = Math.max(
    0,
    shellThemes.findIndex((theme) => theme.id === activeShellThemeId),
  );
  return shellThemes[(index + 1) % shellThemes.length];
}

export function resolveShellThemeModeToggle(
  shellThemes: readonly ResolvedFrameShellTheme[],
  activeShellThemeId: string | undefined,
): ResolvedFrameShellTheme | undefined {
  const current = resolveCurrentShellTheme(shellThemes, activeShellThemeId);
  if (current?.modeId == null) return undefined;
  const siblings = shellThemes.filter(
    (theme) =>
      theme.shellThemeId === current.shellThemeId && theme.modeId != null,
  );
  if (siblings.length < 2) return undefined;
  const oppositeId =
    current.modeId === 'dark'
      ? 'light'
      : current.modeId === 'light'
        ? 'dark'
        : undefined;
  const opposite = siblings.find((theme) => theme.modeId === oppositeId);
  if (opposite != null) return opposite;
  const index = Math.max(
    0,
    siblings.findIndex((theme) => theme.id === current.id),
  );
  return siblings[(index + 1) % siblings.length];
}

export function resolveShellThemeForContext(
  shellThemes: readonly ResolvedFrameShellTheme[],
  ctx: BijouContext | undefined,
): ResolvedFrameShellTheme | undefined {
  return ctx == null
    ? undefined
    : shellThemes.find(
        (theme) => theme.resolvedTheme.theme === ctx.theme.theme,
      );
}

function assertUniqueChoice(seen: Set<string>, id: string): void {
  if (seen.has(id)) {
    throw new Error(`createFramedApp: duplicate shell theme choice id "${id}"`);
  }
  seen.add(id);
}

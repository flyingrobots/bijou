import { REQUIRED_MODES, assertNonEmpty } from './builder.part01.js';
import type { ThemeBuilder, ThemeBuilderModeId, ThemeModeBuilder, ThemeTokenRef, TokenTheme, TokenThemeMode } from './builder.part01.js';
import { MutableThemeModeBuilder, sortedTokenIds } from './builder.part02.js';

class MutableThemeBuilder implements ThemeBuilder {
  private themeId: string | undefined;
  private themeLabel: string | undefined;
  private readonly modes = new Map<string, MutableThemeModeBuilder>();

  id(id: string): ThemeBuilder {
    assertNonEmpty(id, 'Theme id');
    this.themeId = id;
    return this;
  }

  label(label: string): ThemeBuilder {
    assertNonEmpty(label, 'Theme label');
    this.themeLabel = label;
    return this;
  }

  mode(id: ThemeBuilderModeId, configure: (mode: ThemeModeBuilder) => void): ThemeBuilder {
    assertNonEmpty(id, 'Theme mode id');
    if (this.modes.has(id)) {
      throw new Error(`Duplicate theme mode "${id}".`);
    }
    const mode = new MutableThemeModeBuilder(id);
    configure(mode);
    this.modes.set(id, mode);
    return this;
  }

  build(): TokenTheme {
    if (this.themeId === undefined) {
      throw new Error('Theme id is required.');
    }

    for (const requiredMode of REQUIRED_MODES) {
      if (!this.modes.has(requiredMode)) {
        throw new Error(`Missing required theme mode "${requiredMode}".`);
      }
    }

    const tokenIds = sortedTokenIds(this.modes);
    for (const [modeId, mode] of this.modes) {
      for (const tokenId of tokenIds) {
        if (!mode.hasToken(tokenId)) {
          throw new Error(`Mode "${modeId}" is missing token "${tokenId}".`);
        }
      }
    }

    const modes: Record<string, TokenThemeMode> = {};
    for (const [modeId, mode] of this.modes) {
      modes[modeId] = mode.build();
    }

    const built: TokenTheme = {
      kind: 'bijou.token-theme',
      id: this.themeId,
      ...(this.themeLabel === undefined ? {} : { label: this.themeLabel }),
      requiredModes: REQUIRED_MODES,
      modes: Object.freeze(modes),
      tokenIds: Object.freeze(tokenIds),
    };
    return Object.freeze(built);
  }
}

export function defineTheme(): ThemeBuilder {
  return new MutableThemeBuilder();
}

export function tokenRef(id: string): ThemeTokenRef {
  assertNonEmpty(id, 'Token id');
  return Object.freeze({
    kind: 'bijou.theme-token-ref' as const,
    id,
  });
}

export function isTokenRef(value: unknown): value is ThemeTokenRef {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && 'kind' in value && value.kind === 'bijou.theme-token-ref'
    && 'id' in value && typeof value.id === 'string';
}

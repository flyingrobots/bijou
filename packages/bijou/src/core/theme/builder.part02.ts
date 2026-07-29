import { hexToRgb, rgbToHex } from './color.js';
import { assertNonEmpty, freezeColorValue, from } from './builder.part01.js';
import type { ThemeColorInput, ThemeColorTokenValue, ThemeModeBuilder, ThemeModeTokenColorBuilder, ThemeModeTokenDraftBuilder, ThemeModeTokenIdBuilder, ThemeModeTokenRegistrationBuilder, TokenThemeMode } from './builder.part01.js';

function normalizeColorInput(value: ThemeColorInput): ThemeColorTokenValue {
  if (typeof value === 'string') {
    const rgb = hexToRgb(value);
    return freezeColorValue({ hex: rgbToHex(rgb), rgb });
  }

  if (Array.isArray(value)) {
    return from(value);
  }

  return from([value.r, value.g, value.b]);
}

class MutableThemeModeBuilder implements ThemeModeBuilder {
  private readonly tokens = new Map<string, ThemeColorTokenValue>();

  constructor(private readonly modeId: string) {}

  token(): ThemeModeTokenIdBuilder;
  token(id: string): ThemeModeTokenColorBuilder;
  token(id?: string): ThemeModeTokenColorBuilder | ThemeModeTokenIdBuilder {
    if (id === undefined) {
      return new DraftTokenBuilder(this);
    }
    assertNonEmpty(id, 'Token id');
    return new ShortTokenBuilder(this, id);
  }

  registerToken(id: string, value: ThemeColorInput): ThemeModeBuilder {
    assertNonEmpty(id, 'Token id');
    if (this.tokens.has(id)) {
      throw new Error(`Duplicate token "${id}" in mode "${this.modeId}".`);
    }
    this.tokens.set(id, normalizeColorInput(value));
    return this;
  }

  hasToken(id: string): boolean {
    return this.tokens.has(id);
  }

  tokenIds(): readonly string[] {
    return [...this.tokens.keys()];
  }

  build(): TokenThemeMode {
    const tokens: Record<string, ThemeColorTokenValue> = {};
    for (const [id, value] of this.tokens) {
      tokens[id] = freezeColorValue(value);
    }

    return Object.freeze({
      id: this.modeId,
      tokens: Object.freeze(tokens),
    });
  }
}

class ShortTokenBuilder implements ThemeModeTokenColorBuilder {
  constructor(
    private readonly mode: MutableThemeModeBuilder,
    private readonly tokenId: string,
  ) {}

  color(value: ThemeColorInput): ThemeModeBuilder {
    return this.mode.registerToken(this.tokenId, value);
  }
}

class DraftTokenBuilder implements ThemeModeTokenIdBuilder {
  constructor(private readonly mode: MutableThemeModeBuilder) {}

  id(id: string): ThemeModeTokenDraftBuilder {
    assertNonEmpty(id, 'Token id');
    return new DraftTokenColorBuilder(this.mode, id);
  }
}

class DraftTokenColorBuilder implements ThemeModeTokenDraftBuilder {
  constructor(
    private readonly mode: MutableThemeModeBuilder,
    private readonly tokenId: string,
  ) {}

  color(value: ThemeColorInput): ThemeModeTokenRegistrationBuilder {
    return new DraftTokenRegistrationBuilder(this.mode, this.tokenId, value);
  }
}

class DraftTokenRegistrationBuilder implements ThemeModeTokenRegistrationBuilder {
  constructor(
    private readonly mode: MutableThemeModeBuilder,
    private readonly tokenId: string,
    private readonly value: ThemeColorInput,
  ) {}

  register(): ThemeModeBuilder {
    return this.mode.registerToken(this.tokenId, this.value);
  }
}

function sortedTokenIds(modes: ReadonlyMap<string, MutableThemeModeBuilder>): string[] {
  return [...new Set([...modes.values()].flatMap(mode => mode.tokenIds()))].sort();
}

export { MutableThemeModeBuilder, normalizeColorInput, sortedTokenIds };

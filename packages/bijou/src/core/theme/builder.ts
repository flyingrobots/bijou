import { hexToRgb, rgbToHex } from './color.js';
import type { RGB } from './tokens.js';

export type ThemeBuilderRequiredMode = 'dark' | 'light';
export type ThemeBuilderModeId = ThemeBuilderRequiredMode | (string & {});

export interface ThemeRgbObject {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export type ThemeColorInput = string | RGB | ThemeRgbObject;

export interface ThemeColorTokenValue {
  readonly hex: string;
  readonly rgb: RGB;
}

export interface TokenThemeMode {
  readonly id: string;
  readonly tokens: Readonly<Record<string, ThemeColorTokenValue>>;
}

export interface TokenTheme {
  readonly kind: 'bijou.token-theme';
  readonly id: string;
  readonly label?: string;
  readonly requiredModes: readonly ThemeBuilderRequiredMode[];
  readonly modes: Readonly<Record<string, TokenThemeMode>>;
  readonly tokenIds: readonly string[];
}

export interface ThemeTokenRef {
  readonly kind: 'bijou.theme-token-ref';
  readonly id: string;
}

export type ThemeColorRef = ThemeColorInput | ThemeTokenRef;

export interface ThemeBuilder {
  id(id: string): ThemeBuilder;
  label(label: string): ThemeBuilder;
  mode(id: ThemeBuilderModeId, configure: (mode: ThemeModeBuilder) => ThemeModeBuilder | unknown): ThemeBuilder;
  build(): TokenTheme;
}

export interface ThemeModeBuilder {
  token(): ThemeModeTokenIdBuilder;
  token(id: string): ThemeModeTokenColorBuilder;
}

export interface ThemeModeTokenColorBuilder {
  color(value: ThemeColorInput): ThemeModeBuilder;
}

export interface ThemeModeTokenIdBuilder {
  id(id: string): ThemeModeTokenDraftBuilder;
}

export interface ThemeModeTokenDraftBuilder {
  color(value: ThemeColorInput): ThemeModeTokenRegistrationBuilder;
}

export interface ThemeModeTokenRegistrationBuilder {
  register(): ThemeModeBuilder;
}

export interface ResolveThemeColorRefOptions {
  readonly theme: TokenTheme;
  readonly mode: ThemeBuilderModeId;
  readonly unresolved?: 'throw' | 'fallback';
  readonly fallback?: ThemeColorInput;
}

interface ThemeTokenColorResolution {
  readonly source: 'theme';
  readonly themeId: string;
  readonly mode: string;
  readonly tokenId: string;
  readonly hex: string;
  readonly rgb: RGB;
  readonly fallback: false;
}

interface RawThemeColorResolution {
  readonly source: 'raw-color';
  readonly themeId: string;
  readonly mode: string;
  readonly hex: string;
  readonly rgb: RGB;
  readonly fallback: false;
}

interface FallbackThemeColorResolution {
  readonly source: 'fallback';
  readonly themeId: string;
  readonly mode: string;
  readonly tokenId: string;
  readonly hex: string;
  readonly rgb: RGB;
  readonly fallback: true;
}

export type ThemeColorResolution =
  | ThemeTokenColorResolution
  | RawThemeColorResolution
  | FallbackThemeColorResolution;

const REQUIRED_MODES: readonly ThemeBuilderRequiredMode[] = Object.freeze(['dark', 'light']);

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
  return typeof value === 'object'
    && value !== null
    && (value as ThemeTokenRef).kind === 'bijou.theme-token-ref'
    && typeof (value as ThemeTokenRef).id === 'string';
}

export function resolveThemeColorRef(
  ref: ThemeColorRef,
  options: ResolveThemeColorRefOptions,
): ThemeColorResolution {
  if (!isTokenRef(ref)) {
    const color = normalizeColorInput(ref);
    return Object.freeze({
      source: 'raw-color' as const,
      themeId: options.theme.id,
      mode: options.mode,
      hex: color.hex,
      rgb: copyRgb(color.rgb),
      fallback: false as const,
    });
  }

  const mode = options.theme.modes[options.mode];
  if (mode === undefined) {
    throw new Error(`Unknown theme mode "${options.mode}" for theme "${options.theme.id}".`);
  }

  const token = mode.tokens[ref.id];
  if (token !== undefined) {
    return Object.freeze({
      source: 'theme' as const,
      themeId: options.theme.id,
      mode: options.mode,
      tokenId: ref.id,
      hex: token.hex,
      rgb: copyRgb(token.rgb),
      fallback: false as const,
    });
  }

  if (options.unresolved === 'fallback') {
    if (options.fallback === undefined) {
      throw new Error(`Fallback color is required for unresolved token "${ref.id}".`);
    }
    const fallback = normalizeColorInput(options.fallback);
    return Object.freeze({
      source: 'fallback' as const,
      themeId: options.theme.id,
      mode: options.mode,
      tokenId: ref.id,
      hex: fallback.hex,
      rgb: copyRgb(fallback.rgb),
      fallback: true as const,
    });
  }

  throw new Error(`Unresolved theme token "${ref.id}" for mode "${options.mode}" in theme "${options.theme.id}".`);
}

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

  mode(id: ThemeBuilderModeId, configure: (mode: ThemeModeBuilder) => ThemeModeBuilder | unknown): ThemeBuilder {
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
    for (const requiredMode of REQUIRED_MODES) {
      const mode = this.modes.get(requiredMode)!;
      for (const tokenId of tokenIds) {
        if (!mode.hasToken(tokenId)) {
          throw new Error(`Mode "${requiredMode}" is missing token "${tokenId}".`);
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

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

function sortedTokenIds(modes: ReadonlyMap<string, MutableThemeModeBuilder>): string[] {
  return [...new Set([...modes.values()].flatMap(mode => mode.tokenIds()))].sort();
}

function normalizeColorInput(value: ThemeColorInput): ThemeColorTokenValue {
  if (typeof value === 'string') {
    const rgb = hexToRgb(value);
    return freezeColorValue({ hex: rgbToHex(rgb), rgb });
  }

  if (Array.isArray(value)) {
    return fromRgb(value);
  }

  return fromRgb([value.r, value.g, value.b]);
}

function fromRgb(value: readonly number[]): ThemeColorTokenValue {
  if (
    value.length !== 3
    || value.some(channel => !Number.isInteger(channel) || channel < 0 || channel > 255)
  ) {
    throw new Error('RGB channels must be integers from 0 to 255.');
  }
  const rgb: RGB = [value[0]!, value[1]!, value[2]!];
  return freezeColorValue({ hex: rgbToHex(rgb), rgb });
}

function freezeColorValue(value: ThemeColorTokenValue): ThemeColorTokenValue {
  return Object.freeze({
    hex: value.hex,
    rgb: copyRgb(value.rgb),
  });
}

function copyRgb(value: readonly number[]): RGB {
  return Object.freeze([value[0]!, value[1]!, value[2]!] as RGB) as RGB;
}

import type {
  BijouContext,
  TextModifier,
  Theme,
} from '../../packages/bijou/src/index.js';
import type { FrameModel } from '../../packages/bijou-tui/src/index.js';
import type { I18nRuntime, LocalizationPort } from '../../packages/bijou-i18n/src/index.js';

export type LandingQualityMode = 'auto' | 'quality' | 'balanced' | 'performance';
export type LandingQualityProfileId = 'full' | 'balanced' | 'ultra';
export type Rgb = [number, number, number];

export interface LandingThemeSeed {
  readonly id: string;
  readonly background: string;
  readonly waveGradient: readonly [string, string, string];
  readonly logoGradient: readonly [string, string, string];
}

export interface LandingThemeTokens {
  readonly id: string;
  readonly label: string;
  readonly background: string;
  readonly waveRamp: readonly string[];
  readonly logoRamp: readonly string[];
  readonly promptBodyColor: string;
  readonly promptAccentColor: string;
  readonly footerMutedColor: string;
  readonly footerStrongColor: string;
  readonly fpsColor: string;
}

export interface LandingToastState {
  readonly message: string;
  readonly expiresAtMs: number;
}

export interface LandingQualityProfile {
  readonly id: LandingQualityProfileId;
  readonly maxArea: number;
  readonly frameStepMs: number;
  readonly fpsStep: number;
  readonly backgroundTile: number;
  readonly logoTile: number;
}

export interface LandingTextModifiers {
  readonly dim: TextModifier[];
  readonly bold: TextModifier[];
  readonly dimStrikethrough: TextModifier[];
}

export interface LandingQualityPageState {
  readonly landingQualityMode: LandingQualityMode;
}

export interface LandingModel {
  readonly columns: number;
  readonly rows: number;
  readonly landingTimeMs: number;
  readonly landingFps: number;
  readonly landingThemeIndex: number;
  readonly landingToast?: LandingToastState;
  readonly docsModel: FrameModel<LandingQualityPageState>;
}

export interface LandingRendererOptions {
  readonly getCtx: () => BijouContext;
  readonly localization: LocalizationPort;
  readonly textModifiers: LandingTextModifiers;
  readonly versionText: string;
}

export interface LandingPerfHudModel {
  readonly columns: number;
  readonly rows: number;
  readonly docsModel: Pick<FrameModel<LandingQualityPageState>,
    'frameTimeMs' | 'viewTimeMs' | 'diffTimeMs'>;
}

export interface LandingShellThemeChoice {
  readonly id: string;
  readonly label: string;
  readonly theme: Theme;
}

export interface LandingPerfHudOptions {
  readonly ctx: BijouContext;
  readonly i18n?: I18nRuntime;
}

import {
  colorHex,
  type Cell,
  type Surface,
} from '../../packages/bijou/src/index.js';
import {
  clamp01,
  mixHexColor,
  oppositeHexColor,
  rgbHex,
  sampleColorRamp,
} from './app-landing-colors.js';
import type { LandingTextModifiers, LandingThemeTokens } from './app-landing-types.js';

const LANDING_FLYING_ROBOTS_FADE_DELAY_MS = 3000;
const LANDING_FLYING_ROBOTS_FADE_DURATION_MS = 1000;
const LANDING_BIJOU_LOGO_LETTER_COUNT = 5;
const LANDING_BIJOU_LOGO_WAVE_AMPLITUDE_ROWS = 1.35;
const LANDING_LOGO_OVERLAY_MASK = { char: true, fg: true, modifiers: true } as const;
interface LandingLogoOverlayOptions {
  readonly foregroundSample?: 'visible-cell' | 'background-cell';
  readonly opacity?: number;
  readonly yOffset?: (x: number, y: number, char: string, width: number, height: number) => number;
  readonly foreground?: (input: LandingLogoForegroundInput) => string;
}
interface LandingLogoForegroundInput {
  readonly x: number;
  readonly y: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly char: string;
  readonly width: number;
  readonly height: number;
  readonly targetCell: Cell;
  readonly baseForeground: string;
  readonly sampledColor: string;
}
export function paintLandingLogoOverlay(
  surface: Surface,
  mark: Surface,
  left: number,
  top: number,
  tokens: LandingThemeTokens,
  modifiers: LandingTextModifiers,
  options: LandingLogoOverlayOptions = {},
): void {
  const opacity = options.opacity ?? 1;
  if (opacity <= 0.02) return;
  for (let y = 0; y < mark.height; y++) {
    for (let x = 0; x < mark.width; x++) {
      const markChar = mark.get(x, y).char;
      if (markChar === ' ') continue;
      const targetX = left + x;
      const targetY = top + y + Math.round(options.yOffset?.(x, y, markChar, mark.width, mark.height) ?? 0);
      if (targetX < 0 || targetX >= surface.width || targetY < 0 || targetY >= surface.height) continue;
      const targetCell = surface.get(targetX, targetY);
      const foregroundSample = options.foregroundSample === 'background-cell'
        ? landingCellBackgroundColor(targetCell, tokens)
        : landingBackgroundCellColor(targetCell, tokens);
      const baseForeground = oppositeHexColor(foregroundSample);
      const animatedForeground = options.foreground?.({
        x,
        y,
        targetX,
        targetY,
        char: markChar,
        width: mark.width,
        height: mark.height,
        targetCell,
        baseForeground,
        sampledColor: foregroundSample,
      }) ?? baseForeground;
      const fg = opacity >= 0.995
        ? animatedForeground
        : mixHexColor(landingCellBackgroundColor(targetCell, tokens), animatedForeground, opacity);
      surface.set(targetX, targetY, {
        char: markChar,
        fg,
        modifiers: opacity < 0.38 ? modifiers.dim : modifiers.bold,
        empty: false,
        opacity: 1,
      }, LANDING_LOGO_OVERLAY_MASK);
    }
  }
}
export function paintFlyingRobotsLogoOverlay(
  surface: Surface,
  mark: Surface,
  top: number,
  tokens: LandingThemeTokens,
  modifiers: LandingTextModifiers,
  timeMs: number,
): void {
  const left = Math.floor((surface.width - mark.width) / 2);
  paintLandingLogoOverlay(surface, mark, left, top, tokens, modifiers, {
    foregroundSample: 'background-cell',
    opacity: landingFlyingRobotsOpacity(timeMs),
  });
}
export function landingBijouLogoYOffset(x: number, width: number, timeMs: number): number {
  const phase = landingBijouLogoWavePhase(timeMs, landingBijouLogoLetterIndex(x, width));
  return Math.round(Math.sin(phase) * LANDING_BIJOU_LOGO_WAVE_AMPLITUDE_ROWS);
}
export function landingBijouLogoFillColor(
  baseForeground: string,
  tokens: LandingThemeTokens,
  x: number,
  width: number,
  timeMs: number,
): string {
  const letterIndex = landingBijouLogoLetterIndex(x, width);
  const phase = landingBijouLogoWavePhase(timeMs, letterIndex);
  const local = width <= 1 ? 0 : x / (width - 1);
  const wave = 0.5 + (Math.sin(phase + (local * Math.PI * 1.4)) * 0.5);
  const logo = sampleColorRamp(tokens.logoRamp, clamp01(0.34 + (wave * 0.62)));
  const wake = sampleColorRamp(tokens.waveRamp, clamp01(0.42 + ((1 - wave) * 0.36)));
  return mixHexColor(baseForeground, mixHexColor(logo, wake, 0.22), 0.64);
}
function landingBackgroundCellColor(cell: Cell, tokens: LandingThemeTokens): string {
  return cell.fgRGB != null
    ? rgbHex(cell.fgRGB[0], cell.fgRGB[1], cell.fgRGB[2])
    : colorHex(cell.fg) ?? sampleColorRamp(tokens.waveRamp, 0.58);
}
function landingCellBackgroundColor(cell: Cell, tokens: LandingThemeTokens): string {
  return cell.bgRGB != null
    ? rgbHex(cell.bgRGB[0], cell.bgRGB[1], cell.bgRGB[2])
    : colorHex(cell.bg) ?? tokens.background;
}
function landingFlyingRobotsOpacity(timeMs: number): number {
  if (timeMs <= LANDING_FLYING_ROBOTS_FADE_DELAY_MS) return 1;
  return 1 - clamp01((timeMs - LANDING_FLYING_ROBOTS_FADE_DELAY_MS) / LANDING_FLYING_ROBOTS_FADE_DURATION_MS);
}
function landingBijouLogoLetterIndex(x: number, width: number): number {
  const letterWidth = Math.max(1, width / LANDING_BIJOU_LOGO_LETTER_COUNT);
  return Math.max(0, Math.min(LANDING_BIJOU_LOGO_LETTER_COUNT - 1, Math.floor(x / letterWidth)));
}
function landingBijouLogoWavePhase(timeMs: number, letterIndex: number): number {
  return (timeMs * 0.004) + (letterIndex * 0.82);
}

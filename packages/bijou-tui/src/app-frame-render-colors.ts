import {
  darken,
  hexToRgb,
  lighten,
  mix,
  saturate,
  type BijouContext,
  type Cell,
  type Surface,
  type TokenValue,
} from '@flyingrobots/bijou';
import type { FrameHeaderTabTarget } from './app-frame-render-contract.js';

const ACTIVE_HEADER_TOKEN_CACHE_LIMIT = 64;
const activeHeaderTokenCache = new Map<string, TokenValue>();

function relativeLuminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex);
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

function linear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function contrastRatio(left: string, right: string): number {
  const lighter = Math.max(relativeLuminance(left), relativeLuminance(right));
  const darker = Math.min(relativeLuminance(left), relativeLuminance(right));
  return (lighter + 0.05) / (darker + 0.05);
}

function colorDistance(left: string, right: string): number {
  const [lr, lg, lb] = hexToRgb(left);
  const [rr, rg, rb] = hexToRgb(right);
  return Math.sqrt((lr - rr) ** 2 + (lg - rg) ** 2 + (lb - rb) ** 2);
}

export function deriveActiveHeaderTabToken(
  ctx: BijouContext,
  backgroundHex: string,
  baseHex: string,
): TokenValue {
  const darkBackground = relativeLuminance(backgroundHex) < 0.35;
  const accent = ctx.semantic('accent');
  const info = ctx.semantic('info');
  const primary = ctx.semantic('primary');
  const warning = ctx.semantic('warning');
  const cacheKey = [
    backgroundHex,
    baseHex,
    accent.hex,
    info.hex,
    primary.hex,
    warning.hex,
  ].join('\0');
  const cached = activeHeaderTokenCache.get(cacheKey);
  if (cached != null) {
    activeHeaderTokenCache.delete(cacheKey);
    activeHeaderTokenCache.set(cacheKey, cached);
    return cached;
  }
  const seeds = [
    accent,
    info,
    mix(accent, info, 0.5),
    mix(accent, warning, 0.3),
    mix(primary, accent, 0.3),
  ];
  const candidates = seeds.flatMap((seed) => {
    const emphasized = saturate(seed, 0.35);
    return darkBackground
      ? [
          emphasized,
          lighten(seed, 0.18),
          lighten(emphasized, 0.3),
          lighten(mix(seed, primary, 0.25), 0.2),
        ]
      : [
          darken(seed, 0.18),
          darken(emphasized, 0.28),
          darken(mix(seed, primary, 0.1), 0.22),
        ];
  });
  let best = candidates[0] ?? accent;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of candidates) {
    const contrast = contrastRatio(candidate.hex, backgroundHex);
    const distance =
      colorDistance(candidate.hex, baseHex) / Math.sqrt(3 * 255 * 255);
    const score = contrast * 3 + distance;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  const token: TokenValue = { hex: best.hex, modifiers: ['bold'] };
  if (activeHeaderTokenCache.size >= ACTIVE_HEADER_TOKEN_CACHE_LIMIT) {
    const oldest = activeHeaderTokenCache.keys().next().value;
    if (oldest != null) activeHeaderTokenCache.delete(oldest);
  }
  activeHeaderTokenCache.set(cacheKey, token);
  return token;
}

export function paintActiveHeaderTab(
  surface: Surface,
  tabTargets: readonly FrameHeaderTabTarget[],
  activePageId: string,
  ctx: BijouContext | undefined,
  tokenOverride?: TokenValue,
): void {
  if (ctx == null) return;
  const target = tabTargets.find((tab) => tab.pageId === activePageId);
  if (target == null) return;
  const sample = surface.get(target.startCol, 0);
  const background =
    (typeof sample.bg === 'string' ? sample.bg : sample.bg?.hex) ??
    ctx.surface('primary').bg ??
    ctx.surface('secondary').bg ??
    '#000000';
  const foreground =
    (typeof sample.fg === 'string' ? sample.fg : sample.fg?.hex) ??
    ctx.surface('primary').hex;
  const token =
    tokenOverride ?? deriveActiveHeaderTabToken(ctx, background, foreground);
  for (let x = target.startCol; x <= target.endCol; x++) {
    const cell = surface.get(x, 0);
    const hasTokenBackground = token.bg != null || token.bgRGB != null;
    const next: Cell = {
      ...cell,
      fg: token.hex,
      bg: hasTokenBackground ? token.bg : cell.bg,
      fgRGB: token.fgRGB,
      bgRGB: hasTokenBackground ? token.bgRGB : cell.bgRGB,
      modifiers:
        token.modifiers == null
          ? cell.modifiers
          : [...new Set([...(cell.modifiers ?? []), ...token.modifiers])],
      empty: false,
    };
    surface.set(x, 0, next);
  }
}

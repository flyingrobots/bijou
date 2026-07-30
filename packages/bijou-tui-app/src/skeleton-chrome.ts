import type {
  BijouContext,
  TokenValue,
} from '@flyingrobots/bijou';
import {
  clipToWidth,
  statusBar,
  visibleLength,
} from '@flyingrobots/bijou-tui';
import type {
  SkeletonTab,
  SkeletonThemeTokens,
} from './skeleton-contract.js';

export function renderTabRow(
  width: number,
  tabs: readonly SkeletonTab[],
  activeTabId: string,
  tokens: SkeletonThemeTokens | undefined,
  ctx: BijouContext,
): string {
  const header = tokens?.headerBgToken ?? ctx.theme.theme.surface.primary;
  const active = tokens?.activeTabToken ?? ctx.theme.theme.surface.elevated;
  const inactive =
    tokens?.inactiveTabToken ?? ctx.theme.theme.surface.secondary;
  const content = tabs
    .map((tab) => style(
      ` ${tab.title} `,
      tab.id === activeTabId ? active : inactive,
      ctx,
    ))
    .join(style(' | ', header, ctx));
  return fillToWidth(content, width, header, ctx);
}

export function renderHeaderRow(
  width: number,
  title: string,
  activeTabTitle: string,
  tokens: SkeletonThemeTokens | undefined,
  ctx: BijouContext,
): string {
  return styledStatus(
    ` ${title}`,
    activeTabTitle,
    width,
    tokens?.headerBgToken ?? ctx.theme.theme.surface.primary,
    ctx,
  );
}

export function renderSeparatorRow(
  width: number,
  tokens: SkeletonThemeTokens | undefined,
  ctx: BijouContext,
): string {
  const token = tokens?.separatorToken ?? ctx.theme.theme.border.muted;
  return style('\\'.repeat(width), token, ctx);
}

export function renderFooterStatusRow(
  width: number,
  status: string,
  activeTabTitle: string,
  tokens: SkeletonThemeTokens | undefined,
  ctx: BijouContext,
): string {
  const token =
    tokens?.footerStatusToken ?? ctx.theme.theme.surface.secondary;
  return styledStatus(` ${status}`, activeTabTitle, width, token, ctx);
}

export function renderFooterControlsRow(
  width: number,
  keyLegend: string,
  tokens: SkeletonThemeTokens | undefined,
  ctx: BijouContext,
): string {
  const token =
    tokens?.footerControlsToken ?? ctx.theme.theme.surface.primary;
  return styledStatus(` ${keyLegend}`, '', width, token, ctx);
}

function styledStatus(
  left: string,
  right: string,
  width: number,
  token: TokenValue,
  ctx: BijouContext,
): string {
  return style(statusBar({ left, right, width }), token, ctx);
}

function fillToWidth(
  content: string,
  width: number,
  token: TokenValue,
  ctx: BijouContext,
): string {
  const clipped = clipToWidth(content, width);
  const visible = visibleLength(clipped);
  return visible >= width
    ? clipped
    : clipped + style(' '.repeat(width - visible), token, ctx);
}

function style(
  text: string,
  token: TokenValue,
  ctx: BijouContext,
): string {
  return text.length === 0 ? '' : ctx.style.styled(token, text);
}

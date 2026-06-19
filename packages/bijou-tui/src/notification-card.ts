import type { Surface } from '@flyingrobots/bijou';
import { createSurface, isPackedSurface } from '@flyingrobots/bijou';
import { encodeModifiers, parseHex } from '@flyingrobots/bijou/perf';
import type { LayoutRect } from './layout-rect.js';
import { visibleLength } from './viewport.js';
import { forceTextPresentation } from './icon-presentation.js';
import {
  composeColumnRows,
  createBlankLineSurface,
  createSegmentSurface,
  defaultBgToken,
  formatTimeLabel,
  resolvedColorHex,
  resolvedColorRgb,
  resolveRegion,
  standaloneRows,
  tokenToCellStyle,
  toneSemanticKey,
  withModifiers,
  type NotificationRecord,
  type NotificationTone,
  type RenderNotificationStackOptions,
} from './notification.js';

export interface NotificationRenderEntry<Msg> {
  readonly item: NotificationRecord<Msg>;
  readonly surface: Surface;
  readonly dismissRect: LayoutRect;
  readonly actionRect?: LayoutRect;
}

const TONE_ICONS: Record<NotificationTone, string> = {
  INFO: forceTextPresentation('\u2139'),
  SUCCESS: forceTextPresentation('\u2714'),
  WARNING: forceTextPresentation('\u26a0'),
  ERROR: forceTextPresentation('\u2718'),
};

const TONE_BORDER_KEYS: Record<NotificationTone, 'primary' | 'success' | 'warning' | 'error'> = {
  INFO: 'primary',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

function measureTextWidth<Msg>(
  item: NotificationRecord<Msg>,
  screenWidth: number,
): number {
  const available = Math.max(18, screenWidth - 7);
  if (item.width != null) {
    return Math.max(18, Math.min(available, item.width));
  }
  const titleWidth = visibleLength(item.title);
  const messageWidth = visibleLength(item.message);
  const buttonWidth = item.action == null ? 0 : visibleLength(item.action.label) + 6;
  const base = Math.max(titleWidth + 8, messageWidth + 2, buttonWidth + 2);

  if (item.variant === 'INLINE') {
    const target = Math.max(base + 8, Math.floor(screenWidth * 0.66));
    return Math.min(available, Math.max(28, target));
  }

  return Math.min(available, Math.max(26, Math.min(52, base + 6)));
}

export function renderNotificationSurface<Msg>(
  item: NotificationRecord<Msg>,
  options: RenderNotificationStackOptions,
  focused: boolean,
): NotificationRenderEntry<Msg> {
  const ctx = options.ctx;
  const textWidth = measureTextWidth(item, resolveRegion(options).width);
  const mutedStyle = tokenToCellStyle(ctx?.semantic('muted'));
  const titleStyle = withModifiers({}, ['bold']);
  const iconStyle = tokenToCellStyle(ctx?.semantic(toneSemanticKey(item.tone)));
  const accentStyle = tokenToCellStyle(item.accentToken ?? ctx?.border(TONE_BORDER_KEYS[item.tone]));
  const backgroundStyle = tokenToCellStyle(item.bgToken ?? defaultBgToken(ctx));
  const closeSurface = createSegmentSurface([{ text: '\u2715', style: mutedStyle }]);
  const icon = TONE_ICONS[item.tone];
  const overflow = item.overflow;

  const rows: Surface[] = [];
  let actionRect: LayoutRect | undefined;

  if (item.variant === 'INLINE') {
    const left = createSegmentSurface([
      { text: icon, style: iconStyle },
      { text: ' ' },
      { text: item.title, style: titleStyle },
      ...(item.message.length > 0
        ? [
          { text: ' ' },
          { text: item.message, style: mutedStyle },
        ]
        : []),
    ]);
    rows.push(...composeColumnRows(left, closeSurface, textWidth, overflow));
  } else {
    const titleLeft = createSegmentSurface([
      { text: icon, style: iconStyle },
      { text: ' ' },
      { text: item.title, style: titleStyle },
    ]);
    rows.push(...composeColumnRows(titleLeft, closeSurface, textWidth, overflow));

    if (item.message.length > 0) {
      const messageSurface = createSegmentSurface([{ text: item.message, style: mutedStyle }]);
      rows.push(...standaloneRows(messageSurface, textWidth, overflow));
    }

    if (item.variant === 'ACTIONABLE') {
      rows.push(createBlankLineSurface(textWidth));
      const actionLabel = item.action == null
        ? 'Dismiss'
        : (focused ? `[ ${item.action.label} ]` : `  ${item.action.label}  `);
      const actionStyle = focused ? withModifiers({}, ['bold']) : {};
      const actionRows = standaloneRows(
        createSegmentSurface([{ text: actionLabel, style: actionStyle }]),
        textWidth,
        overflow,
      );
      actionRect = {
        row: rows.length,
        col: 2,
        width: textWidth,
        height: actionRows.length,
      };
      rows.push(...actionRows);
    }

    if (item.variant === 'TOAST') {
      rows.push(createBlankLineSurface(textWidth));
      const timestampSurface = createSegmentSurface([{ text: formatTimeLabel(item.createdAtMs), style: mutedStyle }]);
      rows.push(...standaloneRows(timestampSurface, textWidth, overflow));
    }
  }

  const contentRows = rows.length === 0 ? [createBlankLineSurface(textWidth)] : rows;
  const cardWidth = textWidth + 3;
  const cardHeight = contentRows.length;
  const card = createSurface(cardWidth, cardHeight, {
    char: ' ',
    fg: backgroundStyle.fg,
    bg: backgroundStyle.bg,
    modifiers: backgroundStyle.modifiers ? [...backgroundStyle.modifiers] : undefined,
    empty: false,
  });

  const cardPacked = isPackedSurface(card);
  for (let y = 0; y < contentRows.length; y++) {
    const contentRow = contentRows[y];
    if (contentRow === undefined) {
      continue;
    }
    const accentRgb = cardPacked
      ? (() => {
          const accentHex = resolvedColorHex(accentStyle.fg);
          return accentStyle.fgRGB ?? resolvedColorRgb(accentStyle.fg) ?? (accentHex ? parseHex(accentHex) : undefined);
        })()
      : undefined;
    if (accentRgb) {
      const [fR, fG, fB] = accentRgb;
      let bR = -1, bG = 0, bB = 0;
      const backgroundHex = resolvedColorHex(backgroundStyle.bg);
      const bgRgb = backgroundStyle.bgRGB
        ?? resolvedColorRgb(backgroundStyle.bg)
        ?? (backgroundHex ? parseHex(backgroundHex) : undefined);
      if (bgRgb) { [bR, bG, bB] = bgRgb; }
      (card).setRGB(0, y, '\u258e', fR, fG, fB, bR, bG, bB, encodeModifiers(accentStyle.modifiers));
    } else {
      card.set(0, y, {
        char: '\u258e',
        fg: accentStyle.fg,
        bg: backgroundStyle.bg,
        fgRGB: accentStyle.fgRGB,
        bgRGB: backgroundStyle.bgRGB,
        modifiers: accentStyle.modifiers ? [...accentStyle.modifiers] : undefined,
        empty: false,
      });
    }
    card.blit(
      contentRow,
      2,
      y,
      0,
      0,
      contentRow.width,
      1,
      {
        char: true,
        fg: true,
        bg: false,
        modifiers: true,
        alpha: true,
      },
    );
  }

  return {
    item,
    surface: card,
    dismissRect: {
      row: 0,
      col: Math.max(0, card.width - 2),
      width: 1,
      height: 1,
    },
    actionRect,
  };
}

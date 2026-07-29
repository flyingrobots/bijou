import type { Surface } from '@flyingrobots/bijou';
import { createSurface, isPackedSurface } from '@flyingrobots/bijou';
import { encodeModifiers, parseHex } from '@flyingrobots/bijou/perf';
import type { LayoutRect } from './layout-rect.js';
import {
  resolvedColorHex,
  resolvedColorRgb,
  type NotificationRecord,
  type RenderNotificationStackOptions,
} from './notification.js';
import { buildNotificationCardContent } from './notification-card-content.js';

export interface NotificationRenderEntry<Msg> {
  readonly item: NotificationRecord<Msg>;
  readonly surface: Surface;
  readonly dismissRect: LayoutRect;
  readonly actionRect?: LayoutRect;
}

export function renderNotificationSurface<Msg>(
  item: NotificationRecord<Msg>,
  options: RenderNotificationStackOptions,
  focused: boolean,
): NotificationRenderEntry<Msg> {
  const {
    textWidth,
    rows: contentRows,
    actionRect,
    accentStyle,
    backgroundStyle,
  } = buildNotificationCardContent(item, options, focused);
  const cardWidth = textWidth + 3;
  const cardHeight = contentRows.length;
  const card = createSurface(cardWidth, cardHeight, {
    char: ' ',
    fg: backgroundStyle.fg,
    bg: backgroundStyle.bg,
    modifiers: backgroundStyle.modifiers
      ? [...backgroundStyle.modifiers]
      : undefined,
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
          return (
            accentStyle.fgRGB ??
            resolvedColorRgb(accentStyle.fg) ??
            (accentHex ? parseHex(accentHex) : undefined)
          );
        })()
      : undefined;
    if (accentRgb) {
      const [fR, fG, fB] = accentRgb;
      let bR = -1,
        bG = 0,
        bB = 0;
      const backgroundHex = resolvedColorHex(backgroundStyle.bg);
      const bgRgb =
        backgroundStyle.bgRGB ??
        resolvedColorRgb(backgroundStyle.bg) ??
        (backgroundHex ? parseHex(backgroundHex) : undefined);
      if (bgRgb) {
        [bR, bG, bB] = bgRgb;
      }
      card.setRGB(
        0,
        y,
        '\u258e',
        fR,
        fG,
        fB,
        bR,
        bG,
        bB,
        encodeModifiers(accentStyle.modifiers),
      );
    } else {
      card.set(0, y, {
        char: '\u258e',
        fg: accentStyle.fg,
        bg: backgroundStyle.bg,
        fgRGB: accentStyle.fgRGB,
        bgRGB: backgroundStyle.bgRGB,
        modifiers: accentStyle.modifiers
          ? [...accentStyle.modifiers]
          : undefined,
        empty: false,
      });
    }
    card.blit(contentRow, 2, y, 0, 0, contentRow.width, 1, {
      char: true,
      fg: true,
      bg: false,
      modifiers: true,
      alpha: true,
    });
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

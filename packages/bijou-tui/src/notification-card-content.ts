import type { Surface } from '@flyingrobots/bijou';
import type { LayoutRect } from './layout-rect.js';
import {
  composeColumnRows,
  createBlankLineSurface,
  createSegmentSurface,
  defaultBgToken,
  formatTimeLabel,
  resolveRegion,
  standaloneRows,
  tokenToCellStyle,
  toneSemanticKey,
  withModifiers,
  type CellTextStyle,
  type NotificationRecord,
  type RenderNotificationStackOptions,
} from './notification.js';
import {
  measureNotificationTextWidth,
  notificationToneBorderKey,
  notificationToneIcon,
} from './notification-card-metrics.js';

export interface NotificationCardContent {
  readonly textWidth: number;
  readonly rows: readonly Surface[];
  readonly actionRect?: LayoutRect;
  readonly accentStyle: CellTextStyle;
  readonly backgroundStyle: CellTextStyle;
}

export function buildNotificationCardContent<Msg>(
  item: NotificationRecord<Msg>,
  options: RenderNotificationStackOptions,
  focused: boolean,
): NotificationCardContent {
  const context = options.ctx;
  const textWidth = measureNotificationTextWidth(
    item,
    resolveRegion(options).width,
  );
  const mutedStyle = tokenToCellStyle(context?.semantic('muted'));
  const titleStyle = withModifiers({}, ['bold']);
  const iconStyle = tokenToCellStyle(
    context?.semantic(toneSemanticKey(item.tone)),
  );
  const accentStyle = tokenToCellStyle(
    item.accentToken ?? context?.border(notificationToneBorderKey(item.tone)),
  );
  const backgroundStyle = tokenToCellStyle(
    item.bgToken ?? defaultBgToken(context),
  );
  const closeSurface = createSegmentSurface([
    { text: '\u2715', style: mutedStyle },
  ]);
  const rows: Surface[] = [];
  let actionRect: LayoutRect | undefined;

  if (item.variant === 'INLINE') {
    const left = createSegmentSurface([
      { text: notificationToneIcon(item.tone), style: iconStyle },
      { text: ' ' },
      { text: item.title, style: titleStyle },
      ...(item.message.length > 0
        ? [{ text: ' ' }, { text: item.message, style: mutedStyle }]
        : []),
    ]);
    rows.push(
      ...composeColumnRows(left, closeSurface, textWidth, item.overflow),
    );
  } else {
    const title = createSegmentSurface([
      { text: notificationToneIcon(item.tone), style: iconStyle },
      { text: ' ' },
      { text: item.title, style: titleStyle },
    ]);
    rows.push(
      ...composeColumnRows(title, closeSurface, textWidth, item.overflow),
    );
    if (item.message.length > 0) {
      rows.push(
        ...standaloneRows(
          createSegmentSurface([{ text: item.message, style: mutedStyle }]),
          textWidth,
          item.overflow,
        ),
      );
    }
    if (item.variant === 'ACTIONABLE') {
      rows.push(createBlankLineSurface(textWidth));
      const label =
        item.action == null
          ? 'Dismiss'
          : focused
            ? `[ ${item.action.label} ]`
            : `  ${item.action.label}  `;
      const actionRows = standaloneRows(
        createSegmentSurface([
          {
            text: label,
            style: focused ? withModifiers({}, ['bold']) : {},
          },
        ]),
        textWidth,
        item.overflow,
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
      rows.push(
        ...standaloneRows(
          createSegmentSurface([
            {
              text: formatTimeLabel(item.createdAtMs),
              style: mutedStyle,
            },
          ]),
          textWidth,
          item.overflow,
        ),
      );
    }
  }

  return {
    textWidth,
    rows: rows.length === 0 ? [createBlankLineSurface(textWidth)] : rows,
    actionRect,
    accentStyle,
    backgroundStyle,
  };
}

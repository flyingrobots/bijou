import { initDefaultContext } from '@flyingrobots/bijou-node';
import type {
  NotificationHistoryFilter,
  NotificationPlacement,
  NotificationTone,
  NotificationVariant,
} from '../../packages/bijou-tui/src/index.js';

export const ctx = initDefaultContext();
export const NOTIFICATION_TICK_MS = 40;
export const DEMO_NOTIFICATION_GAP = 1;

export const VARIANTS: readonly NotificationVariant[] = [
  'ACTIONABLE',
  'INLINE',
  'TOAST',
];
export const TONES: readonly NotificationTone[] = [
  'INFO',
  'SUCCESS',
  'WARNING',
  'ERROR',
];
export const PLACEMENTS: readonly NotificationPlacement[] = [
  'UPPER_LEFT',
  'UPPER_RIGHT',
  'LOWER_LEFT',
  'LOWER_RIGHT',
  'TOP_CENTER',
  'BOTTOM_CENTER',
  'CENTER',
];
export const HISTORY_FILTERS: readonly NotificationHistoryFilter[] = [
  'ALL',
  'ACTIONABLE',
  'ERROR',
  'WARNING',
  'SUCCESS',
  'INFO',
];
export const DURATION_OPTIONS = [
  { label: 'default', value: undefined },
  { label: 'persistent', value: null },
  { label: '2.5s', value: 2_500 },
  { label: '5.0s', value: 5_000 },
  { label: '9.0s', value: 9_000 },
] as const;

const COMPACT_DEMO_WIDTH = 52;
const COMPACT_DEMO_HEIGHT = 16;
const COMPACT_OVERLAY_MARGIN = 1;
const DEFAULT_OVERLAY_MARGIN = 2;

export function demoOverlayMargin(width: number, height: number): number {
  return width < COMPACT_DEMO_WIDTH || height < COMPACT_DEMO_HEIGHT
    ? COMPACT_OVERLAY_MARGIN
    : DEFAULT_OVERLAY_MARGIN;
}

export function demoNotificationStackSpacing(
  width: number,
  height: number,
): { readonly margin: number; readonly gap: number } {
  return {
    margin: demoOverlayMargin(width, height),
    gap: DEMO_NOTIFICATION_GAP,
  };
}

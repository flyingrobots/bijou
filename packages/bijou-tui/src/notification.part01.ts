import type { BijouContext, OverflowBehavior, TokenValue } from '@flyingrobots/bijou';

import type { LayoutRect } from './layout-rect.js';

import type { NotificationHistoryLabels } from './notification.part02.js';
export function resolvedColorRgb(ref: unknown): readonly [number, number, number] | undefined {
  if (typeof ref !== 'object' || ref === null || !('kind' in ref) || ref.kind !== 'resolved-color' || !('rgb' in ref)) return undefined;
  const rgb = ref.rgb;
  if (!Array.isArray(rgb) || rgb.length !== 3) return undefined;
  const r: unknown = rgb[0], g: unknown = rgb[1], b: unknown = rgb[2];
  return typeof r === 'number' && typeof g === 'number' && typeof b === 'number'
    ? [r, g, b]
    : undefined;
}
export function resolvedColorHex(ref: unknown): string | undefined {
  if (typeof ref === 'string') return ref;
  if (typeof ref !== 'object' || ref === null || !('kind' in ref) || ref.kind !== 'resolved-color') return undefined;
  return 'hex' in ref && typeof ref.hex === 'string' ? ref.hex : undefined;
}
export type NotificationVariant = 'ACTIONABLE' | 'INLINE' | 'TOAST';
export type NotificationTone = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type NotificationPlacement =
  | 'UPPER_LEFT'
  | 'UPPER_RIGHT'
  | 'LOWER_LEFT'
  | 'LOWER_RIGHT'
  | 'TOP_CENTER'
  | 'BOTTOM_CENTER'
  | 'CENTER';
export type NotificationHistoryFilter =
  | 'ALL'
  | 'ACTIONABLE'
  | NotificationTone;
export interface NotificationAction<Msg> {
  readonly label: string;
  readonly payload: Msg;
}
export interface NotificationSpec<Msg> {
  readonly title: string;
  readonly message?: string;
  readonly variant?: NotificationVariant;
  readonly tone?: NotificationTone;
  readonly width?: number;
  readonly durationMs?: number | null;
  readonly placement?: NotificationPlacement;
  readonly action?: NotificationAction<Msg>;
  readonly bgToken?: TokenValue;
  readonly accentToken?: TokenValue;
  readonly overflow?: OverflowBehavior;
}
export type NotificationPhase = 'entering' | 'visible' | 'exiting';
export interface NotificationRecord<Msg> {
  readonly id: number;
  readonly title: string;
  readonly message: string;
  readonly variant: NotificationVariant;
  readonly tone: NotificationTone;
  readonly width?: number;
  readonly durationMs: number | null;
  readonly placement: NotificationPlacement;
  readonly action?: NotificationAction<Msg>;
  readonly bgToken?: TokenValue;
  readonly accentToken?: TokenValue;
  readonly overflow: OverflowBehavior;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
  readonly enteredAtMs?: number;
  readonly exitStartedAtMs?: number;
  readonly phase: NotificationPhase;
  readonly progress: number;
}
export interface NotificationState<Msg> {
  readonly items: readonly NotificationRecord<Msg>[];
  readonly overflowExits: readonly NotificationRecord<Msg>[];
  readonly history: readonly NotificationRecord<Msg>[];
  readonly nextId: number;
  readonly focusedId?: number;
}
export interface RenderNotificationStackOptions {
  readonly screenWidth: number;
  readonly screenHeight: number;
  readonly region?: LayoutRect;
  readonly ctx?: BijouContext;
  readonly margin?: number;
  readonly gap?: number;
}
export interface RenderNotificationHistoryOptions {
  readonly width: number;
  readonly height: number;
  readonly scroll?: number;
  readonly filter?: NotificationHistoryFilter;
  readonly ctx?: BijouContext;
  readonly labels?: NotificationHistoryLabels;
}
export interface RenderNotificationReviewEntrySurfaceOptions {
  readonly width: number;
  readonly ctx?: BijouContext;
  readonly metaLabel?: string;
  readonly actionLabel?: (label: string) => string;
}

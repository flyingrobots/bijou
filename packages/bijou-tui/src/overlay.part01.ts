import type { BijouContext, Surface, TokenValue } from '@flyingrobots/bijou';
export function resolvedColorRgb(ref: unknown): readonly [number, number, number] | undefined {
  const rgb = isResolvedColorRecord(ref) ? ref['rgb'] : undefined;
  return isRgbTuple(rgb)
    ? rgb
    : undefined;
}
export function resolvedColorHex(ref: unknown): string | undefined {
  if (typeof ref === 'string') return ref;
  const hex = isResolvedColorRecord(ref) ? ref['hex'] : undefined;
  return typeof hex === 'string'
    ? hex
    : undefined;
}
export function isResolvedColorRecord(ref: unknown): ref is Record<string, unknown> {
  return typeof ref === 'object'
    && ref !== null
    && 'kind' in ref
    && ref.kind === 'resolved-color';
}
export function isRgbTuple(value: unknown): value is readonly [number, number, number] {
  return Array.isArray(value)
    && value.length === 3
    && value.every((channel) => typeof channel === 'number');
}
export interface Overlay {
  /** Rendered content string (newline-delimited lines). */
  readonly content: string;
  /** Optional cell-accurate overlay surface used by surface-first render paths. */
  readonly surface?: Surface;
  /** Top-left row position (0-based). */
  readonly row: number;
  /** Top-left column position (0-based). */
  readonly col: number;
}
export interface CompositeOptions {
  /** Wrap background lines in dim (ANSI 2m). */
  readonly dim?: boolean;
}
export type OverlayContent = string | Surface;
export interface ModalOptions {
  /** Optional title displayed at the top of the modal (bolded when ctx provided). */
  readonly title?: string;
  /** Body content of the modal. Accepts plain text or a structured surface. */
  readonly body: OverlayContent;
  /** Optional hint content displayed below the body (muted when ctx provided). */
  readonly hint?: OverlayContent;
  /** Screen width in columns, used for centering. */
  readonly screenWidth: number;
  /** Screen height in rows, used for centering. */
  readonly screenHeight: number;
  /** Preferred minimum width — shorter lines are padded but longer lines are not truncated (default: auto from content). */
  readonly width?: number;
  /** Preferred edge inset from the viewport when the dialog is centered. */
  readonly margin?: number;
  /** Design token for the border color. */
  readonly borderToken?: TokenValue;
  /** Background fill token for the overlay interior. */
  readonly bgToken?: TokenValue;
  /** Bijou context for styled output. */
  readonly ctx?: BijouContext;
}
export type ToastVariant = 'success' | 'error' | 'info';
export type ToastAnchor = 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
export interface ToastOptions {
  /** Message text displayed beside the variant icon. */
  readonly message: string;
  /** Visual variant controlling icon and border color. Default: 'info'. */
  readonly variant?: ToastVariant;
  /** Screen corner to anchor the toast. Default: 'bottom-right'. */
  readonly anchor?: ToastAnchor;
  /** Screen width in columns, used for positioning. */
  readonly screenWidth: number;
  /** Screen height in rows, used for positioning. */
  readonly screenHeight: number;
  /** Rows/cols from edge. Default: 1. */
  readonly margin?: number;
  /** Background fill token for the toast interior. */
  readonly bgToken?: TokenValue;
  /** Bijou context for styled output. */
  readonly ctx?: BijouContext;
}
export const BORDER = {
  tl: '\u250c', // ┌
  tr: '\u2510', // ┐
  bl: '\u2514', // └
  br: '\u2518', // ┘
  h: '\u2500',  // ─
  v: '\u2502',  // │
};

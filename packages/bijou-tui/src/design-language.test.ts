import { describe, expect, it } from 'vitest';
import {
  COMPACT_VIEWPORT_HEIGHT,
  COMPACT_VIEWPORT_WIDTH,
  TUI_SPACING,
  clampCenteredPosition,
  isCompactViewport,
  resolveNotificationGap,
  resolveOverlayMargin,
} from './design-language.js';

describe('design language defaults', () => {
  it('treats narrow or short viewports as compact', () => {
    expect(isCompactViewport(COMPACT_VIEWPORT_WIDTH - 1, 24)).toBe(true);
    expect(isCompactViewport(80, COMPACT_VIEWPORT_HEIGHT - 1)).toBe(true);
    expect(isCompactViewport(COMPACT_VIEWPORT_WIDTH, COMPACT_VIEWPORT_HEIGHT)).toBe(false);
  });

  it('defaults overlay margins to the preferred rhythm on roomy screens', () => {
    expect(resolveOverlayMargin(80, 24)).toBe(TUI_SPACING.overlayMargin);
  });

  it('falls back to a compact inset on small screens', () => {
    expect(resolveOverlayMargin(40, 12)).toBe(TUI_SPACING.compactOverlayMargin);
  });

  it('respects explicit overlay margins after normalizing them', () => {
    expect(resolveOverlayMargin(80, 24, 3.9)).toBe(3);
    expect(resolveOverlayMargin(80, 24, -5)).toBe(0);
  });

  it('uses the shared notification stack gap by default', () => {
    expect(resolveNotificationGap()).toBe(TUI_SPACING.notificationGap);
    expect(resolveNotificationGap(2.7)).toBe(2);
  });

  it('keeps centered content off the edge when there is room for the preferred inset', () => {
    expect(clampCenteredPosition(80, 20, 2)).toBe(30);
    expect(clampCenteredPosition(7, 5, 2)).toBe(1);
  });
});

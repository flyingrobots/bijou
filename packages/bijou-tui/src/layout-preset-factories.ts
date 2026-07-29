import type { SerializedPageLayout } from './layout-preset.js';

function splitPreset(splitId: string): SerializedPageLayout {
  return {
    splitRatios: { [splitId]: 0.5 },
    focusedPane: undefined,
    minimized: [],
    dockOrder: {},
    maximizedPane: undefined,
  };
}

/** Preset: side-by-side split with equal ratio. */
export function presetSideBySide(splitId: string): SerializedPageLayout {
  return splitPreset(splitId);
}

/** Preset: stacked (vertical) split with equal ratio. */
export function presetStacked(splitId: string): SerializedPageLayout {
  return splitPreset(splitId);
}

/** Preset: focused on a single pane (maximized). */
export function presetFocused(paneId: string): SerializedPageLayout {
  return {
    splitRatios: {},
    focusedPane: paneId,
    minimized: [],
    dockOrder: {},
    maximizedPane: paneId,
  };
}

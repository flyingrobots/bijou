import { describe, it, expect } from 'vitest';
import { presetSideBySide, presetStacked, presetFocused } from './layout-preset.js';

describe('preset helpers', () => {
  it('presetSideBySide creates equal split', () => {
    const preset = presetSideBySide('split-1');
    expect(preset.splitRatios['split-1']).toBe(0.5);
    expect(preset.maximizedPane).toBeUndefined();
    expect(preset.minimized).toEqual([]);
  });

  it('presetStacked creates equal split', () => {
    const preset = presetStacked('split-1');
    expect(preset.splitRatios['split-1']).toBe(0.5);
  });
  it('presetFocused maximizes the given pane', () => {
    const preset = presetFocused('editor');
    expect(preset.maximizedPane).toBe('editor');
    expect(preset.focusedPane).toBe('editor');
  });
});

import { describe, it, expect } from 'vitest';
import type { Theme, BaseStatusKey, TokenValue, RGB, GradientStop, TextModifier } from './tokens.js';

describe('theme/tokens types', () => {
  it('BaseStatusKey includes all expected keys', () => {
    const keys: BaseStatusKey[] = ['success', 'error', 'warning', 'info', 'pending', 'active', 'muted'];
    expect(keys).toHaveLength(7);
  });

  it('TokenValue supports hex + modifiers', () => {
    const token: TokenValue = { hex: '#ff0000', modifiers: ['bold', 'dim'] };
    expect(token.hex).toBe('#ff0000');
    expect(token.modifiers).toEqual(['bold', 'dim']);
  });

  it('TokenValue modifiers are optional', () => {
    const token: TokenValue = { hex: '#ffffff' };
    expect(token.modifiers).toBeUndefined();
  });

  it('RGB is a triple of numbers', () => {
    const rgb: RGB = [255, 128, 0];
    expect(rgb).toHaveLength(3);
  });

  it('GradientStop has pos and color', () => {
    const stop: GradientStop = { pos: 0.5, color: [128, 128, 128] };
    expect(stop.pos).toBe(0.5);
    expect(stop.color).toEqual([128, 128, 128]);
  });

  it('TextModifier includes all variants', () => {
    const mods: TextModifier[] = ['bold', 'dim', 'strikethrough', 'inverse'];
    expect(mods).toHaveLength(4);
  });

  it('Theme<S> can be parameterized with custom status keys', () => {
    type CustomStatus = BaseStatusKey | 'CUSTOM';
    const theme: Theme<CustomStatus> = {
      name: 'test',
      status: {
        success: { hex: '#00ff00' },
        error: { hex: '#ff0000' },
        warning: { hex: '#ffff00' },
        info: { hex: '#00ffff' },
        pending: { hex: '#808080' },
        active: { hex: '#00ffff' },
        muted: { hex: '#808080' },
        CUSTOM: { hex: '#ff00ff' },
      },
      semantic: {
        success: { hex: '#00ff00' },
        error: { hex: '#ff0000' },
        warning: { hex: '#ffff00' },
        info: { hex: '#00ffff' },
        accent: { hex: '#ff00ff' },
        muted: { hex: '#808080' },
        primary: { hex: '#ffffff' },
      },
      gradient: {
        brand: [{ pos: 0, color: [0, 0, 0] }, { pos: 1, color: [255, 255, 255] }],
        progress: [{ pos: 0, color: [0, 0, 0] }, { pos: 1, color: [255, 255, 255] }],
      },
      border: {
        primary: { hex: '#00ffff' },
        secondary: { hex: '#ff00ff' },
        success: { hex: '#00ff00' },
        warning: { hex: '#ffff00' },
        error: { hex: '#ff0000' },
        muted: { hex: '#808080' },
      },
      ui: {
        cursor: { hex: '#00ffff' },
        scrollThumb: { hex: '#00ffff' },
        scrollTrack: { hex: '#808080' },
        sectionHeader: { hex: '#0000ff' },
        logo: { hex: '#00ffff' },
        tableHeader: { hex: '#ffffff' },
        trackEmpty: { hex: '#505050' },
      },
    };
    expect(theme.status.CUSTOM.hex).toBe('#ff00ff');
  });
});

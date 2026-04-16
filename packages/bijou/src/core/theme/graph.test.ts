import { describe, it, expect, vi } from 'vitest';
import { createTokenGraph } from './graph.js';

describe('TokenGraph', () => {
  it('resolves raw hex colors', () => {
    const graph = createTokenGraph({
      palette: {
        brand: '#00ffff',
      },
    });

    expect(graph.get('palette.brand').hex).toBe('#00ffff');
  });

  it('resolves references', () => {
    const graph = createTokenGraph({
      palette: {
        brand: '#00ffff',
      },
      semantic: {
        accent: { ref: 'palette.brand' },
      },
    });

    expect(graph.get('semantic.accent').hex).toBe('#00ffff');
  });

  it('applies color transforms', () => {
    const graph = createTokenGraph({
      palette: {
        brand: '#ffffff',
      },
      semantic: {
        muted: { ref: 'palette.brand', transform: [{ type: 'darken', amount: 0.5 }] },
      },
    });

    // #ffffff darkened by 0.5 should be #808080
    expect(graph.get('semantic.muted').hex).toBe('#808080');
  });

  it('handles adaptive mode buckets', () => {
    const graph = createTokenGraph({
      surface: {
        primary: { light: '#ffffff', dark: '#000000' },
      },
    });

    expect(graph.get('surface.primary', 'light').hex).toBe('#ffffff');
    expect(graph.get('surface.primary', 'dark').hex).toBe('#000000');
  });

  it('detects circular references', () => {
    const graph = createTokenGraph({
      a: { ref: 'b' },
      b: { ref: 'a' },
    });

    expect(() => graph.get('a')).toThrow(/Circular token reference/);
  });

  it('notifies subscribers on changes', () => {
    const graph = createTokenGraph({ brand: '#000' });
    const handler = vi.fn();
    graph.on(handler);

    graph.set('brand', '#fff');
    expect(handler).toHaveBeenCalledWith('brand');
    expect(graph.get('brand').hex).toBe('#ffffff');
  });

  it('handles complex nested definitions', () => {
    const graph = createTokenGraph({
      palette: { brand: '#ff0000' },
      ui: {
        button: {
          fg: { ref: 'palette.brand' },
          bg: { light: '#eee', dark: '#333' },
          modifiers: ['bold'],
        },
      },
    });

    const light = graph.get('ui.button', 'light');
    expect(light.hex).toBe('#ff0000');
    expect(light.bg).toBe('#eeeeee');
    expect(light.modifiers).toEqual(['bold']);

    const dark = graph.get('ui.button', 'dark');
    expect(dark.bg).toBe('#333333');
  });

  it('supports mixing colors', () => {
    const graph = createTokenGraph({
      black: '#000000',
      white: '#ffffff',
      gray: { ref: 'black', transform: [{ type: 'mix', with: 'white', ratio: 0.5 }] },
    });

    expect(graph.get('gray').hex).toBe('#808080');
  });

  it('returns pre-parsed fgRGB/bgRGB for direct token values', () => {
    const graph = createTokenGraph({
      surface: {
        primary: {
          hex: '#112233',
          bg: '#445566',
          fgRGB: [0x11, 0x22, 0x33],
          bgRGB: [0x44, 0x55, 0x66],
        },
      },
    });

    expect(graph.get('surface.primary')).toMatchObject({
      hex: '#112233',
      bg: '#445566',
      fgRGB: [0x11, 0x22, 0x33],
      bgRGB: [0x44, 0x55, 0x66],
    });
  });

  it('parses and caches fgRGB/bgRGB for resolved theme tokens', () => {
    const graph = createTokenGraph({
      palette: {
        ink: '#123456',
        paper: '#654321',
      },
      semantic: {
        primary: {
          fg: { ref: 'palette.ink' },
          bg: { ref: 'palette.paper' },
          modifiers: ['bold'],
        },
      },
    });

    expect(graph.get('semantic.primary')).toMatchObject({
      hex: '#123456',
      bg: '#654321',
      fgRGB: [0x12, 0x34, 0x56],
      bgRGB: [0x65, 0x43, 0x21],
      modifiers: ['bold'],
    });
  });

  it('normalizes TokenValue writes through set()', () => {
    const graph = createTokenGraph();

    graph.set('semantic.primary', {
      hex: '#abcdef',
      bg: '#112233',
      fgRGB: [0xab, 0xcd, 0xef],
      bgRGB: [0x11, 0x22, 0x33],
    });

    expect(graph.get('semantic.primary')).toMatchObject({
      hex: '#abcdef',
      bg: '#112233',
      fgRGB: [0xab, 0xcd, 0xef],
      bgRGB: [0x11, 0x22, 0x33],
    });
  });
});

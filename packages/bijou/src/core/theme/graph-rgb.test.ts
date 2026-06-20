import { describe, expect, it } from 'vitest';
import { createTokenGraph } from './graph.js';

describe('TokenGraph RGB channels', () => {
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

import { describe, it, expect } from 'vitest';
import { perfOverlaySurface } from './perf-overlay.js';
import { createTestContext } from '../../adapters/test/index.js';

const ctx = createTestContext();

describe('perfOverlaySurface', () => {
  it('renders a surface with the requested width', () => {
    const surface = perfOverlaySurface({
      fps: 30,
      frameTimeMs: 0.42,
      width: 120,
      height: 40,
    }, { width: 30, ctx });
    expect(surface.width).toBe(30);
  });

  it('includes FPS, frame time, and size rows', () => {
    const surface = perfOverlaySurface({
      fps: 60,
      frameTimeMs: 16.6,
      width: 80,
      height: 24,
    }, { width: 28, ctx });

    // Extract all text from the surface.
    let text = '';
    for (let y = 0; y < surface.height; y++) {
      for (let x = 0; x < surface.width; x++) {
        text += surface.get(x, y).char;
      }
    }
    expect(text).toContain('FPS');
    expect(text).toContain('frame');
    expect(text).toContain('size');
  });

  it('includes heap when provided', () => {
    const surface = perfOverlaySurface({
      fps: 30,
      frameTimeMs: 0.5,
      width: 80,
      height: 24,
      heapUsedMB: 42.1,
    }, { width: 28, ctx });

    let text = '';
    for (let y = 0; y < surface.height; y++) {
      for (let x = 0; x < surface.width; x++) {
        text += surface.get(x, y).char;
      }
    }
    expect(text).toContain('heap');
    expect(text).toContain('42.1');
  });

  it('renders chart when history is provided', () => {
    const history = Array.from({ length: 30 }, (_, i) => Math.sin(i * 0.3) * 5 + 10);
    const surface = perfOverlaySurface({
      fps: 30,
      frameTimeMs: 0.5,
      width: 80,
      height: 24,
      frameTimeHistory: history,
    }, { width: 30, chartHeight: 3, ctx });

    // Surface should be taller than panel-only (panel + chart).
    const panelOnly = perfOverlaySurface({
      fps: 30,
      frameTimeMs: 0.5,
      width: 80,
      height: 24,
    }, { width: 30, ctx });

    expect(surface.height).toBeGreaterThan(panelOnly.height);
  });

  it('omits chart when showChart is false', () => {
    const history = Array.from({ length: 20 }, (_, i) => i);
    const withChart = perfOverlaySurface({
      fps: 30, frameTimeMs: 1, width: 80, height: 24,
      frameTimeHistory: history,
    }, { width: 30, showChart: true, ctx });

    const without = perfOverlaySurface({
      fps: 30, frameTimeMs: 1, width: 80, height: 24,
      frameTimeHistory: history,
    }, { width: 30, showChart: false, ctx });

    expect(withChart.height).toBeGreaterThan(without.height);
  });

  it('handles extra entries', () => {
    const surface = perfOverlaySurface({
      fps: 30, frameTimeMs: 1, width: 80, height: 24,
      extras: [{ label: 'custom', value: '999' }],
    }, { width: 28, ctx });

    let text = '';
    for (let y = 0; y < surface.height; y++) {
      for (let x = 0; x < surface.width; x++) {
        text += surface.get(x, y).char;
      }
    }
    expect(text).toContain('custom');
    expect(text).toContain('999');
  });
});

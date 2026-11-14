import { describe, expect, it } from 'vitest';
import { createSurface } from '../../ports/surface.js';
import {
  HalfBlockCanvas,
  computeHdrHistogram,
  findFlameNode,
  flamegraphSurface,
  forceGraphSurface,
  forceSimulation,
  heatmapSurface,
  layoutFlamegraph,
  surfaceToPlainString,
  type FlameNode,
} from './index.js';

describe('HalfBlockCanvas and heatmapSurface', () => {
  it('encodes independent top and bottom 24-bit sub-pixels per cell using ▀ and ▄', () => {
    const canvas = new HalfBlockCanvas(4, 2);
    expect(canvas.pixelWidth).toBe(4);
    expect(canvas.pixelHeight).toBe(4);

    canvas.setPixel(0, 0, [255, 10, 20]);
    canvas.setPixel(0, 1, [30, 200, 40]);
    canvas.setPixel(1, 0, [100, 110, 120]);
    canvas.setPixel(2, 1, [50, 60, 70]);

    const surface = createSurface(4, 2);
    canvas.flushToSurface(surface);

    const cell0 = surface.get(0, 0);
    expect(cell0.char).toBe('▀');
    expect(cell0.fgRGB).toEqual([255, 10, 20]);
    expect(cell0.bgRGB).toEqual([30, 200, 40]);

    const cell1 = surface.get(1, 0);
    expect(cell1.char).toBe('▀');
    expect(cell1.fgRGB).toEqual([100, 110, 120]);
    expect(cell1.bgRGB).toBeUndefined();

    const cell2 = surface.get(2, 0);
    expect(cell2.char).toBe('▄');
    expect(cell2.fgRGB).toEqual([50, 60, 70]);
  });

  it('shifts sub-pixel rows downward for scrolling waterfall spectrograms', () => {
    const canvas = new HalfBlockCanvas(2, 2);
    canvas.setPixel(0, 0, [12, 34, 56]);
    canvas.shiftDown(2);
    const surface = createSurface(2, 2);
    canvas.flushToSurface(surface);
    expect(surface.get(0, 1).char).toBe('▀');
    expect(surface.get(0, 1).fgRGB).toEqual([12, 34, 56]);
  });

  it('renders 2D numeric matrices via heatmapSurface', () => {
    const surf = heatmapSurface({
      width: 6,
      height: 3,
      data: [
        [0, 50, 100],
        [25, 75, 100],
      ],
    });
    expect(surf.width).toBe(6);
    expect(surf.height).toBe(3);
    expect(surf.get(0, 0).char).toBe('▀');
    expect(surf.get(5, 2).fgRGB).toBeDefined();
    expect(surf.get(5, 2).bgRGB).toBeDefined();
  });
});

describe('forceSimulation and forceGraphSurface', () => {
  it('converges connected nodes and renders Braille spring edges with Surface node badges', () => {
    const sim = forceSimulation(
      [
        { id: 'bijou', label: 'bijou', x: 0.15, y: 0.2 },
        { id: 'tui', label: 'bijou-tui', x: 0.85, y: 0.8 },
        { id: 'viz', label: 'bijou-viz', x: 0.2, y: 0.85 },
      ],
      [
        { source: 'bijou', target: 'tui', weight: 1.5 },
        { source: 'bijou', target: 'viz', active: true },
      ],
    );
    const alpha0 = sim.alpha();
    sim.tick(20);
    expect(sim.alpha()).toBeLessThan(alpha0);

    sim.nudgeNode('viz', 0.05, -0.05, true);
    const vizNode = sim.nodes().find((n) => n.id === 'viz');
    expect(vizNode?.pinned).toBe(true);

    const surf = forceGraphSurface(sim, { width: 48, height: 14, selectedNodeId: 'bijou' });
    const plain = surfaceToPlainString(surf);
    expect(plain).toContain('◆[bijou]');
    expect(plain).toContain('[bijou-tui]');
  });
});

describe('computeHdrHistogram and flamegraphSurface', () => {
  it('computes log-scale HDR latency bins and tail percentiles', () => {
    const samples: number[] = [];
    for (let i = 1; i <= 100; i++) {
      samples.push(i <= 90 ? i * 0.5 : i * 10);
    }
    const hdr = computeHdrHistogram(samples, 12);
    expect(hdr.bins.length).toBe(12);
    expect(hdr.p50).toBeGreaterThan(0);
    expect(hdr.p99).toBeGreaterThan(hdr.p90);
    expect(hdr.p999).toBeGreaterThanOrEqual(hdr.p99);
    const lastBin = hdr.bins[hdr.bins.length - 1];
    expect(lastBin?.cdfPct).toBeCloseTo(100, 4);
  });

  it('partitions hierarchical flamegraphs and supports subtree lookup', () => {
    const tree: FlameNode = {
      id: 'root',
      name: 'run(app)',
      value: 10,
      children: [
        {
          id: 'update',
          name: 'app.update',
          value: 20,
          children: [{ id: 'telemetry', name: 'stepTelemetry', value: 15 }],
        },
        {
          id: 'view',
          name: 'app.view',
          value: 45,
          children: [{ id: 'plot', name: 'plotSurface', value: 30 }],
        },
      ],
    };
    const frames = layoutFlamegraph(tree, 5);
    expect(frames.length).toBe(5);
    expect(findFlameNode(tree, 'plot')?.name).toBe('plotSurface');

    const surf = flamegraphSurface(tree, { width: 60, height: 4, selectedId: 'view' });
    const plain = surfaceToPlainString(surf);
    expect(plain).toContain('run(app)');
    expect(plain).toContain('▸app.view');
  });
});

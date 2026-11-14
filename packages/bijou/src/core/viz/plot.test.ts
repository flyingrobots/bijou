import { describe, expect, it } from 'vitest';
import { createTestContext, must } from '../../adapters/test/index.js';
import { createSurface } from '../../ports/surface.js';
import {
  BrailleCanvas,
  areaY,
  barY,
  dot,
  lineY,
  plot,
  plotSurface,
  ruleX,
  ruleY,
  scaleLinear,
  scaleOklch,
} from './index.js';

describe('BrailleCanvas', () => {
  it('maps 2x4 sub-pixel dots into Unicode Braille code points (U+2800..U+28FF)', () => {
    const canvas = new BrailleCanvas(2, 2);
    canvas.plotDot(0, 0, [56, 189, 248]); // top-left bit 0x01
    canvas.plotDot(1, 3, [56, 189, 248]); // bottom-right bit 0x80
    expect(canvas.getCellMask(0, 0)).toBe(0x81);

    const surface = createSurface(2, 2);
    canvas.flushToSurface(surface);
    const cell = surface.get(0, 0);
    expect(must(cell.char.codePointAt(0))).toBe(0x2881);
    expect(cell.fgRGB).toEqual([56, 189, 248]);
  });

  it('rasterizes continuous Bresenham lines across cell boundaries', () => {
    const canvas = new BrailleCanvas(6, 3);
    canvas.plotLine(0, 0, 11, 11, [255, 100, 50]);
    let nonEmptyCells = 0;
    for (let cy = 0; cy < 3; cy++) {
      for (let cx = 0; cx < 6; cx++) {
        if (canvas.getCellMask(cx, cy) > 0) nonEmptyCells++;
      }
    }
    expect(nonEmptyCells).toBeGreaterThanOrEqual(6);
  });
});

describe('plotSurface and plot', () => {
  it('composes lineY, areaY, ruleY, and ruleX with axes and legend onto a PackedSurface', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const surface = plotSurface({
      title: 'Throughput',
      width: 48,
      height: 12,
      ctx,
      y: scaleLinear([0, 100]),
      marks: [
        areaY([20, 40, 65, 50, 80, 90], { label: 'rps', stroke: '#38bdf8' }),
        lineY([10, 25, 35, 30, 45, 55], { label: 'err', stroke: '#f43f5e' }),
        ruleY(75, { label: 'target', stroke: '#f59e0b' }),
        ruleX(3, { stroke: '#a78bfa' }),
      ],
    });

    expect(surface.width).toBe(48);
    expect(surface.height).toBe(12);
    const rendered = plot({
      title: 'Throughput',
      width: 48,
      height: 12,
      ctx,
      y: scaleLinear([0, 100]),
      marks: [
        areaY([20, 40, 65, 50, 80, 90], { label: 'rps', stroke: '#38bdf8' }),
        lineY([10, 25, 35, 30, 45, 55], { label: 'err', stroke: '#f43f5e' }),
      ],
    });
    expect(rendered).toContain('Throughput');
    expect(rendered).toContain('● rps');
    expect(rendered).toContain('● err');
    expect(rendered).toContain('└');
  });

  it('renders barY fractional blocks and dot marks with OKLCH colour scales', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const heat = scaleOklch([0, 100]);
    const surface = plotSurface({
      width: 36,
      height: 10,
      ctx,
      marks: [
        barY([10, 50, 90, 40], { label: 'bars' }),
        dot(
          [
            { x: 0, y: 15, colorValue: 15 },
            { x: 2, y: 85, colorValue: 85 },
          ],
          { label: 'pts', colorScale: heat },
        ),
      ],
    });
    expect(surface.width).toBe(36);
    expect(surface.height).toBe(10);
  });

  it('lowers cleanly in pipe mode (TSV) and accessible mode (screen-reader summary)', () => {
    const pipeCtx = createTestContext({ mode: 'pipe' });
    const tsv = plot({
      title: 'CPU Load',
      width: 40,
      height: 10,
      ctx: pipeCtx,
      marks: [lineY([12, 35, 28, 64], { label: 'cpu_pct' })],
    });
    expect(tsv).toBe('series\tcount\tx_min\tx_max\ty_min\ty_max\ty_last\ncpu_pct\t4\t0\t3\t12\t64\t64');

    const a11yCtx = createTestContext({ mode: 'accessible' });
    const summary = plot({
      title: 'CPU Load',
      width: 40,
      height: 10,
      ctx: a11yCtx,
      marks: [
        lineY([12, 35, 28, 64], { label: 'cpu_pct' }),
        ruleY(80, { label: 'alert' }),
      ],
    });
    expect(summary).toContain('Plot: CPU Load.');
    expect(summary).toContain('cpu_pct: 4 points, min=12, max=64, latest=64.');
    expect(summary).toContain('Horizontal rule (alert) at y=80.');
  });

  it('rasterizes 100,000 scatter points in O(D) without stack overflow', () => {
    const points = new Array(100_000).fill(0).map((_, i) => ({
      x: i,
      y: Math.sin(i * 0.01) * 50 + 50,
    }));
    const surface = plotSurface({
      width: 40,
      height: 10,
      marks: [dot(points, { label: 'wave' })],
    });
    expect(surface.width).toBe(40);
    expect(surface.height).toBe(10);
  });
});
